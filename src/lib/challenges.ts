import { db } from "./supabase";

export type Challenge = {
  id: string; unit_id: string; slug: string; title: string; item: string; unit_label: string; price: number;
  target_qty: number; last_date: string | null; regions: string[]; upi_id: string | null; description: string | null; created_at: string;
};
export type Order = {
  id: string; challenge_id: string; name: string; phone: string | null; region: string | null; qty: number; amount: number;
  method: "upi" | "cash"; status: "paid" | "pending"; utr: string | null; created_at: string;
};

export async function getChallengeBySlug(slug: string) {
  const { data } = await db().from("challenges").select("*").eq("slug", slug).maybeSingle();
  return data as Challenge | null;
}

export async function getOrders(challengeId: string) {
  const { data } = await db().from("challenge_orders").select("*").eq("challenge_id", challengeId).order("created_at", { ascending: false }).limit(5000);
  return (data as Order[]) ?? [];
}

export function summarise(orders: Order[], regions: string[]) {
  const qty = orders.reduce((s, o) => s + o.qty, 0);
  const amount = orders.reduce((s, o) => s + o.amount, 0);
  const collected = orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.amount, 0);
  const cashPending = orders.filter((o) => o.status === "pending").reduce((s, o) => s + o.amount, 0);
  const byRegion = new Map<string, { region: string; orders: number; qty: number; amount: number }>();
  for (const r of regions) byRegion.set(r, { region: r, orders: 0, qty: 0, amount: 0 });
  for (const o of orders) {
    const k = o.region || "Other";
    const r = byRegion.get(k) ?? { region: k, orders: 0, qty: 0, amount: 0 };
    r.orders++; r.qty += o.qty; r.amount += o.amount; byRegion.set(k, r);
  }
  return { qty, amount, collected, cashPending, orders: orders.length, regions: [...byRegion.values()].sort((a, b) => b.qty - a.qty) };
}

/** Public stats only (no names or phone numbers). */
export async function getPublicSummary(c: Challenge) {
  const { data } = await db().from("challenge_orders").select("qty,amount,status,region,name,created_at").eq("challenge_id", c.id).order("created_at", { ascending: false });
  const rows = (data as Order[]) ?? [];
  return { ...summarise(rows, c.regions), recent: rows.slice(0, 6).map((r) => ({ name: r.name.split(" ")[0], qty: r.qty, region: r.region, at: r.created_at })) };
}
