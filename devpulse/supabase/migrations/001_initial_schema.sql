-- Apply in a Supabase project. Public clients have no table access; no Supabase Auth is used.
begin;

create table public.profiles (
  id bigint primary key,
  login text not null unique,
  display_name text,
  avatar_url text,
  github_created_at timestamptz not null,
  first_observed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_login_lower on public.profiles(lower(login));

create table public.repositories (
  id bigint primary key,
  profile_id bigint not null references public.profiles(id) on delete cascade,
  name text not null,
  full_name text not null unique,
  primary_language text,
  is_fork boolean not null,
  archived boolean not null,
  github_created_at timestamptz not null,
  pushed_at timestamptz,
  updated_at timestamptz not null default now()
);
create index repositories_profile on public.repositories(profile_id);

create table public.profile_snapshots (
  id bigint generated always as identity primary key,
  profile_id bigint not null references public.profiles(id) on delete cascade,
  observed_on date not null default current_date,
  observed_at timestamptz not null default now(),
  range_key text not null check (range_key in ('7D','30D','90D','1Y','ALL')),
  source text not null check (source in ('graphql','events')),
  limited boolean not null,
  contributions integer not null check (contributions >= 0),
  focus_score integer not null check (focus_score between 0 and 100),
  active_repositories integer not null,
  followers integer not null,
  stars integer not null,
  unique(profile_id, observed_on, range_key)
);
create index profile_snapshots_history on public.profile_snapshots(profile_id, observed_at desc);

create table public.daily_contributions (
  profile_id bigint not null references public.profiles(id) on delete cascade,
  contribution_date date not null,
  source text not null check (source in ('graphql','events')),
  contribution_count integer not null check (contribution_count >= 0),
  observed_at timestamptz not null default now(),
  primary key(profile_id, contribution_date, source)
);
create table public.repository_activity (
  snapshot_id bigint not null references public.profile_snapshots(id) on delete cascade,
  repository_full_name text not null,
  activity_count integer not null check(activity_count >= 0),
  primary key(snapshot_id, repository_full_name)
);
create table public.language_snapshots (
  snapshot_id bigint not null references public.profile_snapshots(id) on delete cascade,
  language text not null,
  activity_weight numeric not null,
  share_percent numeric not null check(share_percent between 0 and 100),
  primary key(snapshot_id, language)
);
create table public.repository_snapshots (
  repository_id bigint not null references public.repositories(id) on delete cascade,
  observed_on date not null default current_date,
  stars integer not null,
  forks integer not null,
  open_issues integer not null,
  health_score integer check(health_score between 0 and 100),
  primary key(repository_id, observed_on)
);
create table public.trophy_snapshots (
  snapshot_id bigint not null references public.profile_snapshots(id) on delete cascade,
  family text not null,
  tier_index integer not null check(tier_index between 0 and 7),
  measured_value numeric not null,
  primary key(snapshot_id, family, tier_index)
);
create table public.trophy_unlocks (
  profile_id bigint not null references public.profiles(id) on delete cascade,
  family text not null,
  tier_index integer not null check(tier_index between 0 and 7),
  range_key text not null,
  first_observed_at timestamptz not null default now(),
  -- This is the first observation, NOT a claimed GitHub achievement date.
  primary key(profile_id, family, tier_index, range_key)
);
create table public.developer_eras (
  profile_id bigint not null references public.profiles(id) on delete cascade,
  era_key text not null,
  start_year integer not null,
  end_year integer not null check(end_year >= start_year),
  dominant_language text not null,
  repository_share numeric not null,
  first_observed_at timestamptz not null default now(),
  primary key(profile_id, era_key)
);
create table public.timeline_events (
  id bigint generated always as identity primary key,
  profile_id bigint not null references public.profiles(id) on delete cascade,
  event_key text not null,
  kind text not null,
  evidence_date timestamptz,
  observed_at timestamptz not null default now(),
  title text not null,
  source_url text,
  unique(profile_id, event_key)
);
create index timeline_events_history on public.timeline_events(profile_id, evidence_date desc);
create table public.sync_runs (
  id bigint generated always as identity primary key,
  profile_id bigint not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check(status in ('running','complete','failed')),
  source text not null,
  error_code text
);
create table public.wrapped_summaries (
  profile_id bigint not null references public.profiles(id) on delete cascade,
  year integer not null check(year >= 2008),
  observed_at timestamptz not null default now(),
  source text not null,
  limited boolean not null,
  contributions integer not null,
  active_days integer not null,
  longest_streak integer not null,
  focus_score integer not null,
  top_language text,
  primary key(profile_id, year)
);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','repositories','profile_snapshots','daily_contributions','repository_activity',
    'language_snapshots','repository_snapshots','trophy_snapshots','trophy_unlocks',
    'developer_eras','timeline_events','sync_runs','wrapped_summaries'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant all on public.%I to service_role', table_name);
  end loop;
end $$;
grant usage, select on all sequences in schema public to service_role;

create function public.record_profile_snapshot(payload jsonb) returns bigint
language plpgsql security invoker set search_path = public as $$
declare
  profile_key bigint := (payload->'user'->>'id')::bigint;
  snapshot_key bigint;
  item jsonb;
begin
  insert into profiles(id, login, display_name, avatar_url, github_created_at)
  values(profile_key, payload->'user'->>'login', payload->'user'->>'name',
    payload->'user'->>'avatar_url', (payload->'user'->>'created_at')::timestamptz)
  on conflict(id) do update set login=excluded.login, display_name=excluded.display_name,
    avatar_url=excluded.avatar_url, updated_at=now();

  insert into profile_snapshots(profile_id, range_key, source, limited, contributions,
    focus_score, active_repositories, followers, stars)
  values(profile_key, payload->>'range', payload->>'source', (payload->>'limited')::boolean,
    (payload->>'contributions')::integer, (payload->>'focus')::integer,
    (payload->>'activeRepositories')::integer, (payload->'user'->>'followers')::integer,
    (payload->>'stars')::integer)
  on conflict(profile_id, observed_on, range_key) do update set
    observed_at=now(), contributions=excluded.contributions, focus_score=excluded.focus_score,
    active_repositories=excluded.active_repositories, followers=excluded.followers,
    stars=excluded.stars, source=excluded.source, limited=excluded.limited
  returning id into snapshot_key;

  for item in select * from jsonb_array_elements(payload->'days') loop
    insert into daily_contributions(profile_id, contribution_date, source, contribution_count)
    values(profile_key, (item->>'date')::date, payload->>'source', (item->>'contributionCount')::integer)
    on conflict(profile_id, contribution_date, source) do update set
      contribution_count=excluded.contribution_count, observed_at=now();
  end loop;

  delete from language_snapshots where snapshot_id=snapshot_key;
  for item in select * from jsonb_array_elements(payload->'languages') loop
    insert into language_snapshots values(snapshot_key, item->>'name',
      (item->>'value')::numeric, (item->>'percentage')::numeric);
  end loop;
  delete from repository_activity where snapshot_id=snapshot_key;
  for item in select * from jsonb_array_elements(payload->'activity') loop
    insert into repository_activity values(snapshot_key, item->>'nameWithOwner', (item->>'count')::integer);
  end loop;
  delete from trophy_snapshots where snapshot_id=snapshot_key;
  for item in select * from jsonb_array_elements(payload->'trophies') loop
    insert into trophy_snapshots values(snapshot_key, item->>'family',
      (item->>'tierIndex')::integer, (item->>'value')::numeric);
    insert into trophy_unlocks(profile_id, family, tier_index, range_key)
    values(profile_key, item->>'family', (item->>'tierIndex')::integer, payload->>'range')
    on conflict do nothing;
  end loop;
  insert into sync_runs(profile_id, finished_at, status, source)
  values(profile_key, now(), 'complete', payload->>'source');
  return snapshot_key;
end $$;
revoke all on function public.record_profile_snapshot(jsonb) from public, anon, authenticated;
grant execute on function public.record_profile_snapshot(jsonb) to service_role;
commit;

