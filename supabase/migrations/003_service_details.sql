-- Service details: includes bullets and gallery URLs
alter table services add column if not exists includes text[] default '{}'::text[];
alter table services add column if not exists gallery_urls text[] default '{}'::text[];
