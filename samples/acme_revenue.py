"""acme_revenue.py — daily MRR / ARR rollup for Atlas.

Reads the orders feed from the Atlas API, normalises currencies to USD using
the daily ECB rate, and posts a Slack digest at 09:00 PT every morning.

This script is what backs the #revenue-daily Slack channel. If it stops
posting, page the on-call PM (rotation in OpsGenie).
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Iterable

import httpx
import pandas as pd

ATLAS_API = "https://api.acme.example/v1"
SLACK_WEBHOOK = os.environ["SLACK_REVENUE_WEBHOOK"]
FX_CACHE: dict[tuple[str, date], Decimal] = {}

log = logging.getLogger("acme.revenue")


@dataclass(frozen=True, slots=True)
class Order:
    id: str
    created: datetime
    status: str
    currency: str
    total_cents: int
    is_returning_customer: bool
    plan: str

    @property
    def is_revenue(self) -> bool:
        # We count fulfilled orders only — pending/refunded don't hit MRR.
        return self.status == "fulfilled"


@dataclass
class DailyRollup:
    on_date: date
    orders: list[Order] = field(default_factory=list)
    rates: dict[str, Decimal] = field(default_factory=dict)

    def usd_cents(self, order: Order) -> int:
        if order.currency == "USD":
            return order.total_cents
        rate = self.rates.get(order.currency)
        if rate is None:
            raise KeyError(f"missing FX rate for {order.currency} on {self.on_date}")
        return int(Decimal(order.total_cents) * rate)

    def total_usd_cents(self) -> int:
        return sum(self.usd_cents(o) for o in self.orders if o.is_revenue)

    def by_plan(self) -> dict[str, int]:
        out: dict[str, int] = {}
        for o in self.orders:
            if not o.is_revenue:
                continue
            out[o.plan] = out.get(o.plan, 0) + self.usd_cents(o)
        return dict(sorted(out.items(), key=lambda kv: -kv[1]))


def fetch_orders(day: date) -> Iterable[Order]:
    """Stream orders for a given day, paginating through the cursor API."""
    cursor: str | None = None
    while True:
        params: dict[str, str | int] = {"date": day.isoformat(), "per_page": 100}
        if cursor:
            params["cursor"] = cursor
        r = httpx.get(
            f"{ATLAS_API}/orders",
            params=params,
            headers={"Authorization": f"Bearer {os.environ['ATLAS_API_KEY']}"},
            timeout=10.0,
        )
        r.raise_for_status()
        body = r.json()
        for o in body["data"]:
            yield Order(
                id=o["id"],
                created=datetime.fromisoformat(o["created"].replace("Z", "+00:00")),
                status=o["status"],
                currency=o["currency"],
                total_cents=o["amounts"]["total_cents"],
                is_returning_customer=o["customer"]["is_returning"],
                plan=o["items"][0]["sku"],
            )
        if not body.get("has_more"):
            return
        cursor = body["pagination"]["next_cursor"]


def fetch_fx_rates(day: date) -> dict[str, Decimal]:
    """ECB daily rates against USD. Cached per-day to avoid re-querying."""
    cached = {ccy: rate for (ccy, d), rate in FX_CACHE.items() if d == day}
    if cached:
        return cached
    r = httpx.get(f"https://api.frankfurter.app/{day:%Y-%m-%d}?from=USD", timeout=5.0)
    r.raise_for_status()
    rates_raw = r.json()["rates"]
    rates = {ccy: Decimal(1) / Decimal(str(rate)) for ccy, rate in rates_raw.items()}
    rates["USD"] = Decimal(1)
    for ccy, rate in rates.items():
        FX_CACHE[(ccy, day)] = rate
    return rates


def build_rollup(day: date) -> DailyRollup:
    rollup = DailyRollup(on_date=day, rates=fetch_fx_rates(day))
    rollup.orders = list(fetch_orders(day))
    log.info("rollup %s: %d orders, $%.2f", day, len(rollup.orders),
             rollup.total_usd_cents() / 100)
    return rollup


def render_slack_blocks(today: DailyRollup, yesterday: DailyRollup) -> list[dict]:
    delta_pct = (today.total_usd_cents() - yesterday.total_usd_cents()) / max(
        yesterday.total_usd_cents(), 1
    ) * 100
    arrow = "📈" if delta_pct >= 0 else "📉"

    plan_lines = "\n".join(
        f"• `{plan}` — ${cents / 100:,.2f}"
        for plan, cents in today.by_plan().items()
    )
    return [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": f"Daily revenue — {today.on_date:%a %b %-d}"},
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f"*Total:* ${today.total_usd_cents() / 100:,.2f}  "
                    f"{arrow} {delta_pct:+.1f}% vs. yesterday\n"
                    f"*Orders:* {len(today.orders)}  ·  "
                    f"*Returning customers:* "
                    f"{sum(1 for o in today.orders if o.is_returning_customer)}"
                ),
            },
        },
        {"type": "section", "text": {"type": "mrkdwn", "text": "*By plan*\n" + plan_lines}},
    ]


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    today = build_rollup(date.today())
    yesterday = build_rollup(date.today() - timedelta(days=1))

    blocks = render_slack_blocks(today, yesterday)
    httpx.post(SLACK_WEBHOOK, json={"blocks": blocks}, timeout=5.0).raise_for_status()
    log.info("posted to slack — %d blocks", len(blocks))


if __name__ == "__main__":
    main()
