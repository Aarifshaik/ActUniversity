-- Sample data for Act University LMS
-- Run this in your Supabase SQL editor after creating the schema

-- Create additional employees
INSERT INTO employees (emp_id, email, password_hash, full_name, department, role, is_active) VALUES
('EMP001', 'john.doe@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Doe', 'Engineering', 'employee', true),
('EMP002', 'jane.smith@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Smith', 'Marketing', 'employee', true),
('EMP003', 'mike.johnson@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike Johnson', 'HR', 'employee', true),
('ADMIN002', 'admin2@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah Wilson', 'IT', 'admin', true)
ON CONFLICT (emp_id) DO NOTHING;

-- Create sample courses
INSERT INTO courses (title, description, category, difficulty_level, estimated_duration_minutes, is_published, display_order, created_by) VALUES
(
  'Workplace Safety Fundamentals',
  'Essential safety protocols and procedures for all employees. Learn about emergency procedures, hazard identification, and personal protective equipment.',
  'Safety & Compliance',
  'beginner',
  45,
  true,
  1,
  (SELECT id FROM employees WHERE emp_id = 'ADMIN001' LIMIT 1)
),
(
  'Data Security & Privacy',
  'Comprehensive training on data protection, cybersecurity best practices, and privacy regulations including GDPR compliance.',
  'Security',
  'intermediate',
  60,
  true,
  2,
  (SELECT id FROM employees WHERE emp_id = 'ADMIN001' LIMIT 1)
),
(
  'Leadership Development',
  'Advanced leadership skills including team management, communication strategies, and performance coaching techniques.',
  'Leadership',
  'advanced',
  90,
  true,
  3,
  (SELECT id FROM employees WHERE emp_id = 'ADMIN001' LIMIT 1)
),
(
  'Customer Service Excellence',
  'Master the art of exceptional customer service with practical techniques for handling difficult situations and building customer loyalty.',
  'Customer Service',
  'intermediate',
  75,
  true,
  4,
  (SELECT id FROM employees WHERE emp_id = 'ADMIN001' LIMIT 1)
),
(
  'Project Management Basics',
  'Introduction to project management methodologies, tools, and best practices for successful project delivery.',
  'Management',
  'beginner',
  120,
  false,
  5,
  (SELECT id FROM employees WHERE emp_id = 'ADMIN001' LIMIT 1)
);

-- Create sample activities for the first course (Workplace Safety)
INSERT INTO activities (course_id, title, description, activity_type, duration_minutes, display_order, is_mandatory) VALUES
(
  (SELECT id FROM courses WHERE title = 'Workplace Safety Fundamentals' LIMIT 1),
  'Safety Introduction Video',
  'Welcome video explaining the importance of workplace safety and overview of the training program.',
  'video',
  10,
  1,
  true
),
(
  (SELECT id FROM courses WHERE title = 'Workplace Safety Fundamentals' LIMIT 1),
  'Emergency Procedures Presentation',
  'Detailed presentation covering fire safety, evacuation procedures, and emergency contact information.',
  'ppt',
  15,
  2,
  true
),
(
  (SELECT id FROM courses WHERE title = 'Workplace Safety Fundamentals' LIMIT 1),
  'Safety Knowledge Quiz',
  'Test your understanding of basic safety principles and emergency procedures.',
  'quiz',
  10,
  3,
  true
),
(
  (SELECT id FROM courses WHERE title = 'Workplace Safety Fundamentals' LIMIT 1),
  'Safety Compliance Declaration',
  'Acknowledge that you understand and will follow all workplace safety protocols.',
  'declaration',
  5,
  4,
  true
);

-- Create sample activities for Data Security course
INSERT INTO activities (course_id, title, description, activity_type, duration_minutes, display_order, is_mandatory) VALUES
(
  (SELECT id FROM courses WHERE title = 'Data Security & Privacy' LIMIT 1),
  'Cybersecurity Threats Overview',
  'Learn about common cyber threats including phishing, malware, and social engineering attacks.',
  'video',
  20,
  1,
  true
),
(
  (SELECT id FROM courses WHERE title = 'Data Security & Privacy' LIMIT 1),
  'Password Security Best Practices',
  'Comprehensive guide to creating strong passwords and using password managers effectively.',
  'article',
  15,
  2,
  true
),
(
  (SELECT id FROM courses WHERE title = 'Data Security & Privacy' LIMIT 1),
  'GDPR Compliance Training',
  'Understanding data protection regulations and your responsibilities in handling personal data.',
  'ppt',
  20,
  3,
  true
),
(
  (SELECT id FROM courses WHERE title = 'Data Security & Privacy' LIMIT 1),
  'Security Assessment Quiz',
  'Evaluate your knowledge of data security principles and compliance requirements.',
  'quiz',
  15,
  4,
  true
);

-- Create sample quiz questions for Safety Knowledge Quiz
INSERT INTO quiz_questions (activity_id, question_text, question_type, options, correct_answer, points, display_order) VALUES
(
  (SELECT id FROM activities WHERE title = 'Safety Knowledge Quiz' LIMIT 1),
  'What should you do first when you hear the fire alarm?',
  'multiple_choice',
  '["Stop what you are doing immediately", "Finish your current task first", "Check if it''s a drill", "Call security"]',
  '"Stop what you are doing immediately"',
  10,
  1
),
(
  (SELECT id FROM activities WHERE title = 'Safety Knowledge Quiz' LIMIT 1),
  'Personal Protective Equipment (PPE) is mandatory in designated areas.',
  'true_false',
  '["True", "False"]',
  '"True"',
  10,
  2
),
(
  (SELECT id FROM activities WHERE title = 'Safety Knowledge Quiz' LIMIT 1),
  'Which of the following are considered workplace hazards? (Select all that apply)',
  'multi_select',
  '["Wet floors", "Blocked emergency exits", "Proper lighting", "Unsecured cables", "Clean workspaces"]',
  '["Wet floors", "Blocked emergency exits", "Unsecured cables"]',
  15,
  3
);

-- Create sample quiz questions for Security Assessment Quiz
INSERT INTO quiz_questions (activity_id, question_text, question_type, options, correct_answer, points, display_order) VALUES
(
  (SELECT id FROM activities WHERE title = 'Security Assessment Quiz' LIMIT 1),
  'What makes a strong password?',
  'multiple_choice',
  '["At least 8 characters with mixed case, numbers, and symbols", "Your name and birth year", "A common dictionary word", "The same password for all accounts"]',
  '"At least 8 characters with mixed case, numbers, and symbols"',
  10,
  1
),
(
  (SELECT id FROM activities WHERE title = 'Security Assessment Quiz' LIMIT 1),
  'You should immediately click on links in suspicious emails to verify their legitimacy.',
  'true_false',
  '["True", "False"]',
  '"False"',
  10,
  2
),
(
  (SELECT id FROM activities WHERE title = 'Security Assessment Quiz' LIMIT 1),
  'Under GDPR, which rights do individuals have regarding their personal data?',
  'multi_select',
  '["Right to access", "Right to rectification", "Right to erasure", "Right to sell data", "Right to data portability"]',
  '["Right to access", "Right to rectification", "Right to erasure", "Right to data portability"]',
  20,
  3
);

-- Create sample declarations
INSERT INTO declarations (activity_id, declaration_text, requires_signature) VALUES
(
  (SELECT id FROM activities WHERE title = 'Safety Compliance Declaration' LIMIT 1),
  'I acknowledge that I have completed the Workplace Safety Fundamentals training and understand my responsibilities to maintain a safe work environment. I commit to following all safety protocols and procedures outlined in this training.',
  false
);

-- Note: All passwords in this sample data are hashed versions of "password"
-- In production, use strong, unique passwords and proper password hashing