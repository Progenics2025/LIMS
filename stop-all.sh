#!/bin/bash

# =====================================================
# LeadLab LIMS - Stop All Services Script
# =====================================================
# Stops only LeadLab LIMS services (preserves other tunnels)
# Key Feature: Won't kill other running tunnels like AskEVO, MyDay, etc.
# =====================================================

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

echo -e "${BLUE}=====================================================\n"
echo -e "    🛑 Stopping $APP_NAME Services"
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

# 1. Stop LeadLab LIMS Application (port 4000 only)
echo -e "\n${YELLOW}[1/2] Stopping $APP_NAME on port $APP_PORT...${NC}"
if check_port $APP_PORT; then
    # Get PIDs using port 4000
    PIDS=$(lsof -ti :$APP_PORT 2>/dev/null)
    if [ -n "$PIDS" ]; then
        echo -e "${YELLOW}Killing processes on port $APP_PORT: $PIDS${NC}"
        echo "$PIDS" | xargs kill -9 2>/dev/null
        sleep 1
    fi
    
    # Also try to kill from PID file if exists
    if [ -f "$PROJECT_DIR/.lims-app.pid" ]; then
        PID=$(cat "$PROJECT_DIR/.lims-app.pid")
        if ps -p $PID > /dev/null 2>&1; then
            kill -9 $PID 2>/dev/null
        fi
        rm -f "$PROJECT_DIR/.lims-app.pid"
    fi
    
    echo -e "${GREEN}✅ $APP_NAME stopped${NC}"
else
    echo -e "${GREEN}✅ $APP_NAME was not running${NC}"
fi

# Clean up PID file
rm -f "$PROJECT_DIR/.lims-app.pid"

# 2. Stop ONLY this specific tunnel (NOT other tunnels)
echo -e "\n${YELLOW}[2/2] Stopping Cloudflare Tunnel ($TUNNEL_UUID)...${NC}"
# Find process running this specific UUID
TUNNEL_PIDS=$(pgrep -f "cloudflared.*tunnel.*run.*$TUNNEL_UUID" 2>/dev/null)
if [ -n "$TUNNEL_PIDS" ]; then
    echo -e "${YELLOW}Killing tunnel process: $TUNNEL_PIDS${NC}"
    echo "$TUNNEL_PIDS" | xargs kill -9 2>/dev/null
    sleep 1
    echo -e "${GREEN}✅ Tunnel stopped${NC}"
else
    echo -e "${GREEN}✅ Tunnel was not running${NC}"
fi

# Also try to kill from PID file if exists
if [ -f "$PROJECT_DIR/.lims-tunnel.pid" ]; then
    PID=$(cat "$PROJECT_DIR/.lims-tunnel.pid")
    if ps -p $PID > /dev/null 2>&1; then
        kill -9 $PID 2>/dev/null
    fi
    rm -f "$PROJECT_DIR/.lims-tunnel.pid"
fi

# Clean up PID file
rm -f "$PROJECT_DIR/.lims-tunnel.pid"

# Summary
echo -e "\n${BLUE}=====================================================\n"
echo -e "    ✅ $APP_NAME Services Stopped"
echo -e "\n=====================================================${NC}"

# Show remaining active services
echo -e "\n${GREEN}📊 Other Services Still Running:${NC}"

# Check for other tunnels
echo -e "\n${YELLOW}Active Cloudflare Tunnels:${NC}"
if pgrep -f "cloudflared.*tunnel" > /dev/null 2>&1; then
    pgrep -af "cloudflared.*tunnel.*run" | grep -v "grep" | while read -r line; do
        echo -e "  • $line"
    done
else
    echo -e "  • No tunnels running"
fi

# Check for other apps on common ports
echo -e "\n${YELLOW}Active Application Ports:${NC}"
for port in 3001 5173 5000 11434; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        case $port in
            3001) echo -e "  • Port $port: ✅ Running (AskEVO Backend)" ;;
            5173) echo -e "  • Port $port: ✅ Running (AskEVO Frontend)" ;;
            5000) echo -e "  • Port $port: ✅ Running (MyDay)" ;;
            11434) echo -e "  • Port $port: ✅ Running (Ollama)" ;;
            *) echo -e "  • Port $port: ✅ Running" ;;
        esac
    fi
done

echo -e "\n${YELLOW}💡 Note: PostgreSQL is NOT stopped to preserve other app data${NC}\n"
