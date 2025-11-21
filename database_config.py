# LeadLab LIMS Database Configuration
# Update these values according to your MySQL server settings

DATABASE_CONFIG = {
    'host': '192.168.29.11',
    'user': 'remote_user',
    'password': 'Prolab#05',  # Set your password here
    'database': 'lead_lims2',
    'port': 3306,
    'charset': 'utf8mb4',
    'autocommit': True,
    'pool_size': 10,
    'max_overflow': 20
}

# Connection string for SQLAlchemy (if using ORM)
DATABASE_URL = f"mysql+pymysql://{DATABASE_CONFIG['user']}:{DATABASE_CONFIG['password']}@{DATABASE_CONFIG['host']}:{DATABASE_CONFIG['port']}/{DATABASE_CONFIG['database']}?charset={DATABASE_CONFIG['charset']}"

# Environment variable names for secure configuration
ENV_VARS = {
    'DB_HOST': 'DB_HOST',
    'DB_USER': 'DB_USER', 
    'DB_PASSWORD': 'DB_PASSWORD',
    'DB_NAME': 'DB_NAME',
    'DB_PORT': 'DB_PORT'
}

# Example usage:
# import os
# from database_config import DATABASE_CONFIG
# 
# # Override with environment variables if available
# DATABASE_CONFIG['host'] = os.getenv('DB_HOST', DATABASE_CONFIG['host'])
# DATABASE_CONFIG['user'] = os.getenv('DB_USER', DATABASE_CONFIG['user'])
# DATABASE_CONFIG['password'] = os.getenv('DB_PASSWORD', DATABASE_CONFIG['password'])

