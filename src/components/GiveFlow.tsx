"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmOtp, sendOtp, startGiving } from "@/app/give/actions";
import { chargeFor, DISTRICT_ML, DISTRICTS, WEEKLY_PRESETS, WEEKS_PER, type Frequency } from "@/lib/constants";

export type PickUnit = { id: string; name: string; name_ml: string | null; district: string; panchayat: string | null; patients_registered: number };
type Step = "phone" | "otp" | "name" | "units" | "amount" | "upi" | "approving";

const T = {
  en: {
    steps: ["Phone", "Name", "Units", "Amount", "UPI"],
    phoneH: "Log in with your phone", phoneP: "We'll send a 6-digit code. No password needed.", phoneL: "Mobile number", phoneB: "Send code",
    phoneErr: "Enter a valid 10-digit Indian mobile number.",
    otpH: "Enter the code", otpP: (p: string) => `Sent to +91 ${p}.`, otpB: "Verify", otpErr: "That code is wrong. Try again.", otpDemo: "Demo mode: the code is 123456", change: "Change number",
    nameH: "What should we call you?", nameP: "Units see this name in their supporter list. You can stay anonymous.", nameL: "Your name", nameB: "Continue",
    unitsH: "Choose palliative units", unitsP: "Pick your home district, or any unit in Kerala. You can choose more than one.",
    district: "District", noUnits: "No verified units in this district yet.", patients: "patients", selected: (n: number) => `${n} selected`, unitsB: "Continue",
    amountH: "How much a week?", amountP: "Pick an amount you won't notice. It goes to each unit you chose.",
    perWeek: "a week", other: "Other", billed: "Billed", freq: { monthly: "Monthly", quarterly: "Every 3 months", yearly: "Yearly" },
    summary: (c: number, f: string, n: number) => `₹${c} ${f.toLowerCase()} for each of ${n} unit${n > 1 ? "s" : ""}`,
    total: "Total per debit", math: (w: number, n: string) => `₹${w} a week × ${n} weeks${n === "4.33" ? " (52 weeks ÷ 12 months), rounded up" : ""}.`, amountB: "Continue",
    upiH: "Set up UPI AutoPay", upiP: "Enter your UPI ID. You'll get one request in your UPI app to approve the AutoPay.",
    upiL: "UPI ID", upiErr: "Enter a UPI ID like name@okaxis.", upiB: (t: number) => `Set up AutoPay of ₹${t}`, upiNote: "You can pause or cancel any time from My giving.",
    approving: "Approve the request in your UPI app", approvingP: "Waiting for your bank to confirm the AutoPay mandate.", demo: "Demo mode: no money moves.",
    back: "Back",
  },
  ml: {
    steps: ["ഫോൺ", "പേര്", "യൂണിറ്റ്", "തുക", "UPI"],
    phoneH: "മൊബൈൽ നമ്പർ വെച്ച് തുടങ്ങാം", phoneP: "6 അക്ക OTP അയയ്ക്കും. പാസ്‌വേഡ് ഒന്നും വേണ്ട.", phoneL: "മൊബൈൽ നമ്പർ", phoneB: "OTP അയയ്ക്കൂ",
    phoneErr: "ശരിയായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക.",
    otpH: "OTP നൽകൂ", otpP: (p: string) => `+91 ${p} എന്ന നമ്പറിലേക്ക് അയച്ചിട്ടുണ്ട്.`, otpB: "തുടരാം", otpErr: "നൽകിയ OTP ശരിയല്ല, വീണ്ടും ശ്രമിക്കുക.", otpDemo: "ഡെമോ മോഡ്: OTP 123456", change: "നമ്പർ മാറ്റാം",
    nameH: "നിങ്ങളെ എന്ത് വിളിക്കണം?", nameP: "യൂണിറ്റിന്റെ സപ്പോർട്ടർ ലിസ്റ്റിൽ ഈ പേര് കാണിക്കും. വേണ്ടെങ്കിൽ ഒഴിവാക്കാം.", nameL: "നിങ്ങളുടെ പേര്", nameB: "തുടരാം",
    unitsH: "ഏത് യൂണിറ്റിന്റെ കൂടെ നിൽക്കണം?", unitsP: "സ്വന്തം ജില്ലയിലെയോ കേരളത്തിൽ എവിടെയുമുള്ളതോ ആയ യൂണിറ്റ്. ഒന്നിൽ കൂടുതലും തിരഞ്ഞെടുക്കാം.",
    district: "ജില്ല", noUnits: "ഈ ജില്ലയിൽ നിന്ന് ഇതുവരെ യൂണിറ്റുകൾ ചേർന്നിട്ടില്ല.", patients: "രോഗികൾ", selected: (n: number) => `${n} യൂണിറ്റ് തിരഞ്ഞെടുത്തു`, unitsB: "തുടരാം",
    amountH: "ആഴ്ചയിൽ എത്ര കൊടുക്കാം?", amountP: "അറിയുക പോലുമില്ലാത്ത ഒരു തുക മതി. തിരഞ്ഞെടുത്ത ഓരോ യൂണിറ്റിനും ഇത്രയും പോകും.",
    perWeek: "ആഴ്ചയിൽ", other: "വേറെ തുക", billed: "AutoPay എപ്പോൾ?", freq: { monthly: "മാസത്തിൽ", quarterly: "3 മാസത്തിൽ", yearly: "വർഷത്തിൽ" },
    summary: (c: number, f: string, n: number) => `${n} യൂണിറ്റിനും ${f} ₹${c} വീതം`,
    total: "ഓരോ തവണയും ആകെ", math: (w: number, n: string) => `ആഴ്ചയിൽ ₹${w} × ${n} ആഴ്ച${n === "4.33" ? " (52 ആഴ്ച ÷ 12 മാസം), റൗണ്ട് ചെയ്തത്" : ""}.`, amountB: "തുടരാം",
    upiH: "UPI AutoPay സെറ്റ് ചെയ്യാം", upiP: "നിങ്ങളുടെ UPI ID നൽകൂ. UPI ആപ്പിൽ ഒരു AutoPay റിക്വസ്റ്റ് വരും, അത് Approve ചെയ്താൽ മതി.",
    upiL: "UPI ID", upiErr: "ശരിയായ UPI ID നൽകുക (ഉദാ: name@upi).", upiB: (t: number) => `₹${t} AutoPay സെറ്റ് ചെയ്യാം`, upiNote: "എപ്പോൾ വേണമെങ്കിലും 'എന്റെ കരുതൽ' പേജിൽ നിന്ന് Pause ചെയ്യാനോ Cancel ചെയ്യാനോ പറ്റും.",
    approving: "UPI ആപ്പിൽ AutoPay അംഗീകരിക്കൂ", approvingP: "ബാങ്കിൽ നിന്ന് AutoPay ഉറപ്പാകുന്നത് കാത്തിരിക്കുന്നു.", demo: "ഡെമോ മോഡ്: പണം പോകില്ല.",
    back: "തിരികെ",
  },
};

export function GiveFlow({ lang, units, loggedIn, initialName, preUnit, preWeekly, preFreq }: {
  lang: "en" | "ml"; units: PickUnit[]; loggedIn: boolean; initialName: string | null;
  preUnit?: string; preWeekly?: number; preFreq?: Frequency;
}) {
  const t = T[lang];
  const router = useRouter();
  const [pending, start] = useTransition();
  const pre = units.find((u) => u.id === preUnit);

  const [step, setStep] = useState<Step>(loggedIn ? "name" : "phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState(initialName ?? "");
  const [district, setDistrict] = useState(pre?.district ?? "Kozhikode");
  const [chosen, setChosen] = useState<string[]>(pre ? [pre.id] : []);
  const [weekly, setWeekly] = useState(preWeekly && preWeekly > 0 ? preWeekly : 3);
  const [custom, setCustom] = useState(!!preWeekly && !WEEKLY_PRESETS.includes(preWeekly));
  const [freq, setFreq] = useState<Frequency>(preFreq ?? "monthly");
  const [upi, setUpi] = useState("");

  const inDistrict = useMemo(() => units.filter((u) => u.district === district), [units, district]);
  const counts = useMemo(() => units.reduce<Record<string, number>>((m, u) => ((m[u.district] = (m[u.district] ?? 0) + 1), m), {}), [units]);
  const unitName = (u: PickUnit) => (lang === "ml" && u.name_ml) || u.name;
  const charge = chargeFor(weekly, freq);
  const total = charge * Math.max(1, chosen.length);
  const stepIndex = { phone: 0, otp: 0, name: 1, units: 2, amount: 3, upi: 4, approving: 4 }[step];

  const go = (s: Step) => { setErr(null); setStep(s); };

  return (
    <div className="mx-auto w-full max-w-xl">
      <ol className="mb-6 flex items-center gap-2 text-xs" aria-label="Progress">
        {t.steps.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col gap-1.5">
            <span className={`h-1 rounded-full ${i <= stepIndex ? "bg-ink" : "bg-line"}`} />
            <span className={i === stepIndex ? "font-semibold text-ink" : "text-ink/65"}>{s}</span>
          </li>
        ))}
      </ol>

      <div className="rounded-xl bg-white p-6 shadow-[0_24px_60px_-30px_rgba(21,32,59,0.45)] ring-1 ring-line sm:p-8">
        {step === "phone" && (
          <form onSubmit={(e) => { e.preventDefault(); start(async () => {
            const r = await sendOtp(phone);
            if (r.ok) { setPhone(r.phone); go("otp"); } else setErr(t.phoneErr);
          }); }}>
            <h1 className="display text-3xl sm:text-4xl">{t.phoneH}</h1>
            <p className="mt-2 text-ink/65">{t.phoneP}</p>
            <label className="label mt-6" htmlFor="phone">{t.phoneL}</label>
            <div className="flex gap-2">
              <span className="input !w-16 text-center text-ink/70">+91</span>
              <input id="phone" className="input text-lg" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus required />
            </div>
            {err && <p role="alert" className="mt-2 text-sm text-rose">{err}</p>}
            <button className="btn-primary mt-6 w-full py-3 text-base" disabled={pending}>{pending ? "…" : t.phoneB}</button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={(e) => { e.preventDefault(); start(async () => {
            const r = await confirmOtp(phone, otp);
            if (r.ok) { if (r.name) setName(r.name); go("name"); router.refresh(); } else setErr(r.error === "otp" ? t.otpErr : r.error === "phone" ? t.phoneErr : `Couldn't log you in: ${r.error.replace(/^server: /, "")}`);
          }); }}>
            <h1 className="display text-3xl sm:text-4xl">{t.otpH}</h1>
            <p className="mt-2 text-ink/65">{t.otpP(phone)} <button type="button" className="underline" onClick={() => go("phone")}>{t.change}</button></p>
            <input className="input mt-6 text-center text-2xl tracking-[0.6em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} autoFocus required aria-label={t.otpH} />
            {err && <p role="alert" className="mt-2 text-sm text-rose">{err}</p>}
            <button className="btn-primary mt-6 w-full py-3 text-base" disabled={pending || otp.length !== 6}>{pending ? "…" : t.otpB}</button>
            <p className="mt-4 rounded-md bg-gold-soft p-2.5 text-center text-sm">{t.otpDemo}</p>
          </form>
        )}

        {step === "name" && (
          <form onSubmit={(e) => { e.preventDefault(); go("units"); }}>
            <h1 className="display text-3xl sm:text-4xl">{t.nameH}</h1>
            <p className="mt-2 text-ink/65">{t.nameP}</p>
            <label className="label mt-6" htmlFor="name">{t.nameL}</label>
            <input id="name" className="input text-lg" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" autoFocus />
            <button className="btn-primary mt-6 w-full py-3 text-base">{t.nameB}</button>
          </form>
        )}

        {step === "units" && (
          <div>
            <h1 className="display text-3xl sm:text-4xl">{t.unitsH}</h1>
            <p className="mt-2 text-ink/65">{t.unitsP}</p>
            <label className="label mt-6" htmlFor="district">{t.district}</label>
            <select id="district" className="input text-base" value={district} onChange={(e) => setDistrict(e.target.value)}>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{lang === "ml" ? DISTRICT_ML[d] : d} ({counts[d] ?? 0})</option>
              ))}
            </select>
            <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto p-1">
              {inDistrict.length === 0 && <li className="text-sm text-ink/65">{t.noUnits}</li>}
              {inDistrict.map((u) => {
                const on = chosen.includes(u.id);
                return (
                  <li key={u.id}>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 ring-1 transition-colors ${on ? "bg-ink/[0.04] ring-ink" : "ring-line hover:ring-ink/40"}`}>
                      <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--ink)]" checked={on}
                        onChange={() => setChosen((c) => (on ? c.filter((x) => x !== u.id) : [...c, u.id]))} />
                      <span>
                        <span className="block font-semibold leading-snug">{unitName(u)}</span>
                        <span className="text-sm text-ink/65">{u.panchayat ?? u.district}, {u.patients_registered} {t.patients}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {chosen.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {chosen.map((id) => {
                  const u = units.find((x) => x.id === id);
                  return u ? (
                    <button key={id} type="button" onClick={() => setChosen((c) => c.filter((x) => x !== id))}
                      className="rounded-full bg-ink px-3 py-1 text-xs text-white" aria-label={`Remove ${u.name}`}>
                      {unitName(u)} ✕
                    </button>
                  ) : null;
                })}
              </div>
            )}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button type="button" className="text-sm underline" onClick={() => go("name")}>{t.back}</button>
              <span className="text-sm text-ink/70">{t.selected(chosen.length)}</span>
              <button type="button" className="btn-primary px-6 py-3" disabled={!chosen.length} onClick={() => go("amount")}>{t.unitsB}</button>
            </div>
          </div>
        )}

        {step === "amount" && (
          <div>
            <h1 className="display text-3xl sm:text-4xl">{t.amountH}</h1>
            <p className="mt-2 text-ink/65">{t.amountP}</p>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {WEEKLY_PRESETS.map((v) => (
                <button type="button" key={v} onClick={() => { setWeekly(v); setCustom(false); }} aria-pressed={!custom && weekly === v}
                  className={`rounded-lg py-3 text-lg font-bold ring-1 ${!custom && weekly === v ? "bg-ink text-white ring-ink" : "bg-white ring-line hover:ring-ink"}`}>
                  ₹{v}<span className="block text-[11px] font-normal opacity-70">{t.perWeek}</span>
                </button>
              ))}
              <button type="button" onClick={() => setCustom(true)} aria-pressed={custom}
                className={`rounded-lg py-3 font-semibold ring-1 ${custom ? "bg-ink text-white ring-ink" : "bg-white ring-line hover:ring-ink"}`}>{t.other}</button>
            </div>
            {custom && <input className="input mt-2 text-lg" type="number" min={1} max={10000} value={weekly} onChange={(e) => setWeekly(Math.max(1, Number(e.target.value) || 1))} aria-label={t.other} autoFocus />}

            <div className="label mt-6">{t.billed}</div>
            <div className="grid grid-cols-3 gap-2">
              {(["monthly", "quarterly", "yearly"] as const).map((f) => (
                <button type="button" key={f} onClick={() => setFreq(f)} aria-pressed={freq === f}
                  className={`rounded-lg px-1 py-2.5 text-sm font-semibold leading-tight ring-1 ${freq === f ? "bg-gold-soft ring-gold" : "bg-white ring-line"}`}>{t.freq[f]}</button>
              ))}
            </div>

            <div className="mt-6 rounded-lg bg-paper p-4">
              <div className="text-sm text-ink/65">{t.summary(charge, t.freq[freq], chosen.length)}</div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-sm">{t.total}</span><span className="display text-3xl sm:text-4xl">₹{total}</span>
              </div>
              <div className="mt-1 text-sm text-ink/65">{t.math(weekly, WEEKS_PER[freq])}</div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button type="button" className="text-sm underline" onClick={() => go("units")}>{t.back}</button>
              <button type="button" className="btn-primary px-6 py-3" onClick={() => go("upi")}>{t.amountB}</button>
            </div>
          </div>
        )}

        {step === "upi" && (
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!/^[\w.\-]{2,}@[A-Za-z]{2,}$/.test(upi.trim())) { setErr(t.upiErr); return; }
            go("approving");
            start(async () => {
              await new Promise((r) => setTimeout(r, 2200));
              const r = await startGiving({ name, unitIds: chosen, weekly, frequency: freq, upi });
              if (r.ok) router.push("/me?new=1");
              else { setStep("upi"); setErr(r.error === "auth" ? t.phoneErr : t.upiErr); }
            });
          }}>
            <h1 className="display text-3xl sm:text-4xl">{t.upiH}</h1>
            <p className="mt-2 text-ink/65">{t.upiP}</p>
            <label className="label mt-6" htmlFor="upi">{t.upiL}</label>
            <input id="upi" className="input text-lg" placeholder="yourname@okaxis" value={upi} onChange={(e) => setUpi(e.target.value)} autoCapitalize="none" autoCorrect="off" autoFocus />
            <div className="mt-2 flex flex-wrap gap-2">
              {["@okaxis", "@okhdfcbank", "@ybl", "@paytm", "@upi"].map((h) => (
                <button key={h} type="button" className="chip hover:ring-ink" onClick={() => setUpi((u) => (u.split("@")[0] || "yourname") + h)}>{h}</button>
              ))}
            </div>
            {err && <p role="alert" className="mt-2 text-sm text-rose">{err}</p>}
            <button className="btn-gold mt-6 w-full py-3 text-base">{t.upiB(total)}</button>
            <p className="mt-3 text-center text-xs text-ink/65">{t.upiNote}</p>
            <div className="mt-4 text-left"><button type="button" className="text-sm underline" onClick={() => go("amount")}>{t.back}</button></div>
          </form>
        )}

        {step === "approving" && (
          <div className="py-6 text-center" role="status" aria-live="polite">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-line border-t-ink" />
            <h1 className="display mt-6 text-3xl">{t.approving}</h1>
            <p className="mt-2 text-ink/65">{t.approvingP}</p>
            <p className="mt-4 text-xs text-ink/65">{t.demo}</p>
          </div>
        )}
      </div>
    </div>
  );
}
