#!/bin/bash

# LeadLab LIMS Application Setup Script
# This script will set up the entire application including database and dependencies

echo "🚀 Setting up LeadLab LIMS Application..."
echo "=========================================="

# Step 1: Check if Node.js is installed
echo "📋 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Step 2: Check if MySQL client is installed
echo "📋 Checking MySQL client installation..."
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL client is not installed. Please install mysql-client first."
    echo "   Ubuntu/Debian: sudo apt-get install mysql-client"
    echo "   CentOS/RHEL: sudo yum install mysql"
    exit 1
fi

echo "✅ MySQL client is installed"

# Step 3: Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Step 4: Setup environment file
echo "🔧 Setting up environment configuration..."
if [ ! -f .env ]; then
    echo "📝 Creating .env file from config.env..."
    cp config.env .env
    echo "⚠️  Please edit .env file and set your MySQL password!"
    echo "   Update DATABASE_URL with your actual password"
else
    echo "✅ .env file already exists"
fi

# Step 5: Setup database
echo "🗄️  Setting up database..."
echo "   This will create the database and tables on your MySQL server"
echo "   Make sure your .env file has the correct DATABASE_URL"

read -p "   Do you want to run the database setup now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./setup_database.sh
    if [ $? -eq 0 ]; then
        echo "✅ Database setup completed"
    else
        echo "❌ Database setup failed. Please check your configuration."
        exit 1
    fi
else
    echo "⏭️  Skipping database setup. Run './setup_database.sh' manually later."
fi

# Step 6: Generate Drizzle migrations
echo "🔄 Generating database migrations..."
npm run db:push

if [ $? -eq 0 ]; then
    echo "✅ Database migrations generated"
else
    echo "⚠️  Database migrations failed. This might be expected if the database isn't set up yet."
fi

# Step 7: Build the application
echo "🔨 Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Application built successfully"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🎉 LeadLab LIMS Application Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env file with your MySQL password"
echo "2. Run database setup: ./setup_database.sh"
echo "3. Start development server: npm run dev"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "🔧 Useful Commands:"
echo "   npm run dev          - Start development server"
echo "   npm run build        - Build for production"
echo "   npm run start        - Start production server"
echo "   npm run db:push      - Push database schema changes"
echo ""
echo "📚 Documentation:"
echo "   - Database setup: DATABASE_SETUP.md"
echo "   - Configuration: config.env"
echo ""
echo "🚀 Happy coding!"

