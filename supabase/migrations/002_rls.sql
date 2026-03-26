-- Enable RLS on both tables
alter table offerings enable row level security;
alter table pulse enable row level security;

-- offerings: anyone can read, only service_role can write
create policy "offerings_public_read"
  on offerings for select
  to anon, authenticated
  using (true);

-- pulse: anyone can insert, anyone can read visible posts only
create policy "pulse_public_insert"
  on pulse for insert
  to anon, authenticated
  with check (status = 'visible');

create policy "pulse_public_read_visible"
  on pulse for select
  to anon, authenticated
  using (status = 'visible');

-- service_role bypasses RLS automatically — no policies needed for it
