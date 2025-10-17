const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function updatePassword(empId, newPassword) {
  try {
    console.log(`🔄 Updating password for employee: ${empId}`);
    
    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    console.log(`🔐 Generated password hash: ${passwordHash.substring(0, 20)}...`);
    
    // Update the password in database
    const { data, error } = await supabase
      .from('employees')
      .update({ 
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('emp_id', empId)
      .select('emp_id, full_name, email');
    
    if (error) {
      console.error('❌ Database error:', error.message);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.error(`❌ Employee with ID '${empId}' not found`);
      return false;
    }
    
    console.log('✅ Password updated successfully!');
    console.log(`👤 Employee: ${data[0].full_name} (${data[0].email})`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error updating password:', error.message);
    return false;
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.log('📋 Usage: node update-password.js <EMP_ID> <NEW_PASSWORD>');
  console.log('📋 Example: node update-password.js ADMIN001 password');
  process.exit(1);
}

const [empId, newPassword] = args;

// Validate inputs
if (!empId || !newPassword) {
  console.error('❌ Both Employee ID and password are required');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error('❌ Password must be at least 6 characters long');
  process.exit(1);
}

// Run the update
updatePassword(empId, newPassword)
  .then((success) => {
    if (success) {
      console.log('🎉 Password update completed successfully!');
      process.exit(0);
    } else {
      console.log('💥 Password update failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });