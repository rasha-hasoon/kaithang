import Link from "next/link";
import { redirect } from "next/navigation";
import { db, getStaff } from "@/lib/supabase";
import { getPlatformStats, type Report, type Unit, type UnitStats } from "@/lib/data";
import { CATEGORIES, UNIT_KIND } from "@/lib/constants";
import { fmtDate, inr, num } from "@/lib/format";
import { Stat, StatusPill } from "@/components/ui";
import { recordTransfer, reviewReport, setUnitStatus, staffLogout } from "../staff/actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const staff = await getStaff();
  if (!staff) redirect("/staff/login");
  if (staff.role !== "admin") redirect("/unit");
  const s = db();
  const [stats, { data: units }, { data: ustats }, { data: pendingReports }, { data: recent }] = await Promise.all([
    getPlatformStats(),
    s.from("units").select("*").order("created_at", { ascending: false }),
    s.from("unit_stats").select("*"),
    s.from("reports").select("*, report_items(*), units(name)").eq("status", "submitted").order("submitted_at"),
    s.from("contributions").select("id,amount,charged_at, donors(name), units(name)").order("charged_at", { ascending: false }).limit(8),
  ]);
  const all = (units as Unit[]) ?? [];
  const sm = new Map((ustats as UnitStats[] ?? []).map((x) => [x.unit_id, x]));
  const pending = all.filter((u) => u.status === "pending");
  const approved = all.filter((u) => u.status === "approved");
  const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const toTransfer = approved.reduce((a, u) => a + Math.max(0, sm.get(u.id)?.pending_transfer ?? 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs text-ink/65">Committee dashboard</div>
          <h1 className="display text-5xl">Samhari admin</h1>
        </div>
        <form action={staffLogout}><button className="btn-ghost">Log out</button></form>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Active supporters" value={num(stats.active_supporters)} />
        <Stat label="Committed / month" value={inr(stats.monthly_committed)} />
        <Stat label="Collected (central a/c)" value={inr(stats.total_raised)} />
        <Stat label="Transferred to units" value={inr(stats.total_disbursed)} />
        <Stat label="Awaiting transfer" value={inr(toTransfer)} />
      </div>

      {pending.length > 0 && (
        <section className="card mt-8 p-6">
          <h2 className="font-bold">Units awaiting verification <span className="chip ml-1">{pending.length}</span></h2>
          <div className="mt-4 space-y-3">
            {pending.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-ink/65">{UNIT_KIND[u.kind].en} · {u.panchayat}, {u.district} · {u.patients_registered} patients · {u.email ?? u.phone} · applied {fmtDate(u.created_at)}</div>
                  <div className="text-xs text-ink/65">Bank: {u.bank_account_name ?? "not given"} ••••{u.bank_account_last4 ?? "not given"} · {u.ifsc ?? "not given"}</div>
                </div>
                <div className="flex gap-2">
                  <form action={setUnitStatus}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="status" value="approved" /><button className="btn-primary !py-1.5">Approve</button></form>
                  <form action={setUnitStatus}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="status" value="rejected" /><button className="btn-ghost !py-1.5 text-red-600">Reject</button></form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card mt-6 p-6">
        <h2 className="font-bold">Reports awaiting review <span className="chip ml-1">{pendingReports?.length ?? 0}</span></h2>
        {!pendingReports?.length && <p className="mt-2 text-sm text-ink/65">Nothing to review.</p>}
        <div className="mt-4 space-y-4">
          {(pendingReports as (Report & { units: { name: string } })[] ?? []).map((r) => {
            const total = r.report_items?.reduce((a, i) => a + i.amount, 0) ?? 0;
            return (
              <div key={r.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold">{r.units.name} · {r.period_label}</div>
                  <div className="text-sm">Spent <b>{inr(total)}</b> · {num(r.patients_served)} patients · {num(r.home_visits)} visits</div>
                </div>
                <table className="mt-3 w-full text-sm">
                  <tbody>
                    {r.report_items?.map((i) => (
                      <tr key={i.id} className="border-t border-line">
                        <td className="py-1.5">{CATEGORIES[i.category].en}<span className="text-ink/65">: {i.description}</span></td>
                        <td className="text-right tabular-nums">{inr(i.amount)}</td>
                        <td className="w-20 text-right text-xs">{i.receipt_url ? <a href={i.receipt_url} target="_blank" className="font-semibold text-brand">Receipt</a> : <span className="text-ink/30">none</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <form action={reviewReport} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input name="note" placeholder="Note to unit (optional)" className="input !w-auto flex-1" />
                  <button name="decision" value="approve" className="btn-primary !py-1.5">Approve & publish</button>
                  <button name="decision" value="reject" className="btn-ghost !py-1.5 text-red-600">Send back</button>
                </form>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card mt-6 p-6">
        <h2 className="font-bold">Monthly transfers to units</h2>
        <p className="text-sm text-ink/65">Collections sit in the central account and are transferred once a month. Record each bank transfer here.</p>
        <div className="-mx-6 mt-4 overflow-x-auto px-6">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs uppercase text-ink/65"><tr><th className="py-2">Unit</th><th className="text-right">Supporters</th><th className="text-right">Received</th><th className="text-right">Transferred</th><th className="text-right">Due</th><th /></tr></thead>
          <tbody>
            {approved.map((u) => {
              const x = sm.get(u.id);
              return (
                <tr key={u.id} className="border-t border-line align-middle">
                  <td className="py-2.5"><Link href={`/units/${u.slug}`} className="font-medium hover:text-brand">{u.name}</Link></td>
                  <td className="text-right">{num(x?.supporters)}</td>
                  <td className="text-right tabular-nums">{inr(x?.total_received)}</td>
                  <td className="text-right tabular-nums">{inr(x?.total_disbursed)}</td>
                  <td className="text-right font-semibold tabular-nums">{inr(x?.pending_transfer)}</td>
                  <td className="pl-3 text-right">
                    {(x?.pending_transfer ?? 0) > 0 && (
                      <form action={recordTransfer} className="flex justify-end gap-1">
                        <input type="hidden" name="unit_id" value={u.id} />
                        <input type="hidden" name="amount" value={x?.pending_transfer} />
                        <input type="hidden" name="period_label" value={lastMonth} />
                        <input name="utr_ref" placeholder="UTR ref" className="input !w-28 !py-1 text-xs" />
                        <button className="btn-primary !px-3 !py-1 text-xs">Mark paid</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </section>

      <section className="card mt-6 p-6">
        <h2 className="font-bold">Latest collections</h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {(recent as unknown as { id: string; amount: number; charged_at: string; donors: { name: string | null }; units: { name: string } }[] ?? []).map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="py-2">{fmtDate(c.charged_at)}</td>
                <td>{c.donors?.name ?? "Supporter"}</td>
                <td className="text-ink/70">{c.units?.name}</td>
                <td className="text-right font-semibold tabular-nums">{inr(c.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="mt-6 text-xs text-ink/65">Signed in as {staff.email} (admin)</p>
    </div>
  );
}
