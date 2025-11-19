# LeadLab LIMS Database Setup Guide

## Overview
This guide will help you set up the MySQL database for your LeadLab LIMS application on the remote MySQL server.

## Prerequisites
- MySQL client installed on your system
- Access to the remote MySQL server at `192.168.29.12`
- Valid credentials for user `remote_user`

## Database Schema
Your database will include the following tables:
- **users** - User management and authentication
- **leads** - Client leads and test requests
- **samples** - Sample tracking and management
- **lab_processing** - Laboratory workflow tracking
- **reports** - Test report management
- **notifications** - System notifications

## Setup Options

### Option 1: Automated Setup (Recommended)
Run the provided setup script:
```bash
./setup_database.sh
```
This script will:
1. Connect to your MySQL server
2. Create the `leadlab_lims` database
3. Create all required tables
4. Set up proper indexes for performance

### Option 2: Manual Setup
If you prefer to run the commands manually:

1. **Connect to MySQL:**
   ```bash
   mysql -h 192.168.29.12 -u remote_user -p
   ```

2. **Run the schema file:**
   ```bash
   mysql -h 192.168.29.12 -u remote_user -p < database_schema.sql
   ```

### Option 3: Interactive Setup
1. Connect to MySQL:
   ```bash
   mysql -h 192.168.29.12 -u remote_user -p
   ```

2. Copy and paste the contents of `database_schema.sql` into the MySQL prompt

## Verification
After setup, you can verify the database was created correctly:

```sql
-- Connect to MySQL and run:
SHOW DATABASES;
USE leadlab_lims;
SHOW TABLES;
DESCRIBE users;
```

## Database Connection Details
- **Host:** 192.168.29.12
- **User:** remote_user
- **Database:** leadlab_lims
- **Port:** 3306 (default)

## Troubleshooting

### Common Issues:
1. **Access Denied:** Check your username and password
2. **Connection Refused:** Verify the server IP and port
3. **Permission Denied:** Ensure `remote_user` has CREATE privileges

### Required MySQL Privileges:
The `remote_user` needs:
- `CREATE` privilege to create the database
- `CREATE` privilege to create tables
- `INSERT`, `SELECT`, `UPDATE`, `DELETE` for data operations

## Next Steps
After successful database setup:
1. Update your application's database configuration
2. Test the connection
3. Begin populating the database with initial data

## Support
If you encounter any issues during setup, check:
1. MySQL server status
2. Network connectivity to 192.168.29.12
3. User permissions on the MySQL server

