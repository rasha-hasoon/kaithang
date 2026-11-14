import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { getChallengeBySlug, getPublicSummary } from "@/lib/challenges";
import { fmtDate, inr, num, pct } from "@/lib/format";
import { Progress } from "@/components/ui";
import { ChallengeOrderForm } from "@/components/ChallengeOrderForm";

export const dynamic = "force-dynamic";

export default async function ChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getChallengeBySlug(slug);
  if (!c) notFound();
  const [s, { data: unit }] = await Promise.all([getPublicSummary(c), db().from("units").select("name,slug").eq("id", c.unit_id).single()]);
  const top = s.regions.slice(0, 5);
  const maxQ = Math.max(1, ...top.map((r) => r.qty));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm text-ink/70">{unit?.name}{c.last_date ? `, orders close ${fmtDate(c.last_date)}` : ""}</p>
      <h1 className="display mt-2 text-5xl sm:text-6xl">{c.title}</h1>
      {c.description && <p className="mt-3 max-w-2xl text-lg text-ink/75">{c.description}</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><div className="display text-5xl">{num(s.qty)}</div><div className="text-sm text-ink/70">{c.unit_label}s booked of {num(c.target_qty)}</div></div>
              <div className="text-right"><div className="display text-4xl text-leaf">{inr(s.amount)}</div><div className="text-sm text-ink/70">raised for palliative care</div></div>
            </div>
            <div className="mt-4"><Progress value={s.qty} max={c.target_qty} /></div>
            <p className="mt-2 text-xs text-ink/65">{pct(s.qty, c.target_qty)}% of target, {num(s.orders)} orders, {inr(c.price)} per {c.unit_label}</p>
          </section>

          {top.length > 0 && (
            <section className="card p-6">
              <h2 className="text-lg font-bold">Ward leaderboard</h2>
              <ol className="mt-4 space-y-3">
                {top.map((r, i) => (
                  <li key={r.region}>
                    <div className="flex justify-between text-sm"><span><b className="mr-2 text-ink/50">{i + 1}</b>{r.region}</span><span className="font-semibold tabular-nums">{num(r.qty)}</span></div>
                    <div className="mt-1 h-2 rounded-full bg-line"><div className="h-full rounded-full bg-gold" style={{ width: `${(r.qty / maxQ) * 100}%` }} /></div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {s.recent.length > 0 && (
            <section className="card p-6">
              <h2 className="text-lg font-bold">Just booked</h2>
              <ul className="mt-3 divide-y divide-line text-sm">
                {s.recent.map((r, i) => <li key={i} className="flex justify-between py-2"><span>{r.name}, {r.region}</span><span className="text-ink/70">{r.qty} {c.unit_label}{r.qty > 1 ? "s" : ""}</span></li>)}
              </ul>
            </section>
          )}
        </div>

        <aside className="card kasavu h-fit p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">Book {c.item.toLowerCase()}</h2>
          <p className="mb-5 text-sm text-ink/70">{inr(c.price)} per {c.unit_label}. Every rupee goes to {unit?.name}.</p>
          <ChallengeOrderForm slug={c.slug} title={c.title} price={c.price} item={c.item} unitLabel={c.unit_label}
            regions={c.regions} upiId={c.upi_id || "samhari.demo@upi"} />
        </aside>
      </div>
    </div>
  );
}
