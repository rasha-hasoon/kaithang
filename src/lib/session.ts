import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "./supabase";

/**
 * Donor login = phone + OTP.
 * DEMO MODE: the OTP is always 123456 and no SMS is sent.
 * For production, swap verifyOtp() for Supabase phone auth / MSG91.
 */
const COOKIE = "kd_donor";
const secret = () => process.env.SESSION_SECRET || "kaithang-dev-secret-change-me";
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex").slice(0, 32);

export const DEMO_OTP = "123456";
export function verifyOtp(_phone: string, otp: string) {
  return otp.trim() === DEMO_OTP;
}

export function normalisePhone(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export async function setDonorSession(donorId: string) {
  (await cookies()).set(COOKIE, `${donorId}.${sign(donorId)}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearDonorSession() {
  (await cookies()).delete(COOKIE);
}

export type Donor = { id: string; phone: string; name: string | null; district: string | null; show_name: boolean };

export async function getDonor(): Promise<Donor | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [id, sig] = raw.split(".");
  if (!id || !sig || sig.length !== 32) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(sign(id)))) return null;
  const { data } = await db().from("donors").select("id,phone,name,district,show_name").eq("id", id).single();
  return (data as Donor) ?? null;
}
