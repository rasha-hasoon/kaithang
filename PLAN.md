# Kaithang (കൈത്താങ്ങ്) — 24-Hour Build Plan

*₹1 a week. A life saved every week.*
Kerala's verified, community-pooled medical emergency fund. Milaap-style case pages + a recurring "pool" that funds ASHA-verified cases, paid straight to hospitals.

---

## 1. What we're building (scope for the demo)

| Area | Live in demo | Simulated / later |
|---|---|---|
| Donor site (EN + ML) | Home, case list, case page, subscribe, one-time donate, "My impact" | Login for donors (guest checkout instead) |
| Payments | Razorpay one-time UPI checkout + UPI AutoPay subscriptions (test mode), webhooks | Real money (needs Ignite's live KYC'd account) |
| Verification | Family registers case → 2 ASHA workers approve → admin publishes | Govt/NHM integration |
| Admin (Ignite committee) | Approve, allocate pool → case, log hospital payout, notify donors | Automated payouts (Razorpay Route) |
| WhatsApp | "New verified case" alert + payment link to test numbers; payment receipt | Monthly impact digest, chatbot |

**Milaap patterns we copy (layout, not branding):** hero photo + title, raised/goal progress bar, supporters count, WhatsApp share at top, "Created by / Benefits" block with location, tabs: **Story · Documents · Payouts · Updates**.
**What we add (USP):** recurring pool, ASHA "Verified at doorstep" badge, public payout proof, Malayalam-first.

---

## 2. Stack

- **Next.js 15 (App Router, TypeScript, Tailwind)** — one app, deployed on **Vercel**
- **Supabase** — Postgres, Auth (email+password for ASHA/admin/family; donors check out as guests), Storage (photos, documents)
- **Razorpay** — Orders (one-time), Plans + Subscriptions (UPI AutoPay), Webhooks
- **WhatsApp Cloud API** (Meta test number) — template messages with payment links
- **next-intl** — `/en` and `/ml` routes, Noto Sans Malayalam font

> Deploy to Vercel in Step 0 so webhooks (Razorpay, WhatsApp) have a public URL from the start.

---

## 3. Users & roles

| Role | How they log in | What they do |
|---|---|---|
| Donor | No login (name + phone at checkout) | Browse, subscribe, donate, view impact by phone number |
| Family | Email login | Register a case, upload ID / income cert / estimate, track status |
| ASHA | Email login (seeded accounts) | See assigned cases, upload visit photos + consent, approve/reject |
| Admin | Email login (seeded) | Publish cases, allocate pool, log payouts, post updates, send WhatsApp alerts |

---

## 4. Database (Supabase)

```
profiles        id(auth uid) · role[donor|family|asha|admin] · name · phone · district · lang
hospitals       id · name · district · account_name · account_no_last4 · ifsc
cases           id · slug · patient_name · age · district · condition · story_en · story_ml
                goal_amount · hospital_id · urgency(1-3) · cover_image · deadline
                status[submitted|under_verification|verified|live|funded|paid|rejected]
                created_by · assigned_asha_ids(uuid[]) · created_at
case_documents  id · case_id · type[id_proof|income_cert|medical_estimate|photo|consent] · path · is_public
verifications   id · case_id · asha_id · decision[approve|reject] · notes · photo_paths · visited_at
                UNIQUE(case_id, asha_id)
                TRIGGER: 2 approvals → cases.status = 'verified'
subscriptions   id · donor_name · phone · amount · interval[weekly|monthly] · rzp_plan_id
                rzp_subscription_id · status · created_at
donations       id · case_id(null = pool) · donor_name · phone · amount · kind[one_time|sub_charge]
                rzp_order_id · rzp_payment_id · subscription_id · status · created_at
allocations     id · case_id · amount · note · created_by · created_at      (pool → case)
payouts         id · case_id · hospital_id · amount · utr_ref · proof_path · paid_at
case_updates    id · case_id · body_en · body_ml · created_at

VIEWS
case_totals     case_id · direct_raised · allocated · total_raised · supporters
pool_balance    total_in (pool donations + sub charges) − total_allocated
```
RLS: public can read `live/funded/paid` cases, public docs, payouts, updates, totals. Writes only via role checks or server routes using the service key.

---

## 5. Routes

```
/[locale]                      Home: pool counter, "₹1 a week" hero, trending verified cases, how it works
/[locale]/cases                All live cases (filter: district, urgency)
/[locale]/cases/[slug]         Case page (Milaap-style, tabs) + Donate once / Subscribe
/[locale]/give                 Subscribe to the pool (amount + weekly/monthly)
/[locale]/impact               Enter phone → your total, cases helped
/[locale]/register             Family: register a case (multi-step form)
/[locale]/login                Staff/family login
/asha                          ASHA dashboard → /asha/cases/[id] verify screen
/admin                         Admin dashboard: queue, pool, allocate, payouts, notify

API
/api/pay/order                 POST → Razorpay order (one-time)
/api/pay/subscribe             POST → create/reuse plan + subscription, return short_url
/api/pay/webhook               Razorpay events: payment.captured, subscription.charged …
/api/wa/notify                 POST (admin) → WhatsApp template to subscribers
```

---

## 6. Build steps (one step = one chat turn ≈ one commit)

| # | Step | Output | Time |
|---|---|---|---|
| 0 | **Accounts & scaffold** — Supabase project (Mumbai), Razorpay test keys + Subscriptions on, Meta WhatsApp app + test numbers, Next.js scaffold, `.env.local`, first Vercel deploy | Running blank app online | 0:45 |
| 1 | **Database** — schema SQL, trigger, views, RLS, storage buckets, seed (Amina + 3 cases, 2 hospitals, 2 ASHA + 1 admin users) | `supabase/schema.sql`, `seed.sql` | 1:00 |
| 2 | **App shell** — i18n EN/ML, layout, header/footer, design tokens, Supabase clients, language toggle | Navigable skeleton | 1:30 |
| 3 | **Donor pages** — Home (pool counter, trending), case list, case page with tabs, progress bar, WhatsApp share | Full browse experience on seed data | 3:00 |
| 4 | **One-time payments** — Razorpay checkout on case page + pool, webhook → `donations`, live progress update | Real test-mode UPI payment moves the bar | 2:00 |
| 5 | **Subscriptions** — /give page, plans per amount/interval, UPI AutoPay mandate, `subscription.charged` → pool, Impact page | "₹1/week" flow works end to end | 2:30 |
| 6 | **Case registration + ASHA** — family multi-step form + uploads, ASHA dashboard, 2-approval verify screen | Case goes submitted → verified | 3:00 |
| 7 | **Admin** — publish, allocate pool → case, log payout with proof (shows in Payouts tab), post update | Committee flow done | 2:00 |
| 8 | **WhatsApp** — notify subscribers of new verified case with pay link, payment receipt message | Phone buzzes during demo | 1:30 |
| 9 | **Polish & demo** — Malayalam copy pass, mobile check, seed realistic data, demo script rehearsal | Demo-ready | 1:30 |
|   | Buffer / rest | | ~5:00 |

**Cut order if behind:** 8 receipts → 7 payout proof upload → 6 family form (seed cases instead, keep ASHA verify) → Impact page.

---

## 7. Demo script (3 minutes)

1. Home in Malayalam → pool counter, "₹1 a week" pitch.
2. Open Amina's case → ASHA-verified badge, documents, payouts tab.
3. Subscribe ₹10/week via UPI AutoPay (test) → pool counter rises.
4. Switch to ASHA phone → verify a new case (2nd approval) → status flips to verified.
5. Admin publishes + allocates from pool → WhatsApp alert arrives on judge's phone → tap link → donate.
6. Payouts tab shows "₹4,00,000 paid to hospital" with reference.

---

## 8. Working rules (to save time & tokens)

- One step per turn; I write files straight into the project folder, you run `npm run dev` and report errors.
- Paste only the error line + file, not full logs.
- Secrets never go in chat — only in `.env.local` / Vercel env.
- After each step: `git commit -m "step N"`.
