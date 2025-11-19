#!/bin/bash

# Database configuration
DB_HOST="192.168.29.12"
DB_USER="remote_user"
DB_NAME="leadlab_lims"

# Function to execute SQL file
execute_sql_file() {
    local file=$1
    echo "Executing $file..."
    mysql -h "$DB_HOST" -u "$DB_USER" -p "$DB_NAME" < "$file"
}

# Create database and tables
echo "Setting up database schema..."
execute_sql_file "database/schema.sql"

# Create admin user
echo "Creating admin user..."
execute_sql_file "database/admin_user.sql"

echo "Database setup completed!"
