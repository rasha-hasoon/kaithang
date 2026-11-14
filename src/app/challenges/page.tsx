import Link from "next/link";
import { db } from "@/lib/supabase";
import type { Challenge } from "@/lib/challenges";
import { fmtDate, inr, num } from "@/lib/format";
import { Progress } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const s = db();
  const { data } = await s.from("challenges").select("*, units(name)").order("created_at", { ascending: false });
  const list = (data as (Challenge & { units: { name: string } })[]) ?? [];
  const { data: orders } = list.length
    ? await s.from("challenge_orders").select("challenge_id,qty,amount").in("challenge_id", list.map((c) => c.id))
    : { data: [] };
  const tot = new Map<string, { qty: number; amount: number }>();
  (orders ?? []).forEach((o) => { const t = tot.get(o.challenge_id) ?? { qty: 0, amount: 0 }; t.qty += o.qty; t.amount += o.amount; tot.set(o.challenge_id, t); });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-5xl sm:text-6xl">Food challenges</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink/75">Biryani, payasam, cake and juice challenges run by palliative units. Book with one tap, pay by UPI, and every rupee goes to patient care.</p>
        </div>
        <Link href="/unit/challenges/new" className="btn-primary px-6 py-3">Create a challenge</Link>
      </div>
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {list.length === 0 && <li className="text-ink/70">No challenges yet. Palliative units can create the first one.</li>}
        {list.map((c) => {
          const t = tot.get(c.id) ?? { qty: 0, amount: 0 };
          return (
            <li key={c.id} className="card p-6">
              <p className="text-sm text-ink/70">{c.units?.name}{c.last_date ? `, closes ${fmtDate(c.last_date)}` : ""}</p>
              <h2 className="mt-1 text-2xl font-bold">{c.title}</h2>
              <p className="mt-1 text-ink/70">{c.item}, {inr(c.price)} per {c.unit_label}</p>
              <div className="mt-4"><Progress value={t.qty} max={c.target_qty} /></div>
              <p className="mt-2 text-sm"><b>{num(t.qty)}</b> of {num(c.target_qty)} {c.unit_label}s, <b>{inr(t.amount)}</b> raised</p>
              <Link href={`/c/${c.slug}`} className="btn-gold mt-5">Book now</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
