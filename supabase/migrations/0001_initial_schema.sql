-- ELVORI initial database schema
-- Authentication is handled by Supabase Auth.

create extension if not exists pgcrypto;

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Document sections
create table public.document_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  slug text not null,
  content text not null default '',
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, slug)
);

-- AI/chat messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Document versions
create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  snapshot jsonb not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, version_number)
);

-- Compilation records
create table public.compilations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_id uuid references public.document_versions(id) on delete set null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'success', 'failed', 'timeout')),
  compiler text,
  logs text,
  pdf_path text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

-- Indexes
create index projects_owner_id_idx
  on public.projects(owner_id);

create index sections_project_id_idx
  on public.document_sections(project_id);

create index messages_project_id_created_at_idx
  on public.messages(project_id, created_at);

create index versions_project_id_idx
  on public.document_versions(project_id);

create index compilations_project_id_idx
  on public.compilations(project_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.document_sections enable row level security;
alter table public.messages enable row level security;
alter table public.document_versions enable row level security;
alter table public.compilations enable row level security;

-- Profiles
create policy "users can view own profile"
on public.profiles
for select
using (id = auth.uid());

create policy "users can update own profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

-- Projects
create policy "users can view own projects"
on public.projects
for select
using (owner_id = auth.uid());

create policy "users can create own projects"
on public.projects
for insert
with check (owner_id = auth.uid());

create policy "users can update own projects"
on public.projects
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "users can delete own projects"
on public.projects
for delete
using (owner_id = auth.uid());

-- Sections
create policy "users can access own project sections"
on public.document_sections
for all
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_id
      and p.owner_id = auth.uid()
  )
);

-- Messages
create policy "users can access own project messages"
on public.messages
for all
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_id
      and p.owner_id = auth.uid()
  )
);

-- Versions
create policy "users can access own project versions"
on public.document_versions
for all
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_id
      and p.owner_id = auth.uid()
  )
);

-- Compilations
create policy "users can access own project compilations"
on public.compilations
for all
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_id
      and p.owner_id = auth.uid()
  )
);
