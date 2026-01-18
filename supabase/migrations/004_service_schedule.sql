-- Per-service scheduling
alter table services add column if not exists slot_interval_minutes integer not null default 60;

create table if not exists service_time_windows (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6), -- 0=Sunday
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);

create index if not exists idx_service_time_windows_service_week on service_time_windows(service_id, weekday);

-- RLS
alter table service_time_windows enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = current_schema()
      and policyname = 'service_time_windows_read_public'
      and tablename = 'service_time_windows'
  ) then
    create policy service_time_windows_read_public
      on service_time_windows for select using (true);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = current_schema()
      and policyname = 'service_time_windows_write_auth'
      and tablename = 'service_time_windows'
  ) then
    create policy service_time_windows_write_auth
      on service_time_windows for all to authenticated using (true) with check (true);
  end if;
end$$;
