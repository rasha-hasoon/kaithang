-- Run once in Supabase → SQL Editor. Stores why a donor cancelled.
alter table subscriptions add column if not exists cancel_reason text;
alter table subscriptions add column if not exists cancel_note text;
