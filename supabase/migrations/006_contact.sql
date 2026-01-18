-- Contact messages table with RLS
create table if not exists contact_messages (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text,
  phone text,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;

-- Allow anyone to insert a contact message
drop policy if exists contact_messages_insert_public on contact_messages;
create policy contact_messages_insert_public on contact_messages
  for insert with check (true);

-- Allow admin/service role to read (optional). For anon, no select.
drop policy if exists contact_messages_read_service_role on contact_messages;
create policy contact_messages_read_service_role on contact_messages
  for select to service_role using (true);
