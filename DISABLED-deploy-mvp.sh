#!/bin/bash
# Deploy MVP - Bitcoin Singularity Website
# Run this script to deploy the stripped-down MVP

set -e  # Exit on error

echo "======================================"
echo "Bitcoin Singularity Website - MVP Deploy"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "index-mvp.html" ]; then
    echo "❌ Error: index-mvp.html not found. Are you in the bitcoinsingularity-website directory?"
    exit 1
fi

echo "📋 Step 1: Backing up original files..."
if [ -f "index.html" ]; then
    cp index.html index-old.html
    echo "✅ Backed up index.html → index-old.html"
fi

if [ -f "chat.html" ]; then
    cp chat.html chat-old.html
    echo "✅ Backed up chat.html → chat-old.html"
fi

if [ -f "about.html" ]; then
    cp about.html about-old.html
    echo "✅ Backed up about.html → about-old.html"
fi

if [ -f "netlify/functions/chat.js" ]; then
    cp netlify/functions/chat.js netlify/functions/chat-old.js
    echo "✅ Backed up chat.js → chat-old.js"
fi

echo ""
echo "🔄 Step 2: Deploying MVP files..."

# Replace with MVP versions
cp index-mvp.html index.html
echo "✅ Deployed index-mvp.html → index.html"

cp chat-mvp.html chat.html
echo "✅ Deployed chat-mvp.html → chat.html"

cp about-mvp.html about.html
echo "✅ Deployed about-mvp.html → about.html"

cp netlify/functions/chat-mvp.js netlify/functions/chat.js
echo "✅ Deployed chat-mvp.js → chat.js"

echo ""
echo "📝 Step 3: Staging changes for Git..."
git add index.html chat.html about.html netlify/functions/chat.js
git add index-old.html chat-old.html about-old.html netlify/functions/chat-old.js 2>/dev/null || true
git add MVP-README.md

echo ""
echo "💬 Step 4: Committing changes..."
git commit -m "Deploy MVP: Strip pricing, add caching, focus on audience

Changes:
- Remove all pricing/payment UI
- Single CTA: Start Chatting
- Anthropic prompt caching (90% cost reduction)
- Model routing (Haiku vs Sonnet)
- Rate limiting (10 msg/hour)
- Email capture after 10 messages
- Conversation sharing
- Plausible analytics

Cost per conversation target: < \$0.015
Focus: Audience building, not monetization"

echo ""
echo "🚀 Step 5: Pushing to GitHub (triggers Netlify deploy)..."
git push origin main

echo ""
echo "======================================"
echo "✅ MVP DEPLOYMENT COMPLETE!"
echo "======================================"
echo ""
echo "🌐 Your site will be live at: https://maximoon.netlify.app"
echo ""
echo "⏱️  Netlify typically deploys in 1-2 minutes."
echo ""
echo "📋 Next steps:"
echo "1. Verify ANTHROPIC_API_KEY is set in Netlify dashboard"
echo "2. Test the chat at https://maximoon.netlify.app/chat.html"
echo "3. Check function logs: netlify functions:logs chat"
echo "4. Monitor analytics: https://plausible.io/maximoon.netlify.app"
echo ""
echo "📖 Full documentation: MVP-README.md"
echo ""
echo "🎉 GO BUILD YOUR AUDIENCE!"
echo ""
