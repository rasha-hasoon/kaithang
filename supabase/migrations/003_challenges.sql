-- Run once in Supabase → SQL Editor. Food challenges (biryani, payasam, cake...) run by palliative units.
create table if not exists challenges (
  id          uuid primary key default gen_random_uuid(),
  unit_id     uuid not null references units(id) on delete cascade,
  slug        text unique not null,
  title       text not null,
  item        text not null,
  unit_label  text not null default 'plate',
  price       int  not null check (price > 0),
  target_qty  int  not null default 500,
  last_date   date,
  regions     text[] not null default '{}',
  upi_id      text,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists challenge_orders (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  name         text not null,
  phone        text,
  region       text,
  qty          int  not null check (qty > 0),
  amount       int  not null,
  method       text not null default 'upi',      -- upi | cash
  status       text not null default 'paid',     -- paid | pending
  utr          text,
  created_at   timestamptz not null default now()
);
create index if not exists challenge_orders_ch on challenge_orders (challenge_id, created_at desc);

alter table challenges enable row level security;
alter table challenge_orders enable row level security;
drop policy if exists "challenges public read" on challenges;
create policy "challenges public read" on challenges for select using (true);
-- orders: server only (names + phone numbers)

-- ---------- Sample challenge for the demo ----------
delete from challenges where slug = 'mukkam-biryani-challenge';
insert into challenges (id, unit_id, slug, title, item, unit_label, price, target_qty, last_date, regions, upi_id, description)
values ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'mukkam-biryani-challenge',
  'Mukkam Biryani Challenge 2026', 'Chicken biryani', 'packet', 150, 2000, current_date + 6,
  array['Ward 1 Agastyanmuzhi', 'Ward 4 Manassery', 'Ward 7 Mukkam Town', 'Ward 9 Kariyakulangara', 'Ward 12 Neeleswaram'],
  'samhari.demo@upi', 'Every packet you book funds home care for bedridden patients in Mukkam. Delivery on Sunday afternoon.');

insert into challenge_orders (challenge_id, name, phone, region, qty, amount, method, status, utr, created_at)
select 'c0000000-0000-0000-0000-000000000001',
  (array['Arjun','Meera','Anu','Fahad','Nikhil','Sneha','Jithin','Aswathy','Rahim','Divya','Joel','Shabna','Vishnu','Ameena','Basil','Fathima'])[1 + floor(random()*16)::int]
    || ' ' || (array['K','M','P','R','S','T','V','N'])[1 + floor(random()*8)::int],
  '9' || lpad((floor(random()*999999999))::text, 9, '0'),
  (array['Ward 1 Agastyanmuzhi', 'Ward 4 Manassery', 'Ward 7 Mukkam Town', 'Ward 9 Kariyakulangara', 'Ward 12 Neeleswaram'])[1 + floor(random()*5 + 0*g)::int],
  q.qty, q.qty * 150,
  case when random() < 0.8 then 'upi' else 'cash' end,
  case when random() < 0.9 then 'paid' else 'pending' end,
  null,
  now() - (random() * interval '5 days')
from generate_series(1, 260) g
cross join lateral (select (array[1,1,1,2,2,3,4,5,10])[1 + floor(random()*9 + 0*g)::int] as qty) q;
update challenge_orders set utr = 'DEMO' || substr(md5(id::text), 1, 10) where method = 'upi' and status = 'paid' and utr is null;
-- UPI orders are paid instantly; some cash orders are still to be collected
update challenge_orders set status = 'paid' where method = 'upi';
