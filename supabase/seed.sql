-- =============================================================================
-- SEED DATA: seed.sql
-- Demo data for Shyamved Residency
-- Blocks A and B with realistic Indian residential society data
--
-- IMPORTANT: Run this ONLY in development / staging.
-- Auth users must be created manually through Supabase Auth dashboard first,
-- then update the UUIDs below to match the created auth.users IDs.
-- =============================================================================

-- =============================================================================
-- STEP 1: Create the society
-- =============================================================================

INSERT INTO societies (
  id,
  name,
  address,
  registration_number,
  maintenance_amount,
  payment_window_start,
  payment_window_end,
  penalty_per_day
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Shyamved Residency',
  'Plot No. 47, Shyamved Society, Near Patel Park, Naroda, Ahmedabad - 382330, Gujarat',
  'GJ-AHD-HSG-2018-0047',
  850.00,
  1,
  10,
  10.00
);

-- =============================================================================
-- STEP 2: Create blocks
-- =============================================================================

INSERT INTO blocks (id, society_id, name) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'A'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'B');

-- =============================================================================
-- STEP 3: Create houses
-- Block A: Floors 1-2, 2 houses per floor (A-101, A-102, A-201, A-202)
-- Block B: Floors 1-2, 2 houses per floor (B-101, B-102, B-201, B-202)
-- =============================================================================

INSERT INTO houses (
  id, society_id, block_id, house_number, floor, occupancy_status,
  owner_name, owner_phone, owner_email, tenant_name, tenant_phone,
  primary_contact_phone, water_meter_id, is_active
) VALUES
  -- Block A
  (
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'A-101', 1, 'owner_occupied',
    'Rajesh Kumar Sharma', '9876543201', 'rajesh.sharma@gmail.com',
    NULL, NULL, '9876543201', 'WM-A101', true
  ),
  (
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'A-102', 1, 'tenant_occupied',
    'Suresh Bhatt', '9876543202', 'suresh.bhatt@gmail.com',
    'Amit Patel', '9876543220',
    '9876543220', 'WM-A102', true
  ),
  (
    '00000000-0000-0000-0002-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'A-201', 2, 'owner_occupied',
    'Priya Desai', '9876543203', 'priya.desai@gmail.com',
    NULL, NULL, '9876543203', 'WM-A201', true
  ),
  (
    '00000000-0000-0000-0002-000000000004',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'A-202', 2, 'vacant',
    'Mahesh Joshi', '9876543204', NULL,
    NULL, NULL, '9876543204', 'WM-A202', true
  ),
  -- Block B
  (
    '00000000-0000-0000-0002-000000000005',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000002',
    'B-101', 1, 'owner_occupied',
    'Vijay Mehta', '9876543205', 'vijay.mehta@gmail.com',
    NULL, NULL, '9876543205', 'WM-B101', true
  ),
  (
    '00000000-0000-0000-0002-000000000006',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000002',
    'B-102', 1, 'owner_occupied',
    'Geeta Patel', '9876543206', 'geeta.patel@gmail.com',
    NULL, NULL, '9876543206', 'WM-B102', true
  ),
  (
    '00000000-0000-0000-0002-000000000007',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000002',
    'B-201', 2, 'tenant_occupied',
    'Ramesh Nair', '9876543207', 'ramesh.nair@gmail.com',
    'Sunil Kumar', '9876543221',
    '9876543221', 'WM-B201', true
  ),
  (
    '00000000-0000-0000-0002-000000000008',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000002',
    'B-202', 2, 'owner_occupied',
    'Anita Shah', '9876543208', 'anita.shah@gmail.com',
    NULL, NULL, '9876543208', 'WM-B202', true
  );

-- =============================================================================
-- STEP 4: Create family members
-- =============================================================================

INSERT INTO family_members (house_id, society_id, full_name, relationship, age, phone, is_primary_contact) VALUES
  -- A-101: Sharma family
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', 'Rajesh Kumar Sharma', 'Self', 45, '9876543201', true),
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', 'Sunita Sharma', 'Wife', 42, '9876543211', false),
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', 'Rohit Sharma', 'Son', 18, NULL, false),
  -- A-102: Patel tenant family
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000001', 'Amit Patel', 'Self', 35, '9876543220', true),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000001', 'Rekha Patel', 'Wife', 32, NULL, false),
  -- A-201: Desai family
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000001', 'Priya Desai', 'Self', 38, '9876543203', true),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000001', 'Kiran Desai', 'Husband', 41, '9876543213', false),
  -- B-101: Mehta family
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000001', 'Vijay Mehta', 'Self', 52, '9876543205', true),
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000001', 'Hema Mehta', 'Wife', 48, NULL, false),
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000001', 'Nisha Mehta', 'Daughter', 22, '9876543215', false),
  -- B-102: Patel family
  ('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0000-000000000001', 'Geeta Patel', 'Self', 44, '9876543206', true),
  ('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0000-000000000001', 'Dinesh Patel', 'Husband', 47, '9876543216', false),
  -- B-201: Kumar tenant
  ('00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0000-000000000001', 'Sunil Kumar', 'Self', 29, '9876543221', true),
  -- B-202: Shah family
  ('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0000-000000000001', 'Anita Shah', 'Self', 55, '9876543208', true),
  ('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0000-000000000001', 'Nilesh Shah', 'Husband', 58, '9876543218', false),
  ('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0000-000000000001', 'Pooja Shah', 'Daughter', 25, NULL, false);

-- =============================================================================
-- STEP 5: Users
-- NOTE: These UUIDs must match real auth.users created via Supabase Auth dashboard.
-- Replace placeholder UUIDs with actual auth user IDs before running.
--
-- Recommended accounts to create:
--   chairman@shyamved.com       / password: ShyamvedAdmin@2025
--   office@shyamved.com         / password: ShyamvedOffice@2025
--   resident.a101@shyamved.com  / password: Resident@2025
--   resident.b101@shyamved.com  / password: Resident@2025
-- =============================================================================

-- Placeholder: Replace with real auth.users UUIDs
-- INSERT INTO users (id, society_id, role, house_id, full_name, phone) VALUES
--   ('<chairman-auth-uuid>',   '00000000-0000-0000-0000-000000000001', 'chairman',   NULL, 'Haresh Patel (Chairman)', '9876500001'),
--   ('<office-auth-uuid>',     '00000000-0000-0000-0000-000000000001', 'office_man', NULL, 'Bhavesh Modi (Office)', '9876500002'),
--   ('<resident-a101-uuid>',   '00000000-0000-0000-0000-000000000001', 'resident', '00000000-0000-0000-0002-000000000001', 'Rajesh Kumar Sharma', '9876543201'),
--   ('<resident-b101-uuid>',   '00000000-0000-0000-0000-000000000001', 'resident', '00000000-0000-0000-0002-000000000005', 'Vijay Mehta', '9876543205');

-- =============================================================================
-- STEP 6: Chairman history
-- =============================================================================

-- INSERT INTO chairman_history (society_id, user_id, chairman_name, phone, email, start_date, status) VALUES
--   ('00000000-0000-0000-0000-000000000001', '<chairman-auth-uuid>', 'Haresh Patel', '9876500001', 'chairman@shyamved.com', '2024-01-01', 'active');

-- =============================================================================
-- STEP 7: Water rate (active rate)
-- =============================================================================

INSERT INTO water_rates (
  id, society_id, price_per_unit, effective_from, effective_to
) VALUES (
  '00000000-0000-0000-0003-000000000001',
  '00000000-0000-0000-0000-000000000001',
  3.50,         -- ₹3.50 per unit
  '2025-01-01',
  NULL          -- currently active
);

-- =============================================================================
-- STEP 8: Sample water meter entries (May 2025)
-- =============================================================================

INSERT INTO water_meter_entries (
  society_id, house_id, billing_month, units_consumed, unit_price
) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000001', '2025-05-01', 28, 3.50),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000002', '2025-05-01', 35, 3.50),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000003', '2025-05-01', 22, 3.50),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000005', '2025-05-01', 31, 3.50),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000006', '2025-05-01', 26, 3.50),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000007', '2025-05-01', 18, 3.50),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000008', '2025-05-01', 42, 3.50);

-- =============================================================================
-- STEP 9: Sample bills (May 2025)
-- =============================================================================

INSERT INTO bills (
  id, society_id, house_id, billing_month,
  maintenance_amount, water_units, water_unit_price, water_bill_amount,
  status, due_date
) VALUES
  -- A-101: Paid
  ('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0002-000000000001', '2025-05-01',
   850.00, 28, 3.50, 98.00, 'paid', '2025-05-10'),
  -- A-102: Pending
  ('00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0002-000000000002', '2025-05-01',
   850.00, 35, 3.50, 122.50, 'overdue', '2025-05-10'),
  -- A-201: Pending
  ('00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0002-000000000003', '2025-05-01',
   850.00, 22, 3.50, 77.00, 'pending', '2025-05-10'),
  -- B-101: Paid
  ('00000000-0000-0000-0004-000000000004', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0002-000000000005', '2025-05-01',
   850.00, 31, 3.50, 108.50, 'paid', '2025-05-10'),
  -- B-102: Pending
  ('00000000-0000-0000-0004-000000000005', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0002-000000000006', '2025-05-01',
   850.00, 26, 3.50, 91.00, 'pending', '2025-05-10'),
  -- B-201: Overdue
  ('00000000-0000-0000-0004-000000000006', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0002-000000000007', '2025-05-01',
   850.00, 18, 3.50, 63.00, 'overdue', '2025-05-10'),
  -- B-202: Paid
  ('00000000-0000-0000-0004-000000000007', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0002-000000000008', '2025-05-01',
   850.00, 42, 3.50, 147.00, 'paid', '2025-05-10');

-- =============================================================================
-- STEP 10: Sample notices
-- =============================================================================

INSERT INTO notices (
  society_id, title, description, type, priority, status, audience, published_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Monthly Maintenance Due - May 2025',
    'Dear Residents, please note that the monthly maintenance amount of ₹850 along with your water bill is due by 10th May 2025. Late payment will attract a penalty of ₹10 per day after the due date. Kindly pay on time to avoid penalties. For any queries, contact the office.',
    'payment_reminder', 'important', 'published', 'all',
    NOW() - INTERVAL '15 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Society Annual General Meeting - June 2025',
    'All residents are cordially invited to attend the Annual General Meeting of Shyamved Residency on 15th June 2025 at 7:00 PM in the Community Hall (Ground Floor). Agenda: Review of annual accounts, election of committee members, and discussion on society development plans. Attendance is mandatory for at least one member per flat.',
    'meeting', 'important', 'published', 'all',
    NOW() - INTERVAL '5 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Water Supply Maintenance - 28th May 2025',
    'Please be informed that the water supply will be interrupted on 28th May 2025 from 10:00 AM to 2:00 PM due to annual maintenance of the water pump and overhead tank cleaning. Please store sufficient water in advance. Inconvenience caused is regretted.',
    'maintenance', 'normal', 'published', 'all',
    NOW() - INTERVAL '2 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Eid Mubarak - Society Celebration',
    'Shyamved Residency Management Committee wishes all residents Eid Mubarak! A small celebration has been arranged at the society garden on the occasion. All residents are welcome to join. Light refreshments will be served.',
    'festival', 'normal', 'published', 'all',
    NOW() - INTERVAL '20 days'
  );

-- =============================================================================
-- STEP 11: Sample events
-- =============================================================================

INSERT INTO events (
  society_id, title, event_type, description,
  event_date, start_time, end_time, location, status
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Annual General Meeting 2025',
    'general_meeting',
    'Annual General Meeting to review accounts, elect new committee, and discuss society development plans for 2025-26.',
    '2025-06-15', '19:00', '21:00',
    'Community Hall, Ground Floor, Shyamved Residency',
    'published'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Society Garden Cleanup Drive',
    'maintenance',
    'Monthly garden cleanup and maintenance drive. Volunteers from each flat are requested to participate. Tools will be provided.',
    '2025-06-01', '07:00', '10:00',
    'Society Garden, Shyamved Residency',
    'published'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Children Day Celebration',
    'cultural',
    'Annual Children Day celebration with drawing competition, dance, and games for kids. Prizes for winners. All children are welcome!',
    '2025-11-14', '10:00', '13:00',
    'Community Hall and Garden Area',
    'draft'
  );

-- =============================================================================
-- STEP 12: Sample expenses
-- =============================================================================

INSERT INTO expenses (
  society_id, title, category, amount, expense_date, paid_to, payment_mode, notes
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Water Pump Repair',
    'Maintenance',
    2500.00,
    '2025-05-02',
    'Ramesh Plumbers & Electricals',
    'cash',
    'Annual maintenance of submersible pump in Block A. Replaced motor seals and pressure valve.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Garden Maintenance - May',
    'Garden',
    800.00,
    '2025-05-05',
    'Ganesh Nursery & Landscaping',
    'cash',
    'Monthly garden maintenance - mowing, pruning, and fertilizer application.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Electricity Bill - Common Areas',
    'Utilities',
    3200.00,
    '2025-05-08',
    'DGVCL',
    'upi',
    'Monthly electricity bill for common areas, lift, and street lights.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Security Guard Salary',
    'Salaries',
    8000.00,
    '2025-05-01',
    'Mahesh Yadav',
    'cash',
    'Monthly salary for security guard - May 2025.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Stationery and Office Supplies',
    'Office',
    350.00,
    '2025-05-10',
    'Swastik Stationery Store',
    'cash',
    'Receipt books, registers, pens, and office supplies for monthly billing.'
  );
