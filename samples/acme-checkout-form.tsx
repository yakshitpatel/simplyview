/**
 * acme-checkout-form.tsx — single-screen mobile checkout (Atlas v4.2)
 *
 * Implements the design from RFC-0042. Express pay above the fold, address
 * collected in a bottom sheet, smart payment-method default per region.
 *
 * Owner: @priya · Linear: ATL-2104
 */

import { useEffect, useMemo, useState, useTransition } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useCart, type CartLineItem } from "@/hooks/use-cart";
import { useGeo } from "@/hooks/use-geo";
import { ExpressPay } from "@/components/express-pay";
import { AddressSheet } from "@/components/address-sheet";
import { CurrencyAmount } from "@/components/currency-amount";
import { Spinner } from "@/components/spinner";

const QuoteSchema = z.object({
  shipping_cents: z.number(),
  tax_cents: z.number(),
  eta_days: z.number(),
});
type Quote = z.infer<typeof QuoteSchema>;

type PaymentMethod = "apple_pay" | "google_pay" | "card" | "upi";

const REGION_PRIMARY: Readonly<Record<string, PaymentMethod>> = {
  US: "apple_pay",
  GB: "apple_pay",
  AU: "apple_pay",
  IN: "upi",
  DE: "card",
  FR: "card",
};

function pickDefaultMethod(
  region: string | null,
  lastUsed: PaymentMethod | null,
  totalCents: number,
): PaymentMethod {
  if (lastUsed) return lastUsed;
  if (totalCents > 50_000) return "card";
  return (region && REGION_PRIMARY[region]) ?? "card";
}

export interface CheckoutFormProps {
  cartId: string;
  lastUsedMethod: PaymentMethod | null;
}

export function CheckoutForm({ cartId, lastUsedMethod }: CheckoutFormProps) {
  const router = useRouter();
  const cart = useCart(cartId);
  const geo = useGeo();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [addressOpen, setAddressOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const total = useMemo(() => {
    if (!cart.subtotalCents) return 0;
    return (
      cart.subtotalCents +
      (quote?.shipping_cents ?? 0) +
      (quote?.tax_cents ?? 0)
    );
  }, [cart.subtotalCents, quote]);

  // Pick a payment default as soon as we know the region + total.
  useEffect(() => {
    if (method !== null) return;
    if (geo.region == null || total === 0) return;
    setMethod(pickDefaultMethod(geo.region, lastUsedMethod, total));
  }, [geo.region, lastUsedMethod, total, method]);

  async function fetchQuote(
    postalCode: string,
    country: string,
  ): Promise<void> {
    const res = await fetch("/v1/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cart_id: cartId,
        postal_code: postalCode,
        country,
      }),
    });
    if (!res.ok) throw new Error(`quote failed: ${res.status}`);
    setQuote(QuoteSchema.parse(await res.json()));
  }

  function handlePay() {
    if (!method) return;
    startTransition(async () => {
      const res = await fetch("/v1/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId, method }),
      });
      if (!res.ok) {
        console.error("[checkout] confirm failed", res.status);
        return;
      }
      const { order_id } = (await res.json()) as { order_id: string };
      router.push(`/orders/${order_id}`);
    });
  }

  return (
    <form
      className="flex h-dvh flex-col bg-white"
      onSubmit={(e) => {
        e.preventDefault();
        handlePay();
      }}
    >
      <header className="sticky top-0 border-b border-zinc-200 bg-white/90 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">
            {cart.items.length} items
          </span>
          <CurrencyAmount
            cents={total}
            currency={cart.currency}
            className="font-semibold"
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <ExpressPay
          method={method}
          onSelect={setMethod}
          totalCents={total}
          available={geo.region ? availabilityFor(geo.region) : null}
        />

        <button
          type="button"
          onClick={() => setAddressOpen(true)}
          className="w-full text-left rounded-xl border border-zinc-200 px-4 py-3 hover:bg-zinc-50"
        >
          <span className="block text-xs uppercase tracking-wide text-zinc-500">
            Ship to
          </span>
          <span className="block text-sm font-medium text-zinc-900">
            {cart.address ? formatAddress(cart.address) : "Add address →"}
          </span>
        </button>

        <ItemList items={cart.items} />
      </main>

      <footer className="border-t border-zinc-200 px-4 py-4">
        <button
          type="submit"
          disabled={!method || isPending}
          className="w-full rounded-xl bg-zinc-950 text-white py-3 font-semibold disabled:opacity-50"
        >
          {isPending ? (
            <Spinner />
          ) : (
            <>Pay {formatTotal(total, cart.currency)}</>
          )}
        </button>
      </footer>

      <AddressSheet
        open={addressOpen}
        onClose={() => setAddressOpen(false)}
        onSubmit={async (addr) => {
          await fetchQuote(addr.postal_code, addr.country);
          setAddressOpen(false);
        }}
      />
    </form>
  );
}

// — helpers ——————————————————————————————————————

function ItemList({ items }: { items: readonly CartLineItem[] }) {
  return (
    <ul className="divide-y divide-zinc-100">
      {items.map((it) => (
        <li key={it.sku} className="flex items-center justify-between py-3">
          <span className="text-sm text-zinc-900">
            {it.name}
            {it.quantity > 1 ? (
              <span className="text-zinc-500"> × {it.quantity}</span>
            ) : null}
          </span>
          <CurrencyAmount
            cents={it.unit_price_cents * it.quantity}
            currency={it.currency}
          />
        </li>
      ))}
    </ul>
  );
}

function availabilityFor(region: string): readonly PaymentMethod[] {
  switch (region) {
    case "US":
    case "GB":
    case "AU":
    case "CA":
      return ["apple_pay", "google_pay", "card"] as const;
    case "IN":
      return ["upi", "card"] as const;
    default:
      return ["card"] as const;
  }
}

function formatAddress(a: {
  line1: string;
  city: string;
  postal_code: string;
}) {
  return `${a.line1}, ${a.city} ${a.postal_code}`;
}

function formatTotal(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
