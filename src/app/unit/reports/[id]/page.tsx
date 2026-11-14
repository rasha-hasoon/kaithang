import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db, getStaff } from "@/lib/supabase";
import type { Report } from "@/lib/data";
import { CATEGORIES, type Category } from "@/lib/constants";
import { inr } from "@/lib/format";
import { CategoryBreakdown, StatusPill } from "@/components/ui";
import { addReportItem, deleteReportItem, saveReportMeta, submitReport } from "../../../staff/actions";

export const dynamic = "force-dynamic";

export default async function ReportEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getStaff();
  if (!staff?.unit_id) redirect("/staff/login");
  const s = db();
  const { data: r } = await s.from("reports").select("*, report_items(*)").eq("id", id).eq("unit_id", staff.unit_id).single<Report>();
  if (!r) notFound();
  const { data: got } = await s.from("disbursements").select("amount").eq("unit_id", staff.unit_id).gte("paid_at", r.period_start).lte("paid_at", `${r.period_end}T23:59:59`);
  const received = (got ?? []).reduce((a, x) => a + x.amount, 0);
  const items = r.report_items ?? [];
  const spent = items.reduce((a, i) => a + i.amount, 0);
  const locked = r.status === "approved" || r.status === "submitted";
  const byCat = Object.values(items.reduce<Record<string, { category: Category; amount: number }>>((m, i) => {
    m[i.category] = { category: i.category, amount: (m[i.category]?.amount ?? 0) + i.amount };
    return m;
  }, {})).sort((a, b) => b.amount - a.amount);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/unit" className="text-sm text-ink/65 hover:text-brand">← Unit dashboard</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="display text-5xl">Report · {r.period_label}</h1>
        <StatusPill status={r.status} />
      </div>
      {r.admin_note && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm">Committee note: {r.admin_note}</p>}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card p-4"><div className="text-2xl font-bold">{inr(received)}</div><div className="text-xs text-ink/65">Transferred to you this quarter</div></div>
        <div className="card p-4"><div className="text-2xl font-bold">{inr(spent)}</div><div className="text-xs text-ink/65">Spending entered</div></div>
        <div className="card p-4"><div className="text-2xl font-bold">{inr(received - spent)}</div><div className="text-xs text-ink/65">Carried forward</div></div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="card p-6">
          <h2 className="font-bold">Spending items</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-line">
                  <td className="py-2.5 pr-2">
                    <div className="font-medium">{CATEGORIES[i.category].en}</div>
                    <div className="text-xs text-ink/65">{i.description}</div>
                  </td>
                  <td className="text-right tabular-nums">{inr(i.amount)}</td>
                  <td className="w-20 text-right text-xs">{i.receipt_url ? <a href={i.receipt_url} target="_blank" className="font-semibold text-brand">Receipt</a> : <span className="text-ink/30">no receipt</span>}</td>
                  <td className="w-8 text-right">
                    {!locked && (
                      <form action={deleteReportItem}><input type="hidden" name="id" value={i.id} /><input type="hidden" name="report_id" value={r.id} /><button className="text-red-500">✕</button></form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!locked && (
            <form action={addReportItem} className="mt-5 grid gap-2 border-t border-line pt-4 sm:grid-cols-2">
              <input type="hidden" name="report_id" value={r.id} />
              <select name="category" className="input">{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.en}</option>)}</select>
              <input name="amount" type="number" min={1} placeholder="Amount (₹)" className="input" required />
              <input name="description" placeholder="What was bought / paid for" className="input sm:col-span-2" required />
              <div className="sm:col-span-2"><label className="label">Receipt / bill photo</label><input name="receipt" type="file" accept="image/*,application/pdf" className="text-sm" /></div>
              <button className="btn-primary sm:col-span-2">Add item</button>
            </form>
          )}
        </section>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-bold">By category</h2>
            <div className="mt-4">{byCat.length ? <CategoryBreakdown items={byCat} lang="en" /> : <p className="text-sm text-ink/65">Add items to see the breakdown.</p>}</div>
          </section>
          <section className="card p-6">
            <h2 className="font-bold">Summary</h2>
            <form action={saveReportMeta} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={r.id} />
              <div className="grid grid-cols-2 gap-2">
                <div><label className="label">Patients served</label><input name="patients_served" type="number" className="input" defaultValue={r.patients_served ?? ""} disabled={locked} /></div>
                <div><label className="label">Home visits</label><input name="home_visits" type="number" className="input" defaultValue={r.home_visits ?? ""} disabled={locked} /></div>
              </div>
              <textarea name="summary_en" rows={3} className="input" placeholder="Short note for supporters (English)" defaultValue={r.summary_en ?? ""} disabled={locked} />
              <textarea name="summary_ml" rows={3} className="input font-ml" placeholder="മലയാളത്തിൽ" defaultValue={r.summary_ml ?? ""} disabled={locked} />
              {!locked && <button className="btn-ghost w-full">Save summary</button>}
            </form>
            {!locked && (
              <form action={submitReport} className="mt-3">
                <input type="hidden" name="id" value={r.id} />
                <button className="btn-gold w-full" disabled={!items.length}>Submit for committee review</button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
