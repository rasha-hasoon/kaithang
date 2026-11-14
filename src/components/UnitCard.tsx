import Link from "next/link";
import type { Unit, UnitStats } from "@/lib/data";
import { UNIT_KIND, type Lang } from "@/lib/constants";
import { inr, num } from "@/lib/format";
import { pick, type Dict } from "@/lib/i18n";

/** A unit as one row in a list, scannable, not a card grid. */
export function UnitRow({ u, lang, d }: { u: Unit & { stats: UnitStats }; lang: Lang; d: Dict }) {
  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 border-t border-line py-5 md:grid-cols-[minmax(0,2.2fr)_repeat(3,minmax(0,0.8fr))_auto]">
      <div className="min-w-0">
        <Link href={`/units/${u.slug}`} className="text-lg font-semibold leading-snug hover:underline">{pick(lang, u.name, u.name_ml)}</Link>
        <div className="mt-0.5 text-sm text-ink/65">
          {u.panchayat ? `${u.panchayat}, ` : ""}{u.district} <span className="mx-1 text-ink/25">|</span> {UNIT_KIND[u.kind][lang]}
        </div>
      </div>
      <div className="hidden md:block"><div className="font-semibold tabular-nums">{num(u.patients_registered)}</div><div className="text-xs text-ink/65">{d.patients}</div></div>
      <div className="hidden md:block"><div className="font-semibold tabular-nums">{num(u.stats?.supporters)}</div><div className="text-xs text-ink/65">{d.supporters}</div></div>
      <div className="hidden md:block"><div className="font-semibold tabular-nums">{inr(u.stats?.monthly_committed)}</div><div className="text-xs text-ink/65">{d.per_month}</div></div>
      <Link href={`/give?unit=${u.id}`} className="btn-ghost justify-self-end">{d.support_unit}</Link>
    </li>
  );
}
