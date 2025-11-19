-- First, create the user if it doesn't exist
CREATE USER IF NOT EXISTS 'remote_user'@'%' IDENTIFIED BY 'Prolab%2305';

-- Grant all privileges on the leadlab_lims database
GRANT ALL PRIVILEGES ON leadlab_lims.* TO 'remote_user'@'%';

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS leadlab_lims;

-- Make sure the privileges are applied
FLUSH PRIVILEGES;