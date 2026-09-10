create table if not exists public.truck_sessions (
  id uuid primary key default gen_random_uuid(), truck_id text unique not null, session_id text not null, device_id text not null,
  latitude double precision not null, longitude double precision not null, accuracy double precision, speed double precision, heading double precision,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','OFFLINE')), last_seen timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.truck_sessions enable row level security;
drop policy if exists "public can read active truck sessions" on public.truck_sessions;
drop policy if exists "anonymous sessions can insert truck sessions" on public.truck_sessions;
drop policy if exists "anonymous sessions can update truck sessions" on public.truck_sessions;
create policy "public can read active truck sessions" on public.truck_sessions for select using (true);
create policy "anonymous sessions can insert truck sessions" on public.truck_sessions for insert with check (true);
create policy "anonymous sessions can update truck sessions" on public.truck_sessions for update using (true) with check (true);
alter publication supabase_realtime add table public.truck_sessions;
create index if not exists truck_sessions_last_seen_idx on public.truck_sessions(last_seen);
