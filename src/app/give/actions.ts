"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { getDonor, normalisePhone, setDonorSession, verifyOtp } from "@/lib/session";
import { chargeFor, type Frequency } from "@/lib/constants";

/** Turn common setup mistakes into a fix the developer can act on. */
function explain(msg: string) {
  if (/row-level security|permission denied/i.test(msg))
    return "the database refused the write. SUPABASE_SERVICE_ROLE_KEY in .env.local is probably the anon/publishable key; use the service_role (secret) key and restart npm run dev.";
  if (/relation .* does not exist|Could not find the table/i.test(msg))
    return "the donors table is missing. Run supabase/schema.sql in the Supabase SQL Editor.";
  if (/Invalid API key|JWT|apikey/i.test(msg))
    return "the Supabase key in .env.local is invalid. Copy it again from Project Settings, API keys, and restart npm run dev.";
  return msg;
}

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Step 1. Production: send the SMS here (Supabase phone auth / MSG91 / Firebase). */
export async function sendOtp(rawPhone: string): Promise<Result<{ phone: string }>> {
  const phone = normalisePhone(rawPhone);
  if (!phone) return { ok: false, error: "phone" };
  return { ok: true, phone };
}

/** Step 2. Verify the code, create the donor if new, start a session. */
export async function confirmOtp(rawPhone: string, otp: string): Promise<Result<{ name: string | null }>> {
  const phone = normalisePhone(rawPhone);
  if (!phone) return { ok: false, error: "phone" };
  if (!verifyOtp(phone, otp)) return { ok: false, error: "otp" };
  let s;
  try { s = db(); } catch (e) { return { ok: false, error: `server: ${(e as Error).message}` }; }
  const { data: existing, error: readErr } = await s.from("donors").select("id,name").eq("phone", phone).maybeSingle();
  if (readErr) { console.error("[confirmOtp] read donors:", readErr); return { ok: false, error: `server: ${explain(readErr.message)}` }; }
  let id = existing?.id as string | undefined;
  if (!id) {
    const { data, error } = await s.from("donors").insert({ phone }).select("id").single();
    if (error) { console.error("[confirmOtp] insert donor:", error); return { ok: false, error: `server: ${explain(error.message)}` }; }
    id = data.id;
  }
  await setDonorSession(id!);
  return { ok: true, name: (existing?.name as string | null) ?? null };
}

/**
 * Final step. Creates one AutoPay per chosen unit.
 * DEMO: the UPI mandate is simulated and the first debit is recorded at once.
 * Razorpay: create the subscription here and confirm it from the webhook instead.
 */
export async function startGiving(input: {
  name: string; unitIds: string[]; weekly: number; frequency: Frequency; upi: string;
}): Promise<Result> {
  const donor = await getDonor();
  if (!donor) return { ok: false, error: "auth" };
  const weekly = Math.max(1, Math.min(10000, Math.round(input.weekly)));
  const frequency: Frequency = ["monthly", "quarterly", "yearly"].includes(input.frequency) ? input.frequency : "monthly";
  if (!/^[\w.\-]{2,}@[A-Za-z]{2,}$/.test(input.upi.trim())) return { ok: false, error: "upi" };
  const unitIds = [...new Set(input.unitIds)].slice(0, 10);
  if (!unitIds.length) return { ok: false, error: "units" };

  const s = db();
  const name = input.name.trim().slice(0, 60);
  if (name) await s.from("donors").update({ name }).eq("id", donor.id);

  const { data: units } = await s.from("units").select("id").in("id", unitIds).eq("status", "approved");
  const charge = chargeFor(weekly, frequency);
  const next = new Date();
  next.setMonth(next.getMonth() + (frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12));

  for (const u of units ?? []) {
    const { data: sub, error } = await s.from("subscriptions").insert({
      donor_id: donor.id, unit_id: u.id, weekly_amount: weekly, frequency, charge_amount: charge,
      status: "active", next_charge_on: next.toISOString().slice(0, 10),
    }).select("id").single();
    if (error) return { ok: false, error: error.message };
    await s.from("contributions").insert({
      donor_id: donor.id, unit_id: u.id, subscription_id: sub.id, amount: charge, status: "captured",
      rzp_payment_id: `pay_demo_${sub.id.slice(0, 12)}`,
    });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
