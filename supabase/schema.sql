-- Appliance Remote: devices table with Row Level Security.
-- Paste this whole file into Supabase > SQL Editor > New query > Run.

create table public.devices (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid()
             references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

-- Once RLS is on, nobody can touch the table until a policy allows it.
alter table public.devices enable row level security;

create policy "owners can read their devices"
  on public.devices for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "owners can add devices for themselves"
  on public.devices for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "owners can rename their devices"
  on public.devices for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "owners can delete their devices"
  on public.devices for delete to authenticated
  using (owner_id = (select auth.uid()));
