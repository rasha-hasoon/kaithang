export type Lang = "en" | "ml";
export type Frequency = "monthly" | "quarterly" | "yearly";

export const MORPHINE_DOSE_COST = 3; // ₹, pitch figure, confirm with partner doctor
export const WEEKLY_PRESETS = [3, 5, 10, 20, 50];

/** How many weeks one debit covers. A month is 52 weeks / 12 months = 4.33 weeks. */
export const WEEKS_PER: Record<Frequency, string> = { monthly: "4.33", quarterly: "13", yearly: "52" };

/** Mirrors charge_for() in schema.sql */
export function chargeFor(weekly: number, f: Frequency) {
  return f === "monthly" ? Math.ceil((weekly * 52) / 12) : f === "quarterly" ? weekly * 13 : weekly * 52;
}

export const CATEGORIES = {
  medicines_pain_relief: { en: "Medicines & pain relief", ml: "മരുന്നും വേദനസംഹാരികളും", color: "#0f766e" },
  home_care_visits: { en: "Home care visits", ml: "ഹോം കെയർ വിസിറ്റുകൾ", color: "#b45309" },
  consumables: { en: "Diapers, dressings & consumables", ml: "ഡയപ്പർ, ഡ്രസ്സിംഗ് പോലുള്ളവ", color: "#7c3aed" },
  equipment: { en: "Equipment (water beds, wheelchairs)", ml: "ഉപകരണങ്ങൾ (വാട്ടർ ബെഡ്, വീൽചെയർ)", color: "#2563eb" },
  family_support: { en: "Food kits & family support", ml: "ഭക്ഷ്യകിറ്റും കുടുംബത്തിന് സഹായവും", color: "#db2777" },
  training_admin: { en: "Volunteer training & admin", ml: "വളണ്ടിയർ ട്രെയിനിംഗ്, മറ്റ് ചെലവുകൾ", color: "#64748b" },
} as const;
export type Category = keyof typeof CATEGORIES;

export const UNIT_KIND = {
  government: { en: "Panchayat / Government", ml: "പഞ്ചായത്ത് / സർക്കാർ" },
  private: { en: "Private centre", ml: "സ്വകാര്യ സെന്റർ" },
  community: { en: "Community / Volunteer", ml: "കമ്മ്യൂണിറ്റി / വളണ്ടിയർ" },
} as const;

export const DISTRICT_ML: Record<string, string> = {
  Thiruvananthapuram: "തിരുവനന്തപുരം", Kollam: "കൊല്ലം", Pathanamthitta: "പത്തനംതിട്ട", Alappuzha: "ആലപ്പുഴ",
  Kottayam: "കോട്ടയം", Idukki: "ഇടുക്കി", Ernakulam: "എറണാകുളം", Thrissur: "തൃശ്ശൂർ", Palakkad: "പാലക്കാട്",
  Malappuram: "മലപ്പുറം", Kozhikode: "കോഴിക്കോട്", Wayanad: "വയനാട്", Kannur: "കണ്ണൂർ", Kasaragod: "കാസർഗോഡ്",
};

export const DISTRICTS = [
  "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", "Idukki", "Ernakulam",
  "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod",
];
