-- Grant execute on admin_list_appointments to authenticated role
grant execute on function admin_list_appointments(timestamptz, timestamptz) to authenticated;
