-- Ensure buckets exist and are public
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('course-images', 'course-images', true)
on conflict (id) do nothing;

-- Storage policies for product-images
do $$
begin
  if exists (
    select 1 from pg_policies where policyname = 'public_read_product_images' and tablename = 'objects'
  ) then
    drop policy public_read_product_images on storage.objects;
  end if;
  create policy public_read_product_images on storage.objects
    for select
    using (bucket_id = 'product-images');
end$$;

-- Authenticated write to product-images
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'auth_write_product_images' AND tablename = 'objects'
  ) THEN
    DROP POLICY auth_write_product_images ON storage.objects;
  END IF;
  CREATE POLICY auth_write_product_images ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'product-images');
END$$;

-- Optional: allow update/delete by authenticated users for product-images
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'auth_update_product_images' AND tablename = 'objects'
  ) THEN
    DROP POLICY auth_update_product_images ON storage.objects;
  END IF;
  CREATE POLICY auth_update_product_images ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'product-images')
    WITH CHECK (bucket_id = 'product-images');
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'auth_delete_product_images' AND tablename = 'objects'
  ) THEN
    DROP POLICY auth_delete_product_images ON storage.objects;
  END IF;
  CREATE POLICY auth_delete_product_images ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'product-images');
END$$;

-- Storage policies for course-images
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'public_read_course_images' AND tablename = 'objects'
  ) THEN
    DROP POLICY public_read_course_images ON storage.objects;
  END IF;
  CREATE POLICY public_read_course_images ON storage.objects
    FOR SELECT
    USING (bucket_id = 'course-images');
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'auth_write_course_images' AND tablename = 'objects'
  ) THEN
    DROP POLICY auth_write_course_images ON storage.objects;
  END IF;
  CREATE POLICY auth_write_course_images ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'course-images');
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'auth_update_course_images' AND tablename = 'objects'
  ) THEN
    DROP POLICY auth_update_course_images ON storage.objects;
  END IF;
  CREATE POLICY auth_update_course_images ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'course-images')
    WITH CHECK (bucket_id = 'course-images');
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'auth_delete_course_images' AND tablename = 'objects'
  ) THEN
    DROP POLICY auth_delete_course_images ON storage.objects;
  END IF;
  CREATE POLICY auth_delete_course_images ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'course-images');
END$$;

-- RLS policies for product_categories and products to allow authenticated write
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'product_categories_write_auth' AND tablename = 'product_categories'
  ) THEN
    DROP POLICY product_categories_write_auth ON public.product_categories;
  END IF;
  CREATE POLICY product_categories_write_auth ON public.product_categories
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'products_write_auth' AND tablename = 'products'
  ) THEN
    DROP POLICY products_write_auth ON public.products;
  END IF;
  CREATE POLICY products_write_auth ON public.products
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
END$$;
