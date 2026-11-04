create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#E6A6B8',
  password_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.event_settings (
  id integer primary key default 1 check (id = 1),
  submissions_closed boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.event_settings (id, submissions_closed)
values (1, false)
on conflict (id) do nothing;

create table if not exists public.submissions (
  team_id uuid not null references public.teams(id) on delete cascade,
  slot integer not null check (slot between 0 and 15),
  object_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (team_id, slot)
);

insert into public.teams (name, color)
values
  ('チーム ピンク', '#E6A6B8'),
  ('チーム ブルー', '#7EA6E0'),
  ('チーム グリーン', '#83C5A3'),
  ('チーム イエロー', '#E6C96A')
on conflict (name) do nothing;

alter table public.teams enable row level security;
alter table public.event_settings enable row level security;
alter table public.submissions enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('color-hunt-private', 'color-hunt-private', false, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
