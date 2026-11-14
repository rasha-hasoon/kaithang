import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaff } from "@/lib/supabase";
import { staffLogin } from "../actions";

export const dynamic = "force-dynamic";

export default async function StaffLogin({ searchParams }: { searchParams: Promise<{ err?: string; next?: string }> }) {
  const { err, next } = await searchParams;
  const staff = await getStaff().catch(() => null);
  if (staff?.role === "admin") redirect("/admin");
  if (staff?.unit_id) redirect(next?.startsWith("/unit") ? next : "/unit");
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card kasavu p-7">
        <h1 className="text-2xl font-bold text-brand">Palliative unit & admin login</h1>
        <p className="mt-1 text-sm text-ink/70">For unit coordinators and the Samhari committee.</p>
        <form action={staffLogin} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />
          <div><label className="label">Email</label><input name="email" type="email" className="input" required /></div>
          <div><label className="label">Password</label><input name="password" type="password" className="input" required /></div>
          {err === "nounit" || (staff && !staff.unit_id) ? (
            <p role="alert" className="text-sm text-rose">You&apos;re logged in, but this account isn&apos;t linked to a palliative unit yet. Ask the admin to link it, or run the STAFF ACCOUNTS lines at the bottom of supabase/seed.sql.</p>
          ) : err ? (
            <p role="alert" className="text-sm text-rose">{err === "Invalid login credentials" || err === "login" ? "Wrong email or password." : err}</p>
          ) : null}
          <button className="btn-primary w-full">Log in</button>
        </form>
        <p className="mt-6 text-center text-sm text-ink/70">
          Run a palliative care unit? <Link href="/staff/register" className="font-semibold text-brand">Register your unit</Link>
        </p>
      </div>
    </div>
  );
}
