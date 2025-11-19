-- Create admin user
INSERT INTO users (username, password, name, email, role) VALUES 
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBgRj8sFKlWmwS', 'Administrator', 'admin@leadlab.com', 'admin');

-- The password for this admin account is 'admin123'
-- You should change this password immediately after first login
