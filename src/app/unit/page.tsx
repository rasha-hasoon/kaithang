import Link from "next/link";
import { redirect } from "next/navigation";
import { db, getStaff } from "@/lib/supabase";
import { getUnitDetail, type Unit } from "@/lib/data";
import { CATEGORIES } from "@/lib/constants";
import { fmtDate, inr, num } from "@/lib/format";
import { CategoryBreakdown, Progress, Stat, StatusPill } from "@/components/ui";
import { addNeed, createReport, staffLogout, updateNeed, updateUnitProfile } from "../staff/actions";

export const dynamic = "force-dynamic";

function quarterOptions() {
  const now = new Date();
  const out: string[] = [];
  let y = now.getFullYear(), q = Math.floor(now.getMonth() / 3) + 1;
  for (let i = 0; i < 4; i++) { out.push(`${y}-Q${q}`); q--; if (q === 0) { q = 4; y--; } }
  return out;
}

export default async function UnitDashboard({ searchParams }: { searchParams: Promise<{ registered?: string; submitted?: string }> }) {
  const staff = await getStaff();
  if (!staff) redirect("/staff/login");
  if (staff.role === "admin") redirect("/admin");
  if (!staff.unit_id) return <div className="mx-auto max-w-xl px-4 py-16 text-center">Your account isn&apos;t linked to a unit yet. Ask the admin to link it.</div>;
  const sp = await searchParams;
  const s = db();
  const { data: unit } = await s.from("units").select("*").eq("id", staff.unit_id).single<Unit>();
  if (!unit) redirect("/staff/login");
  const detail = await getUnitDetail(unit.id, { allReports: true });

  const { data: subs } = await s.from("subscriptions")
    .select("id,weekly_amount,frequency,charge_amount,status,started_at, donors(name,show_name,district)")
    .eq("unit_id", unit.id).order("started_at", { ascending: false }).limit(25);
  const { data: monthly } = await s.from("contributions").select("amount,charged_at").eq("unit_id", unit.id).gte("charged_at", new Date(Date.now() - 182 * 864e5).toISOString());
  const byMonth = new Map<string, number>();
  (monthly ?? []).forEach((c) => {
    const k = c.charged_at.slice(0, 7); // YYYY-MM
    byMonth.set(k, (byMonth.get(k) ?? 0) + c.amount);
  });
  const months = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6)
    .map(([k, v]) => [new Date(`${k}-01`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }), v] as const);
  const maxM = Math.max(1, ...months.map(([, v]) => v));
  const st = detail.stats;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {sp.registered && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">Thanks for registering! Your unit is <b>pending verification</b> by the Samhari committee.</div>}
      {sp.submitted && <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm">Report submitted for review.</div>}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs text-ink/65">Unit dashboard</div>
          <h1 className="display text-5xl">{unit.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-ink/70"><StatusPill status={unit.status} /> {unit.panchayat}, {unit.district}</div>
        </div>
        <div className="flex gap-2">
          <Link href="/unit/challenges" className="btn-primary">Food challenges</Link>
          {unit.status === "approved" && <Link href={`/units/${unit.slug}`} className="btn-ghost">View public page</Link>}
          <form action={staffLogout}><button className="btn-ghost">Log out</button></form>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Active supporters" value={num(st?.supporters)} />
        <Stat label="Committed / month" value={inr(st?.monthly_committed)} />
        <Stat label="Total received" value={inr(st?.total_received)} />
        <Stat label="Transferred to you" value={inr(st?.total_disbursed)} />
        <Stat label="Next transfer (pending)" value={inr(st?.pending_transfer)} hint="Sent at the start of next month" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-bold">Collections in the last 6 months</h2>
          <div className="mt-6 flex h-40 items-end gap-3">
            {months.map(([m, v]) => (
              <div key={m} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div className="text-[10px] font-semibold tabular-nums text-ink/70">{inr(v)}</div>
                <div className="w-full rounded-t-md bg-brand" style={{ height: `${Math.max(4, (v / maxM) * 75)}%` }} />
                <div className="text-[11px] text-ink/65">{m}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="card p-6">
          <h2 className="font-bold">Spending reported (approved)</h2>
          <div className="mt-4">
            {detail.categories.length ? <CategoryBreakdown items={detail.categories} lang="en" /> : <p className="text-sm text-ink/65">No approved reports yet.</p>}
          </div>
        </section>
      </div>

      <section className="card mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Quarterly spending reports</h2>
            <p className="text-sm text-ink/65">Submit a report every quarter with how the money was used. Approved reports appear on your public page.</p>
          </div>
          <form action={createReport} className="flex gap-2">
            <select name="quarter" className="input !w-auto">{quarterOptions().map((q) => <option key={q}>{q}</option>)}</select>
            <button className="btn-primary">New / open report</button>
          </form>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-xs uppercase text-ink/65"><tr><th className="py-2">Period</th><th>Status</th><th className="text-right">Spent</th><th className="text-right">Patients</th><th /></tr></thead>
          <tbody>
            {detail.reports.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="py-2.5 font-medium">{r.period_label}</td>
                <td><StatusPill status={r.status} /></td>
                <td className="text-right tabular-nums">{inr(r.report_items?.reduce((a, i) => a + i.amount, 0))}</td>
                <td className="text-right">{num(r.patients_served)}</td>
                <td className="text-right"><Link href={`/unit/reports/${r.id}`} className="font-semibold text-brand">Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-bold">Supporters</h2>
          <p className="text-sm text-ink/65">Latest AutoPay sign-ups for your unit.</p>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {(subs as unknown as { id: string; weekly_amount: number; frequency: string; charge_amount: number; status: string; started_at: string; donors: { name: string | null; show_name: boolean; district: string | null } }[] ?? []).map((x) => (
                <tr key={x.id} className="border-t border-line">
                  <td className="py-2">
                    <div className="font-medium">{x.donors?.show_name ? x.donors?.name ?? "Supporter" : "Anonymous supporter"}</div>
                    <div className="text-xs text-ink/65">{x.donors?.district} · since {fmtDate(x.started_at)}</div>
                  </td>
                  <td className="text-right text-xs text-ink/70">₹{x.weekly_amount}/wk<br />₹{x.charge_amount} {x.frequency}</td>
                  <td className="w-20 text-right"><StatusPill status={x.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card p-6">
          <h2 className="font-bold">Current needs</h2>
          <p className="text-sm text-ink/65">Shown on your public page so supporters see the gap.</p>
          <ul className="mt-4 space-y-3">
            {detail.needs.map((n) => (
              <li key={n.id}>
                <form action={updateNeed} className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="id" value={n.id} />
                  <span className="flex-1">{n.title_en}</span>
                  <input name="qty_fulfilled" type="number" defaultValue={n.qty_fulfilled} className="input !w-16 !py-1 text-center" />
                  <span className="text-ink/65">/ {n.qty_needed}</span>
                  <button className="text-xs font-semibold text-brand">Save</button>
                  <button name="delete" value="1" className="text-xs text-red-500">✕</button>
                </form>
                <div className="mt-1"><Progress value={n.qty_fulfilled} max={n.qty_needed} color={CATEGORIES[n.category].color} /></div>
              </li>
            ))}
          </ul>
          <form action={addNeed} className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-4">
            <input name="title_en" placeholder="Need (e.g. Water beds)" className="input col-span-2" required />
            <input name="title_ml" placeholder="മലയാളത്തിൽ" className="input col-span-2 font-ml" />
            <select name="category" className="input">{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.en}</option>)}</select>
            <input name="qty_needed" type="number" placeholder="Qty needed" className="input" required />
            <input name="cost_per_item" type="number" placeholder="Cost per item (₹)" className="input" />
            <button className="btn-primary">Add need</button>
          </form>
        </section>
      </div>

      <section className="card mt-6 p-6">
        <h2 className="font-bold">Unit profile</h2>
        <form action={updateUnitProfile} className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2"><label className="label">About (English)</label><textarea name="about_en" rows={3} className="input" defaultValue={unit.about_en ?? ""} /></div>
          <div className="sm:col-span-2"><label className="label">About (Malayalam)</label><textarea name="about_ml" rows={3} className="input font-ml" defaultValue={unit.about_ml ?? ""} /></div>
          <div><label className="label">Patients</label><input name="patients_registered" type="number" className="input" defaultValue={unit.patients_registered} /></div>
          <div><label className="label">Home visits / month</label><input name="home_visits_month" type="number" className="input" defaultValue={unit.home_visits_month} /></div>
          <div><label className="label">Nurses</label><input name="nurses" type="number" className="input" defaultValue={unit.nurses} /></div>
          <div><label className="label">Volunteers</label><input name="volunteers" type="number" className="input" defaultValue={unit.volunteers} /></div>
          <div className="sm:col-span-2"><label className="label">Phone</label><input name="phone" className="input" defaultValue={unit.phone ?? ""} /></div>
          <div className="flex items-end sm:col-span-2"><button className="btn-primary">Save profile</button></div>
        </form>
      </section>
    </div>
  );
}
