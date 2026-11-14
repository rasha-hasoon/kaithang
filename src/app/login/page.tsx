import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n";
import { getDonor } from "@/lib/session";
import { requestOtp, verifyLogin } from "../actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ step?: string; phone?: string; next?: string; err?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/me";
  if (await getDonor()) redirect(next);
  const { t, lang } = await getT();
  const ml = lang === "ml" ? "font-ml" : "";
  const otpStep = sp.step === "otp" && sp.phone;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card kasavu p-7">
        <h1 className={`text-2xl font-bold text-brand ${ml}`}>{t("login_title")}</h1>
        {!otpStep ? (
          <form action={requestOtp} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <label className="label" htmlFor="phone">{t("login_phone")}</label>
              <div className="flex gap-2">
                <span className="input !w-16 text-center text-ink/70">+91</span>
                <input id="phone" name="phone" className="input" inputMode="numeric" placeholder="98765 43210" required autoFocus />
              </div>
              {sp.err === "phone" && <p className="mt-1 text-xs text-red-600">Enter a valid 10-digit Indian mobile number.</p>}
            </div>
            <button className="btn-primary w-full">{t("login_send")}</button>
          </form>
        ) : (
          <form action={verifyLogin} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="phone" value={sp.phone} />
            <p className="text-sm text-ink/70">OTP sent to <b>+91 {sp.phone}</b></p>
            <div>
              <label className="label" htmlFor="otp">{t("login_otp")}</label>
              <input id="otp" name="otp" className="input text-center text-lg tracking-[0.5em]" inputMode="numeric" maxLength={6} required autoFocus />
              {sp.err === "otp" && <p className="mt-1 text-xs text-red-600">Wrong OTP. Try again.</p>}
            </div>
            <div>
              <label className="label" htmlFor="name">{t("login_name")}</label>
              <input id="name" name="name" className="input" />
            </div>
            <button className="btn-primary w-full">{t("login_verify")}</button>
          </form>
        )}
        <p className="mt-5 rounded-lg bg-gold-soft/60 p-2.5 text-center text-xs text-ink/70">{t("login_demo")}</p>
      </div>
    </div>
  );
}
