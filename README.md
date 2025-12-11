# LeadLab LIMS - Enhanced Laboratory Information Management System

A comprehensive Laboratory Information Management System (LIMS) designed to handle all aspects of laboratory operations including lead management, sample tracking, lab processing, financial management, and client management. The system includes advanced Excel import capabilities for seamless data migration from SharePoint sheets.

## 🚀 Features

### Core LIMS Functionality
- **Lead Management**: Track potential clients, quotes, and conversions
- **Sample Tracking**: Complete sample lifecycle from collection to delivery
- **Lab Processing**: DNA/RNA extraction, QC, sequencing workflow
- **Report Management**: Generate and deliver test reports
- **Financial Management**: Invoices, payments, pricing, and revenue tracking
- **Client Management**: Organization details, contact management
- **Logistics Tracking**: Courier and delivery management
- **Sales Activities**: Call tracking, follow-ups, and outcomes

### Advanced Import System
- **SharePoint Excel Import**: Import data from multiple Excel sheets
- **Smart Column Mapping**: Automatic detection of common header variations
- **Data Validation**: Comprehensive error checking and reporting
- **Batch Processing**: Import large datasets efficiently

### User Management
- **Role-based Access**: Sales, Operations, Finance, Lab, Bioinformatics, Reporting, Manager, Admin
 - **Role-based Access**: Sales, Operations, Finance, Lab, Bioinformatics, Reporting, Nutritionist, Manager, Admin
- **Authentication**: Secure login system
- **Dashboard**: Real-time statistics and notifications

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: MySQL 8.0+
- **ORM**: Drizzle ORM
- **Excel Processing**: xlsx library
- **Build Tool**: Vite, esbuild

## 📋 Prerequisites

- Node.js v18+ and npm
- MySQL 8.0+ server
- Windows/Linux/macOS

## 🗄️ Database Schema

### Core Tables

#### Users
```sql
users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL, -- sales, operations, finance, lab, bioinformatics, reporting, nutritionist, manager, admin
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
)
```

#### Leads (Enhanced)
```sql
leads (
  id VARCHAR(36) PRIMARY KEY,
  organization VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  referred_doctor VARCHAR(255) NOT NULL,
  clinic_hospital_name VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  sample_type VARCHAR(255) NOT NULL,
  amount_quoted DECIMAL(10,2) NOT NULL,
  tat INT NOT NULL, -- days
  status VARCHAR(50) DEFAULT 'quoted', -- quoted, converted, closed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  converted_at TIMESTAMP,
  -- Additional fields from Excel sheets
  source VARCHAR(100), -- referral source
  priority VARCHAR(50), -- high, medium, low
  notes TEXT,
  follow_up_date TIMESTAMP,
  assigned_to VARCHAR(36),
  lead_type VARCHAR(50), -- new, existing, referral
  expected_revenue DECIMAL(10,2),
  probability INT -- percentage
)
```

#### Samples (Enhanced)
```sql
samples (
  id VARCHAR(36) PRIMARY KEY,
  sample_id VARCHAR(64) NOT NULL UNIQUE,
  lead_id VARCHAR(36) NOT NULL,
  status VARCHAR(50) DEFAULT 'pickup_scheduled', -- pickup_scheduled, in_transit, received, lab_processing, bioinformatics, reporting, completed
  courier_details JSON,
  amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Additional fields from Excel sheets
  sample_type VARCHAR(100),
  collection_date TIMESTAMP,
  received_date TIMESTAMP,
  patient_name VARCHAR(255),
  patient_age INT,
  patient_gender VARCHAR(10),
  clinical_history TEXT,
  special_instructions TEXT,
  sample_volume VARCHAR(50),
  sample_condition VARCHAR(100),
  test_panel VARCHAR(255),
  urgency VARCHAR(50), -- routine, urgent, stat
  priority VARCHAR(50)
)
```

#### Lab Processing (Enhanced)
```sql
lab_processing (
  id VARCHAR(36) PRIMARY KEY,
  sample_id VARCHAR(36) NOT NULL,
  lab_id VARCHAR(100) NOT NULL,
  qc_status VARCHAR(100), -- passed, failed, retest_required
  dna_rna_quantity DECIMAL(8,2),
  run_id VARCHAR(100),
  library_prepared BOOLEAN DEFAULT false,
  sequencing_id VARCHAR(100),
  is_outsourced BOOLEAN DEFAULT false,
  outsource_details JSON,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_by VARCHAR(36),
  -- Additional fields from Excel sheets
  sample_type VARCHAR(100),
  extraction_method VARCHAR(100),
  concentration DECIMAL(8,2),
  purity DECIMAL(5,2),
  volume DECIMAL(8,2),
  quality_score VARCHAR(50),
  processing_notes TEXT,
  equipment_used VARCHAR(255),
  reagents JSON,
  processing_time INT, -- minutes
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2)
)
```

#### Reports (Enhanced)
```sql
reports (
  id VARCHAR(36) PRIMARY KEY,
  sample_id VARCHAR(36) NOT NULL,
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, awaiting_approval, approved, delivered
  report_path VARCHAR(500),
  generated_at TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by VARCHAR(36),
  delivered_at TIMESTAMP,
  -- Additional fields from Excel sheets
  report_type VARCHAR(100),
  report_format VARCHAR(50), -- pdf, excel, word
  findings TEXT,
  recommendations TEXT,
  clinical_interpretation TEXT,
  technical_notes TEXT,
  quality_control JSON,
  validation_status VARCHAR(50),
  report_version VARCHAR(20),
  delivery_method VARCHAR(50), -- email, portal, courier
  recipient_email VARCHAR(255)
)
```

### New Tables for Enhanced Functionality

#### Finance Records
```sql
finance_records (
  id VARCHAR(36) PRIMARY KEY,
  sample_id VARCHAR(36),
  lead_id VARCHAR(36),
  invoice_number VARCHAR(100) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, partial, paid, overdue
  payment_method VARCHAR(50),
  payment_date TIMESTAMP,
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  currency VARCHAR(10) DEFAULT 'INR',
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_reason VARCHAR(255),
  billing_address TEXT,
  billing_contact VARCHAR(255),
  payment_terms VARCHAR(100),
  late_fees DECIMAL(10,2) DEFAULT 0,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refund_reason VARCHAR(255),
  notes TEXT
)
```

#### Logistics Tracking
```sql
logistics_tracking (
  id VARCHAR(36) PRIMARY KEY,
  sample_id VARCHAR(36),
  tracking_number VARCHAR(100),
  courier_name VARCHAR(100),
  pickup_date TIMESTAMP,
  estimated_delivery TIMESTAMP,
  actual_delivery TIMESTAMP,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, picked_up, in_transit, delivered, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pickup_address TEXT,
  delivery_address TEXT,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(50),
  special_instructions TEXT,
  package_weight DECIMAL(8,2),
  package_dimensions VARCHAR(100),
  insurance_amount DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  tracking_updates JSON,
  delivery_notes TEXT
)
```

#### Pricing
```sql
pricing (
  id VARCHAR(36) PRIMARY KEY,
  test_name VARCHAR(255) NOT NULL,
  test_code VARCHAR(50) UNIQUE,
  base_price DECIMAL(10,2) NOT NULL,
  discounted_price DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'INR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  description TEXT,
  turnaround_time INT, -- days
  sample_requirements TEXT,
  methodology VARCHAR(255),
  accreditation VARCHAR(255),
  valid_from TIMESTAMP,
  valid_to TIMESTAMP,
  notes TEXT
)
```

#### Sales Activities
```sql
sales_activities (
  id VARCHAR(36) PRIMARY KEY,
  lead_id VARCHAR(36),
  activity_type VARCHAR(50) NOT NULL, -- call, email, meeting, follow_up, proposal
  description TEXT,
  outcome VARCHAR(100),
  next_action VARCHAR(255),
  scheduled_date TIMESTAMP,
  completed_date TIMESTAMP,
  assigned_to VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration INT, -- minutes
  priority VARCHAR(50),
  status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, completed, cancelled
  notes TEXT,
  attachments JSON
)
```

#### Clients
```sql
clients (
  id VARCHAR(36) PRIMARY KEY,
  organization_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  pincode VARCHAR(20),
  client_type VARCHAR(50), -- individual, hospital, clinic, corporate
  registration_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  gst_number VARCHAR(50),
  pan_number VARCHAR(50),
  credit_limit DECIMAL(10,2),
  payment_terms VARCHAR(100),
  assigned_sales_rep VARCHAR(36),
  notes TEXT,
  tags JSON
)
```

#### Notifications
```sql
notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(100) NOT NULL, -- lead_converted, payment_pending, report_ready, etc.
  is_read BOOLEAN DEFAULT false,
  related_id VARCHAR(36), -- related lead, sample, or report ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd LIMS-main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Configuration

#### Option A: Using Environment Variables
Create a `.env` file in the root directory:
```env
# Database Configuration
DATABASE_URL=mysql://username:password@host:port/database_name
# OR use individual variables:
DB_HOST=192.168.29.12
DB_PORT=3306
DB_USER=remote_user
DB_PASSWORD=your_password
DB_NAME=leadlab_lims

# Application Configuration
NODE_ENV=development
PORT=3000

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

#### Option B: Using config.env
Copy the provided `config.env` file and update the values:
```env
# LeadLab LIMS Environment Configuration
DATABASE_URL=mysql://remote_user:YOUR_PASSWORD@192.168.29.12:3306/leadlab_lims

# Application Configuration
NODE_ENV=development
PORT=3000

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

### 4. Database Setup

#### Automated Setup (Recommended)
```bash
npm run db:push
```

#### Manual Setup
1. Connect to your MySQL server:
```bash
mysql -h 192.168.29.12 -u remote_user -p
```

2. Create the database:
```sql
CREATE DATABASE leadlab_lims;
USE leadlab_lims;
```

3. Run the schema file:
```bash
mysql -h 192.168.29.12 -u remote_user -p leadlab_lims < database_schema.sql
```

### 5. Start the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

The application will be available at `http://localhost:3000`

## 🔐 Default Login

- **Email**: `admin@lims.com`
- **Password**: `admin123`

## 📊 SharePoint Excel Import System

### Supported File Types
The system can import data from various Excel files:

1. **Lead Sheets**: `Lead_sheet_shubham.xlsx`, `Refrens leads.xlsx`
2. **Finance Records**: `Lab_Finance.xlsx`
3. **Pricing Data**: `Progenics pricelist(Final_pricelist).xlsx`
4. **Client Information**: `Daily Client Report.xlsx`
5. **Lab Processing**: `Lab process_Clinical_Samples.xlsx`, `Lab process_Discovery Samples.xlsx`
6. **Reports**: `Lab_Report sheet_(Clinical samples).xlsx`

### Import Process

#### 1. Scan Excel Files
- Navigate to Admin Panel → SharePoint Sheets
- Click "Scan" to analyze all Excel files in the `sharepoint sheets` folder
- Review file names, sheet names, and column headers

#### 2. Import Data
Use the appropriate importer for each data type:

**Leads Import**:
- File: `Lead_sheet_shubham.xlsx`
- Maps: Organization, Doctor, Phone, Email, Test Name, Amount, TAT
- Deduplicates by email + phone

**Finance Import**:
- File: `Lab_Finance.xlsx`
- Maps: Invoice Number, Amount, Tax, Payment Status, Payment Method
- Creates finance records with proper relationships

**Pricing Import**:
- File: `Progenics pricelist(Final_pricelist).xlsx`
- Maps: Test Name, Price, Category, Description, Turnaround Time
- Creates pricing catalog

**Client Import**:
- File: `Daily Client Report.xlsx`
- Maps: Organization, Contact Person, Email, Phone, Address
- Creates client records

### Smart Column Mapping
The system automatically detects common header variations:

| Data Type | Supported Headers |
|-----------|-------------------|
| Organization | Organization, Clinic/Company, Clinic Name, Hospital/Clinic Name |
| Contact | Phone, Contact, Mobile, Phone Number |
| Email | Email, Email ID, Client Email, Customer Email |
| Amount | Amount, Base Amount, Price, Cost, Quoted Amount |
| Test | Test Name, Test, Panel, Product, Service |
| Date | Date, Created Date, Registration Date, Payment Date |

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### User Management
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user

### Lead Management
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create lead
- `POST /api/leads/:id/convert` - Convert lead to sample

### Sample Management
- `GET /api/samples` - Get all samples
- `PUT /api/samples/:id` - Update sample

### Lab Processing
- `GET /api/lab-processing` - Get lab processing queue
- `POST /api/lab-processing` - Create lab processing record

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Create report
- `PUT /api/reports/:id/approve` - Approve report

### Finance
- `GET /api/finance/records` - Get finance records
- `POST /api/finance/records` - Create finance record
- `GET /api/finance/stats` - Get finance statistics

### Logistics
- `GET /api/logistics` - Get logistics tracking
- `POST /api/logistics` - Create logistics record

### Pricing
- `GET /api/pricing` - Get pricing data
- `POST /api/pricing` - Create pricing record

### Sales Activities
- `GET /api/sales/activities` - Get sales activities
- `POST /api/sales/activities` - Create sales activity

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create client

### SharePoint Import
- `GET /api/sharepoint/scan` - Scan Excel files
- `POST /api/sharepoint/import/leads` - Import leads
- `POST /api/sharepoint/import/finance` - Import finance records
- `POST /api/sharepoint/import/pricing` - Import pricing
- `POST /api/sharepoint/import/clients` - Import clients

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Notifications
- `GET /api/notifications/:userId` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## 🔧 Development

### Project Structure
```
LIMS-main/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
├── server/                # Node.js backend
│   ├── db.ts             # Database configuration
│   ├── storage.ts        # Data access layer
│   ├── routes.ts         # API routes
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema definitions
├── sharepoint sheets/    # Excel files for import
└── package.json          # Dependencies and scripts
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run check` - Type checking

### Environment Variables
- `DATABASE_URL` - MySQL connection string
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `NODE_ENV` - Environment (development/production)
- `PORT` - Application port
- `SESSION_SECRET` - Session encryption key

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
**Error**: `Access denied for user 'remote_user'@'IP'`
**Solution**: 
- Verify MySQL server is running
- Check user permissions
- Ensure IP is whitelisted in MySQL
- Verify credentials in `.env` file

#### 2. Port Already in Use
**Error**: `EADDRINUSE: address already in use`
**Solution**:
- Change PORT in `.env` file
- Kill existing process: `netstat -ano | findstr :3000`

#### 3. Excel Import Fails
**Error**: `File not found`
**Solution**:
- Ensure Excel files are in `sharepoint sheets` folder
- Check file permissions
- Verify file names match exactly

#### 4. Schema Push Fails
**Error**: `ER_ACCESS_DENIED_ERROR`
**Solution**:
- Grant CREATE privileges to database user
- Check database connection settings
- Verify database exists

### Windows-Specific Issues

#### PowerShell Execution Policy
If npm commands fail:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Node.js Path Issues
Add Node.js to PATH:
```powershell
$env:PATH += ";C:\Program Files\nodejs"
```

## 📈 Performance Optimization

### Database
- Use indexes on frequently queried columns
- Optimize queries with proper joins
- Use connection pooling (already configured)

### Application
- Enable compression for static assets
- Use caching for frequently accessed data
- Implement pagination for large datasets

## 🔒 Security Considerations

### Production Deployment
1. Change default admin password
2. Use strong session secrets
3. Enable HTTPS
4. Set up proper firewall rules
5. Regular security updates
6. Database backup strategy

### Data Protection
- Encrypt sensitive data
- Implement proper access controls
- Regular security audits
- GDPR compliance for patient data

## 📞 Support

For technical support or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check database logs for errors
4. Verify Excel file formats

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**LeadLab LIMS** - Streamlining laboratory operations with comprehensive data management and Excel import capabilities.

