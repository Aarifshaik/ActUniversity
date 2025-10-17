-- Check if we have any courses
SELECT 'Current courses:' as info;
SELECT title, is_published, category FROM courses;

-- If no courses exist, insert sample data
INSERT INTO courses (title, description, category, difficulty_level, estimated_duration_minutes, is_published, display_order, created_by) 
SELECT 
  'Workplace Safety Fundamentals',
  'Essential safety protocols and procedures for all employees. Learn about emergency procedures, hazard identification, and personal protective equipment.',
  'Safety & Compliance',
  'beginner',
  45,
  true,
  1,
  (SELECT id FROM employees WHERE role = 'admin' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Workplace Safety Fundamentals');

INSERT INTO courses (title, description, category, difficulty_level, estimated_duration_minutes, is_published, display_order, created_by) 
SELECT 
  'Data Security & Privacy',
  'Comprehensive training on data protection, cybersecurity best practices, and privacy regulations including GDPR compliance.',
  'Security',
  'intermediate',
  60,
  true,
  2,
  (SELECT id FROM employees WHERE role = 'admin' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Data Security & Privacy');

INSERT INTO courses (title, description, category, difficulty_level, estimated_duration_minutes, is_published, display_order, created_by) 
SELECT 
  'Customer Service Excellence',
  'Master the art of exceptional customer service with practical techniques for handling difficult situations and building customer loyalty.',
  'Customer Service',
  'intermediate',
  75,
  true,
  3,
  (SELECT id FROM employees WHERE role = 'admin' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Customer Service Excellence');

-- Check results
SELECT 'After insert:' as info;
SELECT title, is_published, category FROM courses;