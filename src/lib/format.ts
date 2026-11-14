const inrFmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const inr = (n: number | null | undefined) => inrFmt.format(Math.round(n ?? 0));
export const num = (n: number | null | undefined) => new Intl.NumberFormat("en-IN").format(Math.round(n ?? 0));
export const pct = (part: number, whole: number) => (whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0);
export const fmtDate = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
