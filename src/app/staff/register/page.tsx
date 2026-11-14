import { DISTRICTS } from "@/lib/constants";
import { registerUnit } from "../actions";

export default async function RegisterUnit({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="display text-5xl">Register your palliative care unit</h1>
      <p className="mt-2 text-ink/70">Once the Samhari committee verifies your unit, it will be listed and can start receiving monthly transfers.</p>
      {err && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Could not register: {err === "fields" ? "fill all required fields (password ≥ 8 characters)" : err}</p>}
      <form action={registerUnit} className="mt-8 space-y-8">
        <fieldset className="card grid gap-4 p-6 sm:grid-cols-2">
          <legend className="px-1 text-sm font-bold">Unit details</legend>
          <div className="sm:col-span-2"><label className="label">Unit name *</label><input name="name" className="input" required /></div>
          <div className="sm:col-span-2"><label className="label">Name in Malayalam</label><input name="name_ml" className="input font-ml" /></div>
          <div><label className="label">Type *</label>
            <select name="kind" className="input" required>
              <option value="community">Community / Volunteer</option><option value="government">Panchayat / Government</option><option value="private">Private centre</option>
            </select></div>
          <div><label className="label">District *</label>
            <select name="district" className="input" required defaultValue="Kozhikode">{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></div>
          <div><label className="label">Panchayat / Municipality</label><input name="panchayat" className="input" /></div>
          <div><label className="label">Phone</label><input name="phone" className="input" /></div>
          <div className="sm:col-span-2"><label className="label">Address</label><input name="address" className="input" /></div>
          <div className="sm:col-span-2"><label className="label">About the unit</label><textarea name="about_en" rows={3} className="input" /></div>
          <div><label className="label">Registered patients</label><input name="patients_registered" type="number" className="input" /></div>
          <div><label className="label">Home visits per month</label><input name="home_visits_month" type="number" className="input" /></div>
          <div><label className="label">Nurses</label><input name="nurses" type="number" className="input" /></div>
          <div><label className="label">Volunteers</label><input name="volunteers" type="number" className="input" /></div>
        </fieldset>
        <fieldset className="card grid gap-4 p-6 sm:grid-cols-2">
          <legend className="px-1 text-sm font-bold">Bank account for monthly transfers</legend>
          <div className="sm:col-span-2"><label className="label">Account holder name</label><input name="bank_account_name" className="input" /></div>
          <div><label className="label">Account number</label><input name="bank_account_no" className="input" /></div>
          <div><label className="label">IFSC</label><input name="ifsc" className="input uppercase" /></div>
          <p className="text-xs text-ink/65 sm:col-span-2">Only the last 4 digits are stored and shown publicly. Full details are verified by the committee.</p>
        </fieldset>
        <fieldset className="card grid gap-4 p-6 sm:grid-cols-2">
          <legend className="px-1 text-sm font-bold">Coordinator login</legend>
          <div className="sm:col-span-2"><label className="label">Coordinator name</label><input name="contact_name" className="input" /></div>
          <div><label className="label">Email *</label><input name="email" type="email" className="input" required /></div>
          <div><label className="label">Password * (min 8)</label><input name="password" type="password" minLength={8} className="input" required /></div>
        </fieldset>
        <button className="btn-primary text-base">Submit for verification</button>
      </form>
    </div>
  );
}
