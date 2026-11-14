"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { chargeFor, WEEKLY_PRESETS, WEEKS_PER, type Frequency } from "@/lib/constants";

type Labels = Record<
  "sub_title" | "sub_weekly" | "sub_custom" | "sub_billing" | "freq_monthly" | "freq_quarterly" | "freq_yearly" |
  "sub_you_pay" | "sub_impact" | "sub_button" | "sub_demo" | "sub_why_monthly" | "per_week_short",
  string
>;

export function SubscribeBox({ unitId, slug, initialWeekly, initialFreq, l }: {
  unitId: string; slug: string; initialWeekly?: number; initialFreq?: Frequency; l: Labels;
}) {
  const [weekly, setWeekly] = useState(initialWeekly && initialWeekly > 0 ? initialWeekly : 3);
  const [custom, setCustom] = useState(!!initialWeekly && !WEEKLY_PRESETS.includes(initialWeekly));
  const [freq, setFreq] = useState<Frequency>(initialFreq ?? "monthly");
  const router = useRouter();
  const charge = chargeFor(weekly, freq);
  const freqLabel = { monthly: l.freq_monthly, quarterly: l.freq_quarterly, yearly: l.freq_yearly };

  return (
    <form onSubmit={(e) => { e.preventDefault(); router.push(`/give?unit=${unitId}&w=${weekly}&f=${freq}`); }} id="support" className="card kasavu sticky top-24 p-5">
      <input type="hidden" name="unit_id" value={unitId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="weekly" value={weekly} />
      <input type="hidden" name="frequency" value={freq} />
      <h3 className="text-lg font-bold">{l.sub_title}</h3>

      <div className="label mt-4">{l.sub_weekly}</div>
      <div className="grid grid-cols-3 gap-2">
        {WEEKLY_PRESETS.map((v) => (
          <button type="button" key={v} onClick={() => { setWeekly(v); setCustom(false); }}
            className={`rounded-xl border py-2.5 text-sm font-bold ${!custom && weekly === v ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand"}`}>
            ₹{v}<span className="text-[10px] font-normal opacity-70">{l.per_week_short}</span>
          </button>
        ))}
        <button type="button" onClick={() => setCustom(true)}
          className={`rounded-xl border py-2.5 text-sm font-bold ${custom ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand"}`}>
          {l.sub_custom}
        </button>
      </div>
      {custom && (
        <input className="input mt-2" type="number" min={1} max={10000} value={weekly}
          onChange={(e) => setWeekly(Math.max(1, Number(e.target.value) || 1))} aria-label={l.sub_custom} />
      )}

      <div className="label mt-4">{l.sub_billing}</div>
      <div className="grid grid-cols-3 gap-2">
        {(["monthly", "quarterly", "yearly"] as const).map((f) => (
          <button type="button" key={f} onClick={() => setFreq(f)}
            className={`rounded-xl border px-1 py-2 text-xs font-semibold leading-tight ${freq === f ? "border-brand bg-brand/10 text-brand" : "border-line bg-white"}`}>
            {freqLabel[f]}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-ink/65">{l.sub_why_monthly}</p>

      <div className="mt-4 rounded-xl bg-gold-soft/70 p-4">
        <div className="text-xs text-ink/70">{l.sub_you_pay}</div>
        <div className="text-2xl font-extrabold">₹{charge} <span className="text-sm font-medium text-ink/70">· {freqLabel[freq]}</span></div>
        <div className="mt-1 text-xs text-ink/70">{l.sub_impact.replace("{w}", String(weekly)).replace("{n}", WEEKS_PER[freq])}</div>
      </div>

      <button className="btn-primary mt-4 w-full text-base">{l.sub_button}</button>
      <p className="mt-2 text-center text-[11px] text-ink/65">{l.sub_demo}</p>
    </form>
  );
}
