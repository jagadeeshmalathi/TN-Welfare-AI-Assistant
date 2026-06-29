// ponytail: replaces clsx + tailwind-merge; no Tailwind class deduplication (not needed here)
export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function formatINR(amount: number): string | null {
  if (!amount) return null;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}
