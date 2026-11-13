-- =============================================================
-- Kaithang — demo seed data (all people, hospitals and accounts are FICTIONAL)
-- Run AFTER schema.sql.  Re-runnable: wipes demo rows first.
-- =============================================================
truncate case_updates, payouts, allocations, donations, subscriptions,
         verifications, case_documents, cases, hospitals restart identity cascade;

select setseed(0.42);

-- ---------- Hospitals ----------
insert into hospitals (id, name, district, account_name, account_no_last4, ifsc) values
 ('11111111-0000-0000-0000-000000000001', 'Malabar Demo Medical Centre', 'Malappuram', 'MALABAR DEMO MEDICAL CENTRE', '4821', 'DEMO0001234'),
 ('11111111-0000-0000-0000-000000000002', 'Kottayam Demo Kidney Institute', 'Kottayam', 'KOTTAYAM DEMO KIDNEY INST', '7710', 'DEMO0005678'),
 ('11111111-0000-0000-0000-000000000003', 'Thrissur Demo Mother & Child Hospital', 'Thrissur', 'THRISSUR DEMO MCH', '3392', 'DEMO0009012'),
 ('11111111-0000-0000-0000-000000000004', 'Alappuzha Demo Cancer Care', 'Alappuzha', 'ALAPPUZHA DEMO CANCER CARE', '1189', 'DEMO0003456'),
 ('11111111-0000-0000-0000-000000000005', 'Kozhikode Demo Trauma Centre', 'Kozhikode', 'KOZHIKODE DEMO TRAUMA', '6604', 'DEMO0007890');

-- ---------- Cases ----------
insert into cases (id, slug, patient_name, age, district, condition_en, condition_ml, title_en, title_ml,
                   story_en, story_ml, goal_amount, hospital_id, urgency, deadline, status, creator_name, published_at, created_at) values
('22222222-0000-0000-0000-000000000001', 'amina-heart-surgery', 'Amina', 14, 'Malappuram',
 'Atrial septal defect (hole in the heart)', 'ഹൃദയത്തിലെ ദ്വാരം (ASD)',
 '14-year-old Amina needs urgent heart surgery',
 '14 വയസ്സുള്ള ആമിനയ്ക്ക് അടിയന്തര ഹൃദയ ശസ്ത്രക്രിയ വേണം',
 'Amina, a Class 9 student from Malappuram, was born with a hole in her heart. She gets breathless climbing stairs and has missed months of school. Doctors say she needs ASD closure surgery within weeks. Her father is a daily-wage worker earning about ₹15,000 a month, and the family is not covered by any scheme that pays in time. Two ASHA workers visited the home and verified the family''s details. Every rupee goes directly to the hospital.',
 'മലപ്പുറം സ്വദേശിയായ ഒൻപതാം ക്ലാസ് വിദ്യാർത്ഥിനി ആമിനയ്ക്ക് ജന്മനാ ഹൃദയത്തിൽ ദ്വാരമുണ്ട്. പടികൾ കയറുമ്പോൾ ശ്വാസംമുട്ടുന്നു, മാസങ്ങളായി സ്കൂളിൽ പോകാനാവുന്നില്ല. ആഴ്ചകൾക്കുള്ളിൽ ശസ്ത്രക്രിയ നടത്തണമെന്ന് ഡോക്ടർമാർ പറയുന്നു. ദിവസക്കൂലിക്കാരനായ പിതാവിന് 4 ലക്ഷം രൂപ കണ്ടെത്താനാവുന്നില്ല. രണ്ട് ആശാ പ്രവർത്തകർ വീട് സന്ദർശിച്ച് വിവരങ്ങൾ സ്ഥിരീകരിച്ചിട്ടുണ്ട്. തുക മുഴുവൻ നേരിട്ട് ആശുപത്രിയിലേക്കാണ് പോകുന്നത്.',
 400000, '11111111-0000-0000-0000-000000000001', 3, current_date + 14, 'live', 'Ignite Foundation', now() - interval '6 days', now() - interval '9 days'),

('22222222-0000-0000-0000-000000000002', 'rahul-kidney-transplant', 'Rahul', 32, 'Kottayam',
 'End-stage kidney failure', 'വൃക്ക തകരാർ',
 'Auto driver Rahul needs a kidney transplant',
 'ഓട്ടോ ഡ്രൈവറായ രാഹുലിന് വൃക്ക മാറ്റിവയ്ക്കൽ ശസ്ത്രക്രിയ',
 'Rahul, 32, drives an auto-rickshaw in Kottayam and supports his wife and two children. Both his kidneys have failed and he is on dialysis three times a week. His mother is ready to donate a kidney, but the transplant costs ₹8 lakh. The family has already sold their gold to pay for dialysis.',
 'കോട്ടയത്ത് ഓട്ടോ ഓടിക്കുന്ന 32 വയസ്സുള്ള രാഹുലിന്റെ രണ്ട് വൃക്കകളും തകരാറിലാണ്. ആഴ്ചയിൽ മൂന്ന് തവണ ഡയാലിസിസ് ചെയ്യുന്നു. അമ്മ വൃക്ക നൽകാൻ തയ്യാറാണ്, പക്ഷേ ശസ്ത്രക്രിയയ്ക്ക് 8 ലക്ഷം രൂപ വേണം. ഡയാലിസിസിനായി കുടുംബം ഇതിനകം സ്വർണം വിറ്റുകഴിഞ്ഞു.',
 800000, '11111111-0000-0000-0000-000000000002', 2, current_date + 30, 'live', 'Ignite Foundation', now() - interval '3 days', now() - interval '7 days'),

('22222222-0000-0000-0000-000000000003', 'baby-of-sreeja-nicu', 'Baby of Sreeja', 0, 'Thrissur',
 'Premature birth — NICU care', 'മാസം തികയാതെയുള്ള ജനനം — NICU ചികിത്സ',
 'Newborn needed 3 weeks of NICU care',
 'നവജാത ശിശുവിന് മൂന്നാഴ്ചത്തെ NICU ചികിത്സ',
 'Born at 29 weeks in Thrissur, Sreeja''s baby needed three weeks in the NICU. The Kaithang pool funded the full amount within 48 hours of verification, paid directly to the hospital. Mother and baby are now home.',
 'തൃശ്ശൂരിൽ 29-ാം ആഴ്ചയിൽ ജനിച്ച ശ്രീജയുടെ കുഞ്ഞിന് മൂന്നാഴ്ച NICU ചികിത്സ ആവശ്യമായിരുന്നു. സ്ഥിരീകരണം കഴിഞ്ഞ് 48 മണിക്കൂറിനുള്ളിൽ കൈത്താങ്ങ് പൂളിൽ നിന്ന് മുഴുവൻ തുകയും നേരിട്ട് ആശുപത്രിയിലേക്ക് നൽകി. അമ്മയും കുഞ്ഞും ഇപ്പോൾ വീട്ടിലാണ്.',
 250000, '11111111-0000-0000-0000-000000000003', 3, current_date - 10, 'paid', 'Ignite Foundation', now() - interval '20 days', now() - interval '22 days'),

('22222222-0000-0000-0000-000000000004', 'joseph-chemotherapy', 'Joseph', 58, 'Alappuzha',
 'Colon cancer — chemotherapy', 'വൻകുടൽ കാൻസർ — കീമോതെറാപ്പി',
 'Fisherman Joseph needs 6 cycles of chemotherapy',
 'മത്സ്യത്തൊഴിലാളിയായ ജോസഫിന് കീമോതെറാപ്പി',
 'Joseph, 58, is a fisherman from Alappuzha. He has been diagnosed with colon cancer and needs six cycles of chemotherapy after surgery.',
 'ആലപ്പുഴയിലെ മത്സ്യത്തൊഴിലാളിയായ ജോസഫിന് (58) വൻകുടൽ കാൻസർ സ്ഥിരീകരിച്ചു. ശസ്ത്രക്രിയയ്ക്ക് ശേഷം ആറ് ഘട്ട കീമോതെറാപ്പി ആവശ്യമാണ്.',
 300000, '11111111-0000-0000-0000-000000000004', 2, current_date + 21, 'submitted', 'Mary Joseph (wife)', null, now() - interval '1 day'),

('22222222-0000-0000-0000-000000000005', 'fathima-accident-surgery', 'Fathima', 22, 'Kozhikode',
 'Compound leg fracture after road accident', 'റോഡപകടത്തിൽ കാലിന് ഗുരുതര ഒടിവ്',
 'Fathima needs surgery after a road accident',
 'അപകടത്തിൽ പരിക്കേറ്റ ഫാത്തിമയ്ക്ക് ശസ്ത്രക്രിയ',
 'Fathima, 22, a nursing student from Kozhikode, suffered a compound fracture of her leg in a road accident and needs surgery with an implant.',
 'കോഴിക്കോട് സ്വദേശിയായ നഴ്സിംഗ് വിദ്യാർത്ഥിനി ഫാത്തിമയ്ക്ക് (22) റോഡപകടത്തിൽ കാലിന് ഗുരുതര ഒടിവ് സംഭവിച്ചു. ഇംപ്ലാന്റോടു കൂടിയ ശസ്ത്രക്രിയ ആവശ്യമാണ്.',
 180000, '11111111-0000-0000-0000-000000000005', 3, current_date + 7, 'submitted', 'Abdul Rasheed (father)', null, now() - interval '5 hours');

-- ---------- Documents (labels only; files are added later via the app) ----------
insert into case_documents (case_id, type, path, label, is_public) values
 ('22222222-0000-0000-0000-000000000001', 'medical_estimate', 'demo/amina-estimate.pdf', 'Hospital cost estimate — ₹4,00,000', true),
 ('22222222-0000-0000-0000-000000000001', 'income_cert',      'demo/amina-income.pdf',   'Income certificate (Village Office)', false),
 ('22222222-0000-0000-0000-000000000001', 'id_proof',         'demo/amina-id.pdf',       'Father''s Aadhaar (masked)', false),
 ('22222222-0000-0000-0000-000000000002', 'medical_estimate', 'demo/rahul-estimate.pdf', 'Transplant estimate — ₹8,00,000', true),
 ('22222222-0000-0000-0000-000000000003', 'medical_estimate', 'demo/sreeja-estimate.pdf','NICU estimate — ₹2,50,000', true);

-- ---------- Pool subscribers (~1,200) ----------
insert into subscriptions (donor_name, phone, amount, interval, status, created_at)
select (array['Arjun','Meera','Anu','Fahad','Nikhil','Sneha','Jithin','Aswathy','Rahim','Divya','Joel','Shabna','Vishnu','Neha','Akhil','Ameena'])[1 + floor(random()*16)::int]
         || ' ' || (array['K','M','P','R','S','T','V','N'])[1 + floor(random()*8)::int],
       '9' || lpad((floor(random()*999999999))::text, 9, '0'),
       (array[1,1,1,5,10,10,10,20,50,100])[1 + floor(random()*10)::int],
       (case when random() < 0.6 then 'weekly' else 'monthly' end)::sub_interval,
       'active',
       now() - (random() * interval '60 days')
from generate_series(1, 1200);

-- ---------- Pool income: subscription charges + one-off pool gifts (≈ ₹5.6 lakh) ----------
insert into donations (case_id, donor_name, phone, amount, kind, status, created_at, rzp_payment_id)
select null,
       s.donor_name, s.phone, s.amount * (1 + floor(random()*8)::int),   -- several weeks of charges
       'sub_charge', 'captured', now() - (random() * interval '45 days'),
       'pay_seed_sub_' || row_number() over ()
from subscriptions s;

insert into donations (case_id, donor_name, phone, amount, kind, status, created_at, rzp_payment_id)
select null, 'Well-wisher', null, (array[100,250,500,1000,2000,5000])[1 + floor(random()*6)::int],
       'one_time', 'captured', now() - (random() * interval '45 days'), 'pay_seed_pool_' || g
from generate_series(1, 500) g;

-- ---------- Direct gifts to live cases ----------
insert into donations (case_id, donor_name, phone, amount, kind, status, created_at, rzp_payment_id, is_anonymous)
select '22222222-0000-0000-0000-000000000001',
       (array['Arjun','Meera','Anu','Fahad','Nikhil','Sneha','Jithin','Aswathy','Rahim','Divya'])[1 + floor(random()*10)::int] || ' ' || (array['K','M','P','R','S'])[1 + floor(random()*5)::int],
       null, (array[10,50,100,100,200,500,500,1000,2000])[1 + floor(random()*9)::int],
       'one_time', 'captured', now() - (random() * interval '6 days'), 'pay_seed_amina_' || g, random() < 0.15
from generate_series(1, 260) g;

insert into donations (case_id, donor_name, phone, amount, kind, status, created_at, rzp_payment_id, is_anonymous)
select '22222222-0000-0000-0000-000000000002',
       (array['Joel','Shabna','Vishnu','Neha','Akhil','Ameena','Tom','Reshma'])[1 + floor(random()*8)::int] || ' ' || (array['K','M','P','R','S'])[1 + floor(random()*5)::int],
       null, (array[50,100,200,500,1000,2000,5000])[1 + floor(random()*7)::int],
       'one_time', 'captured', now() - (random() * interval '3 days'), 'pay_seed_rahul_' || g, random() < 0.15
from generate_series(1, 180) g;

-- ---------- Committee allocations from the pool ----------
insert into allocations (case_id, amount, note, created_at) values
 ('22222222-0000-0000-0000-000000000003', 250000, 'Full NICU cost from pool — urgent', now() - interval '19 days'),
 ('22222222-0000-0000-0000-000000000001', 150000, 'Pool allocation — week 1',         now() - interval '5 days'),
 ('22222222-0000-0000-0000-000000000002', 100000, 'Pool allocation — week 1',         now() - interval '2 days');

-- ---------- Payout to hospital (public proof) ----------
insert into payouts (case_id, hospital_id, amount, utr_ref, paid_at) values
 ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003', 250000, 'DEMOUTR2026110100123', now() - interval '18 days');

-- ---------- Updates ----------
insert into case_updates (case_id, body_en, body_ml, created_at) values
 ('22222222-0000-0000-0000-000000000001', 'Verified by two ASHA workers after a home visit. Case is now live.', 'രണ്ട് ആശാ പ്രവർത്തകർ വീട് സന്ദർശിച്ച് സ്ഥിരീകരിച്ചു. കേസ് ഇപ്പോൾ ലൈവ് ആണ്.', now() - interval '6 days'),
 ('22222222-0000-0000-0000-000000000001', '₹1,50,000 allocated from the Kaithang pool. Surgery date fixed.', 'കൈത്താങ്ങ് പൂളിൽ നിന്ന് ₹1,50,000 അനുവദിച്ചു. ശസ്ത്രക്രിയ തീയതി നിശ്ചയിച്ചു.', now() - interval '5 days'),
 ('22222222-0000-0000-0000-000000000003', '₹2,50,000 paid directly to the hospital. Baby discharged and healthy.', '₹2,50,000 നേരിട്ട് ആശുപത്രിയിലേക്ക് നൽകി. കുഞ്ഞ് ആരോഗ്യത്തോടെ വീട്ടിലെത്തി.', now() - interval '12 days');

-- =============================================================
-- STAFF ACCOUNTS — do this after creating the 3 users in
-- Supabase → Authentication → Users → "Add user" (auto-confirm):
--   admin@kaithang.demo · asha1@kaithang.demo · asha2@kaithang.demo
-- then run the block below.
-- =============================================================
-- update profiles set role = 'admin', name = 'Ignite Committee'            where email = 'admin@kaithang.demo';
-- update profiles set role = 'asha',  name = 'Sumathi K', district = 'Kozhikode' where email = 'asha1@kaithang.demo';
-- update profiles set role = 'asha',  name = 'Rejina P',  district = 'Kozhikode' where email = 'asha2@kaithang.demo';
-- update cases set assigned_asha_ids = array(select id from profiles where role = 'asha')
--   where status in ('submitted', 'under_verification');

-- Quick check
select * from pool_stats;
select c.slug, c.status, t.total_raised, c.goal_amount from cases c left join case_totals t on t.case_id = c.id order by c.created_at;
