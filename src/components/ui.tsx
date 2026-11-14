import { CATEGORIES, type Category, type Lang } from "@/lib/constants";
import { inr, pct } from "@/lib/format";

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="display text-3xl text-ink">{value}</div>
      <div className="mt-1 text-xs text-ink/70">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-ink/65">{hint}</div>}
    </div>
  );
}

export function Progress({ value, max, color = "var(--leaf)" }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full" style={{ width: `${pct(value, max)}%`, background: color }} />
    </div>
  );
}

/** One stacked bar + legend for spending by category. */
export function CategoryBreakdown({ items, lang }: { items: { category: Category; amount: number }[]; lang: Lang }) {
  const total = items.reduce((s, i) => s + i.amount, 0);
  if (!total) return null;
  return (
    <div>
      <div className="flex h-5 w-full overflow-hidden rounded" role="img" aria-label="Spending by category">
        {items.map((i) => (
          <div key={i.category} style={{ width: `${(i.amount / total) * 100}%`, background: CATEGORIES[i.category].color }} />
        ))}
      </div>
      <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
        {items.map((i) => (
          <li key={i.category} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: CATEGORIES[i.category].color }} />
              {CATEGORIES[i.category][lang]}
            </span>
            <span className="tabular-nums">
              <b>{inr(i.amount)}</b> <span className="text-ink/65">{pct(i.amount, total)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800", approved: "bg-green-100 text-green-800",
    paused: "bg-amber-100 text-amber-800", pending: "bg-amber-100 text-amber-800", submitted: "bg-amber-100 text-amber-800",
    cancelled: "bg-gray-100 text-gray-600", rejected: "bg-red-100 text-red-700", draft: "bg-gray-100 text-gray-600",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[status] ?? "bg-gray-100"}`}>{status}</span>;
}

export function Logo({ ml }: { ml?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg width="38" height="38" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="7" fill="var(--ink)" />
        <path d="M8 19c2.2-1.2 4.4-1 6.4.9l2.8 2.8c1 1 2.6 1 3.5 0 .9-.9.9-2.5 0-3.4l-3.6-3.6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="21.5" cy="10.5" r="3.2" fill="var(--marigold)" />
      </svg>
      <span className="text-2xl font-bold tracking-tight text-ink" style={{ fontVariationSettings: '"wdth" 85' }}>
        {ml ? "സംഹാരി" : "Samhari"}
      </span>
    </span>
  );
}
