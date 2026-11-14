import { db } from "./supabase";
import type { Category } from "./constants";

export type Unit = {
  id: string; slug: string; name: string; name_ml: string | null; kind: "government" | "private" | "community";
  district: string; panchayat: string | null; address: string | null; about_en: string | null; about_ml: string | null;
  phone: string | null; email: string | null; cover_url: string | null; patients_registered: number; home_visits_month: number;
  nurses: number; volunteers: number; bank_account_name: string | null; bank_account_last4: string | null; ifsc: string | null;
  status: "pending" | "approved" | "rejected"; is_sample: boolean; created_at: string; approved_at: string | null;
};
export type UnitStats = {
  unit_id: string; supporters: number; monthly_committed: number; total_received: number; total_disbursed: number;
  total_spent: number; pending_transfer: number; last_report_period: string | null;
};
export type Need = { id: string; unit_id: string; title_en: string; title_ml: string | null; category: Category; qty_needed: number; qty_fulfilled: number; cost_per_item: number | null };
export type Report = {
  id: string; unit_id: string; period_label: string; period_start: string; period_end: string; patients_served: number | null;
  home_visits: number | null; summary_en: string | null; summary_ml: string | null; status: "draft" | "submitted" | "approved" | "rejected";
  admin_note: string | null; submitted_at: string | null; approved_at: string | null;
  report_items?: { id: string; category: Category; description: string; amount: number; receipt_url: string | null }[];
};

export async function getPlatformStats() {
  const { data } = await db().from("platform_stats").select("*").single();
  return (data ?? { units_live: 0, active_supporters: 0, total_raised: 0, total_disbursed: 0, patients_cared: 0, monthly_committed: 0 }) as {
    units_live: number; active_supporters: number; total_raised: number; total_disbursed: number; patients_cared: number; monthly_committed: number;
  };
}

export async function getUnitsWithStats(status: Unit["status"] = "approved") {
  const s = db();
  const [{ data: units }, { data: stats }] = await Promise.all([
    s.from("units").select("*").eq("status", status).order("name"),
    s.from("unit_stats").select("*"),
  ]);
  const byId = new Map((stats as UnitStats[] | null)?.map((x) => [x.unit_id, x]));
  return ((units as Unit[]) ?? []).map((u) => ({ ...u, stats: byId.get(u.id)! }));
}

export async function getUnitBySlug(slug: string) {
  const { data } = await db().from("units").select("*").eq("slug", slug).single();
  return (data as Unit) ?? null;
}

export async function getUnitDetail(unitId: string, opts: { allReports?: boolean } = {}) {
  const s = db();
  let rq = s.from("reports").select("*, report_items(*)").eq("unit_id", unitId).order("period_start", { ascending: false });
  if (!opts.allReports) rq = rq.eq("status", "approved");
  const [stats, cats, needs, reports, transfers] = await Promise.all([
    s.from("unit_stats").select("*").eq("unit_id", unitId).single(),
    s.from("unit_spend_by_category").select("category, amount").eq("unit_id", unitId),
    s.from("unit_needs").select("*").eq("unit_id", unitId).order("created_at"),
    rq,
    s.from("disbursements").select("*").eq("unit_id", unitId).order("paid_at", { ascending: false }).limit(12),
  ]);
  return {
    stats: stats.data as UnitStats,
    categories: ((cats.data as { category: Category; amount: number }[]) ?? []).sort((a, b) => b.amount - a.amount),
    needs: (needs.data as Need[]) ?? [],
    reports: (reports.data as Report[]) ?? [],
    transfers: (transfers.data as { id: string; amount: number; period_label: string; utr_ref: string | null; paid_at: string }[]) ?? [],
  };
}
