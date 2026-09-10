create table if not exists public.trucks (
  id uuid primary key default gen_random_uuid(),
  truck_id text unique not null,
  session_id text not null,
  device_hash text not null,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  speed double precision,
  heading double precision,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','OFFLINE')),
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.trucks enable row level security;
create policy "public can read active trucks" on public.trucks for select using (true);
create policy "anonymous sessions can upsert trucks" on public.trucks for insert with check (true);
create policy "anonymous sessions can update trucks" on public.trucks for update using (true);
alter publication supabase_realtime add table public.trucks;

create index if not exists trucks_last_seen_idx on public.trucks(last_seen);
