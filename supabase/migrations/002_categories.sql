-- Service categories table
create table if not exists service_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Add image_url and category_id to services (keep legacy category text for now)
alter table services add column if not exists image_url text;
alter table services add column if not exists category_id uuid references service_categories(id) on delete set null;

-- RLS
alter table service_categories enable row level security;
-- Only authenticated can manage categories
create policy svc_cat_all_auth on service_categories for all to authenticated using (true) with check (true);
-- Optionally allow public read if needed (kept authenticated-only by default)
-- create policy svc_cat_select_public on service_categories for select using (true);
