-- Extensions
create extension if not exists "uuid-ossp";

-- Tables
create table if not exists services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  duration_minutes int not null check (duration_minutes > 0),
  price numeric not null check (price >= 0),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text not null unique,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  service_id uuid not null references services(id) on delete restrict,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null check (status in ('pending_whatsapp','confirmed','cancelled','no_show','done')),
  notes text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists availability_rules (
  id uuid primary key default uuid_generate_v4(),
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_enabled boolean not null default true
);

create table if not exists blocked_times (
  id uuid primary key default uuid_generate_v4(),
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text
);

-- Helpful indexes
create index if not exists idx_appts_start_at on appointments(start_at);
create index if not exists idx_appts_status on appointments(status);

-- Overlap prevention: confirmed or pending_whatsapp not expired
create or replace function check_no_overlap()
returns trigger as $$
begin
  if exists (
    select 1 from appointments a
    where a.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000')
      and a.status in ('confirmed','pending_whatsapp')
      and (a.status <> 'pending_whatsapp' or a.expires_at is null or a.expires_at > now())
      and tstzrange(a.start_at, a.end_at, '[)') && tstzrange(new.start_at, new.end_at, '[)')
  ) then
    raise exception 'Time slot overlaps with existing appointment';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_no_overlap
before insert or update on appointments
for each row execute procedure check_no_overlap();

-- Cleanup function for expired pendings
create or replace function cleanup_expired_pending()
returns void as $$
begin
  update appointments set status = 'cancelled'
  where status = 'pending_whatsapp' and expires_at is not null and expires_at <= now();
end;
$$ language plpgsql security definer;

-- RLS
alter table services enable row level security;
alter table customers enable row level security;
alter table appointments enable row level security;
alter table availability_rules enable row level security;
alter table blocked_times enable row level security;

-- Policies
-- Public can read active services
create policy services_select_public on services for select using (is_active);
-- Admin full access (assume authenticated and optionally filtered by email claim via app)
create policy services_all_auth on services for all to authenticated using (true) with check (true);

-- Customers: public can upsert (insert) and read own by phone via RPC-less approach is limited. Allow insert for everyone.
create policy customers_insert_public on customers for insert with check (true);
create policy customers_select_auth on customers for select to authenticated using (true);

-- Appointments: public can insert only pending_whatsapp
create policy appt_insert_public on appointments for insert with check (status = 'pending_whatsapp');
-- Hide appointments from anon
create policy appt_select_auth on appointments for select to authenticated using (true);
create policy appt_update_auth on appointments for update to authenticated using (true) with check (true);

-- Availability and blocked times only for auth
create policy avail_all_auth on availability_rules for all to authenticated using (true) with check (true);
create policy blocked_all_auth on blocked_times for all to authenticated using (true) with check (true);
