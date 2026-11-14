# Samhari v2, Palliative care subscription platform

## The idea
- Pitch: **₹3 a week ≈ one dose of morphine.** People give an amount small enough not to notice.
- Donors log in with phone + OTP, pick one or more palliative units (any unit, not just local), and set up UPI AutoPay.
- Billing: pitched weekly, **charged monthly (₹13), quarterly (₹39) or yearly (₹156)**, avoids 4 debit fees + 4 pre-debit SMS a month. No stored-value wallet (would need RBI licence).
- Money lands in **one central account** (Ignite for the demo) → **transferred to each unit monthly** → logged with UTR.
- Units sign up → **committee approves** → listed publicly.
- Units file **quarterly spending reports by category** with receipt photos → committee approves → shown publicly as "Where the money goes".
- Units show patient counts, home visits and **current needs** (water beds, wheelchairs, diapers…).
- Pilot partners to approach: IPM Kozhikode, private palliative centres in Mukkam.

## Spending categories (pattern used by Pallium India / give.do: concrete unit costs + category split)
Medicines & pain relief · Home care visits · Diapers & consumables · Equipment · Food kits & family support · Volunteer training & admin

## Build status
| # | Step | Status |
|---|---|---|
| 1 | Schema v2 + seed (tested) | ✅ |
| 2 | Shell, EN/ML toggle, design | ✅ |
| 3 | Home, units directory, unit page, AutoPay box | ✅ |
| 4 | Donor phone-OTP login (demo OTP) + My giving | ✅ |
| 5 | Unit sign-up, unit dashboard, needs, quarterly report + receipts | ✅ |
| 6 | Admin: approve units, review reports, record transfers | ✅ |
| 7 | Razorpay subscriptions (test mode) + webhook | next |
| 8 | Polish, deploy to Vercel, pitch rehearsal | next |

## Build 2 (later)
Event fundraising dashboard, cake fest, biryani challenge, juice fest, replacing Google Sheets; same units, same transparency.
