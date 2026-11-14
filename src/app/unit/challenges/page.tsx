import Link from "next/link";
import { redirect } from "next/navigation";
import { db, getStaff } from "@/lib/supabase";
import type { Challenge } from "@/lib/challenges";
import { fmtDate, inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MyChallenges() {
  const staff = await getStaff();
  if (!staff?.unit_id) redirect("/staff/login?next=/unit/challenges");
  const { data } = await db().from("challenges").select("*").eq("unit_id", staff.unit_id).order("created_at", { ascending: false });
  const list = (data as Challenge[]) ?? [];
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/unit" className="text-sm text-ink/65 hover:text-ink">← Unit dashboard</Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-5xl">Your challenges</h1>
        <Link href="/unit/challenges/new" className="btn-primary">Create a challenge</Link>
      </div>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {list.length === 0 && <li className="py-6 text-ink/70">No challenges yet. Create one for your next biryani or payasam drive.</li>}
        {list.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <Link href={`/unit/challenges/${c.id}`} className="text-lg font-semibold hover:underline">{c.title}</Link>
              <div className="text-sm text-ink/70">{c.item}, {inr(c.price)} per {c.unit_label}{c.last_date ? `, closes ${fmtDate(c.last_date)}` : ""}</div>
            </div>
            <Link href={`/unit/challenges/${c.id}`} className="btn-ghost">Open dashboard</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
