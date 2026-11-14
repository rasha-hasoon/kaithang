"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { clearDonorSession, getDonor, normalisePhone, setDonorSession, verifyOtp } from "@/lib/session";
import { chargeFor, type Frequency } from "@/lib/constants";

const safeNext = (n: FormDataEntryValue | null) => {
  const s = String(n ?? "");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/me";
};

export async function setLang(formData: FormData) {
  const lang = formData.get("lang") === "ml" ? "ml" : "en";
  (await cookies()).set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

/** Step 1: validate phone, (demo) "send" OTP → show OTP step */
export async function requestOtp(formData: FormData) {
  const phone = normalisePhone(String(formData.get("phone") ?? ""));
  const next = safeNext(formData.get("next"));
  if (!phone) redirect(`/login?err=phone&next=${encodeURIComponent(next)}`);
  // Production: trigger SMS via Supabase phone auth / MSG91 here.
  redirect(`/login?step=otp&phone=${phone}&next=${encodeURIComponent(next)}`);
}

/** Step 2: verify OTP, create donor if new, start session */
export async function verifyLogin(formData: FormData) {
  const phone = normalisePhone(String(formData.get("phone") ?? ""));
  const otp = String(formData.get("otp") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 60) || null;
  const next = safeNext(formData.get("next"));
  if (!phone) redirect(`/login?err=phone&next=${encodeURIComponent(next)}`);
  if (!verifyOtp(phone, otp)) redirect(`/login?step=otp&phone=${phone}&err=otp&next=${encodeURIComponent(next)}`);

  const s = db();
  const { data: existing } = await s.from("donors").select("id,name").eq("phone", phone).maybeSingle();
  let id = existing?.id as string | undefined;
  if (!id) {
    const { data, error } = await s.from("donors").insert({ phone, name }).select("id").single();
    if (error) throw new Error(`Couldn't save the donor: ${error.message}. Check SUPABASE_SERVICE_ROLE_KEY in .env.local.`);
    id = data.id;
  } else if (name && !existing?.name) {
    await s.from("donors").update({ name }).eq("id", id);
  }
  await setDonorSession(id!);
  redirect(next);
}

export async function logoutDonor() {
  await clearDonorSession();
  redirect("/");
}

/**
 * Create an AutoPay subscription.
 * DEMO: marks the mandate active and records the first debit immediately.
 * Razorpay (Step 5): create plan + subscription here, redirect to its short_url,
 * and let the webhook insert contributions.
 */
export async function subscribe(formData: FormData) {
  const unitId = String(formData.get("unit_id"));
  const slug = String(formData.get("slug"));
  const weekly = Math.max(1, Math.min(10000, Math.round(Number(formData.get("weekly")) || 3)));
  const freqRaw = String(formData.get("frequency"));
  const frequency: Frequency = freqRaw === "quarterly" || freqRaw === "yearly" ? freqRaw : "monthly";

  const donor = await getDonor();
  if (!donor) redirect(`/login?next=${encodeURIComponent(`/units/${slug}?w=${weekly}&f=${frequency}#support`)}`);

  const s = db();
  const { data: unit } = await s.from("units").select("id,status").eq("id", unitId).single();
  if (!unit || unit.status !== "approved") throw new Error("Unit not available");

  const charge = chargeFor(weekly, frequency);
  const next = new Date();
  next.setMonth(next.getMonth() + (frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12));

  const { data: sub, error } = await s
    .from("subscriptions")
    .insert({ donor_id: donor.id, unit_id: unitId, weekly_amount: weekly, frequency, charge_amount: charge, status: "active", next_charge_on: next.toISOString().slice(0, 10) })
    .select("id")
    .single();
  if (error) throw error;
  await s.from("contributions").insert({ donor_id: donor.id, unit_id: unitId, subscription_id: sub.id, amount: charge, status: "captured", rzp_payment_id: `pay_demo_${sub.id.slice(0, 12)}` });

  revalidatePath("/", "layout");
  redirect("/me?new=1");
}

export async function updateSubscription(formData: FormData) {
  const donor = await getDonor();
  if (!donor) redirect("/login");
  const id = String(formData.get("id"));
  const action = String(formData.get("action"));
  const status = action === "pause" ? "paused" : action === "resume" ? "active" : "cancelled";
  await db()
    .from("subscriptions")
    .update({ status, cancelled_at: status === "cancelled" ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("donor_id", donor.id);
  revalidatePath("/me");
}

/** Lower the weekly amount instead of cancelling. */
export async function lowerAmount(formData: FormData) {
  const donor = await getDonor();
  if (!donor) redirect("/login");
  const id = String(formData.get("id"));
  const weekly = Math.max(1, Math.round(Number(formData.get("weekly")) || 3));
  const s = db();
  const { data: sub } = await s.from("subscriptions").select("frequency").eq("id", id).eq("donor_id", donor.id).single();
  if (!sub) return;
  await s.from("subscriptions")
    .update({ weekly_amount: weekly, charge_amount: chargeFor(weekly, sub.frequency as Frequency), status: "active" })
    .eq("id", id).eq("donor_id", donor.id);
  revalidatePath("/me");
}

/** Cancel with an optional reason. Works even if the feedback columns haven't been added yet. */
export async function cancelWithFeedback(formData: FormData) {
  const donor = await getDonor();
  if (!donor) redirect("/login");
  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") ?? "").slice(0, 40) || null;
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  const s = db();
  const base = { status: "cancelled", cancelled_at: new Date().toISOString() };
  const { error } = await s.from("subscriptions").update({ ...base, cancel_reason: reason, cancel_note: note })
    .eq("id", id).eq("donor_id", donor.id);
  if (error) {
    console.warn("[cancel] feedback columns missing, run supabase/migrations/001_cancel_feedback.sql:", error.message);
    await s.from("subscriptions").update(base).eq("id", id).eq("donor_id", donor.id);
  }
  revalidatePath("/me");
}

/** Pause with a duration (1 or 3 months, or 0 = until resumed) and an optional reason. */
export async function pauseWithReason(formData: FormData) {
  const donor = await getDonor();
  if (!donor) redirect("/login");
  const id = String(formData.get("id"));
  const months = Number(formData.get("months")) || 0;
  const reason = String(formData.get("reason") ?? "").slice(0, 40) || null;
  let until: string | null = null;
  if (months > 0) { const d = new Date(); d.setMonth(d.getMonth() + months); until = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); }
  const s = db();
  const { error } = await s.from("subscriptions").update({ status: "paused", paused_until: until, pause_reason: reason })
    .eq("id", id).eq("donor_id", donor.id);
  if (error) {
    console.warn("[pause] columns missing, run supabase/migrations/002_pause_details.sql:", error.message);
    await s.from("subscriptions").update({ status: "paused" }).eq("id", id).eq("donor_id", donor.id);
  }
  revalidatePath("/me");
}
