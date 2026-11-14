import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db, getStaff } from "@/lib/supabase";
import { getOrders, summarise, type Challenge } from "@/lib/challenges";
import { qrDataUrl, siteUrl } from "@/lib/qr";
import { fmtDate, inr, num, pct } from "@/lib/format";
import { Progress, Stat } from "@/components/ui";
import { OrderSheet } from "@/components/OrderSheet";

export const dynamic = "force-dynamic";

export default async function ChallengeDashboard({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const { created } = await searchParams;
  const staff = await getStaff();
  if (!staff?.unit_id) redirect(`/staff/login?next=/unit/challenges/${id}`);
  const { data } = await db().from("challenges").select("*").eq("id", id).eq("unit_id", staff.unit_id).maybeSingle();
  const c = data as Challenge | null;
  if (!c) notFound();
  const orders = await getOrders(c.id);
  const s = summarise(orders, c.regions);
  const link = `${siteUrl()}/c/${c.slug}`;
  const qr = await qrDataUrl(link);
  const maxQ = Math.max(1, ...s.regions.map((r) => r.qty));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/unit/challenges" className="text-sm text-ink/65 hover:text-ink">← Your challenges</Link>
      {created && <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">Challenge created. Share the QR code or link below.</div>}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-5xl">{c.title}</h1>
          <p className="mt-1 text-ink/70">{c.item}, {inr(c.price)} per {c.unit_label}{c.last_date ? `, orders close ${fmtDate(c.last_date)}` : ""}</p>
        </div>
        <Link href={`/c/${c.slug}`} className="btn-ghost" target="_blank">Open public page</Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={`${c.unit_label}s booked of ${num(c.target_qty)}`} value={num(s.qty)} hint={`${pct(s.qty, c.target_qty)}% of target`} />
        <Stat label="Total booked" value={inr(s.amount)} hint={`${num(s.orders)} orders`} />
        <Stat label="Collected" value={inr(s.collected)} />
        <Stat label="Cash still to collect" value={inr(s.cashPending)} />
      </div>
      <div className="mt-3"><Progress value={s.qty} max={c.target_qty} /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="card p-6">
          <h2 className="font-bold">By ward</h2>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs text-ink/65"><tr><th className="py-1.5">Ward</th><th className="text-right">Orders</th><th className="text-right">{c.unit_label}s</th><th className="text-right">Amount</th><th className="w-1/3" /></tr></thead>
            <tbody>
              {s.regions.map((r) => (
                <tr key={r.region} className="border-t border-line">
                  <td className="py-2">{r.region}</td>
                  <td className="text-right tabular-nums">{num(r.orders)}</td>
                  <td className="text-right font-semibold tabular-nums">{num(r.qty)}</td>
                  <td className="text-right tabular-nums">{inr(r.amount)}</td>
                  <td className="pl-4"><div className="h-2 rounded-full bg-line"><div className="h-full rounded-full bg-gold" style={{ width: `${(r.qty / maxQ) * 100}%` }} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card p-6 text-center">
          <h2 className="font-bold">Share to take orders</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt={`QR code for ${link}`} className="mx-auto mt-3 h-48 w-48" />
          <p className="mt-2 break-all text-xs text-ink/70">{link}</p>
          <a href={qr} download={`${c.slug}-qr.png`} className="btn-ghost mt-3 w-full">Download QR</a>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${c.title}: book ${c.item.toLowerCase()} for ${inr(c.price)} and support palliative care. ${link}`)}`} target="_blank" className="btn-gold mt-2 w-full">Share on WhatsApp</a>
        </section>
      </div>

      <section className="card mt-6 p-6">
        <h2 className="mb-3 font-bold">Order sheet</h2>
        <OrderSheet orders={orders} regions={c.regions} challengeId={c.id} unitLabel={c.unit_label} fileName={c.slug} />
      </section>
    </div>
  );
}
