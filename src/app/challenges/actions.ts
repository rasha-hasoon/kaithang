"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, getStaff } from "@/lib/supabase";
import { normalisePhone } from "@/lib/session";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50);

async function requireUnit() {
  const staff = await getStaff();
  if (!staff || staff.role !== "unit" || !staff.unit_id) redirect("/staff/login?next=/unit/challenges");
  return staff as typeof staff & { unit_id: string };
}

export async function createChallenge(formData: FormData) {
  const staff = await requireUnit();
  const title = str(formData, "title");
  const regions = str(formData, "regions").split(/\n|,/).map((r) => r.trim()).filter(Boolean).slice(0, 40);
  const { data, error } = await db().from("challenges").insert({
    unit_id: staff.unit_id,
    slug: `${slugify(title) || "challenge"}-${Math.random().toString(36).slice(2, 6)}`,
    title, item: str(formData, "item"), unit_label: str(formData, "unit_label") || "plate",
    price: Math.max(1, Math.round(Number(formData.get("price")) || 0)),
    target_qty: Math.max(1, Math.round(Number(formData.get("target_qty")) || 500)),
    last_date: str(formData, "last_date") || null, regions,
    upi_id: str(formData, "upi_id") || null, description: str(formData, "description") || null,
  }).select("id").single();
  if (error) throw new Error(`Couldn't create the challenge: ${error.message}. Did you run supabase/migrations/003_challenges.sql?`);
  redirect(`/unit/challenges/${data.id}?created=1`);
}

/** Public: anyone with the link/QR can book. */
export async function placeOrder(input: { slug: string; name: string; phone: string; region: string; qty: number; method: "upi" | "cash"; utr?: string }) {
  const s = db();
  const { data: c } = await s.from("challenges").select("id,price,last_date").eq("slug", input.slug).single();
  if (!c) return { ok: false as const, error: "Challenge not found" };
  const name = input.name.trim().slice(0, 60);
  const qty = Math.max(1, Math.min(500, Math.round(input.qty)));
  if (!name) return { ok: false as const, error: "name" };
  const phone = input.phone ? normalisePhone(input.phone) : null;
  if (input.phone && !phone) return { ok: false as const, error: "phone" };
  const { error } = await s.from("challenge_orders").insert({
    challenge_id: c.id, name, phone, region: input.region || null, qty, amount: qty * c.price,
    method: input.method, status: input.method === "upi" ? "paid" : "pending", utr: input.utr?.trim().slice(0, 30) || null,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/c/${input.slug}`);
  return { ok: true as const, amount: qty * c.price };
}

export async function markPaid(formData: FormData) {
  const staff = await requireUnit();
  const id = str(formData, "id");
  const challengeId = str(formData, "challenge_id");
  const { data: c } = await db().from("challenges").select("id").eq("id", challengeId).eq("unit_id", staff.unit_id).single();
  if (!c) return;
  await db().from("challenge_orders").update({ status: "paid" }).eq("id", id).eq("challenge_id", challengeId);
  revalidatePath(`/unit/challenges/${challengeId}`);
}
