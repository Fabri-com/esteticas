-- RPC to get booked intervals for a service and date (AR timezone), security definer to bypass RLS
create or replace function get_booked_intervals(
  p_service_id uuid,
  p_date date
)
returns table(start_time text, end_time text)
security definer
set search_path = public
language sql
as $$
  select
    to_char((a.start_at at time zone 'America/Argentina/Buenos_Aires')::time, 'HH24:MI') as start_time,
    to_char((a.end_at   at time zone 'America/Argentina/Buenos_Aires')::time, 'HH24:MI')   as end_time
  from appointments a
  where a.service_id = p_service_id
    and a.status in ('confirmed','pending_whatsapp')
    and (a.status <> 'pending_whatsapp' or a.expires_at is null or a.expires_at > now())
    and ((a.start_at at time zone 'America/Argentina/Buenos_Aires')::date = p_date);
$$;
