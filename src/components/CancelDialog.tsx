"use client";

import { useRef, useState } from "react";
import { cancelWithFeedback, lowerAmount, updateSubscription } from "@/app/actions";
import { WEEKLY_PRESETS, chargeFor, type Frequency } from "@/lib/constants";

const T = {
  en: {
    open: "Cancel",
    h1: "Before you go",
    p: (u: string, w: number) => `Your ₹${w} a week helps ${u} visit patients at home. Would one of these work better?`,
    lower: "Give less instead",
    lowerOpt: (w: number, c: number, f: string) => `₹${w} a week (₹${c} ${f})`,
    pause: "Pause for now",
    pauseP: "No debits until you resume. Your unit keeps your place.",
    goOn: "No, I want to cancel",
    h2: "Why are you cancelling?",
    p2: "It helps us and the units do better. Optional.",
    reasons: {
      money: "Money is tight right now",
      another_unit: "I want to support a different unit",
      trust: "I'm not sure how the money is used",
      other_way: "I already give another way",
      too_many: "Too many debits or messages",
      other: "Something else",
    },
    note: "Anything else you'd like to tell us?",
    confirm: "Cancel AutoPay",
    keep: "Keep my AutoPay",
    freq: { monthly: "a month", quarterly: "every 3 months", yearly: "a year" },
  },
  ml: {
    open: "Cancel",
    h1: "പോകുന്നതിന് മുമ്പ് ഒരു നിമിഷം",
    p: (u: string, w: number) => `ആഴ്ചയിൽ നിങ്ങൾ നൽകുന്ന ₹${w} കൊണ്ടാണ് ${u} രോഗികളെ വീട്ടിൽ ചെന്ന് കാണുന്നത്. ഇതിലൊന്ന് മതിയോ?`,
    lower: "തുക കുറയ്ക്കാം",
    lowerOpt: (w: number, c: number, f: string) => `ആഴ്ചയിൽ ₹${w} (${f} ₹${c})`,
    pause: "തൽക്കാലം നിർത്താം",
    pauseP: "വീണ്ടും തുടങ്ങുന്നത് വരെ debit ഉണ്ടാകില്ല.",
    goOn: "വേണ്ട, Cancel ചെയ്യണം",
    h2: "എന്താണ് Cancel ചെയ്യാൻ കാരണം?",
    p2: "പറഞ്ഞാൽ ഞങ്ങൾക്കും യൂണിറ്റുകൾക്കും മെച്ചപ്പെടാൻ സഹായമാകും. നിർബന്ധമില്ല.",
    reasons: {
      money: "ഇപ്പോൾ പണത്തിന് കുറച്ച് ബുദ്ധിമുട്ടാണ്",
      another_unit: "വേറൊരു യൂണിറ്റിനെ സഹായിക്കണം",
      trust: "പണം എങ്ങനെ ചെലവാക്കുന്നു എന്ന് ഉറപ്പില്ല",
      other_way: "വേറെ വഴിയിലൂടെ ഇപ്പോൾ തന്നെ കൊടുക്കുന്നുണ്ട്",
      too_many: "debit-ഉം മെസേജുകളും കൂടുതലാണ്",
      other: "മറ്റെന്തെങ്കിലും",
    },
    note: "വേറെ എന്തെങ്കിലും പറയാനുണ്ടോ?",
    confirm: "AutoPay Cancel ചെയ്യാം",
    keep: "AutoPay തുടരട്ടെ",
    freq: { monthly: "മാസം", quarterly: "3 മാസത്തിലൊരിക്കൽ", yearly: "വർഷത്തിൽ" },
  },
};

export function CancelDialog({ id, weekly, frequency, unitName, status, lang }: {
  id: string; weekly: number; frequency: Frequency; unitName: string; status: string; lang: "en" | "ml";
}) {
  const t = T[lang];
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const lower = [...new Set([...WEEKLY_PRESETS.filter((v) => v < weekly).slice(-2), ...(weekly > 3 ? [3] : [])])].sort((a, b) => b - a);
  const close = () => { ref.current?.close(); setStep(1); };

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="btn-ghost !px-3 !py-1 text-xs text-rose">{t.open}</button>
      <dialog ref={ref} onClose={() => setStep(1)} aria-labelledby={`cancel-${id}`}
        className="m-auto w-[min(92vw,30rem)] rounded-xl bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/50">
        <div className="p-6 sm:p-7">
          {step === 1 ? (
            <>
              <h2 id={`cancel-${id}`} className="display text-3xl">{t.h1}</h2>
              <p className="mt-2 text-ink/70">{t.p(unitName, weekly)}</p>

              {lower.length > 0 && (
                <div className="mt-5">
                  <div className="label">{t.lower}</div>
                  <div className="grid gap-2">
                    {lower.map((w) => (
                      <form key={w} action={async (fd) => { await lowerAmount(fd); close(); }}>
                        <input type="hidden" name="id" value={id} />
                        <input type="hidden" name="weekly" value={w} />
                        <button className="btn-ghost w-full justify-between">
                          <span>{t.lowerOpt(w, chargeFor(w, frequency), t.freq[frequency])}</span>
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              )}

              {status === "active" && (
                <form className="mt-4" action={async (fd) => { await updateSubscription(fd); close(); }}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="action" value="pause" />
                  <button className="btn-ghost w-full flex-col !items-start gap-0.5 text-left">
                    <span>{t.pause}</span><span className="text-xs font-normal text-ink/65">{t.pauseP}</span>
                  </button>
                </form>
              )}

              <div className="mt-6 flex items-center justify-between gap-3">
                <button type="button" className="text-sm underline" onClick={() => setStep(2)}>{t.goOn}</button>
                <button type="button" className="btn-primary" onClick={close}>{t.keep}</button>
              </div>
            </>
          ) : (
            <form action={async (fd) => { await cancelWithFeedback(fd); close(); }}>
              <input type="hidden" name="id" value={id} />
              <h2 id={`cancel-${id}`} className="display text-3xl">{t.h2}</h2>
              <p className="mt-2 text-ink/70">{t.p2}</p>
              <fieldset className="mt-5 grid gap-2">
                <legend className="sr-only">{t.h2}</legend>
                {Object.entries(t.reasons).map(([k, label]) => (
                  <label key={k} className="flex cursor-pointer items-center gap-3 rounded-lg p-3 ring-1 ring-line has-[:checked]:ring-ink">
                    <input type="radio" name="reason" value={k} className="h-4 w-4 accent-[var(--ink)]" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </fieldset>
              <label className="label mt-4" htmlFor={`note-${id}`}>{t.note}</label>
              <textarea id={`note-${id}`} name="note" rows={2} className="input" />
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button type="button" className="btn-primary" onClick={close}>{t.keep}</button>
                <button className="btn border border-rose text-rose hover:bg-rose hover:text-white">{t.confirm}</button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
