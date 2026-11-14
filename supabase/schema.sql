-- =============================================================
-- Samhari (സംഹാരി) v2, Palliative care subscription platform
-- Run in Supabase → SQL Editor. Safe to re-run: it RESETS the public schema.
-- =============================================================

-- ---------- 0. Reset (removes the v1 tables) ----------
drop trigger if exists on_auth_user_created on auth.users;
drop policy if exists "public bucket read"  on storage.objects;
drop policy if exists "auth upload public"  on storage.objects;
drop policy if exists "auth upload private" on storage.objects;
drop policy if exists "staff read private"  on storage.objects;
drop policy if exists "kaithang public read" on storage.objects;
drop schema if exists public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables    in schema public to postgres, anon, authenticated, service_role;
grant all on all functions in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on tables    to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;

-- ---------- 1. Enums ----------
create type staff_role     as enum ('unit', 'admin');
create type unit_kind      as enum ('government', 'private', 'community');
create type unit_status    as enum ('pending', 'approved', 'rejected');
create type sub_frequency  as enum ('monthly', 'quarterly', 'yearly');
create type sub_status     as enum ('active', 'paused', 'cancelled');
create type report_status  as enum ('draft', 'submitted', 'approved', 'rejected');
create type spend_category as enum (
  'medicines_pain_relief',   -- morphine, other medicines
  'home_care_visits',        -- nurse/doctor visits, vehicle, fuel
  'consumables',             -- diapers, dressings, catheters, tubes
  'equipment',               -- waterbeds, wheelchairs, oxygen concentrators
  'family_support',          -- food kits, transport, education support
  'training_admin'           -- volunteer training, phone, stationery
);

-- ---------- 2. Staff (unit coordinators + platform admins) ----------
-- Donors are NOT auth users; they log in with phone OTP (table `donors`).
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  name       text,
  role       staff_role not null default 'unit',
  unit_id    uuid,
  created_at timestamptz not null default now()
);

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

-- ---------- 3. Palliative units ----------
create table units (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  name                text not null,
  name_ml             text,
  kind                unit_kind not null,
  district            text not null,
  panchayat           text,
  address             text,
  about_en            text,
  about_ml            text,
  phone               text,
  email               text,
  cover_url           text,
  patients_registered int not null default 0,
  home_visits_month   int not null default 0,
  nurses              int not null default 0,
  volunteers          int not null default 0,
  bank_account_name   text,
  bank_account_last4  text,
  ifsc                text,
  status              unit_status not null default 'pending',
  is_sample           boolean not null default false,
  created_by          uuid references auth.users(id),
  approved_at         timestamptz,
  created_at          timestamptz not null default now()
);
alter table profiles add constraint profiles_unit_fk foreign key (unit_id) references units(id) on delete set null;

create table unit_needs (
  id            uuid primary key default gen_random_uuid(),
  unit_id       uuid not null references units(id) on delete cascade,
  title_en      text not null,
  title_ml      text,
  category      spend_category not null,
  qty_needed    int not null default 1,
  qty_fulfilled int not null default 0,
  cost_per_item int,
  created_at    timestamptz not null default now()
);

-- ---------- 4. Donors & subscriptions ----------
create table donors (
  id         uuid primary key default gen_random_uuid(),
  phone      text unique not null,
  name       text,
  district   text,
  show_name  boolean not null default true,   -- false = unit sees "Anonymous supporter"
  created_at timestamptz not null default now()
);

-- weekly_amount is what we pitch ("₹3 a week"); charge_amount is what is debited per cycle.
create table subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  donor_id            uuid not null references donors(id) on delete cascade,
  unit_id             uuid not null references units(id),
  weekly_amount       int not null check (weekly_amount >= 1),
  frequency           sub_frequency not null default 'monthly',
  charge_amount       int not null check (charge_amount >= 1),
  status              sub_status not null default 'active',
  rzp_subscription_id text unique,
  started_at          timestamptz not null default now(),
  next_charge_on      date,
  cancelled_at        timestamptz
);
create index on subscriptions (unit_id, status);
create index on subscriptions (donor_id);

-- Charge amount from weekly pledge: monthly = 52/12 weeks, quarterly = 13, yearly = 52
create or replace function charge_for(weekly int, freq sub_frequency) returns int
language sql immutable as $$
  select case freq when 'monthly' then ceil(weekly * 52.0 / 12)::int
                   when 'quarterly' then weekly * 13
                   else weekly * 52 end
$$;

-- Every successful debit lands in the central account and is recorded here
create table contributions (
  id              uuid primary key default gen_random_uuid(),
  donor_id        uuid not null references donors(id) on delete cascade,
  unit_id         uuid not null references units(id),
  subscription_id uuid references subscriptions(id),
  amount          int not null check (amount >= 1),
  status          text not null default 'captured',   -- captured | failed
  rzp_payment_id  text unique,
  charged_at      timestamptz not null default now()
);
create index on contributions (unit_id, charged_at);
create index on contributions (donor_id);

-- ---------- 5. Central account → unit transfers ----------
create table disbursements (
  id           uuid primary key default gen_random_uuid(),
  unit_id      uuid not null references units(id),
  amount       int not null check (amount > 0),
  period_label text not null,          -- e.g. 'October 2026'
  utr_ref      text,
  paid_at      timestamptz not null default now(),
  created_by   uuid references auth.users(id)
);

-- ---------- 6. Quarterly spending reports ----------
create table reports (
  id              uuid primary key default gen_random_uuid(),
  unit_id         uuid not null references units(id) on delete cascade,
  period_label    text not null,       -- e.g. 'Jul-Sep 2026'
  period_start    date not null,
  period_end      date not null,
  patients_served int,
  home_visits     int,
  summary_en      text,
  summary_ml      text,
  status          report_status not null default 'draft',
  admin_note      text,
  submitted_at    timestamptz,
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  unique (unit_id, period_start)
);

create table report_items (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references reports(id) on delete cascade,
  category    spend_category not null,
  description text not null,
  amount      int not null check (amount > 0),
  receipt_url text
);

-- =============================================================
-- 7. Views used by the dashboards
-- =============================================================
create or replace view unit_stats as
select u.id as unit_id,
  coalesce(s.supporters, 0)        as supporters,
  coalesce(s.monthly_committed, 0) as monthly_committed,
  coalesce(c.received, 0)          as total_received,
  coalesce(d.disbursed, 0)         as total_disbursed,
  coalesce(r.spent, 0)             as total_spent,
  coalesce(c.received, 0) - coalesce(d.disbursed, 0) as pending_transfer,
  r.last_period                    as last_report_period
from units u
left join (select unit_id, count(distinct donor_id) supporters,
                  round(sum(case frequency when 'monthly' then charge_amount
                                           when 'quarterly' then charge_amount / 3.0
                                           else charge_amount / 12.0 end))::int monthly_committed
             from subscriptions where status = 'active' group by unit_id) s on s.unit_id = u.id
left join (select unit_id, sum(amount) received from contributions where status = 'captured' group by unit_id) c on c.unit_id = u.id
left join (select unit_id, sum(amount) disbursed from disbursements group by unit_id) d on d.unit_id = u.id
left join (select rp.unit_id, sum(ri.amount) spent,
                  (array_agg(rp.period_label order by rp.period_start desc))[1] last_period
             from reports rp join report_items ri on ri.report_id = rp.id
            where rp.status = 'approved' group by rp.unit_id) r on r.unit_id = u.id;

create or replace view unit_spend_by_category as
select rp.unit_id, ri.category, sum(ri.amount)::int as amount
from reports rp join report_items ri on ri.report_id = rp.id
where rp.status = 'approved'
group by rp.unit_id, ri.category;

create or replace view platform_stats as
select
  (select count(*) from units where status = 'approved')                              as units_live,
  (select count(distinct donor_id) from subscriptions where status = 'active')        as active_supporters,
  (select coalesce(sum(amount), 0) from contributions where status = 'captured')      as total_raised,
  (select coalesce(sum(amount), 0) from disbursements)                                as total_disbursed,
  (select coalesce(sum(patients_registered), 0) from units where status = 'approved') as patients_cared,
  (select coalesce(sum(s.monthly_committed), 0) from unit_stats s)                     as monthly_committed;

-- =============================================================
-- 8. Security
-- All writes go through the Next.js server (service-role key).
-- The browser (anon key) can only read public, non-personal data.
-- =============================================================
alter table profiles      enable row level security;
alter table units         enable row level security;
alter table unit_needs    enable row level security;
alter table donors        enable row level security;
alter table subscriptions enable row level security;
alter table contributions enable row level security;
alter table disbursements enable row level security;
alter table reports       enable row level security;
alter table report_items  enable row level security;

create policy "own profile"          on profiles     for select using (id = auth.uid());
create policy "approved units"       on units        for select using (status = 'approved');
create policy "needs of approved"    on unit_needs   for select using (exists (select 1 from units u where u.id = unit_id and u.status = 'approved'));
create policy "public disbursements" on disbursements for select using (true);
create policy "approved reports"     on reports      for select using (status = 'approved');
create policy "approved report items" on report_items for select using (exists (select 1 from reports r where r.id = report_id and r.status = 'approved'));
-- donors, subscriptions, contributions: no anon access (personal data)

revoke all on unit_stats, unit_spend_by_category, platform_stats from anon, authenticated;
grant select on unit_stats, unit_spend_by_category, platform_stats to anon, authenticated;

-- ---------- 9. Storage: receipts & unit photos (public bucket) ----------
insert into storage.buckets (id, name, public) values ('kaithang', 'kaithang', true)
on conflict (id) do nothing;
create policy "kaithang public read" on storage.objects for select using (bucket_id = 'kaithang');
