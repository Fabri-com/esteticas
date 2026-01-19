-- Grant execute on security definer functions to anon and authenticated
grant execute on function get_booked_intervals(uuid, date) to anon, authenticated;
grant execute on function book_appointment(uuid, text, text, text, timestamptz, timestamptz, text, timestamptz) to anon, authenticated;
