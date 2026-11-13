# Kaithang (കൈത്താങ്ങ്)

*₹1 a week. A life saved every week.* — Kerala's verified, community-pooled medical emergency fund.
Built for Healthacon (Ignite Foundation · Coins · Circle of Kindness · TinkerHub). See `PLAN.md` for the full build plan.

## Run locally
```bash
npm install
cp .env.example .env.local   # then fill in the Supabase keys
npm run dev                  # http://localhost:3000
```

## Database setup (once)
1. Supabase → **SQL Editor** → paste `supabase/schema.sql` → **Run**
2. New query → paste `supabase/seed.sql` → **Run** (demo data; re-runnable)
3. Authentication → Users → **Add user** (tick *Auto Confirm*) for
   `admin@kaithang.demo`, `asha1@kaithang.demo`, `asha2@kaithang.demo`
4. Run the commented **STAFF ACCOUNTS** block at the bottom of `seed.sql` (remove the `--`)

All people, hospitals and bank details in the seed are fictional demo data.
