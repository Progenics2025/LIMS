-- Create user if not exists and grant permissions
CREATE USER IF NOT EXISTS 'remote_user'@'%' IDENTIFIED BY 'Prolab%2305';
GRANT ALL PRIVILEGES ON leadlab_lims.* TO 'remote_user'@'%';
FLUSH PRIVILEGES;

-- Verify user creation
SELECT user, host FROM mysql.user WHERE user = 'remote_user';