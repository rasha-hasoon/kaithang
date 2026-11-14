"use client";

import { useRef, useState } from "react";
import { pauseWithReason } from "@/app/actions";

const T = {
  en: {
    open: "Pause", h: "Pause your AutoPay?", for: "For how long?",
    opts: { 1: "1 month", 3: "3 months", 0: "Until I resume" } as Record<number, string>,
    restarts: (d: string) => `Restarts on ${d}.`, manual: "Restarts only when you resume.",
    why: "Why? (optional)",
    reasons: { money: "Short on money", travel: "Travelling", unsure: "Not sure", other: "Other" } as Record<string, string>,
    pause: "Pause", keep: "Keep giving",
  },
  ml: {
    open: "Pause", h: "AutoPay തൽക്കാലം നിർത്തണോ?", for: "എത്ര നാളത്തേക്ക്?",
    opts: { 1: "1 മാസം", 3: "3 മാസം", 0: "ഞാൻ തുടങ്ങുന്നത് വരെ" } as Record<number, string>,
    restarts: (d: string) => `${d}-ന് തനിയെ വീണ്ടും തുടങ്ങും.`, manual: "നിങ്ങൾ വീണ്ടും തുടങ്ങിയാൽ മാത്രം.",
    why: "കാരണം (വേണമെങ്കിൽ)",
    reasons: { money: "പണത്തിന് ബുദ്ധിമുട്ട്", travel: "യാത്രയിലാണ്", unsure: "ഉറപ്പില്ല", other: "മറ്റെന്തെങ്കിലും" } as Record<string, string>,
    pause: "നിർത്താം", keep: "തുടരട്ടെ",
  },
};

export function PauseDialog({ id, lang }: { id: string; lang: "en" | "ml" }) {
  const t = T[lang];
  const ref = useRef<HTMLDialogElement>(null);
  const [months, setMonths] = useState(1);
  const until = new Date(); until.setMonth(until.getMonth() + months);
  const untilText = until.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="btn-ghost !px-3 !py-1 text-xs">{t.open}</button>
      <dialog ref={ref} aria-labelledby={`pause-${id}`} className="m-auto w-[min(92vw,26rem)] rounded-xl bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/50">
        <form className="p-6" action={async (fd) => { await pauseWithReason(fd); ref.current?.close(); }}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="months" value={months} />
          <h2 id={`pause-${id}`} className="display text-3xl">{t.h}</h2>

          <div className="label mt-5">{t.for}</div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 3, 0].map((m) => (
              <button key={m} type="button" onClick={() => setMonths(m)} aria-pressed={months === m}
                className={`rounded-lg px-2 py-2.5 text-sm font-semibold leading-tight ring-1 ${months === m ? "bg-ink text-white ring-ink" : "bg-white ring-line hover:ring-ink"}`}>
                {t.opts[m]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink/70">{months ? t.restarts(untilText) : t.manual}</p>

          <div className="label mt-5">{t.why}</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(t.reasons).map(([k, label]) => (
              <label key={k} className="cursor-pointer rounded-full px-3 py-1.5 text-sm ring-1 ring-line has-[:checked]:bg-ink has-[:checked]:text-white has-[:checked]:ring-ink">
                <input type="radio" name="reason" value={k} className="sr-only" />{label}
              </label>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button type="button" className="btn-primary" onClick={() => ref.current?.close()}>{t.keep}</button>
            <button className="btn-ghost">{t.pause}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
