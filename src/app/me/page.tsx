import Link from "next/link";
import { redirect } from "next/navigation";
import { getT, pick } from "@/lib/i18n";
import { getDonor } from "@/lib/session";
import { db } from "@/lib/supabase";
import { fmtDate, inr, num } from "@/lib/format";
import { Stat, StatusPill } from "@/components/ui";
import { updateSubscription } from "../actions";
import { resumeDuePauses } from "@/lib/subscriptions";
import { CancelDialog } from "@/components/CancelDialog";
import { PauseDialog } from "@/components/PauseDialog";
import type { Frequency } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Sub = {
  id: string; weekly_amount: number; frequency: string; charge_amount: number; status: string; started_at: string; next_charge_on: string | null; paused_until?: string | null;
  units: { id: string; slug: string; name: string; name_ml: string | null; district: string };
};

export default async function MePage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const donor = await getDonor();
  if (!donor) redirect("/login?next=/me");
  const { new: isNew } = await searchParams;
  const { t, lang } = await getT();
  const ml = lang === "ml" ? "font-ml" : "";
  await resumeDuePauses(donor.id).catch(() => {});
  const s = db();

  const [{ data: subs }, { data: payments }] = await Promise.all([
    s.from("subscriptions").select("*, units(id,slug,name,name_ml,district)")
      .eq("donor_id", donor.id).order("started_at", { ascending: false }),
    s.from("contributions").select("id,amount,charged_at,status, units(name)").eq("donor_id", donor.id).order("charged_at", { ascending: false }).limit(50),
  ]);
  const list = (subs as unknown as Sub[]) ?? [];
  const pays = (payments as unknown as { id: string; amount: number; charged_at: string; units: { name: string } }[]) ?? [];
  const total = pays.reduce((a, p) => a + p.amount, 0);
  const unitIds = [...new Set(list.map((x) => x.units.id))];
  const { data: reports } = unitIds.length
    ? await s.from("reports").select("id,period_label,patients_served,home_visits,approved_at, units(name,slug)").in("unit_id", unitIds)
        .eq("status", "approved").order("approved_at", { ascending: false }).limit(4)
    : { data: [] };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {isNew && <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">{t("me_new")}</div>}
      <h1 className={`display text-5xl ${ml}`}>{t("me_title")}</h1>
      <p className="mt-1 text-sm text-ink/65">{donor.name ?? (lang === "ml" ? "സപ്പോർട്ടർ" : "Supporter")} · +91 {donor.phone}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label={t("me_total")} value={inr(total)} />
        <Stat label={t("me_doses")} value={num(new Set(list.filter((x) => x.status === "active").map((x) => x.units.id)).size)} />
        <Stat label={t("me_active")} value={String(list.filter((x) => x.status === "active").length)} />
      </div>

      <section className="mt-8">
        <h2 className={`text-lg font-bold ${ml}`}>{t("me_subs")}</h2>
        {list.length === 0 && (
          <div className="card mt-3 p-6 text-center">
            <p className="text-ink/70">{t("me_none")}</p>
            <Link href="/units" className="btn-primary mt-4">{t("me_find")}</Link>
          </div>
        )}
        <div className="mt-3 space-y-3">
          {list.map((x) => (
            <div key={x.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <Link href={`/units/${x.units.slug}`} className={`font-semibold hover:text-brand ${ml}`}>{pick(lang, x.units.name, x.units.name_ml)}</Link>
                <div className="mt-0.5 text-sm text-ink/70">
                  {lang === "ml"
                    ? <>ആഴ്ചയിൽ ₹{x.weekly_amount} · {{ monthly: "മാസം", quarterly: "3 മാസത്തിലൊരിക്കൽ", yearly: "വർഷത്തിൽ" }[x.frequency as Frequency]} <b>₹{x.charge_amount}</b> വീതം</>
                    : <>₹{x.weekly_amount}/week · <b>₹{x.charge_amount}</b> {x.frequency}</>}
                  {x.status === "active" && x.next_charge_on && <> · {t("me_next")}: {fmtDate(x.next_charge_on)}</>}
                  {x.status === "paused" && <> · {x.paused_until
                    ? (lang === "ml" ? `തൽക്കാലം നിർത്തിവച്ചിരിക്കുന്നു (${fmtDate(x.paused_until)} വരെ)` : `Paused until ${fmtDate(x.paused_until)}`)
                    : (lang === "ml" ? "നിങ്ങൾ വീണ്ടും തുടങ്ങുന്നത് വരെ നിർത്തിവച്ചിരിക്കുന്നു" : "Paused until you resume")}</>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={x.status} />
                {x.status === "active" && <PauseDialog id={x.id} lang={lang} />}
                {x.status === "paused" && (
                  <form action={updateSubscription}>
                    <input type="hidden" name="id" value={x.id} />
                    <button name="action" value="resume" className="btn-ghost !px-3 !py-1 text-xs">{t("me_resume")}</button>
                  </form>
                )}
                {x.status !== "cancelled" && (
                  <CancelDialog id={x.id} weekly={x.weekly_amount} frequency={x.frequency as Frequency} status={x.status}
                    unitName={pick(lang, x.units.name, x.units.name_ml)} lang={lang} />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {reports && reports.length > 0 && (
        <section className="mt-8">
          <h2 className={`text-lg font-bold ${ml}`}>{t("me_reports")}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(reports as unknown as { id: string; period_label: string; patients_served: number; home_visits: number; units: { name: string; slug: string } }[]).map((r) => (
              <Link key={r.id} href={`/units/${r.units.slug}`} className="card p-4 hover:border-brand">
                <div className="text-xs text-ink/65">{r.period_label}</div>
                <div className="font-semibold">{r.units.name}</div>
                <div className="mt-1 text-sm text-ink/70">{num(r.patients_served)} {t("patients")} · {num(r.home_visits)} {t("home_visits")}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className={`text-lg font-bold ${ml}`}>{t("me_history")}</h2>
        <div className="card mt-3 overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {pays.map((p) => (
                <tr key={p.id} className="border-t border-line first:border-0">
                  <td className="px-4 py-2.5">{fmtDate(p.charged_at)}</td>
                  <td className="px-4 py-2.5 text-ink/70">{p.units?.name}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{inr(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
