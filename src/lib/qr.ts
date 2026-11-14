import QRCode from "qrcode";

export const qrDataUrl = (text: string) =>
  QRCode.toDataURL(text, { margin: 1, width: 360, color: { dark: "#15203b", light: "#ffffff" } });

/** UPI deep link with an exact amount, the format every UPI app understands. */
export const upiLink = (upiId: string, payee: string, amount: number, note: string) =>
  `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payee)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note.slice(0, 60))}`;

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
