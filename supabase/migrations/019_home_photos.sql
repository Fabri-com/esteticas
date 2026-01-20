-- Home photos table and RLS for public site and admin inserts
create table if not exists home_photos (
  id uuid primary key default uuid_generate_v4(),
  kind text not null check (kind in ('hero','gallery')),
  title text,
  alt text,
  storage_path text not null,
  public_url text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table home_photos enable row level security;

-- Public can read only active photos
create policy home_photos_select_public on home_photos for select using (is_active);
-- Admins (authenticated) can manage
create policy home_photos_all_auth on home_photos for all to authenticated using (true) with check (true);
