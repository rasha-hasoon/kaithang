"use client";

import { useMemo, useState } from "react";
import { markPaid } from "@/app/challenges/actions";
import type { Order } from "@/lib/challenges";

export function OrderSheet({ orders, regions, challengeId, unitLabel, fileName }: {
  orders: Order[]; regions: string[]; challengeId: string; unitLabel: string; fileName: string;
}) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");
  const rows = useMemo(() => orders.filter((o) =>
    (!region || o.region === region) && (!status || o.status === status) &&
    (!q || `${o.name} ${o.phone ?? ""} ${o.utr ?? ""}`.toLowerCase().includes(q.toLowerCase()))), [orders, q, region, status]);
  const totQty = rows.reduce((s, o) => s + o.qty, 0);
  const totAmt = rows.reduce((s, o) => s + o.amount, 0);

  const download = () => {
    const head = ["#", "Date", "Name", "Mobile", "Ward", "Qty", "Amount", "Method", "Status", "UTR"];
    const lines = rows.map((o, i) => [rows.length - i, new Date(o.created_at).toLocaleString("en-IN"), o.name, o.phone ?? "", o.region ?? "", o.qty, o.amount, o.method, o.status, o.utr ?? ""]);
    const csv = [head, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${fileName}.csv`; a.click();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input className="input !w-56" placeholder="Search name, mobile, UTR" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders" />
        <select className="input !w-auto" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Filter by ward">
          <option value="">All wards</option>{regions.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">Paid and pending</option><option value="paid">Paid</option><option value="pending">Cash pending</option>
        </select>
        <button className="btn-ghost ml-auto" onClick={download}>Download CSV</button>
      </div>
      <div className="mt-3 max-h-[560px] overflow-auto rounded-lg ring-1 ring-line">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-paper text-left text-xs text-ink/70">
            <tr>{["#", "Date", "Name", "Mobile", "Ward", "Qty", "Amount", "Paid by", "Status"].map((h) => <th key={h} className="border-b border-r border-line px-3 py-2 font-semibold last:border-r-0">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((o, i) => (
              <tr key={o.id} className="odd:bg-white even:bg-paper/40">
                <td className="border-b border-r border-line px-3 py-1.5 tabular-nums text-ink/60">{rows.length - i}</td>
                <td className="border-b border-r border-line px-3 py-1.5 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                <td className="border-b border-r border-line px-3 py-1.5">{o.name}</td>
                <td className="border-b border-r border-line px-3 py-1.5 tabular-nums">{o.phone ? `${o.phone.slice(0, 5)} ${o.phone.slice(5)}` : ""}</td>
                <td className="border-b border-r border-line px-3 py-1.5">{o.region}</td>
                <td className="border-b border-r border-line px-3 py-1.5 text-right tabular-nums">{o.qty}</td>
                <td className="border-b border-r border-line px-3 py-1.5 text-right tabular-nums">₹{o.amount.toLocaleString("en-IN")}</td>
                <td className="border-b border-r border-line px-3 py-1.5">{o.method === "upi" ? "UPI" : "Cash"}</td>
                <td className="border-b border-line px-3 py-1.5">
                  {o.status === "paid" ? <span className="text-leaf">Paid</span> : (
                    <form action={markPaid} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={o.id} /><input type="hidden" name="challenge_id" value={challengeId} />
                      <span className="text-rose">Pending</span><button className="rounded bg-ink px-2 py-0.5 text-xs text-white">Mark paid</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 bg-paper font-semibold">
            <tr>
              <td className="border-t border-line px-3 py-2" colSpan={5}>{rows.length} orders</td>
              <td className="border-t border-line px-3 py-2 text-right tabular-nums">{totQty}</td>
              <td className="border-t border-line px-3 py-2 text-right tabular-nums">₹{totAmt.toLocaleString("en-IN")}</td>
              <td className="border-t border-line px-3 py-2" colSpan={2}>{unitLabel}s</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
