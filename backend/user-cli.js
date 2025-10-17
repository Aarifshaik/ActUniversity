const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Hash password utility
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// List all users
async function listUsers() {
  try {
    console.log('📋 Fetching all employees...\n');
    
    const { data, error } = await supabase
      .from('employees')
      .select('emp_id, full_name, email, role, is_active, last_login_at, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('📭 No employees found');
      return;
    }
    
    console.log('👥 EMPLOYEES LIST:');
    console.log('─'.repeat(80));
    console.log('EMP_ID    | NAME                | EMAIL                    | ROLE  | STATUS');
    console.log('─'.repeat(80));
    
    data.forEach(emp => {
      const status = emp.is_active ? '✅ Active' : '❌ Inactive';
      const lastLogin = emp.last_login_at ? 
        new Date(emp.last_login_at).toLocaleDateString() : 'Never';
      
      console.log(
        `${emp.emp_id.padEnd(9)} | ${emp.full_name.padEnd(19)} | ${emp.email.padEnd(24)} | ${emp.role.padEnd(5)} | ${status}`
      );
    });
    
    console.log('─'.repeat(80));
    console.log(`📊 Total: ${data.length} employees\n`);
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

// Update password
async function updatePassword(empId, newPassword) {
  try {
    console.log(`🔄 Updating password for: ${empId}`);
    
    const passwordHash = await hashPassword(newPassword);
    
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
      console.error(`❌ Employee '${empId}' not found`);
      return false;
    }
    
    console.log('✅ Password updated successfully!');
    console.log(`👤 ${data[0].full_name} (${data[0].email})\n`);
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Create new user
async function createUser(empId, email, fullName, password, role = 'employee') {
  try {
    console.log(`🔄 Creating new employee: ${empId}`);
    
    const passwordHash = await hashPassword(password);
    
    const { data, error } = await supabase
      .from('employees')
      .insert({
        emp_id: empId,
        email: email,
        full_name: fullName,
        password_hash: passwordHash,
        role: role,
        is_active: true
      })
      .select('emp_id, full_name, email, role');
    
    if (error) {
      console.error('❌ Database error:', error.message);
      return false;
    }
    
    console.log('✅ Employee created successfully!');
    console.log(`👤 ${data[0].full_name} (${data[0].email}) - Role: ${data[0].role}\n`);
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Toggle user active status
async function toggleUserStatus(empId) {
  try {
    console.log(`🔄 Toggling status for: ${empId}`);
    
    // First get current status
    const { data: current, error: fetchError } = await supabase
      .from('employees')
      .select('is_active, full_name')
      .eq('emp_id', empId)
      .single();
    
    if (fetchError || !current) {
      console.error(`❌ Employee '${empId}' not found`);
      return false;
    }
    
    const newStatus = !current.is_active;
    
    const { data, error } = await supabase
      .from('employees')
      .update({ 
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('emp_id', empId)
      .select('emp_id, full_name, is_active');
    
    if (error) {
      console.error('❌ Database error:', error.message);
      return false;
    }
    
    const status = newStatus ? '✅ Active' : '❌ Inactive';
    console.log(`✅ Status updated: ${data[0].full_name} is now ${status}\n`);
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Show help
function showHelp() {
  console.log(`
🔧 Act University - User Management CLI

📋 USAGE:
  node user-cli.js <command> [arguments]

📝 COMMANDS:
  list                                    - List all employees
  password <EMP_ID> <NEW_PASSWORD>       - Update employee password
  create <EMP_ID> <EMAIL> <NAME> <PASS>  - Create new employee
  admin <EMP_ID> <EMAIL> <NAME> <PASS>   - Create new admin
  toggle <EMP_ID>                        - Toggle active/inactive status
  help                                   - Show this help

📚 EXAMPLES:
  node user-cli.js list
  node user-cli.js password ADMIN001 newpassword123
  node user-cli.js create EMP004 john@company.com "John Doe" password123
  node user-cli.js admin ADMIN003 admin@company.com "Admin User" adminpass
  node user-cli.js toggle EMP004

⚠️  NOTES:
  - Passwords are automatically hashed with bcrypt
  - Employee IDs must be unique
  - Email addresses must be unique
  - Minimum password length: 6 characters
`);
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    return;
  }
  
  const command = args[0].toLowerCase();
  
  switch (command) {
    case 'list':
      await listUsers();
      break;
      
    case 'password':
      if (args.length !== 3) {
        console.error('❌ Usage: node user-cli.js password <EMP_ID> <NEW_PASSWORD>');
        process.exit(1);
      }
      const success = await updatePassword(args[1], args[2]);
      process.exit(success ? 0 : 1);
      
    case 'create':
      if (args.length !== 5) {
        console.error('❌ Usage: node user-cli.js create <EMP_ID> <EMAIL> <FULL_NAME> <PASSWORD>');
        process.exit(1);
      }
      const created = await createUser(args[1], args[2], args[3], args[4], 'employee');
      process.exit(created ? 0 : 1);
      
    case 'admin':
      if (args.length !== 5) {
        console.error('❌ Usage: node user-cli.js admin <EMP_ID> <EMAIL> <FULL_NAME> <PASSWORD>');
        process.exit(1);
      }
      const adminCreated = await createUser(args[1], args[2], args[3], args[4], 'admin');
      process.exit(adminCreated ? 0 : 1);
      
    case 'toggle':
      if (args.length !== 2) {
        console.error('❌ Usage: node user-cli.js toggle <EMP_ID>');
        process.exit(1);
      }
      const toggled = await toggleUserStatus(args[1]);
      process.exit(toggled ? 0 : 1);
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      console.error(`❌ Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

// Run the CLI
main().catch(error => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
});