"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authClient, db, getStaff } from "@/lib/supabase";
import type { Category } from "@/lib/constants";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const int = (f: FormData, k: string) => Math.max(0, Math.round(Number(f.get(k)) || 0));
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);

// ---------------- Auth ----------------
export async function staffLogin(formData: FormData) {
  const supa = await authClient();
  const next = str(formData, "next");
  const safeNext = next.startsWith("/unit") || next.startsWith("/admin") ? next : "";
  const { data, error } = await supa.auth.signInWithPassword({ email: str(formData, "email"), password: str(formData, "password") });
  if (error || !data.user) redirect(`/staff/login?err=${encodeURIComponent(error?.message ?? "login")}${safeNext ? `&next=${encodeURIComponent(safeNext)}` : ""}`);
  // Read the profile with the user id we just got (the new session cookie isn't readable until the next request).
  const s = db();
  let { data: p } = await s.from("profiles").select("role,unit_id").eq("id", data.user.id).maybeSingle();
  if (!p) {
    await s.from("profiles").insert({ id: data.user.id, email: data.user.email, name: data.user.email?.split("@")[0] });
    p = { role: "unit", unit_id: null };
  }
  if (p.role === "admin") redirect(safeNext.startsWith("/admin") ? safeNext : "/admin");
  if (!p.unit_id) redirect("/staff/login?err=nounit");
  redirect(safeNext.startsWith("/unit") ? safeNext : "/unit");
}

export async function staffLogout() {
  const supa = await authClient();
  await supa.auth.signOut();
  redirect("/staff/login");
}

/** A palliative unit signs up → account + unit (pending) → admin approves later. */
export async function registerUnit(formData: FormData) {
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");
  const name = str(formData, "name");
  if (!email || password.length < 8 || !name) redirect("/staff/register?err=fields");

  const s = db();
  const { data: created, error } = await s.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { name: str(formData, "contact_name") || name },
  });
  if (error || !created.user) redirect(`/staff/register?err=${encodeURIComponent(error?.message ?? "signup")}`);

  const base = slugify(`${name}-${str(formData, "panchayat")}`) || "unit";
  const { data: unit, error: uErr } = await s.from("units").insert({
    slug: `${base}-${Math.random().toString(36).slice(2, 6)}`,
    name, name_ml: str(formData, "name_ml") || null,
    kind: str(formData, "kind") || "community",
    district: str(formData, "district"), panchayat: str(formData, "panchayat") || null,
    address: str(formData, "address") || null, about_en: str(formData, "about_en") || null,
    phone: str(formData, "phone") || null, email,
    patients_registered: int(formData, "patients_registered"), home_visits_month: int(formData, "home_visits_month"),
    nurses: int(formData, "nurses"), volunteers: int(formData, "volunteers"),
    bank_account_name: str(formData, "bank_account_name") || null,
    bank_account_last4: str(formData, "bank_account_no").replace(/\D/g, "").slice(-4) || null,
    ifsc: str(formData, "ifsc").toUpperCase() || null,
    status: "pending", created_by: created.user.id,
  }).select("id").single();
  if (uErr) throw uErr;

  await s.from("profiles").upsert({ id: created.user.id, email, name: str(formData, "contact_name") || name, role: "unit", unit_id: unit.id });
  const supa = await authClient();
  await supa.auth.signInWithPassword({ email, password });
  redirect("/unit?registered=1");
}

// ---------------- Unit coordinator ----------------
async function requireUnit() {
  const staff = await getStaff();
  if (!staff || staff.role !== "unit" || !staff.unit_id) redirect("/staff/login");
  return staff as typeof staff & { unit_id: string };
}

export async function updateUnitProfile(formData: FormData) {
  const staff = await requireUnit();
  await db().from("units").update({
    about_en: str(formData, "about_en") || null, about_ml: str(formData, "about_ml") || null,
    patients_registered: int(formData, "patients_registered"), home_visits_month: int(formData, "home_visits_month"),
    nurses: int(formData, "nurses"), volunteers: int(formData, "volunteers"), phone: str(formData, "phone") || null,
  }).eq("id", staff.unit_id);
  revalidatePath("/unit");
}

export async function addNeed(formData: FormData) {
  const staff = await requireUnit();
  await db().from("unit_needs").insert({
    unit_id: staff.unit_id, title_en: str(formData, "title_en"), title_ml: str(formData, "title_ml") || null,
    category: str(formData, "category") as Category, qty_needed: Math.max(1, int(formData, "qty_needed")),
    cost_per_item: int(formData, "cost_per_item") || null,
  });
  revalidatePath("/unit");
}

export async function updateNeed(formData: FormData) {
  const staff = await requireUnit();
  const id = str(formData, "id");
  if (formData.get("delete")) await db().from("unit_needs").delete().eq("id", id).eq("unit_id", staff.unit_id);
  else await db().from("unit_needs").update({ qty_fulfilled: int(formData, "qty_fulfilled") }).eq("id", id).eq("unit_id", staff.unit_id);
  revalidatePath("/unit");
}

export async function createReport(formData: FormData) {
  const staff = await requireUnit();
  const [y, q] = str(formData, "quarter").split("-Q").map(Number); // e.g. 2026-Q4
  const start = new Date(Date.UTC(y, (q - 1) * 3, 1));
  const end = new Date(Date.UTC(y, q * 3, 0));
  const m = (d: Date) => d.toLocaleString("en-IN", { month: "short", timeZone: "UTC" });
  const s = db();
  const startIso = start.toISOString().slice(0, 10);
  const { data: existing } = await s.from("reports").select("id").eq("unit_id", staff.unit_id).eq("period_start", startIso).maybeSingle();
  if (existing) redirect(`/unit/reports/${existing.id}`);
  const { data, error } = await s.from("reports").insert({
    unit_id: staff.unit_id, period_label: `${m(start)}-${m(end)} ${y}`,
    period_start: startIso, period_end: end.toISOString().slice(0, 10), status: "draft",
  }).select("id").single();
  if (error) throw error;
  redirect(`/unit/reports/${data.id}`);
}

async function ownReport(id: string, unitId: string) {
  const { data } = await db().from("reports").select("id,status").eq("id", id).eq("unit_id", unitId).single();
  if (!data) redirect("/unit");
  return data;
}

export async function saveReportMeta(formData: FormData) {
  const staff = await requireUnit();
  const id = str(formData, "id");
  await ownReport(id, staff.unit_id);
  await db().from("reports").update({
    patients_served: int(formData, "patients_served"), home_visits: int(formData, "home_visits"),
    summary_en: str(formData, "summary_en") || null, summary_ml: str(formData, "summary_ml") || null,
  }).eq("id", id);
  revalidatePath(`/unit/reports/${id}`);
}

export async function addReportItem(formData: FormData) {
  const staff = await requireUnit();
  const reportId = str(formData, "report_id");
  const r = await ownReport(reportId, staff.unit_id);
  if (r.status === "approved") return;

  let receipt_url: string | null = null;
  const file = formData.get("receipt");
  if (file instanceof File && file.size > 0) {
    const s = db();
    const path = `receipts/${staff.unit_id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await s.storage.from("kaithang").upload(path, file, { contentType: file.type || undefined });
    if (!error) receipt_url = s.storage.from("kaithang").getPublicUrl(path).data.publicUrl;
  }
  await db().from("report_items").insert({
    report_id: reportId, category: str(formData, "category") as Category, description: str(formData, "description"),
    amount: Math.max(1, int(formData, "amount")), receipt_url,
  });
  revalidatePath(`/unit/reports/${reportId}`);
}

export async function deleteReportItem(formData: FormData) {
  const staff = await requireUnit();
  const reportId = str(formData, "report_id");
  const r = await ownReport(reportId, staff.unit_id);
  if (r.status === "approved") return;
  await db().from("report_items").delete().eq("id", str(formData, "id")).eq("report_id", reportId);
  revalidatePath(`/unit/reports/${reportId}`);
}

export async function submitReport(formData: FormData) {
  const staff = await requireUnit();
  const id = str(formData, "id");
  await ownReport(id, staff.unit_id);
  await db().from("reports").update({ status: "submitted", submitted_at: new Date().toISOString() }).eq("id", id);
  redirect("/unit?submitted=1");
}

// ---------------- Admin (Ignite committee) ----------------
async function requireAdmin() {
  const staff = await getStaff();
  if (!staff || staff.role !== "admin") redirect("/staff/login");
  return staff;
}

export async function setUnitStatus(formData: FormData) {
  await requireAdmin();
  const status = str(formData, "status") === "approved" ? "approved" : "rejected";
  await db().from("units").update({ status, approved_at: status === "approved" ? new Date().toISOString() : null }).eq("id", str(formData, "id"));
  revalidatePath("/admin");
}

export async function reviewReport(formData: FormData) {
  await requireAdmin();
  const approve = str(formData, "decision") === "approve";
  await db().from("reports").update({
    status: approve ? "approved" : "rejected", approved_at: approve ? new Date().toISOString() : null,
    admin_note: str(formData, "note") || null,
  }).eq("id", str(formData, "id"));
  revalidatePath("/admin");
}

export async function recordTransfer(formData: FormData) {
  const staff = await requireAdmin();
  const amount = int(formData, "amount");
  if (!amount) return;
  await db().from("disbursements").insert({
    unit_id: str(formData, "unit_id"), amount, period_label: str(formData, "period_label"),
    utr_ref: str(formData, "utr_ref") || null, created_by: staff.id,
  });
  revalidatePath("/admin");
}
