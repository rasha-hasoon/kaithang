import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaff } from "@/lib/supabase";
import { staffLogin } from "../actions";

export const dynamic = "force-dynamic";

export default async function StaffLogin({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const staff = await getStaff().catch(() => null);
  if (staff) redirect(staff.role === "admin" ? "/admin" : "/unit");
  const { err } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card kasavu p-7">
        <h1 className="text-2xl font-bold text-brand">Palliative unit & admin login</h1>
        <p className="mt-1 text-sm text-ink/70">For unit coordinators and the Samhari committee.</p>
        <form action={staffLogin} className="mt-6 space-y-4">
          <div><label className="label">Email</label><input name="email" type="email" className="input" required /></div>
          <div><label className="label">Password</label><input name="password" type="password" className="input" required /></div>
          {err && <p className="text-xs text-red-600">Wrong email or password.</p>}
          <button className="btn-primary w-full">Log in</button>
        </form>
        <p className="mt-6 text-center text-sm text-ink/70">
          Run a palliative care unit? <Link href="/staff/register" className="font-semibold text-brand">Register your unit</Link>
        </p>
      </div>
    </div>
  );
}
