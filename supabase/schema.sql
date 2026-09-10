create table if not exists public.truck_sessions (
  id uuid primary key default gen_random_uuid(), truck_id text not null, session_id text not null, device_id text not null,
  device_type text not null default 'DESKTOP' check (device_type in ('MOBILE','TABLET','DESKTOP')), browser text not null default 'Browser', ip_address text,
  latitude double precision not null, longitude double precision not null, accuracy double precision, speed double precision, heading double precision,
  status text not null default 'ONLINE' check (status in ('ONLINE','OFFLINE')), last_seen timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.truck_sessions add column if not exists device_type text not null default 'DESKTOP';
alter table public.truck_sessions add column if not exists browser text not null default 'Browser';
alter table public.truck_sessions add column if not exists ip_address text;
update public.truck_sessions set status = 'ONLINE' where status = 'ACTIVE';
alter table public.truck_sessions drop constraint if exists truck_sessions_truck_id_key;
alter table public.truck_sessions drop constraint if exists truck_sessions_status_check;
alter table public.truck_sessions add constraint truck_sessions_status_check check (status in ('ONLINE','OFFLINE'));
create unique index if not exists truck_sessions_session_id_key on public.truck_sessions(session_id);
create unique index if not exists truck_sessions_truck_id_key on public.truck_sessions(truck_id);
alter table public.truck_sessions enable row level security;
drop policy if exists "public can read active truck sessions" on public.truck_sessions;
drop policy if exists "anonymous sessions can insert truck sessions" on public.truck_sessions;
drop policy if exists "anonymous sessions can update truck sessions" on public.truck_sessions;
create policy "public can read active truck sessions" on public.truck_sessions for select using (true);
create policy "anonymous sessions can insert truck sessions" on public.truck_sessions for insert with check (true);
create policy "anonymous sessions can update truck sessions" on public.truck_sessions for update using (true) with check (true);
alter publication supabase_realtime add table public.truck_sessions;
create index if not exists truck_sessions_last_seen_idx on public.truck_sessions(last_seen);
