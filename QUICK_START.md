# 🚀 LeadLab LIMS Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- MySQL client installed
- Access to MySQL server at `192.168.29.12`

## 🎯 Quick Setup (Recommended)

### 1. Run the Automated Setup
```bash
./setup_app.sh
```
This script will:
- ✅ Check prerequisites
- 📦 Install dependencies
- 🔧 Setup environment configuration
- 🗄️ Setup database (optional)
- 🔄 Generate migrations
- 🔨 Build the application

### 2. Manual Setup (Alternative)

#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Configure Environment
```bash
cp config.env .env
# Edit .env and set your MySQL password
```

#### Step 3: Setup Database
```bash
./setup_database.sh
```

#### Step 4: Generate Migrations
```bash
npm run db:push
```

#### Step 5: Build Application
```bash
npm run build
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```
- Server runs on http://localhost:3000
- Hot reload enabled
- Database connection from .env

### Production Mode
```bash
npm run start
```
- Uses built files from `dist/` folder
- Optimized for production

## 🔧 Configuration

### Database Connection
Update `.env` file:
```env
DATABASE_URL=mysql://remote_user:YOUR_PASSWORD@192.168.29.12:3306/leadlab_lims
```

### Environment Variables
- `NODE_ENV`: development/production
- `PORT`: Server port (default: 3000)
- `SESSION_SECRET`: Session encryption key

## 📊 Database Schema

The application uses these main tables:
- **Users** - Authentication and user management
- **Leads** - Client leads and test requests
- **Samples** - Sample tracking
- **Lab Processing** - Laboratory workflow
- **Reports** - Test report management
- **Notifications** - System alerts

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL server is running
   - Verify credentials in .env
   - Ensure network access to 192.168.29.12

2. **Build Failed**
   - Check Node.js version (18+ required)
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

3. **Port Already in Use**
   - Change PORT in .env
   - Kill existing process: `lsof -ti:3000 | xargs kill -9`

### Useful Commands

```bash
# Check database connection
mysql -h 192.168.29.12 -u remote_user -p

# View logs
npm run dev

# Reset database
./setup_database.sh

# Generate new migrations
npm run db:push
```

## 📚 Additional Resources

- **Database Setup**: `DATABASE_SETUP.md`
- **Configuration**: `config.env`
- **Schema**: `shared/schema.ts`
- **API Routes**: `server/routes.ts`

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review error logs in the terminal
3. Verify all prerequisites are installed
4. Ensure database server is accessible

---

**Happy coding! 🎉**

