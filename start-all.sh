#!/bin/bash

# =====================================================
# LeadLab LIMS - Start All Services Script
# =====================================================
# Starts PostgreSQL, LeadLab LIMS app (port 4000), and lims-tunnel
# Key Feature: Won't affect other running tunnels (AskEVO, MyDay, etc.)
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="LeadLab_LIMS"
APP_PORT=4000
TUNNEL_UUID="5a894518-56e6-4784-84a7-3f9025bac047"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$PROJECT_DIR/cloudflared/config.yml"

echo -e "${BLUE}=====================================================\n"
echo -e "    🚀 Starting $APP_NAME Services"
echo -e "\n=====================================================${NC}"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# 1. Check/Start PostgreSQL
echo -e "\n${YELLOW}[1/3] Checking PostgreSQL...${NC}"
if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✅ PostgreSQL is already running${NC}"
else
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    sudo systemctl start postgresql
    sleep 2
    if systemctl is-active --quiet postgresql; then
        echo -e "${GREEN}✅ PostgreSQL started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start PostgreSQL${NC}"
        exit 1
    fi
fi

# 2. Start LeadLab LIMS Application
echo -e "\n${YELLOW}[2/3] Starting $APP_NAME on port $APP_PORT...${NC}"
if check_port $APP_PORT; then
    echo -e "${GREEN}✅ $APP_NAME is already running on port $APP_PORT${NC}"
else
    cd "$PROJECT_DIR"
    echo -e "${YELLOW}Running npm run dev in background...${NC}"
    nohup npm run dev > "$PROJECT_DIR/app.log" 2>&1 &
    echo $! > "$PROJECT_DIR/.lims-app.pid"
    
    # Wait for app to start
    echo -e "${YELLOW}Waiting for app to start...${NC}"
    for i in {1..30}; do
        if check_port $APP_PORT; then
            echo -e "${GREEN}✅ $APP_NAME started successfully on port $APP_PORT${NC}"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ $APP_NAME failed to start within 30 seconds${NC}"
            echo -e "${YELLOW}Check $PROJECT_DIR/app.log for errors${NC}"
            exit 1
        fi
    done
fi

# 3. Start Cloudflare Tunnel
echo -e "\n${YELLOW}[3/3] Starting Cloudflare Tunnel ($TUNNEL_UUID)...${NC}"
# Check if this specific tunnel UUID is running
if pgrep -f "cloudflared.*tunnel.*run.*$TUNNEL_UUID" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Tunnel $TUNNEL_UUID is already running${NC}"
else
    echo -e "${YELLOW}Starting Tunnel...${NC}"
    # Use the local config file we created
    nohup cloudflared --config "$CONFIG_FILE" tunnel run "$TUNNEL_UUID" > "$PROJECT_DIR/tunnel.log" 2>&1 &
    echo $! > "$PROJECT_DIR/.lims-tunnel.pid"
    sleep 3
    
    if pgrep -f "cloudflared.*tunnel.*run.*$TUNNEL_UUID" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Tunnel started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start Tunnel${NC}"
        echo -e "${YELLOW}Check $PROJECT_DIR/tunnel.log for errors${NC}"
    fi
fi

# Summary
echo -e "\n${BLUE}=====================================================\n"
echo -e "    ✅ $APP_NAME Services Started Successfully!"
echo -e "\n=====================================================${NC}"
echo -e "\n${GREEN}📊 Service Status:${NC}"
echo -e "  • PostgreSQL:    $(systemctl is-active postgresql)"
echo -e "  • $APP_NAME:     Port $APP_PORT"
echo -e "  • Tunnel ID:     $TUNNEL_UUID"
echo -e "\n${GREEN}🌐 Access URLs:${NC}"
echo -e "  • Local:         http://localhost:$APP_PORT"
echo -e "  • Production:    https://lims.progenicslabs.com"
echo -e "\n${YELLOW}📁 Logs:${NC}"
echo -e "  • App Log:       $PROJECT_DIR/app.log"
echo -e "  • Tunnel Log:    $PROJECT_DIR/tunnel.log"
echo -e "\n${YELLOW}💡 To stop services: ./stop-all.sh${NC}\n"
