-- Public read policies for booking data
-- Ensure anonymous users can read categories, services and time windows

-- service_categories
alter table if exists service_categories enable row level security;
DROP POLICY IF EXISTS service_categories_read_public ON service_categories;
CREATE POLICY service_categories_read_public ON service_categories
  FOR SELECT USING (true);

-- services
alter table if exists services enable row level security;
DROP POLICY IF EXISTS services_read_public ON services;
CREATE POLICY services_read_public ON services
  FOR SELECT USING (true);

-- service_time_windows
alter table if exists service_time_windows enable row level security;
DROP POLICY IF EXISTS service_time_windows_read_public ON service_time_windows;
CREATE POLICY service_time_windows_read_public ON service_time_windows
  FOR SELECT USING (true);
