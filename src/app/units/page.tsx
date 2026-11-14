import Link from "next/link";
import { getT } from "@/lib/i18n";
import { getUnitsWithStats } from "@/lib/data";
import { UnitRow } from "@/components/UnitCard";

export const dynamic = "force-dynamic";

export default async function UnitsPage({ searchParams }: { searchParams: Promise<{ district?: string }> }) {
  const { district } = await searchParams;
  const { t, lang, dict } = await getT();
  const all = await getUnitsWithStats();
  const districts = [...new Set(all.map((u) => u.district))].sort();
  const units = district ? all.filter((u) => u.district === district) : all;
  const ml = lang === "ml" ? "font-ml" : "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className={`${lang === "ml" ? "display-ml" : "display"} text-5xl ${ml}`}>{t("units_title")}</h1>
      <p className={`mt-2 text-ink/70 ${ml}`}>{t("units_sub")}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/units" className={!district ? "btn-primary !rounded-full !py-1.5" : "btn-ghost !rounded-full !py-1.5"}>{t("filter_all")}</Link>
        {districts.map((d) => (
          <Link key={d} href={`/units?district=${d}`} className={district === d ? "btn-primary !rounded-full !py-1.5" : "btn-ghost !rounded-full !py-1.5"}>{d}</Link>
        ))}
      </div>
      <ul className="mt-6 border-b border-line">
        {units.map((u) => <UnitRow key={u.id} u={u} lang={lang} d={dict} />)}
      </ul>
    </div>
  );
}
