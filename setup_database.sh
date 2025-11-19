#!/bin/bash

# LeadLab LIMS Database Setup Script
# This script will create the database and tables for your LIMS application

echo "Setting up LeadLab LIMS database..."
echo "Connecting to MySQL server at 192.168.29.12..."

# Create the database and run the schema
mysql -h 192.168.29.12 -u remote_user -p < database_schema.sql

if [ $? -eq 0 ]; then
    echo "Database setup completed successfully!"
    echo "Database 'Progenics_lims' has been created with all required tables."
else
    echo "Error: Database setup failed. Please check your MySQL connection and permissions."
    exit 1
fi

