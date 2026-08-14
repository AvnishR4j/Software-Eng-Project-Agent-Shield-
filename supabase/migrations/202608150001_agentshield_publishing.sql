create extension if not exists pgcrypto;

create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.versions (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references public.deliverables(id),
  version text not null check (version ~ '^v[0-9]+(\.[0-9]+){0,2}$'),
  published_date date not null,
  authors_json jsonb not null,
  change_summary text not null,
  commit_url text,
  deployment_url text,
  publisher_email text not null,
  published_at timestamptz not null default now(),
  unique (deliverable_id, version)
);

create table if not exists public.assets (
  id uuid primary key,
  version_id uuid not null references public.versions(id),
  object_key text not null unique,
  relative_path text not null,
  file_name text not null,
  mime_type text not null,
  size bigint not null check (size >= 0),
  sha256 text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_email text not null,
  deliverable_id uuid not null references public.deliverables(id),
  version_id uuid not null references public.versions(id),
  metadata_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.publish_requests (
  idempotency_key text primary key,
  version_id uuid not null references public.versions(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_versions_published_at on public.versions(published_at desc);
create index if not exists idx_assets_version_id on public.assets(version_id);
create index if not exists idx_audit_created_at on public.audit_events(created_at desc);

alter table public.deliverables enable row level security;
alter table public.versions enable row level security;
alter table public.assets enable row level security;
alter table public.audit_events enable row level security;
alter table public.publish_requests enable row level security;

drop policy if exists "Public deliverables are readable" on public.deliverables;
create policy "Public deliverables are readable" on public.deliverables for select to anon, authenticated using (true);
drop policy if exists "Public versions are readable" on public.versions;
create policy "Public versions are readable" on public.versions for select to anon, authenticated using (true);
drop policy if exists "Public asset metadata is readable" on public.assets;
create policy "Public asset metadata is readable" on public.assets for select to anon, authenticated using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'deliverables',
  'deliverables',
  false,
  52428800,
  array[
    'application/pdf',
    'application/zip',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv', 'text/plain', 'text/markdown',
    'image/png', 'image/jpeg', 'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.publish_deliverable_version(
  p_title text,
  p_slug text,
  p_type text,
  p_version text,
  p_published_date date,
  p_authors jsonb,
  p_change_summary text,
  p_commit_url text,
  p_deployment_url text,
  p_publisher_email text,
  p_idempotency_key text,
  p_assets jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deliverable_id uuid;
  v_version_id uuid;
  v_previous_version_id uuid;
begin
  select version_id into v_previous_version_id
  from public.publish_requests
  where idempotency_key = p_idempotency_key;

  if v_previous_version_id is not null then
    return jsonb_build_object('version_id', v_previous_version_id, 'duplicate', true);
  end if;

  insert into public.deliverables (slug, title, type)
  values (p_slug, p_title, p_type)
  on conflict (slug) do update set title = excluded.title, type = excluded.type
  returning id into v_deliverable_id;

  insert into public.versions (
    deliverable_id, version, published_date, authors_json, change_summary,
    commit_url, deployment_url, publisher_email
  ) values (
    v_deliverable_id, p_version, p_published_date, p_authors, p_change_summary,
    p_commit_url, p_deployment_url, p_publisher_email
  ) returning id into v_version_id;

  insert into public.assets (id, version_id, object_key, relative_path, file_name, mime_type, size, sha256)
  select
    (asset->>'id')::uuid,
    v_version_id,
    asset->>'object_key',
    asset->>'relative_path',
    asset->>'file_name',
    asset->>'mime_type',
    (asset->>'size')::bigint,
    asset->>'sha256'
  from jsonb_array_elements(p_assets) asset;

  insert into public.publish_requests (idempotency_key, version_id)
  values (p_idempotency_key, v_version_id);

  insert into public.audit_events (action, actor_email, deliverable_id, version_id, metadata_json)
  values (
    'PUBLISHED', p_publisher_email, v_deliverable_id, v_version_id,
    jsonb_build_object('title', p_title, 'slug', p_slug, 'version', p_version, 'files', jsonb_array_length(p_assets))
  );

  return jsonb_build_object('version_id', v_version_id, 'duplicate', false);
end;
$$;

revoke all on function public.publish_deliverable_version(text, text, text, text, date, jsonb, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.publish_deliverable_version(text, text, text, text, date, jsonb, text, text, text, text, text, jsonb) to service_role;
