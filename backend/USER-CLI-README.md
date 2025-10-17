# 🔧 Act University - User Management CLI

A powerful command-line interface for managing employees in the Act University Learning Management System. This tool provides secure user management with bcrypt password hashing and direct Supabase database integration.

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Commands](#-commands)
- [Examples](#-examples)
- [Security Features](#-security-features)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

### 👥 **User Management**
- **List all employees** with detailed information
- **Create new employees** with automatic password hashing
- **Create admin users** with elevated privileges
- **Update passwords** securely with bcrypt hashing
- **Toggle user status** (active/inactive)

### 🔐 **Security**
- **Bcrypt password hashing** (10 salt rounds)
- **Direct Supabase integration** with service role key
- **Input validation** and error handling
- **Secure credential management**

### 📊 **Information Display**
- **Formatted user listings** with status indicators
- **Role-based identification** (admin/employee)
- **Last login tracking**
- **Account status visualization**

### 🛠️ **Developer Friendly**
- **Simple command syntax**
- **Comprehensive help system**
- **Detailed error messages**
- **Exit codes for scripting**

## 📋 Prerequisites

- **Node.js** 16+ installed
- **Supabase project** set up with Act University schema
- **Backend dependencies** installed (`bcryptjs`, `@supabase/supabase-js`)
- **Environment variables** configured

## 🚀 Installation

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies** (if not already done):
```bash
npm install
```

3. **Ensure environment is configured:**
```bash
# Check that .env file exists with:
# SUPABASE_URL=your-supabase-url
# SUPABASE_SERVICE_KEY=your-service-key
```

## ⚙️ Configuration

The CLI uses the same environment configuration as the backend server:

```env
# Required environment variables in backend/.env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

**Important:** Use the **service role key**, not the anon key, for admin operations.

## 📖 Usage

### Basic Syntax
```bash
node user-cli.js <command> [arguments]
```

### Quick Start
```bash
# Show help
node user-cli.js help

# List all users
node user-cli.js list

# Create admin user
node user-cli.js admin ADMIN001 admin@company.com "System Admin" password123
```

## 📝 Commands

### 1. **`list`** - List All Employees
```bash
node user-cli.js list
```
**Description:** Displays a formatted table of all employees with their details.

**Output includes:**
- Employee ID
- Full Name
- Email Address
- Role (admin/employee)
- Status (Active/Inactive)
- Total count

---

### 2. **`password`** - Update Employee Password
```bash
node user-cli.js password <EMP_ID> <NEW_PASSWORD>
```
**Parameters:**
- `EMP_ID`: Employee ID to update
- `NEW_PASSWORD`: New password (minimum 6 characters)

**Features:**
- Automatic bcrypt hashing
- Password strength validation
- Database update with timestamp

---

### 3. **`create`** - Create New Employee
```bash
node user-cli.js create <EMP_ID> <EMAIL> <FULL_NAME> <PASSWORD>
```
**Parameters:**
- `EMP_ID`: Unique employee identifier
- `EMAIL`: Employee email address (must be unique)
- `FULL_NAME`: Full name (use quotes if contains spaces)
- `PASSWORD`: Initial password

**Features:**
- Creates employee with 'employee' role
- Automatic password hashing
- Email and EMP_ID uniqueness validation

---

### 4. **`admin`** - Create New Admin User
```bash
node user-cli.js admin <EMP_ID> <EMAIL> <FULL_NAME> <PASSWORD>
```
**Parameters:** Same as `create` command

**Features:**
- Creates user with 'admin' role
- Full administrative privileges
- Same security features as regular employee creation

---

### 5. **`toggle`** - Toggle User Active Status
```bash
node user-cli.js toggle <EMP_ID>
```
**Parameters:**
- `EMP_ID`: Employee ID to toggle

**Features:**
- Switches between active/inactive status
- Shows current and new status
- Updates timestamp

---

### 6. **`help`** - Show Help Information
```bash
node user-cli.js help
# or
node user-cli.js --help
# or
node user-cli.js -h
```

## 💡 Examples

### **Basic Operations**
```bash
# List all employees
node user-cli.js list

# Create a regular employee
node user-cli.js create EMP001 john@company.com "John Doe" password123

# Create an admin user
node user-cli.js admin ADMIN001 admin@company.com "System Administrator" adminpass

# Update password
node user-cli.js password EMP001 newpassword456

# Deactivate user
node user-cli.js toggle EMP001
```

### **Batch Operations**
```bash
# Create multiple employees
node user-cli.js create EMP001 john@company.com "John Doe" pass123
node user-cli.js create EMP002 jane@company.com "Jane Smith" pass456
node user-cli.js create EMP003 mike@company.com "Mike Johnson" pass789

# Create admin team
node user-cli.js admin ADMIN001 admin1@company.com "Primary Admin" admin123
node user-cli.js admin ADMIN002 admin2@company.com "Secondary Admin" admin456
```

### **Maintenance Tasks**
```bash
# Reset admin password
node user-cli.js password ADMIN001 newadminpass

# Check all users
node user-cli.js list

# Deactivate terminated employee
node user-cli.js toggle EMP999
```

## 🔐 Security Features

### **Password Security**
- **Bcrypt hashing** with 10 salt rounds
- **Minimum length validation** (6 characters)
- **Secure storage** in database
- **No plaintext passwords** ever stored

### **Database Security**
- **Service role authentication** for admin operations
- **Input sanitization** and validation
- **Error handling** prevents information leakage
- **Audit trail** with timestamps

### **Access Control**
- **Role-based user creation** (employee/admin)
- **Status management** (active/inactive)
- **Unique constraint enforcement** (EMP_ID, email)

## 🔍 Output Examples

### **List Command Output**
```
📋 Fetching all employees...

👥 EMPLOYEES LIST:
────────────────────────────────────────────────────────────────────────────────
EMP_ID    | NAME                | EMAIL                    | ROLE  | STATUS
────────────────────────────────────────────────────────────────────────────────
ADMIN001  | System Administrator | admin@company.com        | admin | ✅ Active
EMP001    | John Doe            | john.doe@company.com     | employee | ✅ Active
EMP002    | Jane Smith          | jane.smith@company.com   | employee | ❌ Inactive
────────────────────────────────────────────────────────────────────────────────
📊 Total: 3 employees
```

### **Password Update Output**
```
🔄 Updating password for: ADMIN001
✅ Password updated successfully!
👤 System Administrator (admin@company.com)
```

### **User Creation Output**
```
🔄 Creating new employee: EMP001
✅ Employee created successfully!
👤 John Doe (john.doe@company.com) - Role: employee
```

## 🛠️ Troubleshooting

### **Common Issues**

#### **"Employee not found" Error**
```bash
❌ Employee with ID 'EMP001' not found
```
**Solution:** Check the employee ID spelling and run `node user-cli.js list` to see existing users.

#### **"Database error" Messages**
```bash
❌ Database error: duplicate key value violates unique constraint
```
**Solutions:**
- **Duplicate EMP_ID:** Use a unique employee ID
- **Duplicate email:** Use a unique email address
- **Connection issues:** Check Supabase credentials in `.env`

#### **Environment Issues**
```bash
❌ Error: Invalid Supabase URL
```
**Solutions:**
1. Check `backend/.env` file exists
2. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set
3. Ensure you're using the service role key, not anon key

### **Validation Errors**

#### **Password Too Short**
```bash
❌ Password must be at least 6 characters long
```
**Solution:** Use a password with 6+ characters.

#### **Missing Arguments**
```bash
❌ Usage: node user-cli.js create <EMP_ID> <EMAIL> <FULL_NAME> <PASSWORD>
```
**Solution:** Provide all required arguments in the correct order.

### **Debug Mode**
For detailed error information, check the console output. The CLI provides comprehensive error messages and suggestions.

## 📚 Integration with Main Application

### **Created Users Can:**
- **Login** to the web application immediately
- **Access role-appropriate features** (employee/admin)
- **Change passwords** through the web interface
- **Be managed** through the admin dashboard

### **Admin Users Can:**
- **Access admin dashboard** at `/admin`
- **Manage courses** and activities
- **View audit logs** and active sessions
- **Force logout** other users
- **Export compliance reports**

## 🔄 Exit Codes

The CLI returns standard exit codes for scripting:

- **`0`** - Success
- **`1`** - Error (user not found, validation failed, database error)

### **Example Script Usage**
```bash
#!/bin/bash
# Create user and check if successful
if node user-cli.js create EMP001 user@company.com "New User" password123; then
    echo "User created successfully"
else
    echo "Failed to create user"
    exit 1
fi
```

## 📞 Support

### **Getting Help**
- Run `node user-cli.js help` for command reference
- Check the main project documentation
- Review Supabase dashboard for database issues

### **Common Workflows**

#### **Initial Setup**
```bash
# 1. Create primary admin
node user-cli.js admin ADMIN001 admin@company.com "System Administrator" securepass

# 2. Create department admins
node user-cli.js admin ADMIN002 hr@company.com "HR Administrator" hrpass
node user-cli.js admin ADMIN003 it@company.com "IT Administrator" itpass

# 3. Verify creation
node user-cli.js list
```

#### **Employee Onboarding**
```bash
# Create new employee
node user-cli.js create EMP001 newemployee@company.com "New Employee" temppass123

# They can login and change password through web interface
```

#### **Employee Offboarding**
```bash
# Deactivate instead of deleting (preserves audit trail)
node user-cli.js toggle EMP001
```

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-14  
**Compatibility:** Node.js 16+, Supabase 2.x