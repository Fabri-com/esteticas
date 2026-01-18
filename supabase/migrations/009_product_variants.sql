-- Product variants (e.g., colors) with image per variant
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  color_hex text,
  image_url text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_product_variants_product on product_variants(product_id);

alter table product_variants enable row level security;

-- Policies (DROP + CREATE pattern for idempotency)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'product_variants_read_public' AND tablename = 'product_variants'
  ) THEN
    DROP POLICY product_variants_read_public ON product_variants;
  END IF;
  CREATE POLICY product_variants_read_public ON product_variants FOR SELECT USING (true);
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'product_variants_write_auth' AND tablename = 'product_variants'
  ) THEN
    DROP POLICY product_variants_write_auth ON product_variants;
  END IF;
  CREATE POLICY product_variants_write_auth ON product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);
END$$;
