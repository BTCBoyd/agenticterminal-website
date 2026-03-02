#!/bin/bash
# Deploy Agentic Terminal Trends Page
# Usage: ./deploy-trends.sh

echo "🚀 Deploying Agentic Terminal Trends..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "trends.html" ]; then
    echo "❌ Error: trends.html not found. Run from agenticterminal-website directory."
    exit 1
fi

# Copy latest data to website directory
echo "📊 Copying latest metrics data..."
mkdir -p agentic-terminal-data/charts

# Find latest chart directory
LATEST_CHART=$(ls -t ../agentic-terminal-data/charts/ | head -1)
if [ ! -z "$LATEST_CHART" ]; then
    echo "Found latest charts: $LATEST_CHART"
    cp -r ../agentic-terminal-data/charts/$LATEST_CHART agentic-terminal-data/charts/
    cp ../agentic-terminal-data/metrics-history.json agentic-terminal-data/
    echo -e "${GREEN}✓${NC} Data copied successfully"
else
    echo -e "${YELLOW}⚠${NC} No charts found, skipping data copy"
fi

# Check for deployment method
if [ -d ".git" ]; then
    echo ""
    echo "📦 Git repository detected. Deployment options:"
    echo ""
    echo "Option 1: Deploy to Netlify"
    echo "  git add ."
    echo "  git commit -m 'Update trends page with latest data'"
    echo "  git push origin main"
    echo ""
    echo "Option 2: Manual Deploy"
    echo "  1. Zip the website folder"
    echo "  2. Upload to Netlify/Vercel dashboard"
    echo ""
    
    # Stage changes
    git add trends.html agentic-terminal-data/
    
    # Show status
    echo "📋 Git status:"
    git status --short
    
    echo ""
    echo -e "${GREEN}Ready to commit!${NC} Run:"
    echo "  git commit -m 'feat: add trends dashboard with Phase 2 features'"
    echo "  git push"
else
    echo ""
    echo "📦 Manual deployment required:"
    echo "  1. Zip the agenticterminal-website folder"
    echo "  2. Go to Netlify dashboard"
    echo "  3. Drag and drop the folder"
    echo ""
fi

echo ""
echo "📊 Trends page ready at: /trends.html"
echo "🌐 Live URL will be: https://agenticterminal.ai/trends"
echo ""
echo -e "${GREEN}✓ Deployment preparation complete!${NC}"
