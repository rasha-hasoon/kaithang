import { db } from "./supabase";

/** Restart pauses whose end date has passed. Server-only (not a server action). */
export async function resumeDuePauses(donorId: string) {
  await db().from("subscriptions").update({ status: "active", paused_until: null })
    .eq("donor_id", donorId).eq("status", "paused").lte("paused_until", new Date().toISOString().slice(0, 10));
}
