-- Run once in Supabase → SQL Editor. Lets donors pause for a set time.
alter table subscriptions add column if not exists paused_until date;
alter table subscriptions add column if not exists pause_reason text;
