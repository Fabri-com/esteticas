-- Structured fields for rich course detail
alter table if exists courses
  add column if not exists program_json jsonb,
  add column if not exists requirements_json jsonb,
  add column if not exists includes_json jsonb;
