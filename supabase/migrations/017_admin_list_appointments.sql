-- RPC to list appointments with denormalized customer and service info for a given date range
create or replace function admin_list_appointments(
  p_start timestamptz,
  p_end timestamptz
)
returns table(
  id uuid,
  start_at timestamptz,
  end_at timestamptz,
  status text,
  notes text,
  service_id uuid,
  service_name text,
  service_price numeric,
  service_category text,
  customer_id uuid,
  customer_full_name text,
  customer_phone text
)
security definer
set search_path = public
language sql
as $$
  select
    a.id,
    a.start_at,
    a.end_at,
    a.status,
    a.notes,
    s.id as service_id,
    s.name as service_name,
    s.price as service_price,
    s.category as service_category,
    c.id as customer_id,
    c.full_name as customer_full_name,
    c.phone as customer_phone
  from appointments a
  join services s on s.id = a.service_id
  join customers c on c.id = a.customer_id
  where a.start_at >= p_start and a.start_at < p_end
  order by a.start_at;
$$;
