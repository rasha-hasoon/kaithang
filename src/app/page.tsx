import Link from "next/link";
import { getT } from "@/lib/i18n";
import { getPlatformStats, getUnitDetail, getUnitsWithStats } from "@/lib/data";
import { inr, num } from "@/lib/format";
import { CategoryBreakdown } from "@/components/ui";
import { UnitRow } from "@/components/UnitCard";
import { pick } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const COPY = {
  en: {
    h1: "What costs you ₹3 could mean a little more relief to someone.",
    sub: "Across Kerala, more than 1.5 lakh bedridden people are cared for at home by palliative units that run on small change. Give ₹3 a week to a unit you choose. It goes out once a month by UPI AutoPay, and the unit reports exactly how it was spent.",
    cta: "Give ₹3 a week",
    cta2: "See how units spend it",
    live: (s: string, m: string) => `${s} people already give. Together that's ${m} for palliative care every month.`,
    facts: [
      { big: "1.5 lakh+", text: "people in Kerala receive palliative care at home, from over 2,400 units and 10,000 volunteers.", src: "Kerala Health Department, 2025" },
      { big: "1 in 3", text: "families caring for a patient at home are in debt, on average ₹2 lakh. Two in three can't afford medicines.", src: "BMC Palliative Care, 2025" },
      { big: "₹1 a day", text: "is how Kerala's first neighbourhood palliative units were funded by labourers, auto drivers and schoolchildren.", src: "Down To Earth" },
    ],
    howTitle: "How your ₹3 reaches a patient",
    steps: [
      ["Choose a unit", "Your home panchayat's unit, or any verified unit in Kerala. Support more than one if you like."],
      ["Pick an amount you won't notice", "₹3 a week is billed as ₹13 once a month. Or every three months, or once a year."],
      ["The unit gets it every month", "Collections reach a central account and are transferred to each unit at the start of the month."],
      ["You see where it went", "Every quarter, units publish what they spent on morphine, home visits, diapers and water beds, with receipts."],
    ],
    spendTitle: (u: string, p: string) => `Last quarter, ${u} spent its money like this.`,
    spendSub: (n: string) => `${n} patients cared for. Every line has a receipt behind it.`,
    seeUnit: "Open this unit's reports",
    unitsTitle: "Verified palliative units",
    unitsSub: "Each unit is checked by the Samhari committee before it can receive money.",
    allUnits: "See all units",
    closeH: "Someone you'll never meet will sleep through tonight.",
    closeSub: "That's what ₹3 a week does.",
  },
  ml: {
    h1: "നിങ്ങൾക്ക് വെറും ₹3. മറ്റൊരാൾക്ക് അത് അൽപം കൂടി ആശ്വാസം.",
    sub: "നമ്മുടെ ഒക്കെ ചെറിയ സഹായങ്ങൾ കൊണ്ടാണ് കേരളത്തിലെ ഒന്നര ലക്ഷത്തിലധികം കിടപ്പുരോഗികളെ ശുശ്രൂഷിച്ച് പാലിയേറ്റീവ് യൂണിറ്റുകൾ പ്രവർത്തിക്കുന്നത്.",
    cta: "ആഴ്ചയിൽ ₹3, കൂടെ നിൽക്കാം",
    cta2: "യൂണിറ്റുകൾ എങ്ങനെ ചെലവാക്കുന്നു",
    live: (s: string, m: string) => `${s} പേർ ഇപ്പോൾ തന്നെ കൂടെയുണ്ട്. എല്ലാ മാസവും ${m} Palliative Care-ന്.`,
    facts: [
      { big: "1.5 ലക്ഷം+", text: "പേർക്ക് കേരളത്തിൽ വീട്ടിൽ തന്നെ Palliative പരിചരണം കിട്ടുന്നുണ്ട്. 2,400-ലേറെ യൂണിറ്റുകൾ, 10,000 വളണ്ടിയർമാർ.", src: "കേരള ആരോഗ്യ വകുപ്പ്, 2025" },
      { big: "3-ൽ 1", text: "കിടപ്പുരോഗിയെ നോക്കുന്ന കുടുംബം കടത്തിലാണ്, ശരാശരി ₹2 ലക്ഷം. മൂന്നിൽ രണ്ട് വീട്ടുകാർക്കും മരുന്ന് വാങ്ങാൻ പോലും പണമില്ല.", src: "BMC Palliative Care, 2025" },
      { big: "ദിവസം ₹1", text: "വീതം നൽകിയാണ് കേരളത്തിലെ ആദ്യ നെയ്ബർഹുഡ് Palliative യൂണിറ്റുകൾ നടന്നത്. ചുമട്ടുതൊഴിലാളികളും ഓട്ടോ ഡ്രൈവർമാരും സ്കൂൾ കുട്ടികളും വരെ അതിൽ പങ്കുചേർന്നു.", src: "Down To Earth" },
    ],
    howTitle: "നിങ്ങളുടെ ₹3 ഒരു രോഗിയുടെ അടുത്ത് എത്തുന്നത് ഇങ്ങനെ",
    steps: [
      ["യൂണിറ്റ് തിരഞ്ഞെടുക്കാം", "സ്വന്തം നാട്ടിലെ യൂണിറ്റോ കേരളത്തിലെ ഏതെങ്കിലും യൂണിറ്റോ. ഒന്നിൽ കൂടുതലും ആകാം."],
      ["അറിയാത്തത്ര ചെറിയ തുക", "ആഴ്ചയിൽ ₹3 എന്നാൽ മാസത്തിലൊരിക്കൽ ₹13. വേണമെങ്കിൽ 3 മാസത്തിലൊരിക്കലോ വർഷത്തിലൊരിക്കലോ ആക്കാം."],
      ["എല്ലാ മാസവും യൂണിറ്റിലേക്ക്", "കിട്ടുന്ന തുക സെൻട്രൽ അക്കൗണ്ടിൽ നിന്ന് മാസാദ്യം ഓരോ യൂണിറ്റിനും അയയ്ക്കും."],
      ["എവിടെ പോയെന്ന് കാണാം", "മരുന്ന്, ഹോം വിസിറ്റ്, ഡയപ്പർ, വാട്ടർ ബെഡ്: ഓരോ 3 മാസവും ചെലവാക്കിയത് Receipt സഹിതം യൂണിറ്റുകൾ പ്രസിദ്ധീകരിക്കും."],
    ],
    spendTitle: (u: string, p: string) => `കഴിഞ്ഞ 3 മാസം ${u} പണം ചെലവാക്കിയത് ഇങ്ങനെ.`,
    spendSub: (n: string) => `${n} രോഗികളെ പരിചരിച്ചു. ഓരോ വരിക്കും പിന്നിൽ ഒരു Receipt ഉണ്ട്.`,
    seeUnit: "ഈ യൂണിറ്റിന്റെ Reports കാണാം",
    unitsTitle: "കേരളത്തിലെ Palliative Care യൂണിറ്റുകൾ",
    unitsSub: "Samhari കമ്മിറ്റി പരിശോധിച്ച് ഉറപ്പാക്കിയ യൂണിറ്റുകൾക്ക് മാത്രമേ പണം കിട്ടൂ.",
    allUnits: "എല്ലാ യൂണിറ്റുകളും കാണാം",
    closeH: "നിങ്ങൾ ഒരിക്കലും കാണാത്ത ഒരാൾ ഇന്ന് രാത്രി സമാധാനമായി ഉറങ്ങും.",
    closeSub: "ആഴ്ചയിൽ ₹3 കൊണ്ട് സാധിക്കുന്നത് അതാണ്.",
  },
};

export default async function Home() {
  const { lang, dict } = await getT();
  const c = COPY[lang];
  const ml = lang === "ml";
  const [stats, units] = await Promise.all([getPlatformStats(), getUnitsWithStats()]);
  const featured = [...units].sort((a, b) => (b.stats?.total_spent ?? 0) - (a.stats?.total_spent ?? 0))[0];
  const fd = featured ? await getUnitDetail(featured.id) : null;
  const lastReport = fd?.reports[0];
  const lastCats = lastReport?.report_items
    ? Object.values(lastReport.report_items.reduce<Record<string, { category: (typeof lastReport.report_items)[number]["category"]; amount: number }>>((m, i) => {
        m[i.category] = { category: i.category, amount: (m[i.category]?.amount ?? 0) + i.amount };
        return m;
      }, {})).sort((a, b) => b.amount - a.amount)
    : [];

  return (
    <>
      {/* HERO: centered, type-led */}
      <section className="mx-auto flex min-h-[78vh] max-w-5xl flex-col items-center justify-center px-4 py-20 text-center md:py-28">
        <h1 className={ml ? "display-ml text-balance text-4xl sm:text-6xl" : "display text-balance text-[3.2rem] sm:text-7xl md:text-[5.6rem]"}>{c.h1}</h1>
        <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-ink/75 md:text-xl">{c.sub}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/give" className="btn-gold px-7 py-3.5 text-base">{c.cta}</Link>
          <Link href="#where" className="btn-ghost px-7 py-3.5 text-base">{c.cta2}</Link>
        </div>
      </section>

      {/* FACTS, ruled columns, sourced */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl md:grid-cols-3">
          {c.facts.map((f, i) => (
            <div key={i} className="border-line px-4 py-8 not-first:border-t md:border-l md:px-8 md:not-first:border-t-0 md:first:border-l-0 md:first:pl-4">
              <div className={`${ml ? "display-ml" : "display"} text-5xl ${i === 1 ? "text-rose" : "text-ink"}`}>{f.big}</div>
              <p className="mt-3 max-w-[30ch] leading-snug text-ink/75">{f.text}</p>
              <p className="mt-3 text-xs text-ink/65">{f.src}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW, a real sequence, so it's numbered */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-20">
        <h2 className={`${ml ? "display-ml" : "display"} text-4xl`}>{c.howTitle}</h2>
        <ol className="relative mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-4 hidden h-px bg-line lg:block" aria-hidden />
          {c.steps.map(([title, body], i) => (
            <li key={i} className="relative">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 max-w-[28ch] text-ink/65">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* WHERE IT GOES, a real unit's last report */}
      {featured && lastReport && (
        <section id="where" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-20">
          <div className="rounded-xl bg-white p-6 ring-1 ring-line md:p-10">
            <h2 className={`${ml ? "display-ml" : "display"} max-w-3xl text-3xl md:text-4xl`}>
              {c.spendTitle(pick(lang, featured.name, featured.name_ml), lastReport.period_label)}
            </h2>
            <p className="mt-2 text-ink/70">{lastReport.period_label}: {c.spendSub(num(lastReport.patients_served))}</p>
            <div className="mt-8"><CategoryBreakdown items={lastCats} lang={lang} /></div>
            <Link href={`/units/${featured.slug}#reports`} className="btn-ghost mt-8">{c.seeUnit}</Link>
          </div>
        </section>
      )}

      {/* UNITS */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className={`${ml ? "display-ml" : "display"} text-4xl`}>{c.unitsTitle}</h2>
            <p className="mt-2 text-ink/70">{c.unitsSub}</p>
          </div>
          <Link href="/units" className="text-sm font-semibold underline underline-offset-4">{c.allUnits}</Link>
        </div>
        <ul className="mt-6 border-b border-line">
          {units.slice(0, 5).map((u) => <UnitRow key={u.id} u={u} lang={lang} d={dict} />)}
        </ul>
      </section>

      {/* CLOSE */}
      <section className="-mb-16 mt-24 bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className={`${ml ? "display-ml" : "display"} max-w-2xl text-4xl md:text-5xl`}>{c.closeH}</h2>
            <p className="mt-3 text-lg text-white/70">{c.closeSub}</p>
          </div>
          <Link href="/give" className="btn-gold shrink-0 px-6 py-3 text-base">{c.cta}</Link>
        </div>
      </section>
    </>
  );
}
