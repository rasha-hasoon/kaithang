-- =============================================================
-- Kaithang (കൈത്താങ്ങ്) — database schema
-- Run once in Supabase → SQL Editor → New query → Run
-- =============================================================

-- ---------- Enums ----------
create type user_role     as enum ('donor', 'family', 'asha', 'admin');
create type case_status   as enum ('submitted', 'under_verification', 'verified', 'live', 'funded', 'paid', 'rejected');
create type doc_type      as enum ('id_proof', 'income_cert', 'medical_estimate', 'photo', 'consent');
create type verify_choice as enum ('approve', 'reject');
create type sub_interval  as enum ('weekly', 'monthly');
create type donation_kind as enum ('one_time', 'sub_charge');

-- ---------- Profiles (1 row per auth user) ----------
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       user_role not null default 'family',
  name       text,
  phone      text,
  district   text,
  lang       text not null default 'ml',
  created_at timestamptz not null default now()
);

-- Auto-create a profile when someone signs up
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Role helpers (security definer so RLS policies can call them safely)
create or replace function my_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_admin() returns boolean
language sql stable as $$ select coalesce(my_role() = 'admin', false) $$;

create or replace function is_staff() returns boolean
language sql stable as $$ select coalesce(my_role() in ('admin', 'asha'), false) $$;

-- ---------- Hospitals ----------
create table hospitals (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  district         text not null,
  account_name     text,
  account_no_last4 text,
  ifsc             text,
  created_at       timestamptz not null default now()
);

-- ---------- Cases ----------
create table cases (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  patient_name     text not null,
  age              int,
  district         text not null,
  condition_en     text not null,
  condition_ml     text,
  title_en         text not null,
  title_ml         text,
  story_en         text,
  story_ml         text,
  goal_amount      int  not null check (goal_amount > 0),     -- rupees
  hospital_id      uuid references hospitals(id),
  urgency          int  not null default 2 check (urgency between 1 and 3),  -- 3 = most urgent
  cover_image      text,
  deadline         date,
  status           case_status not null default 'submitted',
  created_by       uuid references auth.users(id),
  creator_name     text,
  assigned_asha_ids uuid[] not null default '{}',
  published_at     timestamptz,
  created_at       timestamptz not null default now()
);
create index on cases (status);

create or replace function is_public_status(s case_status) returns boolean
language sql immutable as $$ select s in ('live', 'funded', 'paid') $$;

-- ---------- Case documents ----------
create table case_documents (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references cases(id) on delete cascade,
  type       doc_type not null,
  path       text not null,          -- storage path or full URL
  label      text,
  is_public  boolean not null default false,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------- ASHA verifications (two-person rule) ----------
create table verifications (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references cases(id) on delete cascade,
  asha_id     uuid not null references auth.users(id),
  decision    verify_choice not null,
  notes       text,
  photo_paths text[] not null default '{}',
  consent_taken boolean not null default false,
  visited_at  timestamptz not null default now(),
  unique (case_id, asha_id)
);

-- 1 approval → under_verification, 2 approvals → verified, any reject → rejected
create or replace function apply_verification() returns trigger
language plpgsql security definer set search_path = public as $$
declare approvals int; rejections int;
begin
  select count(*) filter (where decision = 'approve'),
         count(*) filter (where decision = 'reject')
    into approvals, rejections
    from verifications where case_id = new.case_id;

  if rejections > 0 then
    update cases set status = 'rejected' where id = new.case_id and status in ('submitted', 'under_verification');
  elsif approvals >= 2 then
    update cases set status = 'verified' where id = new.case_id and status in ('submitted', 'under_verification');
  elsif approvals = 1 then
    update cases set status = 'under_verification' where id = new.case_id and status = 'submitted';
  end if;
  return new;
end $$;

create trigger on_verification
  after insert or update on verifications
  for each row execute function apply_verification();

-- ---------- Subscriptions (the ₹1/week pool) ----------
create table subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  donor_name          text not null,
  phone               text not null,
  email               text,
  amount              int  not null check (amount >= 1),   -- rupees per charge
  interval            sub_interval not null,
  rzp_plan_id         text,
  rzp_subscription_id text unique,
  status              text not null default 'created',     -- mirrors Razorpay status
  created_at          timestamptz not null default now()
);

-- ---------- Donations (one-time gifts + every subscription charge) ----------
create table donations (
  id              uuid primary key default gen_random_uuid(),
  case_id         uuid references cases(id),          -- NULL = goes to the common pool
  donor_name      text not null default 'Anonymous',
  phone           text,
  amount          int  not null check (amount >= 1),   -- rupees
  kind            donation_kind not null default 'one_time',
  subscription_id uuid references subscriptions(id),
  rzp_order_id    text,
  rzp_payment_id  text unique,
  status          text not null default 'created',     -- created | captured | failed
  is_anonymous    boolean not null default false,
  created_at      timestamptz not null default now()
);
create index on donations (case_id, status);
create index on donations (phone);

-- ---------- Pool → case allocations (committee decision) ----------
create table allocations (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references cases(id),
  amount     int  not null check (amount > 0),
  note       text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------- Payouts to hospitals (public proof) ----------
create table payouts (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references cases(id),
  hospital_id uuid references hospitals(id),
  amount      int  not null check (amount > 0),
  utr_ref     text,
  proof_path  text,
  paid_at     timestamptz not null default now()
);

-- ---------- Case updates ----------
create table case_updates (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references cases(id) on delete cascade,
  body_en    text not null,
  body_ml    text,
  created_at timestamptz not null default now()
);

-- =============================================================
-- Public views (aggregates only — no donor phone numbers exposed)
-- =============================================================
create or replace view case_totals as
select c.id as case_id,
       coalesce(d.direct, 0)                       as direct_raised,
       coalesce(a.allocated, 0)                    as allocated,
       coalesce(d.direct, 0) + coalesce(a.allocated, 0) as total_raised,
       coalesce(d.supporters, 0)                   as supporters,
       coalesce(p.paid, 0)                         as paid_out
from cases c
left join (select case_id, sum(amount) direct, count(*) supporters
             from donations where status = 'captured' and case_id is not null group by case_id) d on d.case_id = c.id
left join (select case_id, sum(amount) allocated from allocations group by case_id) a on a.case_id = c.id
left join (select case_id, sum(amount) paid from payouts group by case_id) p on p.case_id = c.id
where is_public_status(c.status);

create or replace view pool_stats as
select
  coalesce((select sum(amount) from donations where status = 'captured' and case_id is null), 0)            as pool_in,
  coalesce((select sum(amount) from allocations), 0)                                                       as pool_allocated,
  coalesce((select sum(amount) from donations where status = 'captured' and case_id is null), 0)
    - coalesce((select sum(amount) from allocations), 0)                                                   as pool_balance,
  (select count(*) from subscriptions where status in ('active', 'authenticated'))                         as active_subscribers,
  coalesce((select sum(amount) from donations where status = 'captured'), 0)                               as total_given,
  (select count(*) from cases where status in ('funded', 'paid'))                                          as cases_funded;

-- Recent supporters wall (first name only)
create or replace view recent_supporters as
select d.case_id,
       case when d.is_anonymous then 'Anonymous' else split_part(d.donor_name, ' ', 1) end as name,
       d.amount, d.kind, d.created_at
from donations d
left join cases c on c.id = d.case_id
where d.status = 'captured' and (d.case_id is null or is_public_status(c.status))
order by d.created_at desc
limit 200;

grant select on case_totals, pool_stats, recent_supporters to anon, authenticated;

-- =============================================================
-- Row Level Security
-- (Payments & webhooks write with the service-role key, which bypasses RLS)
-- =============================================================
alter table profiles       enable row level security;
alter table hospitals      enable row level security;
alter table cases          enable row level security;
alter table case_documents enable row level security;
alter table verifications  enable row level security;
alter table subscriptions  enable row level security;
alter table donations      enable row level security;
alter table allocations    enable row level security;
alter table payouts        enable row level security;
alter table case_updates   enable row level security;

-- profiles
create policy "own profile read"   on profiles for select using (id = auth.uid() or is_staff());
create policy "own profile update" on profiles for update using (id = auth.uid()) with check (role = my_role());
create policy "admin manage profiles" on profiles for all using (is_admin()) with check (is_admin());

-- hospitals
create policy "hospitals public read" on hospitals for select using (true);
create policy "hospitals admin write" on hospitals for all using (is_admin()) with check (is_admin());

-- cases
create policy "cases read" on cases for select
  using (is_public_status(status) or created_by = auth.uid() or is_staff());
create policy "family submits case" on cases for insert to authenticated
  with check (created_by = auth.uid() and status = 'submitted');
create policy "admin updates cases" on cases for update using (is_admin()) with check (is_admin());

-- case documents
create policy "docs read" on case_documents for select using (
  is_staff()
  or exists (select 1 from cases c where c.id = case_id and c.created_by = auth.uid())
  or (is_public and exists (select 1 from cases c where c.id = case_id and is_public_status(c.status)))
);
create policy "docs upload" on case_documents for insert to authenticated with check (
  uploaded_by = auth.uid() and (
    is_staff() or exists (select 1 from cases c where c.id = case_id and c.created_by = auth.uid())
  )
);
create policy "docs admin manage" on case_documents for update using (is_admin()) with check (is_admin());

-- verifications: ASHA can only record their own decision, on a case assigned to them
create policy "verifications staff read" on verifications for select using (is_staff());
create policy "asha verifies" on verifications for insert to authenticated with check (
  asha_id = auth.uid() and my_role() = 'asha'
  and exists (select 1 from cases c where c.id = case_id and auth.uid() = any (c.assigned_asha_ids))
);

-- money tables: admin read only from the client
create policy "subs admin read"      on subscriptions for select using (is_admin());
create policy "donations admin read" on donations     for select using (is_admin());

-- allocations: admin only
create policy "allocations admin" on allocations for all using (is_admin()) with check (is_admin());

-- payouts & updates: public read (transparency), admin write
create policy "payouts public read" on payouts for select using (
  exists (select 1 from cases c where c.id = case_id and is_public_status(c.status)) or is_admin());
create policy "payouts admin write" on payouts for insert with check (is_admin());

create policy "updates public read" on case_updates for select using (
  exists (select 1 from cases c where c.id = case_id and is_public_status(c.status)) or is_staff());
create policy "updates admin write" on case_updates for insert with check (is_admin());

-- =============================================================
-- Storage buckets
--   case-public  : cover photos, consented photos, payout proofs (public URLs)
--   case-private : ID proofs, income certificates, estimates (staff only)
-- =============================================================
insert into storage.buckets (id, name, public) values
  ('case-public', 'case-public', true),
  ('case-private', 'case-private', false)
on conflict (id) do nothing;

create policy "public bucket read"   on storage.objects for select using (bucket_id = 'case-public');
create policy "auth upload public"   on storage.objects for insert to authenticated with check (bucket_id = 'case-public');
create policy "auth upload private"  on storage.objects for insert to authenticated with check (bucket_id = 'case-private');
create policy "staff read private"   on storage.objects for select using (
  bucket_id = 'case-private' and (is_staff() or owner = auth.uid()));
