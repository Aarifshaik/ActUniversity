import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkData() {
  console.log('🔍 Checking database data...\n');

  try {
    // Check employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('emp_id, full_name, role, is_active');

    if (empError) {
      console.error('❌ Error fetching employees:', empError);
    } else {
      console.log(`👥 Employees (${employees.length}):`);
      employees.forEach(emp => {
        console.log(`  - ${emp.emp_id}: ${emp.full_name} (${emp.role}) - ${emp.is_active ? 'Active' : 'Inactive'}`);
      });
    }

    // Check courses
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('title, category, is_published, difficulty_level');

    if (courseError) {
      console.error('❌ Error fetching courses:', courseError);
    } else {
      console.log(`\n📚 Courses (${courses.length}):`);
      courses.forEach(course => {
        console.log(`  - ${course.title} (${course.category}) - ${course.is_published ? 'Published' : 'Draft'} - ${course.difficulty_level}`);
      });
    }

    // Check activities
    const { data: activities, error: actError } = await supabase
      .from('activities')
      .select('title, activity_type, course_id');

    if (actError) {
      console.error('❌ Error fetching activities:', actError);
    } else {
      console.log(`\n🎯 Activities (${activities.length}):`);
      activities.forEach(activity => {
        console.log(`  - ${activity.title} (${activity.activity_type})`);
      });
    }

  } catch (error) {
    console.error('❌ Database connection error:', error);
  }
}

checkData();