-- Products and categories schema
create table if not exists product_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price numeric not null default 0,
  image_url text,
  category_id uuid references product_categories(id) on delete set null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_active on products(active);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_prodcat_position on product_categories(position);

alter table product_categories enable row level security;
alter table products enable row level security;

-- Recreate policies in an idempotent way (CREATE POLICY doesn't support IF NOT EXISTS)
drop policy if exists product_categories_read_public on product_categories;
create policy product_categories_read_public on product_categories
  for select using (true);

drop policy if exists products_read_public on products;
create policy products_read_public on products
  for select using (active = true);
