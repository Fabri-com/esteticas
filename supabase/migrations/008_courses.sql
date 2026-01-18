-- Courses and course categories
create table if not exists course_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  level text,
  duration_weeks int,
  students int,
  seats int,
  price numeric,
  mode text,
  image_url text,
  description text,
  category_id uuid references course_categories(id) on delete set null,
  created_at timestamptz default now()
);

alter table course_categories enable row level security;
alter table courses enable row level security;

-- Public read policies
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'course_categories_read_public' and tablename = 'course_categories') then
    create policy course_categories_read_public on course_categories for select using (true);
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'courses_read_public' and tablename = 'courses') then
    create policy courses_read_public on courses for select using (true);
  end if;
end$$;

-- Authenticated write policies
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'course_categories_write_auth' and tablename = 'course_categories') then
    create policy course_categories_write_auth on course_categories for all to authenticated using (true) with check (true);
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'courses_write_auth' and tablename = 'courses') then
    create policy courses_write_auth on courses for all to authenticated using (true) with check (true);
  end if;
end$$;
