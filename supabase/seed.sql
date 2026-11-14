-- =============================================================
-- Samhari v2, SAMPLE data for the demo (units, people and money are fictional)
-- Run AFTER schema.sql. Re-runnable.
-- =============================================================
truncate report_items, reports, disbursements, contributions, subscriptions, donors, unit_needs;
delete from units;  -- (delete, not truncate, so staff profiles survive a re-seed)
select setseed(0.27);

-- ---------- Units ----------
insert into units (id, slug, name, name_ml, kind, district, panchayat, about_en, about_ml, phone,
                   patients_registered, home_visits_month, nurses, volunteers,
                   bank_account_name, bank_account_last4, ifsc, status, is_sample, approved_at, created_at) values
('a0000000-0000-0000-0000-000000000001', 'mukkam-community-palliative', 'Mukkam Community Palliative Care', 'മുക്കം കമ്മ്യൂണിറ്റി പാലിയേറ്റീവ് കെയർ',
 'community', 'Kozhikode', 'Mukkam Municipality',
 'A volunteer-run home care unit serving bedridden patients across Mukkam. Nurses and trained volunteers visit every patient at least twice a month, bring medicines and consumables, and support families with food kits.',
 'മുക്കത്തെ കിടപ്പുരോഗികൾക്കായി സന്നദ്ധപ്രവർത്തകർ നടത്തുന്ന ഹോം കെയർ യൂണിറ്റ്. നഴ്സുമാരും പരിശീലനം ലഭിച്ച വളണ്ടിയർമാരും എല്ലാ രോഗികളെയും മാസത്തിൽ രണ്ടുതവണയെങ്കിലും സന്ദർശിച്ച് മരുന്നും അവശ്യവസ്തുക്കളും എത്തിക്കുന്നു.',
 '+91 90000 00001', 186, 420, 4, 65, 'MUKKAM COMMUNITY PALLIATIVE', '3381', 'DEMO0000101', 'approved', true, now() - interval '200 days', now() - interval '210 days'),
('a0000000-0000-0000-0000-000000000002', 'kodiyathur-home-care', 'Kodiyathur Panchayat Palliative Home Care', 'കൊടിയത്തൂർ പഞ്ചായത്ത് പാലിയേറ്റീവ് ഹോം കെയർ',
 'government', 'Kozhikode', 'Kodiyathur',
 'The panchayat''s primary palliative unit, attached to the Family Health Centre. A nurse-led team visits bedridden and elderly patients, supported by ASHA workers and local volunteers.',
 'കുടുംബാരോഗ്യ കേന്ദ്രത്തോട് ചേർന്ന പഞ്ചായത്തിന്റെ പ്രാഥമിക പാലിയേറ്റീവ് യൂണിറ്റ്. ആശാ പ്രവർത്തകരുടെയും വളണ്ടിയർമാരുടെയും സഹായത്തോടെ നഴ്സിന്റെ നേതൃത്വത്തിലുള്ള സംഘം വീടുകൾ സന്ദർശിക്കുന്നു.',
 '+91 90000 00002', 142, 300, 2, 40, 'KODIYATHUR PALLIATIVE UNIT', '5520', 'DEMO0000102', 'approved', true, now() - interval '190 days', now() - interval '195 days'),
('a0000000-0000-0000-0000-000000000003', 'karassery-snehasparsham', 'Snehasparsham Palliative Centre, Karassery', 'സ്നേഹസ്പർശം പാലിയേറ്റീവ് സെന്റർ, കാരശ്ശേരി',
 'private', 'Kozhikode', 'Karassery',
 'A small private centre with an outpatient clinic and a home care van. Focuses on cancer patients and people with spinal injuries.',
 'ഔട്ട്‌പേഷ്യന്റ് ക്ലിനിക്കും ഹോം കെയർ വാനുമുള്ള ചെറിയ സ്വകാര്യ കേന്ദ്രം. കാൻസർ രോഗികൾക്കും നട്ടെല്ലിന് പരിക്കേറ്റവർക്കും പ്രത്യേക ശ്രദ്ധ.',
 '+91 90000 00003', 98, 210, 3, 28, 'SNEHASPARSHAM PALLIATIVE', '7714', 'DEMO0000103', 'approved', true, now() - interval '170 days', now() - interval '175 days'),
('a0000000-0000-0000-0000-000000000004', 'thamarassery-pain-palliative', 'Thamarassery Pain & Palliative Clinic', 'താമരശ്ശേരി പെയിൻ & പാലിയേറ്റീവ് ക്ലിനിക്',
 'community', 'Kozhikode', 'Thamarassery',
 'One of the larger community clinics in the region, running a daily OP clinic, two home care teams and a medical equipment lending library.',
 'ദിവസേനയുള്ള ഒപി ക്ലിനിക്, രണ്ട് ഹോം കെയർ ടീമുകൾ, മെഡിക്കൽ ഉപകരണങ്ങൾ വായ്പ നൽകുന്ന ലൈബ്രറി എന്നിവയുള്ള പ്രദേശത്തെ വലിയ കമ്മ്യൂണിറ്റി ക്ലിനിക്കുകളിലൊന്ന്.',
 '+91 90000 00004', 230, 510, 5, 90, 'THAMARASSERY PAIN PALLIATIVE', '2096', 'DEMO0000104', 'approved', true, now() - interval '185 days', now() - interval '190 days'),
('a0000000-0000-0000-0000-000000000005', 'kondotty-neighbourhood', 'Kondotty Neighbourhood Palliative Network', 'കൊണ്ടോട്ടി നെയ്ബർഹുഡ് പാലിയേറ്റീവ് നെറ്റ്‌വർക്ക്',
 'community', 'Malappuram', 'Kondotty',
 'A neighbourhood network of trained volunteers in every ward, backed by two nurses and a visiting doctor every week.',
 'എല്ലാ വാർഡിലും പരിശീലനം ലഭിച്ച വളണ്ടിയർമാരുടെ ശൃംഖല; രണ്ട് നഴ്സുമാരും ആഴ്ചതോറും സന്ദർശിക്കുന്ന ഡോക്ടറും പിന്തുണയ്ക്കുന്നു.',
 '+91 90000 00005', 175, 390, 4, 72, 'KONDOTTY NEIGHBOURHOOD PALLIATIVE', '4458', 'DEMO0000105', 'approved', true, now() - interval '160 days', now() - interval '165 days'),
('a0000000-0000-0000-0000-000000000006', 'omassery-palliative-society', 'Omassery Palliative Care Society', 'ഓമശ്ശേരി പാലിയേറ്റീവ് കെയർ സൊസൈറ്റി',
 'private', 'Kozhikode', 'Omassery',
 'Newly applied unit awaiting verification.', 'പുതുതായി അപേക്ഷിച്ച യൂണിറ്റ്. പരിശോധന കാത്തിരിക്കുന്നു.',
 '+91 90000 00006', 64, 120, 1, 20, 'OMASSERY PALLIATIVE SOCIETY', '9902', 'DEMO0000106', 'pending', true, null, now() - interval '1 day');

-- ---------- More sample units: at least 2 in every district ----------
insert into units (slug, name, kind, district, panchayat, about_en, about_ml, phone,
                   patients_registered, home_visits_month, nurses, volunteers,
                   bank_account_name, bank_account_last4, ifsc, status, is_sample, approved_at, created_at)
select lower(regexp_replace(v.name, '[^A-Za-z0-9]+', '-', 'g')), v.name, v.kind::unit_kind, v.district, v.place,
       'A palliative home care unit serving bedridden and elderly patients in and around ' || v.place || '. Nurses and trained volunteers visit patients at home, bring medicines and consumables, and support families.',
       v.place || ' പ്രദേശത്തെ കിടപ്പുരോഗികൾക്കും വയോജനങ്ങൾക്കും വീടുകളിൽ പരിചരണം നൽകുന്ന പാലിയേറ്റീവ് യൂണിറ്റ്. നഴ്സുമാരും വളണ്ടിയർമാരും വീടുകൾ സന്ദർശിച്ച് മരുന്നും അവശ്യവസ്തുക്കളും എത്തിക്കുന്നു.',
       '+91 90000 0' || lpad(row_number() over ()::text, 4, '0'),
       60 + floor(random()*180)::int, 120 + floor(random()*380)::int, 1 + floor(random()*4)::int, 15 + floor(random()*70)::int,
       upper(v.name), lpad(floor(random()*9999)::text, 4, '0'), 'DEMO0000' || lpad(row_number() over ()::text, 3, '0'),
       'approved', true, now() - interval '200 days', now() - interval '205 days'
from (values
  ('Neyyattinkara Home Care Palliative Unit', 'government', 'Thiruvananthapuram', 'Neyyattinkara'),
  ('Attingal Community Palliative Society', 'community', 'Thiruvananthapuram', 'Attingal'),
  ('Karunagappally Pain & Palliative Clinic', 'community', 'Kollam', 'Karunagappally'),
  ('Punalur Panchayat Palliative Home Care', 'government', 'Kollam', 'Punalur'),
  ('Adoor Palliative Home Care', 'government', 'Pathanamthitta', 'Adoor'),
  ('Ranni Karuna Palliative Unit', 'private', 'Pathanamthitta', 'Ranni'),
  ('Cherthala Pain & Palliative Society', 'community', 'Alappuzha', 'Cherthala'),
  ('Haripad Community Home Care', 'community', 'Alappuzha', 'Haripad'),
  ('Pala Palliative Care Centre', 'private', 'Kottayam', 'Pala'),
  ('Changanassery Home Care Palliative', 'government', 'Kottayam', 'Changanassery'),
  ('Thodupuzha Palliative Care Society', 'community', 'Idukki', 'Thodupuzha'),
  ('Kattappana High Range Palliative Unit', 'community', 'Idukki', 'Kattappana'),
  ('Aluva Pain & Palliative Clinic', 'community', 'Ernakulam', 'Aluva'),
  ('Perumbavoor Panchayat Palliative Care', 'government', 'Ernakulam', 'Perumbavoor'),
  ('Chalakudy Palliative Home Care', 'government', 'Thrissur', 'Chalakudy'),
  ('Kodungallur Karunya Palliative Society', 'private', 'Thrissur', 'Kodungallur'),
  ('Ottapalam Pain & Palliative Clinic', 'community', 'Palakkad', 'Ottapalam'),
  ('Mannarkkad Community Palliative Care', 'community', 'Palakkad', 'Mannarkkad'),
  ('Tirur Palliative Home Care', 'government', 'Malappuram', 'Tirur'),
  ('Mananthavady Palliative Care Society', 'community', 'Wayanad', 'Mananthavady'),
  ('Sulthan Bathery Home Care Unit', 'government', 'Wayanad', 'Sulthan Bathery'),
  ('Thalassery Pain & Palliative Clinic', 'community', 'Kannur', 'Thalassery'),
  ('Payyanur Community Palliative Care', 'private', 'Kannur', 'Payyanur'),
  ('Kanhangad Palliative Home Care', 'government', 'Kasaragod', 'Kanhangad'),
  ('Nileshwar Community Palliative Unit', 'community', 'Kasaragod', 'Nileshwar')
) as v(name, kind, district, place);

-- ---------- Current needs ----------
insert into unit_needs (unit_id, title_en, title_ml, category, qty_needed, qty_fulfilled, cost_per_item)
select u.id, n.t_en, n.t_ml, n.cat::spend_category, n.need + floor(random()*4)::int, floor(random()*n.need)::int, n.cost
from units u
cross join (values
  ('Water beds for bedridden patients', 'കിടപ്പുരോഗികൾക്ക് വാട്ടർ ബെഡ്', 'equipment', 6, 4500),
  ('Wheelchairs', 'വീൽചെയറുകൾ', 'equipment', 3, 7000),
  ('Adult diaper packs (monthly)', 'മുതിർന്നവർക്കുള്ള ഡയപ്പർ പാക്കുകൾ (പ്രതിമാസം)', 'consumables', 40, 450),
  ('Monthly food kits for families', 'കുടുംബങ്ങൾക്ക് പ്രതിമാസ ഭക്ഷ്യകിറ്റ്', 'family_support', 25, 1200),
  ('Oxygen concentrator', 'ഓക്സിജൻ കോൺസെൻട്രേറ്റർ', 'equipment', 1, 45000)
) as n(t_en, t_ml, cat, need, cost)
where u.status = 'approved';

-- ---------- Donors (≈2,400) + one demo donor you can log in as: 9999999999 / OTP 123456 ----------
insert into donors (phone, name, district, show_name, created_at)
select '9' || lpad((floor(random()*999999999))::text, 9, '0'),
       (array['Arjun','Meera','Anu','Fahad','Nikhil','Sneha','Jithin','Aswathy','Rahim','Divya','Joel','Shabna','Vishnu','Neha','Akhil','Ameena','Hrishikesh','Fathima','Sreelakshmi','Basil'])[1 + floor(random()*20)::int]
         || ' ' || (array['K','M','P','R','S','T','V','N'])[1 + floor(random()*8)::int],
       (array['Kozhikode','Kozhikode','Kozhikode','Malappuram','Malappuram','Ernakulam','Thrissur','Kannur','Dubai','Bengaluru'])[1 + floor(random()*10)::int],
       random() > 0.2,
       now() - interval '200 days'
from generate_series(1, 4000)
on conflict (phone) do nothing;

insert into donors (id, phone, name, district, created_at)
values ('d0000000-0000-0000-0000-000000000001', '9999999999', 'Demo Donor', 'Kozhikode', now() - interval '150 days');

-- ---------- Subscriptions (~3,200) ----------
insert into subscriptions (donor_id, unit_id, weekly_amount, frequency, charge_amount, status, started_at)
select d.id, u.id, w.weekly, f.freq, charge_for(w.weekly, f.freq),
       (case when random() < 0.92 then 'active' else 'cancelled' end)::sub_status,
       now() - (random() * interval '205 days')
from donors d
cross join lateral (select id from units where status = 'approved' order by random() + 0 * length(d.id::text) limit (1 + (random() < 0.35)::int)) u
cross join lateral (select (array[3,3,3,3,5,5,10,10,20,50])[1 + floor(random()*10 + 0*length(d.id::text))::int] as weekly) w
cross join lateral (select (case when random() + 0*length(d.id::text) < 0.75 then 'monthly' when random() < 0.7 then 'quarterly' else 'yearly' end)::sub_frequency as freq) f
where d.phone <> '9999999999';

insert into subscriptions (donor_id, unit_id, weekly_amount, frequency, charge_amount, status, started_at) values
 ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 3,  'monthly',   13, 'active', now() - interval '150 days'),
 ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 10, 'quarterly', 130, 'active', now() - interval '120 days');

update subscriptions set next_charge_on = (
  started_at + (case frequency when 'monthly' then interval '1 month' when 'quarterly' then interval '3 months' else interval '1 year' end)
    * (floor(extract(epoch from now() - started_at) /
             extract(epoch from case frequency when 'monthly' then interval '30 days' when 'quarterly' then interval '91 days' else interval '365 days' end)) + 1)
)::date
where status = 'active';
update subscriptions set cancelled_at = least(started_at + interval '40 days', now() - interval '1 day') where status = 'cancelled';

-- ---------- Contribution history (one row per successful debit) ----------
insert into contributions (donor_id, unit_id, subscription_id, amount, status, charged_at, rzp_payment_id)
select s.donor_id, s.unit_id, s.id, s.charge_amount, 'captured', g.t,
       'pay_sample_' || substr(md5(s.id::text || g.t::text), 1, 14)
from subscriptions s
cross join lateral generate_series(
  s.started_at,
  least(coalesce(s.cancelled_at, now()), now()),
  case s.frequency when 'monthly' then interval '1 month' when 'quarterly' then interval '3 months' else interval '1 year' end
) as g(t);

-- ---------- Monthly transfers: central account → unit (all months except the current one) ----------
insert into disbursements (unit_id, amount, period_label, utr_ref, paid_at)
select c.unit_id, sum(c.amount)::int, to_char(date_trunc('month', c.charged_at), 'FMMonth YYYY'),
       'DEMOUTR' || to_char(date_trunc('month', c.charged_at), 'YYYYMM') || substr(c.unit_id::text, 34, 3),
       date_trunc('month', c.charged_at) + interval '1 month 4 days'
from contributions c
where c.charged_at < date_trunc('month', now())
group by c.unit_id, date_trunc('month', c.charged_at);

-- ---------- Quarterly reports: Apr-Jun and Jul-Sep 2026 ----------
insert into reports (unit_id, period_label, period_start, period_end, patients_served, home_visits, summary_en, summary_ml, status, submitted_at, approved_at)
select u.id, q.label, q.s, q.e,
       round(u.patients_registered * (0.85 + random()*0.1))::int,
       u.home_visits_month * 3,
       'Funds from Samhari supporters covered medicines, consumables and home visits for our registered patients this quarter. Receipts for every purchase are attached.',
       'ഈ പാദത്തിൽ സംഹാരി പിന്തുണക്കാരിൽ നിന്നുള്ള തുക രജിസ്റ്റർ ചെയ്ത രോഗികളുടെ മരുന്നുകൾക്കും അവശ്യവസ്തുക്കൾക്കും ഗൃഹസന്ദർശനങ്ങൾക്കും ഉപയോഗിച്ചു. എല്ലാ വാങ്ങലുകളുടെയും രസീതുകൾ ചേർത്തിട്ടുണ്ട്.',
       case when q.label = 'Jul-Sep 2026' and u.slug = 'karassery-snehasparsham' then 'submitted' else 'approved' end::report_status,
       q.e + interval '12 days',
       case when q.label = 'Jul-Sep 2026' and u.slug = 'karassery-snehasparsham' then null else q.e + interval '18 days' end
from units u
cross join (values ('Apr-Jun 2026', date '2026-04-01', date '2026-06-30'),
                   ('Jul-Sep 2026', date '2026-07-01', date '2026-09-30')) as q(label, s, e)
where u.status = 'approved';

-- Line items ≈ 92% of what was transferred in that quarter, split by category
insert into report_items (report_id, category, description, amount, receipt_url)
select r.id, c.cat::spend_category, c.descr, greatest(1, round(t.total * 0.92 * c.share))::int, null
from reports r
join lateral (select coalesce(sum(d.amount), 0) total from disbursements d
              where d.unit_id = r.unit_id and d.paid_at::date between r.period_start and r.period_end + 10) t on true
cross join (values
  ('medicines_pain_relief', 'Morphine tablets and other pain-relief medicines', 0.30),
  ('home_care_visits',      'Home care vehicle hire and fuel for nurse visits', 0.25),
  ('consumables',           'Adult diapers, dressings, catheters and feeding tubes', 0.20),
  ('equipment',             'Water beds and wheelchair repairs', 0.12),
  ('family_support',        'Monthly food kits for patient families', 0.09),
  ('training_admin',        'Volunteer training session and phone recharge', 0.04)
) as c(cat, descr, share)
where t.total > 0;

-- Quick check
select * from platform_stats;
select u.name, s.supporters, s.monthly_committed, s.total_received, s.total_disbursed, s.total_spent
from units u join unit_stats s on s.unit_id = u.id order by s.total_received desc;

-- =============================================================
-- STAFF ACCOUNTS (run as a separate query, after creating these users in
-- Authentication → Users → Add user, with Auto Confirm ticked):
--   admin@kaithang.demo  , platform admin (Ignite committee)
--   unit@kaithang.demo   , coordinator of Mukkam Community Palliative Care
-- =============================================================
-- insert into profiles (id, email, name) select id, email, split_part(email, '@', 1) from auth.users on conflict (id) do nothing;
-- update profiles set role = 'admin', name = 'Ignite Committee' where email = 'admin@kaithang.demo';
-- update profiles set role = 'unit', name = 'Mukkam Unit Coordinator', unit_id = 'a0000000-0000-0000-0000-000000000001' where email = 'unit@kaithang.demo';
-- select email, role, unit_id from profiles;
