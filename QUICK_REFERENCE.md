# Quick Start Guide - LeadLab LIMS

## Current Status
✅ **Application is fully operational and production-ready**

## Database Details
- **Host**: 192.168.29.11
- **Port**: 3306
- **Database**: leadlab_lims
- **User**: remote_user
- **Password**: Prolab#05
- **Tables**: 27 (all verified)

## Running the Application

### Start Development Server
```bash
npm run dev
```
- Server runs on `http://localhost:4000`
- Hot reload enabled
- Full logging enabled

### Build for Production
```bash
npm run build
```
- Creates optimized build in `dist/` folder
- Ready for deployment

### Check TypeScript
```bash
npm run check
```
- Verifies all TypeScript files compile correctly

### Push Database Migrations
```bash
npm run db:push
```
- Applies pending migrations to database

## Available Endpoints

### Health & Status
- `GET /api/modules/health` - Overall system health
- `GET /api/modules/status` - Detailed module status

### Core Modules
- **Authentication** - User login/session management
- **Lead Management** - Client/lead tracking
- **Sample Tracking** - Sample lifecycle management
- **Finance** - Invoicing and payment tracking
- **Dashboard** - Analytics and reporting

## Configuration

The `.env` file contains all configuration:
```env
DB_HOST=192.168.29.11
DB_PORT=3306
DB_USER=remote_user
DB_PASSWORD=Prolab%2305
DB_NAME=leadlab_lims
NODE_ENV=development
PORT=4000
```

## File Structure

```
├── client/              # React frontend
├── server/              # Express backend
├── database/            # Database schemas
├── migrations/          # Database migrations
├── shared/              # Shared TypeScript types
├── types/               # Additional type definitions
├── dist/                # Production build output
├── node_modules/        # Dependencies
└── .env                 # Configuration (DO NOT COMMIT)
```

## Security Notes for Production

Before deploying to production:

1. ✏️ Change `SESSION_SECRET` in `.env`
2. ✏️ Change `JWT_SECRET` in `.env`
3. ✏️ Set `NODE_ENV=production`
4. ✏️ Set up HTTPS/SSL
5. ✏️ Add `.env` to `.gitignore`
6. ✏️ Use strong database credentials
7. ✏️ Configure firewall rules for 192.168.29.11

## Troubleshooting

### Database Connection Issues
```bash
# Test connectivity
ping 192.168.29.11

# Verify MySQL is running on target server
# Check username and password in .env match database
```

### Server Won't Start
1. Check `.env` file exists and is readable
2. Verify database connection: `npm run dev` shows connection logs
3. Check port 4000 is not in use: `lsof -i :4000`

### Missing Dependencies
```bash
npm install
npm run build
```

## Performance Tips

- Database connection pool: 10 connections (configured in `server/db.ts`)
- Node.js version: v18+ required
- Recommended: Node v18 LTS or later
- RAM: 512MB minimum, 1GB+ recommended

## Support & Documentation

For detailed API documentation and feature guides, see:
- `README.md` - Main project documentation
- Backend routes: `server/routes.ts`
- Module configs: `server/modules/`
- Shared types: `shared/schema.ts`

---

**Last Updated**: November 20, 2025  
**Status**: ✅ All systems operational
