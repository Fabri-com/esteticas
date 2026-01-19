-- Make overlap check function run with elevated privileges and localize message
-- Ensure function runs bypassing RLS when reading appointments inside the trigger
create or replace function check_no_overlap()
returns trigger
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from appointments a
    where a.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000')
      and a.status in ('confirmed','pending_whatsapp')
      and (a.status <> 'pending_whatsapp' or a.expires_at is null or a.expires_at > now())
      and tstzrange(a.start_at, a.end_at, '[)') && tstzrange(new.start_at, new.end_at, '[)')
  ) then
    -- Localized message for users/admins
    raise exception 'El horario se superpone con otra reserva';
  end if;
  return new;
end;
$$ language plpgsql;

-- Recreate trigger (idempotent)
drop trigger if exists trg_no_overlap on appointments;
create trigger trg_no_overlap
before insert or update on appointments
for each row execute procedure check_no_overlap();
