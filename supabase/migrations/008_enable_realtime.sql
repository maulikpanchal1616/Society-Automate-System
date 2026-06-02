-- Enable Supabase Realtime for specific tables securely
-- This adds the tables to the supabase_realtime publication
-- RLS policies will automatically filter the websocket streams per user

-- Notices
ALTER PUBLICATION supabase_realtime ADD TABLE notices;

-- Payments
ALTER PUBLICATION supabase_realtime ADD TABLE payments;

-- Bills
ALTER PUBLICATION supabase_realtime ADD TABLE bills;

-- Note: Events are not strictly needed in realtime as requested, but if needed later, they can be added.
