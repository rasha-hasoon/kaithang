import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaff } from "@/lib/supabase";
import { createChallenge } from "@/app/challenges/actions";

export default async function NewChallenge() {
  const staff = await getStaff();
  if (!staff?.unit_id) redirect("/staff/login?next=/unit/challenges/new");
  const week = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/unit/challenges" className="text-sm text-ink/65 hover:text-ink">← Your challenges</Link>
      <h1 className="display mt-2 text-5xl">Create a challenge</h1>
      <p className="mt-2 text-ink/70">Fill this in once. You get a link and a QR code to share, and every order shows up in your sheet.</p>
      <form action={createChallenge} className="card mt-8 grid gap-5 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="title">Challenge name</label><input id="title" name="title" className="input" placeholder="Mukkam Biryani Challenge 2026" required /></div>
        <div><label className="label" htmlFor="item">What are you selling?</label><input id="item" name="item" className="input" placeholder="Chicken biryani" required /></div>
        <div><label className="label" htmlFor="unit_label">Sold per</label>
          <select id="unit_label" name="unit_label" className="input">{["packet", "plate", "litre", "bucket", "kit", "cake", "bottle"].map((u) => <option key={u}>{u}</option>)}</select></div>
        <div><label className="label" htmlFor="price">Price per item (₹)</label><input id="price" name="price" type="number" min={1} className="input" placeholder="150" required /></div>
        <div><label className="label" htmlFor="target_qty">Target (items)</label><input id="target_qty" name="target_qty" type="number" min={1} className="input" placeholder="2000" required /></div>
        <div><label className="label" htmlFor="last_date">Last date for orders</label><input id="last_date" name="last_date" type="date" defaultValue={week} className="input" /></div>
        <div><label className="label" htmlFor="upi_id">UPI ID for payments</label><input id="upi_id" name="upi_id" className="input" placeholder="unitname@okaxis" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="regions">Wards or areas (one per line)</label>
          <textarea id="regions" name="regions" rows={4} className="input" placeholder={"Ward 1 Agastyanmuzhi\nWard 4 Manassery\nWard 7 Mukkam Town"} />
          <p className="mt-1 text-xs text-ink/65">Buyers pick one, and your sheet totals orders by ward.</p></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="description">Note for buyers (optional)</label><textarea id="description" name="description" rows={2} className="input" placeholder="Delivery on Sunday afternoon." /></div>
        <button className="btn-primary py-3 text-base sm:col-span-2">Create challenge and get QR</button>
      </form>
    </div>
  );
}
