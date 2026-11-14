# Samhari (സംഹാരി)

*₹3 a week. Three hours without pain.*, small weekly AutoPay contributions to verified palliative care units in Kerala, with quarterly spending reports.
Built for Healthacon 2026 (Ignite Foundation · Coins · Circle of Kindness · TinkerHub). See `PLAN.md`.

## Run locally
```bash
npm install
cp .env.example .env.local   # fill in Supabase keys + SESSION_SECRET
npm run dev                  # http://localhost:3000
```

## Database (Supabase → SQL Editor)
1. Run `supabase/schema.sql` (resets the public schema, v2)
2. Run `supabase/seed.sql` (sample units, donors, payments, reports)
3. Authentication → Users → Add user (Auto Confirm): `admin@kaithang.demo`, `unit@kaithang.demo`
4. Run the commented STAFF ACCOUNTS block at the bottom of `seed.sql` as a new query (remove the `--`)

## Demo logins
| Who | Where | Login |
|---|---|---|
| Donor | `/login` | phone `9999999999`, OTP `123456` (any phone works in demo mode) |
| Unit coordinator | `/staff/login` | `unit@kaithang.demo` + the password you set |
| Committee admin | `/staff/login` | `admin@kaithang.demo` + the password you set |

## Pages
- `/` home · `/units` directory · `/units/[slug]` unit page with "where the money goes" + AutoPay box
- `/me` donor dashboard (AutoPays, pause/cancel, history)
- `/staff/register` unit sign-up → admin approval
- `/unit` unit dashboard (supporters, collections, needs, profile) · `/unit/reports/[id]` quarterly report with receipt uploads
- `/admin` approve units, review reports, record monthly transfers

AutoPay and OTP are simulated in demo mode. Razorpay subscriptions plug into `subscribe()` in `src/app/actions.ts`.
All units, people and figures in the seed are fictional sample data.
