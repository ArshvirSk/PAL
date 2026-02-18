-- Demo Data for P.A.L. Campus Assistant
-- Run this in Supabase SQL Editor to populate demo data

-- Insert demo students
INSERT INTO users (admission_number, name, email, phone, role, branch, batch, year, current_phase, onboarding_status)
VALUES 
  ('CS-2026-001', 'Rahul Sharma', 'rahul.sharma@college.edu', '+919876543210', 'student', 'Computer Science', '2026', 1, 'Fee Payment', 'in_progress'),
  ('CS-2026-002', 'Priya Patel', 'priya.patel@college.edu', '+919876543211', 'student', 'Computer Science', '2026', 1, 'Document Verification', 'in_progress'),
  ('ECE-2026-001', 'Arjun Singh', 'arjun.singh@college.edu', '+919876543212', 'student', 'Electronics', '2026', 1, 'Hostel Allotment', 'in_progress'),
  ('ADMIN-001', 'Admin User', 'admin@college.edu', '+919876543213', 'admin', NULL, NULL, NULL, NULL, 'completed')
ON CONFLICT (admission_number) DO NOTHING;

-- Insert demo documents
INSERT INTO documents (user_id, file_name, file_path, file_size, document_type, verification_status, confidence, extracted_data)
SELECT 
  u.id,
  '12th_marksheet.pdf',
  'uploads/demo/12th_marksheet.pdf',
  2457600,
  'Marksheet',
  'green',
  0.97,
  '{"Name": "Rahul Sharma", "Board": "CBSE", "Roll No": "8234567", "Percentage": "85.4%", "Year": "2025"}'::jsonb
FROM users u WHERE u.admission_number = 'CS-2026-001'
ON CONFLICT DO NOTHING;

INSERT INTO documents (user_id, file_name, file_path, file_size, document_type, verification_status, confidence, extracted_data, validation_issues)
SELECT 
  u.id,
  'aadhar_card.pdf',
  'uploads/demo/aadhar_card.pdf',
  1153433,
  'ID_Card',
  'yellow',
  0.72,
  '{"Name": "Rahul Kumar Sharma", "ID Number": "XXXX-XXXX-4567"}'::jsonb,
  ARRAY['Name mismatch: Rahul Kumar Sharma vs Rahul Sharma']
FROM users u WHERE u.admission_number = 'CS-2026-001'
ON CONFLICT DO NOTHING;

-- Insert demo tasks
INSERT INTO tasks (title, description, phase, category, priority, estimated_duration, dependencies)
VALUES
  ('Upload 12th Marksheet', 'Upload your 12th standard marksheet for verification', 'Document Verification', 'document', 'high', 15, '[]'::jsonb),
  ('Upload ID Proof', 'Upload Aadhar card or any government ID', 'Document Verification', 'document', 'high', 10, '[]'::jsonb),
  ('Upload Passport Photo', 'Upload a recent passport size photograph', 'Document Verification', 'document', 'medium', 5, '[]'::jsonb),
  ('Pay Tuition Fee', 'Complete tuition fee payment online', 'Fee Payment', 'payment', 'high', 30, '[]'::jsonb),
  ('Pay Hostel Fee', 'Complete hostel fee payment', 'Fee Payment', 'payment', 'high', 20, '[]'::jsonb),
  ('Submit Room Preference', 'Choose your preferred hostel room type', 'Hostel Allotment', 'form', 'medium', 10, '[]'::jsonb),
  ('Register for Courses', 'Select and register for your courses', 'Academic Setup', 'form', 'high', 45, '[]'::jsonb)
ON CONFLICT (title, phase) DO NOTHING;

-- Assign tasks to demo student
INSERT INTO user_tasks (user_id, task_id, status, deadline)
SELECT 
  u.id,
  t.id,
  CASE 
    WHEN t.title IN ('Upload 12th Marksheet', 'Upload ID Proof') THEN 'completed'
    WHEN t.title = 'Upload Passport Photo' THEN 'in_progress'
    ELSE 'pending'
  END,
  CURRENT_DATE + INTERVAL '7 days'
FROM users u
CROSS JOIN tasks t
WHERE u.admission_number = 'CS-2026-001'
ON CONFLICT (user_id, task_id) DO NOTHING;

-- Insert demo notifications
INSERT INTO notifications (user_id, type, priority, title, message, channels)
SELECT 
  u.id,
  'deadline',
  'high',
  'Hostel Fee Deadline Tomorrow',
  'Your hostel fee payment is due tomorrow. Please complete the payment to avoid late fees.',
  ARRAY['in_app', 'email']
FROM users u WHERE u.admission_number = 'CS-2026-001'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, type, priority, title, message, channels)
SELECT 
  u.id,
  'document',
  'medium',
  'Document Verified',
  'Your 12th marksheet has been verified and approved.',
  ARRAY['in_app']
FROM users u WHERE u.admission_number = 'CS-2026-001'
ON CONFLICT DO NOTHING;

-- Insert demo interests for social matching
INSERT INTO interests (user_id, category, tags)
SELECT 
  u.id,
  'Hobbies',
  ARRAY['Coding', 'Gaming', 'Music']
FROM users u WHERE u.admission_number = 'CS-2026-001'
ON CONFLICT (user_id, category) DO NOTHING;

INSERT INTO interests (user_id, category, tags)
SELECT 
  u.id,
  'Hobbies',
  ARRAY['Coding', 'Photography', 'Reading']
FROM users u WHERE u.admission_number = 'CS-2026-002'
ON CONFLICT (user_id, category) DO NOTHING;

-- Insert demo matches
INSERT INTO matches (user_id, matched_user_id, match_score, shared_interests, status)
SELECT 
  u1.id,
  u2.id,
  0.85,
  ARRAY['Coding'],
  'pending'
FROM users u1, users u2
WHERE u1.admission_number = 'CS-2026-001' AND u2.admission_number = 'CS-2026-002'
ON CONFLICT (user_id, matched_user_id) DO NOTHING;

-- Success message
SELECT 'Demo data seeded successfully!' as message;
