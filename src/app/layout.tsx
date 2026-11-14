import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/anek-malayalam/wdth.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./globals.css";
import { getT } from "@/lib/i18n";
import { getDonor } from "@/lib/session";
import { Logo } from "@/components/ui";
import { logoutDonor, setLang } from "./actions";

export const metadata: Metadata = {
  title: "Samhari: ₹3 a week for palliative care in Kerala",
  description: "Small weekly UPI AutoPay contributions to verified palliative care units across Kerala, with quarterly spending reports.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { t, lang } = await getT();
  const donor = await getDonor().catch(() => null);
  const links = [
    { href: "/units", label: t("nav_units") },
    { href: "/challenges", label: t("nav_challenges") },
    { href: "/#how", label: t("nav_how") },
    ...(donor ? [{ href: "/me", label: t("nav_me") }] : []),
    { href: "/staff/login", label: t("nav_staff") },
  ];
  return (
    <html lang={lang} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:py-5">
            <Link href="/" aria-label="Samhari home"><Logo ml={lang === "ml"} /></Link>
            <nav className="hidden items-center gap-8 text-base font-medium text-ink/80 lg:flex">
              {links.map((l) => <Link key={l.href} href={l.href} className="hover:text-ink">{l.label}</Link>)}
            </nav>
            <div className="flex items-center gap-3">
              <form action={setLang}>
                <input type="hidden" name="lang" value={lang === "ml" ? "en" : "ml"} />
                <button className="text-base font-medium text-ink/80 hover:text-ink" aria-label="Switch language">
                  {lang === "ml" ? "English" : "മലയാളം"}
                </button>
              </form>
              {donor ? (
                <form action={logoutDonor}><button className="btn-ghost !px-4 !py-2 text-sm">{t("nav_logout")}</button></form>
              ) : (
                <Link href="/login" className="btn-primary !px-5 !py-2.5 text-sm">{t("nav_login")}</Link>
              )}
            </div>
          </div>
          <nav className="flex gap-6 overflow-x-auto px-4 pb-3 text-base font-medium text-ink/80 lg:hidden">
            {links.map((l) => <Link key={l.href} href={l.href} className="whitespace-nowrap">{l.label}</Link>)}
          </nav>
        </header>
        <main className="flex-1 pb-16">{children}</main>
        <footer className="bg-ink text-white/75">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-white/10 px-4 py-8 text-xs md:flex-row md:justify-between">
            <p>{t("footer")}</p>
            <p>{t("footer_note")}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
