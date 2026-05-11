---
title: RFC-0042 — Mobile checkout redesign
status: Draft
author: Priya Iyer
reviewers: [Marco S, Jamie L, Helen Y]
created: 2026-04-18
updated: 2026-05-09
target_release: Atlas v4.2
---

# RFC-0042 — Mobile checkout redesign

> One-line goal: cut **mobile checkout time-to-purchase from 87s to under 40s**
> by collapsing the three-screen flow into one with smart defaults.

## Why now

Mobile is **62% of sessions** but only **38% of revenue**. Drop-off is concentrated
on the address-entry screen: 41% of users abandon there. The fix is overdue.

### Top three causes (from session replays + support tickets)

1. Three separate screens for cart → address → payment, each with its own
   load + validation cycle.
2. Address autocomplete fires too late, after the user has already typed.
3. Apple Pay / Google Pay buttons are buried below the fold.

## Proposed design

**Single-screen checkout** with progressive disclosure. The user sees the
summary always; the form fields expand contextually.

### Screen anatomy

| Region              | Behavior                                                            | Test owner |
| ------------------- | ------------------------------------------------------------------- | ---------- |
| Order summary (top) | Sticky on scroll, collapses to one line below 600px                 | Marco      |
| Express pay buttons | First-class, above the fold, side-by-side                           | Priya      |
| Address (sheet)     | Autocomplete fires on first keypress, defaults to billing if filled | Jamie      |
| Payment             | Apple Pay / GPay / card — radio with smart default by region        | Helen      |

### Smart defaults

We rank payment options by:

- Last-used method for the same customer (1st priority)
- Region: Apple Pay default in US/UK/AU, UPI in IN, card elsewhere
- Cart total: high-value carts default to card (lower decline rates)

```python
def default_payment(customer, region, total_cents):
    if customer.last_method and not customer.last_method.declined_recently:
        return customer.last_method
    if total_cents > 50_000:
        return "card"
    return REGION_PRIMARY.get(region, "card")
```

### Backend changes

Minimal. The new flow calls the same endpoints in a different order. We add
**one new endpoint** for the "quote address" preview (so we can show shipping
cost before the user commits to the address):

```http
POST /v1/checkout/quote
Content-Type: application/json

{ "cart_id": "ck_…", "postal_code": "94110", "country": "US" }

→ 200 OK
{ "shipping_cents": 800, "tax_cents": 1240, "eta_days": 3 }
```

## Success criteria

- [x] Mobile time-to-purchase under 40s (P50)
- [x] Address-screen drop-off under 25%
- [ ] Apple Pay / GPay adoption above 35% of mobile transactions
- [ ] Zero increase in chargeback rate over 60-day window

## Non-goals

- Desktop checkout — out of scope for this RFC; tracked in RFC-0048
- Subscription billing — separate flow, not affected
- B2B / invoiced checkout — keeps the existing 3-step flow

## Migration plan

1. Build behind feature flag `mobile_checkout_v2`
2. Internal dogfood (Acme staff only) for 2 weeks
3. Ramp: 5% → 25% → 50% → 100% over 4 weeks
4. Remove old flow + flag 4 weeks after 100%

## Open questions

> **Marco:** Do we keep the "review order" step for first-time customers?
> _Counter:_ the data says even first-time mobile users skip it 78% of the
> time. I'd rather show a clear summary always-visible than a separate step.

> **Helen:** Should we deprecate stored cards under $5 (gift cards / promo)?
> _Counter:_ yes, but in a separate ticket — out of scope here.

---

## Appendix

### Funnel comparison (current vs. proposed)

| Step                      | Current drop-off | Proposed drop-off (target) |
| ------------------------- | ---------------- | -------------------------- |
| Cart → Address            | 28%              | 12%                        |
| Address → Payment         | 41%              | 18%                        |
| Payment → Confirmation    | 9%               | 7%                         |
| **End-to-end conversion** | **49%**          | **66%**                    |

### Linked work

- [Figma — Mobile Checkout v2](https://figma.example/atlas/mobile-checkout-v2)
- [RFC-0048 — Desktop checkout (next)](./rfc-0048-desktop-checkout.md)
- [Linear epic ATL-2104](https://linear.example/atlas/ATL-2104)
