# 🚀 QUICK START - MVP Deployment

**5-minute guide to deploy the MVP**

---

## Step 1: Set API Key (CRITICAL)

1. Go to: https://app.netlify.com
2. Select site: **maximoon**
3. Settings → Environment variables
4. Add new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-XXXXX` (your Anthropic API key)
5. Click "Save"

**Get API key:** https://console.anthropic.com/

---

## Step 2: Deploy MVP

### Option A: One Command (Recommended)
```bash
cd /home/futurebit/.openclaw/workspace/bitcoinsingularity-website
./deploy-mvp.sh
```

### Option B: Manual
```bash
cd /home/futurebit/.openclaw/workspace/bitcoinsingularity-website

# Replace production files with MVP
cp index-mvp.html index.html
cp chat-mvp.html chat.html
cp about-mvp.html about.html
cp netlify/functions/chat-mvp.js netlify/functions/chat.js

# Deploy
git add index.html chat.html about.html netlify/functions/chat.js
git commit -m "Deploy MVP"
git push origin main
```

---

## Step 3: Wait for Deploy

Netlify will auto-deploy in **1-2 minutes**.

Watch progress: https://app.netlify.com/sites/maximoon/deploys

---

## Step 4: Test It

1. Visit: https://maximoon.netlify.app
2. Click: **"Start Chatting"**
3. Send a test message
4. Verify: Maxi responds
5. Check logs: `netlify functions:logs chat`

---

## Step 5: Monitor

**Analytics:** https://plausible.io/maximoon.netlify.app

**Function logs:**
```bash
netlify functions:logs chat --follow
```

**Look for:**
- Cost per message (target: < $0.015)
- Cache hit rate (target: > 30%)
- No errors

---

## ✅ You're Live!

**What's different:**
- ✅ No pricing anywhere
- ✅ Single "Start Chatting" CTA
- ✅ No message counters
- ✅ No upgrade prompts
- ✅ 50% lower costs (prompt caching + model routing)

**Next steps:**
1. Tweet about the launch (@BTCBoyd)
2. Share in Bitcoin/AI communities
3. Monitor user behavior
4. Build your email list

---

## 🆘 Troubleshooting

**"Chat not responding"**
→ Check API key is set in Netlify

**"High costs"**
→ Check function logs for cache hits

**"Email not working"**
→ Check Netlify Forms dashboard

**More help:** See `MVP-README.md`

---

**That's it. Go build your audience.** 🚀
