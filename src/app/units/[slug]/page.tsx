import { notFound } from "next/navigation";
import { getT, pick } from "@/lib/i18n";
import { getUnitBySlug, getUnitDetail } from "@/lib/data";
import { CATEGORIES, UNIT_KIND, type Frequency } from "@/lib/constants";
import { fmtDate, inr, num } from "@/lib/format";
import { CategoryBreakdown, Progress, Stat } from "@/components/ui";
import { SubscribeBox } from "@/components/SubscribeBox";

export const dynamic = "force-dynamic";

export default async function UnitPage({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<{ w?: string; f?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const unit = await getUnitBySlug(slug);
  if (!unit || unit.status !== "approved") notFound();
  const { t, lang, dict } = await getT();
  const { stats, categories, needs, reports, transfers } = await getUnitDetail(unit.id);
  const ml = lang === "ml" ? "font-ml" : "";
  const f = (["monthly", "quarterly", "yearly"] as const).includes(sp.f as Frequency) ? (sp.f as Frequency) : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">{UNIT_KIND[unit.kind][lang]}</span>
        <span className="text-sm text-ink/65">{unit.panchayat ? `${unit.panchayat}, ` : ""}{unit.district}</span>
        {unit.is_sample && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">{t("sample_badge")}</span>}
      </div>
      <h1 className={`mt-3 display text-5xl sm:text-6xl ${ml}`}>{pick(lang, unit.name, unit.name_ml)}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={t("patients")} value={num(unit.patients_registered)} />
            <Stat label={t("visits_month")} value={num(unit.home_visits_month)} />
            <Stat label={t("supporters")} value={num(stats?.supporters)} />
            <Stat label={t("per_month")} value={inr(stats?.monthly_committed)} />
          </div>

          <section className="card p-6">
            <h2 className={`text-lg font-bold ${ml}`}>{t("about")}</h2>
            <p className={`mt-2 leading-relaxed text-ink/70 ${ml}`}>{pick(lang, unit.about_en, unit.about_ml)}</p>
            <div className="mt-4 flex gap-6 text-sm text-ink/70">
              <span><b className="text-ink">{unit.nurses}</b> {t("nurses")}</span>
              <span><b className="text-ink">{unit.volunteers}</b> {t("volunteers")}</span>
            </div>
          </section>

          <section id="where" className="card scroll-mt-20 p-6">
            <h2 className={`text-lg font-bold ${ml}`}>{t("where_money_goes")}</h2>
            <p className="text-xs text-ink/65">{t("where_money_goes_sub")}</p>
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-cream p-4 text-center sm:grid-cols-3">
              <div><div className="text-lg font-bold">{inr(stats?.total_received)}</div><div className="text-[11px] text-ink/65">{t("received")}</div></div>
              <div><div className="text-lg font-bold">{inr(stats?.total_disbursed)}</div><div className="text-[11px] text-ink/65">{t("transferred")}</div></div>
              <div><div className="text-lg font-bold">{inr(stats?.total_spent)}</div><div className="text-[11px] text-ink/65">{t("spent_reported")}</div></div>
            </div>
            <div className="mt-6">
              {categories.length ? <CategoryBreakdown items={categories} lang={lang} /> : <p className="text-sm text-ink/65">{t("no_reports")}</p>}
            </div>
          </section>

          {needs.length > 0 && (
            <section className="card p-6">
              <h2 className={`text-lg font-bold ${ml}`}>{t("current_needs")}</h2>
              <ul className="mt-4 space-y-4">
                {needs.map((n) => (
                  <li key={n.id}>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className={ml}>{pick(lang, n.title_en, n.title_ml)}</span>
                      <span className="shrink-0 font-semibold tabular-nums">{n.qty_fulfilled} / {n.qty_needed}</span>
                    </div>
                    <div className="mt-1.5"><Progress value={n.qty_fulfilled} max={n.qty_needed} color={CATEGORIES[n.category].color} /></div>
                    {n.cost_per_item && <div className="mt-1 text-[11px] text-ink/65">{lang === "ml" ? `ഒന്നിന് ${inr(n.cost_per_item)}` : `${inr(n.cost_per_item)} each`}</div>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section id="reports" className="card scroll-mt-20 p-6">
            <h2 className={`text-lg font-bold ${ml}`}>{t("reports")}</h2>
            {reports.length === 0 && <p className="mt-2 text-sm text-ink/65">{t("no_reports")}</p>}
            <div className="mt-4 space-y-4">
              {reports.map((r) => {
                const total = r.report_items?.reduce((s, i) => s + i.amount, 0) ?? 0;
                return (
                  <details key={r.id} className="rounded-xl border border-line p-4 open:bg-cream/50">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <span className="font-semibold">{r.period_label}</span>
                      <span className="text-sm"><b>{inr(total)}</b> <span className="text-ink/65">· {num(r.patients_served)} {t("patients")} · {num(r.home_visits)} {t("home_visits")}</span></span>
                    </summary>
                    <p className={`mt-3 text-sm text-ink/70 ${ml}`}>{pick(lang, r.summary_en, r.summary_ml)}</p>
                    <table className="mt-3 w-full text-sm">
                      <tbody>
                        {r.report_items?.map((i) => (
                          <tr key={i.id} className="border-t border-line">
                            <td className="py-2 pr-2">
                              <div className="font-medium">{CATEGORIES[i.category][lang]}</div>
                              <div className="text-xs text-ink/65">{i.description}</div>
                            </td>
                            <td className="py-2 text-right tabular-nums">{inr(i.amount)}</td>
                            <td className="w-16 py-2 text-right">{i.receipt_url ? <a className="text-xs font-semibold text-brand" href={i.receipt_url} target="_blank">Receipt</a> : null}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-2 text-[11px] text-ink/65">{lang === "ml" ? "അംഗീകരിച്ചത്" : "Approved"} {fmtDate(r.approved_at)}</div>
                  </details>
                );
              })}
            </div>
          </section>

          <section className="card p-6">
            <h2 className={`text-lg font-bold ${ml}`}>{t("transfers")}</h2>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {transfers.map((x) => (
                  <tr key={x.id} className="border-t border-line">
                    <td className="py-2">{x.period_label}</td>
                    <td className="py-2 text-xs text-ink/65">{x.utr_ref}</td>
                    <td className="py-2 text-right font-semibold tabular-nums">{inr(x.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {unit.bank_account_last4 && (
              <p className="mt-3 text-[11px] text-ink/65">To {unit.bank_account_name} · A/c ••••{unit.bank_account_last4}</p>
            )}
          </section>
        </div>

        <aside>
          <SubscribeBox unitId={unit.id} slug={unit.slug} initialWeekly={sp.w ? Number(sp.w) : undefined} initialFreq={f}
            l={{
              sub_title: dict.sub_title, sub_weekly: dict.sub_weekly, sub_custom: dict.sub_custom, sub_billing: dict.sub_billing,
              freq_monthly: dict.freq_monthly, freq_quarterly: dict.freq_quarterly, freq_yearly: dict.freq_yearly,
              sub_you_pay: dict.sub_you_pay, sub_impact: dict.sub_impact, sub_button: dict.sub_button, sub_demo: dict.sub_demo,
              sub_why_monthly: dict.sub_why_monthly, per_week_short: dict.per_week_short,
            }} />
        </aside>
      </div>
    </div>
  );
}
