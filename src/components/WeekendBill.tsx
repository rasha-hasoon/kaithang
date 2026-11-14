"use client";

import { useState } from "react";

type Item = { id: string; en: string; ml: string; price: number };
const ITEMS: Item[] = [
  { id: "biryani", en: "Chicken biryani", ml: "ചിക്കൻ ബിരിയാണി", price: 220 },
  { id: "shawarma", en: "Shawarma plate", ml: "ഷവർമ പ്ലേറ്റ്", price: 140 },
  { id: "soda", en: "Fresh lime soda", ml: "ഫ്രഷ് ലൈം സോഡ", price: 40 },
  { id: "movie", en: "Movie ticket", ml: "സിനിമ ടിക്കറ്റ്", price: 190 },
  { id: "coffee", en: "Cold coffee", ml: "കോൾഡ് കോഫി", price: 150 },
  { id: "chai", en: "Chai & pazhampori", ml: "ചായയും പഴംപൊരിയും", price: 35 },
];

const T = {
  en: { title: "Your weekend", tap: "Tap what you'd spend on", total: "Weekend total", line: "Samhari: a little relief for someone", doses: (n: number) => `Your weekend out = ${n} doses of morphine.`, thanks: "Thank you. Visit again." },
  ml: { title: "നിങ്ങളുടെ വീക്കെൻഡ്", tap: "ചെലവാക്കുന്നവ തിരഞ്ഞെടുക്കൂ", total: "വീക്കെൻഡ് ആകെ", line: "സംഹാരി: ഒരാൾക്ക് അൽപം ആശ്വാസം", doses: (n: number) => `നിങ്ങളുടെ ഒരു വീക്കെൻഡ് = ${n} ഡോസ് മോർഫിൻ.`, thanks: "നന്ദി. വീണ്ടും വരിക." },
};

export function WeekendBill({ lang }: { lang: "en" | "ml" }) {
  const [picked, setPicked] = useState<string[]>(["biryani", "soda", "movie"]);
  const t = T[lang];
  const chosen = ITEMS.filter((i) => picked.includes(i.id));
  const total = chosen.reduce((s, i) => s + i.price, 0);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="w-full max-w-sm">
      <div className="mb-3 text-sm text-ink/70">{t.tap}</div>
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label={t.tap}>
        {ITEMS.map((i) => {
          const on = picked.includes(i.id);
          return (
            <button key={i.id} type="button" onClick={() => toggle(i.id)} aria-pressed={on}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${on ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-line hover:ring-ink"}`}>
              {i[lang]}
            </button>
          );
        })}
      </div>

      <div className="receipt -rotate-1 px-6 pt-6 font-mono text-[13px] shadow-[0_18px_40px_-18px_rgba(21,32,59,0.35)]">
        <div className="text-center">
          <div className="font-semibold tracking-wide">{t.title}</div>
          <div className="text-[11px] text-ink/65">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</div>
        </div>
        <div className="my-3 border-t border-dashed border-ink/30" />
        <ul className="min-h-[96px] space-y-1.5" aria-live="polite">
          {chosen.map((i) => (
            <li key={i.id} className="flex justify-between gap-4"><span>{i[lang]}</span><span className="tabular-nums">₹{i.price}</span></li>
          ))}
        </ul>
        <div className="my-3 border-t border-dashed border-ink/30" />
        <div className="flex justify-between font-semibold"><span>{t.total}</span><span className="tabular-nums">₹{total}</span></div>
        <div className="mt-4 flex justify-between gap-4 rounded bg-gold px-2 py-1.5 font-semibold text-ink">
          <span>{t.line}</span><span className="tabular-nums">₹3</span>
        </div>
        <p className="mt-4 text-[12px] leading-snug text-ink/70">{t.doses(Math.floor(total / 3))}</p>
        <div className="mt-4 text-center text-[11px] text-ink/65">{t.thanks}</div>
      </div>
    </div>
  );
}
