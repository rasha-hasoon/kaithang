import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseUrl } from "./supabase-url";
export { supabaseUrl };

/** Server-only client with full access. Never import this into a "use client" file. */
export function db(): SupabaseClient {
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars, fill in .env.local (see .env.example)");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Cookie-based client for staff (unit coordinators, admins) logged in with Supabase Auth. */
export async function authClient() {
  const store = await cookies();
  return createServerClient(supabaseUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* called from a Server Component, proxy.ts refreshes the session */
        }
      },
    },
  });
}

export type StaffProfile = { id: string; email: string; name: string; role: "unit" | "admin"; unit_id: string | null };

export async function getStaff(): Promise<StaffProfile | null> {
  const supa = await authClient();
  const { data } = await supa.auth.getUser();
  if (!data.user) return null;
  const { data: p } = await db().from("profiles").select("id,email,name,role,unit_id").eq("id", data.user.id).single();
  return (p as StaffProfile) ?? null;
}
