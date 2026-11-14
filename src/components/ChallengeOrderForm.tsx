"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { placeOrder } from "@/app/challenges/actions";

export function ChallengeOrderForm({ slug, title, price, item, unitLabel, regions, upiId }: {
  slug: string; title: string; price: number; item: string; unitLabel: string; regions: string[]; upiId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState(regions[0] ?? "");
  const [qty, setQty] = useState(1);
  const [step, setStep] = useState<"form" | "pay" | "done">("form");
  const [qr, setQr] = useState("");
  const [utr, setUtr] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [method, setMethod] = useState<"upi" | "cash">("upi");
  const amount = qty * price;

  const toPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErr("Enter the buyer's name.");
    setErr(null);
    if (method === "cash") return submit("cash");
    const link = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("Samhari")}&am=${amount}&cu=INR&tn=${encodeURIComponent(title.slice(0, 50))}`;
    setQr(await QRCode.toDataURL(link, { margin: 1, width: 280, color: { dark: "#15203b", light: "#ffffff" } }));
    setStep("pay");
  };
  const submit = (m: "upi" | "cash") => start(async () => {
    const r = await placeOrder({ slug, name, phone, region, qty, method: m, utr });
    if (!r.ok) { setErr(r.error === "phone" ? "Enter a valid 10-digit mobile number, or leave it empty." : r.error); setStep("form"); return; }
    setStep("done"); router.refresh();
  });

  if (step === "done") return (
    <div className="text-center" role="status">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-leaf text-2xl text-white">✓</div>
      <h3 className="display mt-4 text-3xl">Booked: {qty} {unitLabel}{qty > 1 ? "s" : ""}</h3>
      <p className="mt-1 text-ink/70">{method === "cash" ? "Pay the volunteer in cash on delivery." : "Payment recorded. Thank you!"}</p>
      <button className="btn-ghost mt-5" onClick={() => { setStep("form"); setName(""); setPhone(""); setQty(1); setUtr(""); }}>Book another</button>
    </div>
  );

  if (step === "pay") return (
    <div className="text-center">
      <h3 className="display text-3xl">Scan to pay ₹{amount}</h3>
      <p className="mt-1 text-sm text-ink/70">Any UPI app. The amount is filled in for you.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qr} alt={`UPI QR code for ₹${amount}`} className="mx-auto mt-4 h-56 w-56 rounded-lg ring-1 ring-line" />
      <p className="mt-2 text-xs text-ink/65">Pays {upiId}</p>
      <label className="label mt-4 text-left" htmlFor="utr">UTR / reference number (optional)</label>
      <input id="utr" className="input" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="12-digit UPI reference" />
      <button className="btn-gold mt-4 w-full py-3 text-base" disabled={pending} onClick={() => submit("upi")}>{pending ? "…" : "I've paid"}</button>
      <button className="mt-3 text-sm underline" onClick={() => setStep("form")}>Back</button>
      <p className="mt-3 text-xs text-ink/50">Demo mode: no money moves.</p>
    </div>
  );

  return (
    <form onSubmit={toPay} className="grid gap-4">
      <div><label className="label" htmlFor="o-name">Name</label><input id="o-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></div>
      <div><label className="label" htmlFor="o-phone">Mobile (optional)</label><input id="o-phone" className="input" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" /></div>
      {regions.length > 0 && (
        <div><label className="label" htmlFor="o-region">Ward / area</label>
          <select id="o-region" className="input" value={region} onChange={(e) => setRegion(e.target.value)}>{regions.map((r) => <option key={r}>{r}</option>)}</select></div>
      )}
      <div>
        <span className="label">How many {unitLabel}s of {item.toLowerCase()}?</span>
        <div className="flex items-center gap-3">
          <button type="button" className="btn-ghost h-11 w-11 !p-0 text-xl" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="One less">−</button>
          <input className="input w-20 text-center text-lg" type="number" min={1} max={500} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} aria-label="Quantity" />
          <button type="button" className="btn-ghost h-11 w-11 !p-0 text-xl" onClick={() => setQty((q) => q + 1)} aria-label="One more">+</button>
          <span className="ml-auto display text-3xl">₹{amount}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(["upi", "cash"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMethod(m)} aria-pressed={method === m}
            className={`rounded-lg py-2.5 text-sm font-semibold ring-1 ${method === m ? "bg-ink text-white ring-ink" : "bg-white ring-line"}`}>
            {m === "upi" ? "Pay by UPI" : "Cash on delivery"}
          </button>
        ))}
      </div>
      {err && <p role="alert" className="text-sm text-rose">{err}</p>}
      <button className="btn-gold py-3 text-base" disabled={pending}>{method === "upi" ? `Pay ₹${amount}` : `Book for ₹${amount}`}</button>
    </form>
  );
}
