-- BuildOne database core
-- Apply this migration to a dedicated Supabase project for BuildOne.
-- Do not use an unrelated project's database for BuildOne data.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  package_id text not null,
  version_name text not null default '1.0',
  html text not null default '',
  config jsonb not null default '{}'::jsonb,
  backup jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.builds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  project_id uuid references public.projects(id) on delete set null,
  build_id text not null unique,
  repo text not null default 'EarnPlayApps/BuildOne',
  branch text not null default 'main',
  type text not null check (type in ('APK','AAB')),
  signing_mode text not null default 'unsigned' check (signing_mode in ('unsigned','signed')),
  status text not null default 'QUEUED',
  trigger_sha text,
  run_id bigint,
  run_sha text,
  artifact_id bigint,
  artifact_name text,
  artifact_size bigint,
  artifact_sha256 text,
  error text,
  log_ref text,
  retry_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz
);

create index if not exists builds_owner_created_idx on public.builds(owner_id, created_at desc);
create index if not exists builds_status_idx on public.builds(status);
create index if not exists builds_trigger_sha_idx on public.builds(trigger_sha);

create table if not exists public.build_events (
  id bigint generated always as identity primary key,
  build_id text not null references public.builds(build_id) on delete cascade,
  stage text not null,
  status text not null,
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  build_id text references public.builds(build_id) on delete cascade,
  kind text not null,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.builds enable row level security;
alter table public.build_events enable row level security;
alter table public.notifications enable row level security;

create policy "BuildOne project owner select" on public.projects for select to authenticated using ((select auth.uid()) = owner_id);
create policy "BuildOne project owner insert" on public.projects for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "BuildOne project owner update" on public.projects for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "BuildOne project owner delete" on public.projects for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "BuildOne build owner select" on public.builds for select to authenticated using ((select auth.uid()) = owner_id);
create policy "BuildOne build owner insert" on public.builds for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "BuildOne build owner update" on public.builds for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy "BuildOne event owner select" on public.build_events for select to authenticated using (exists (select 1 from public.builds b where b.build_id=build_events.build_id and b.owner_id=(select auth.uid())));
create policy "BuildOne notification owner select" on public.notifications for select to authenticated using ((select auth.uid()) = owner_id);
create policy "BuildOne notification owner update" on public.notifications for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create or replace function public.buildone_touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end; $$;

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects for each row execute function public.buildone_touch_updated_at();

drop trigger if exists builds_touch on public.builds;
create trigger builds_touch before update on public.builds for each row execute function public.buildone_touch_updated_at();
