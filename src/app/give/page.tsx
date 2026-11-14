import { db } from "@/lib/supabase";
import { getDonor } from "@/lib/session";
import { getLang } from "@/lib/i18n";
import { GiveFlow, type PickUnit } from "@/components/GiveFlow";
import type { Frequency } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function GivePage({ searchParams }: { searchParams: Promise<{ unit?: string; w?: string; f?: string }> }) {
  const sp = await searchParams;
  const [lang, donor, { data }] = await Promise.all([
    getLang(),
    getDonor(),
    db().from("units").select("id,name,name_ml,district,panchayat,patients_registered").eq("status", "approved").order("name"),
  ]);
  const f = (["monthly", "quarterly", "yearly"] as const).includes(sp.f as Frequency) ? (sp.f as Frequency) : undefined;
  return (
    <div className="min-h-[80vh] bg-ink/[0.06] px-4 py-10 sm:py-16">
      <GiveFlow lang={lang} units={(data as PickUnit[]) ?? []} loggedIn={!!donor} initialName={donor?.name ?? null}
        preUnit={sp.unit} preWeekly={sp.w ? Number(sp.w) : undefined} preFreq={f} />
    </div>
  );
}
