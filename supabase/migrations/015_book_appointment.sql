-- RPC to book an appointment bypassing RLS, returning the new id
create or replace function book_appointment(
  p_service_id uuid,
  p_full_name text,
  p_phone text,
  p_email text,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_notes text,
  p_expires_at timestamptz
)
returns table(id uuid)
security definer
set search_path = public
language plpgsql
as $$
begin
  -- upsert customer by phone (unique)
  insert into customers(full_name, phone, email)
  values (p_full_name, p_phone, nullif(p_email, ''))
  on conflict (phone) do update set full_name = excluded.full_name, email = excluded.email;

  return query
  insert into appointments(customer_id, service_id, start_at, end_at, status, notes, expires_at)
  select c.id, p_service_id, p_start_at, p_end_at, 'pending_whatsapp', nullif(p_notes,''), p_expires_at
  from customers c where c.phone = p_phone
  returning id;
end;
$$;
