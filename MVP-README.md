# Bitcoin Singularity Website - MVP Rebuild

**Status:** ✅ Ready for Testing  
**Date:** February 7, 2026  
**Objective:** Lean MVP focused on audience building, not monetization

---

## 🎯 MISSION ACCOMPLISHED

This rebuild strips the website down to its core value proposition: **free, friction-free exploration of the Bitcoin-AI convergence thesis with Maxi.**

### What Changed

**✅ REMOVED (Stripped Out):**
- All pricing tiers and payment UI
- "10 free messages" counters and limits
- Upgrade modals and CTAs
- Login/signup flows
- Enterprise solutions pages
- Services/consulting sections
- Multiple CTAs competing for attention

**✅ ADDED (Cost Optimization):**
- Anthropic prompt caching (90% cost reduction on cached content)
- Model routing (Haiku for simple queries, Sonnet for complex)
- Rate limiting (10 messages/hour per IP)
- Cost tracking and monitoring
- 500 character message limit

**✅ ENHANCED (User Experience):**
- Single, clear CTA: "Start Chatting"
- No friction—no signup, no payment, no barriers
- Email capture after 10 messages (subtle, dismissible)
- Conversation sharing with unique links
- Improved opening experience with suggested questions
- Plausible analytics integration

---

## 📁 FILE STRUCTURE

### New MVP Files (Use These)
```
bitcoinsingularity-website/
├── index-mvp.html              # Stripped-down homepage (SINGLE CTA, no pricing)
├── chat-mvp.html               # New chat interface (no counters, email capture)
├── about-mvp.html              # Simplified About page
├── netlify/functions/
│   └── chat-mvp.js             # Backend with caching, routing, rate limiting
└── MVP-README.md               # This file
```

### Old Files (Keep for Reference)
```
├── index.html                  # Original homepage with pricing
├── chat.html                   # Original chat with upgrade modals
├── netlify/functions/
│   └── chat.js                 # Original backend
```

---

## 🚀 DEPLOYMENT INSTRUCTIONS

### Step 1: Environment Variables

Add to Netlify:
```bash
ANTHROPIC_API_KEY=sk-ant-XXXXX
```

**Get your API key:** https://console.anthropic.com/

### Step 2: Rename Files for Production

Option A: Replace existing files (recommended)
```bash
cd bitcoinsingularity-website

# Backup originals
mv index.html index-old.html
mv chat.html chat-old.html
mv about.html about-old.html
mv netlify/functions/chat.js netlify/functions/chat-old.js

# Deploy MVP
mv index-mvp.html index.html
mv chat-mvp.html chat.html
mv about-mvp.html about.html
mv netlify/functions/chat-mvp.js netlify/functions/chat.js
```

Option B: Test MVP first on subdomain
```bash
# Keep MVP files as-is
# Access at: maximoon.netlify.app/index-mvp.html
```

### Step 3: Deploy to Netlify

```bash
git add .
git commit -m "Deploy MVP: Strip pricing, add caching, focus on audience"
git push origin main
```

Netlify auto-deploys from GitHub.

### Step 4: Verify Deployment

**Test these URLs:**
1. `https://maximoon.netlify.app/` - Homepage with single CTA
2. `https://maximoon.netlify.app/chat.html` - Chat interface
3. `https://maximoon.netlify.app/about.html` - About page

**Check:**
- ✅ No pricing mentions anywhere
- ✅ Single "Start Chatting" CTA on homepage
- ✅ Chat works without signup
- ✅ Email capture shows after 10 messages
- ✅ Share button generates link
- ✅ Analytics tracking events

---

## 🔍 TESTING CHECKLIST

### Backend Testing

**Cost Optimization:**
```bash
# Test rate limiting
curl -X POST https://maximoon.netlify.app/.netlify/functions/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Bitcoin?", "sessionId": "test123"}'

# Repeat 11 times → should hit rate limit on 11th
```

**Model Routing Verification:**
- Short query (< 20 words) → Should use `claude-haiku-4-5`
- Complex query (> 20 words) → Should use `claude-sonnet-4-5`

Check Netlify Function logs for model selection.

**Prompt Caching:**
- First message: High cost (cache WRITE)
- Subsequent messages: Low cost (cache READ)
- Look for `cache_read_input_tokens` > 0 in logs

### Frontend Testing

**Chat Experience:**
- [ ] Welcome message displays
- [ ] Suggested questions work
- [ ] User can send messages
- [ ] Maxi responds intelligently
- [ ] No message counter visible
- [ ] No upgrade prompts
- [ ] Email capture shows after 10 messages
- [ ] Email form submits to Netlify Forms
- [ ] Share button generates link
- [ ] Toast notifications work

**Homepage:**
- [ ] Single "Start Chatting" CTA
- [ ] No pricing section
- [ ] No "10 free messages" language
- [ ] Trust line with Boyd's credentials
- [ ] 3 value propositions visible
- [ ] Mobile responsive

**About Page:**
- [ ] Under 500 words
- [ ] "What You Can Ask Maxi" section
- [ ] No team members section
- [ ] Boyd + Maxi story
- [ ] CTA to chat

---

## 📊 SUCCESS METRICS

### Cost Per Conversation Target: < $0.015

**Cost Breakdown (with caching):**
```
First conversation (cache WRITE):
- Haiku: ~2,000 input + 500 output = $0.001
- Sonnet: ~2,000 input + 1,000 output = $0.021

Subsequent messages (cache READ - 90% discount):
- Haiku: ~200 new + 500 output = $0.0008
- Sonnet: ~300 new + 1,000 output = $0.015

Average cost per message: $0.01 - $0.015 ✅
```

### Analytics Events to Track

**Plausible Events:**
- `chat_started` - User opens chat
- `message_sent` - User sends message (with count)
- `email_capture_shown` - Email prompt displayed
- `email_captured` - User submits email
- `conversation_shared` - User clicks share

**Daily Monitoring:**
```bash
# Check Netlify Function logs
netlify functions:logs chat

# Look for:
# - Cost per message
# - Cache hit rate (should be > 30%)
# - Model distribution (Haiku vs Sonnet)
# - Rate limit hits
```

---

## 📚 KNOWLEDGE BASE (Updated with Real Content)

**NEW:** Maxi now uses content from **Bitcoin Singularity** book (Chapter 10).

**Cached Content:**
- Three Epochs Framework (Bitcoinization → Hyperbitcoinization → Bitcoin Singularity)
- Why AI agents choose Bitcoin (Saylor quote + Boyd's prediction)
- Sustainable Abundance Triad (Bitcoin + AI + Longevity)
- AI agents with Lightning wallets (no KYC, autonomous operation)
- Gig economy disruption via Bitcoin
- Bitcoin-backed UBI concept
- Austrian economics and time preference
- Endorsements from Lyn Alden, Bram Kanstein, Joe Bryan

**Source:** `BITCOIN-SINGULARITY-CORE-THESIS.md` (provided by Boyd)

This is the foundational knowledge Maxi uses to answer questions about Bitcoin-AI convergence. All cached for cost efficiency.

## 🎨 DESIGN PHILOSOPHY

### Lean Startup Principles Applied

1. **Single Value Proposition:** Chat with Maxi about Bitcoin-AI convergence
2. **Zero Friction:** No signup, no payment, no barriers to entry
3. **Audience First:** Build email list before monetization
4. **Cost Efficient:** Prompt caching + model routing = sustainable free tier
5. **Viral Potential:** Conversation sharing creates organic growth

### Content Scope

**Maxi Focuses On:**
- Bitcoin fundamentals (21M cap, PoW, sound money)
- Austrian economics (time preference, Cantillon effects)
- Bitcoin-AI convergence thesis
- Corporate treasury strategy
- Sustainable Abundance Triad
- Energy economics

**Maxi Declines:**
- Personal investment advice
- Medical/legal advice
- Political endorsements
- Off-topic entertainment

---

## 🛠️ TROUBLESHOOTING

### Issue: Chat not responding

**Check:**
1. Netlify Function logs: `netlify functions:logs chat`
2. `ANTHROPIC_API_KEY` set in Netlify environment
3. API key has credits remaining
4. No CORS errors in browser console

### Issue: High costs per conversation

**Solutions:**
1. Verify prompt caching is working:
   - Check for `cache_read_input_tokens` in logs
   - Should be > 0 after first message
2. Verify model routing:
   - Simple queries should use Haiku
   - Check `model` field in logs
3. Reduce max_tokens if needed:
   - Haiku: 500 tokens
   - Sonnet: 1000 tokens

### Issue: Rate limiting too strict

**Adjust in `chat-mvp.js`:**
```javascript
const CONFIG = {
  MAX_MESSAGES_PER_HOUR: 10,  // Increase to 20 or 30
  HOURLY_WINDOW_MS: 60 * 60 * 1000,
  // ...
};
```

### Issue: Email capture not working

**Netlify Forms Setup:**
1. Ensure `netlify` attribute in form HTML
2. Check Netlify dashboard → Forms
3. Verify hidden form in HTML exists
4. Test submission manually

---

## 📈 GROWTH STRATEGY

### Phase 1: Launch (Week 1)
- Deploy MVP to production
- Announce on Twitter/LinkedIn (Boyd's accounts)
- Post in Bitcoin/AI communities
- Track: Chat sessions, email captures

### Phase 2: Content (Weeks 2-4)
- Publish 3 blog articles on convergence thesis
- Share Maxi conversations on social media
- Link to book on Amazon
- Track: Viral conversation shares

### Phase 3: Optimize (Month 2)
- A/B test email capture timing (10 vs 15 messages)
- Improve Maxi's knowledge base based on common questions
- Add FAQ page for common queries (use Haiku)
- Track: Cost per conversation, cache hit rate

### Phase 4: Monetize (Month 3+)
- Only after building audience (>1,000 email subscribers)
- Consider: Premium tier for unlimited access
- Boyd's consulting services (separate from Maxi)
- Corporate treasury advisory partnerships

---

## 🔐 SECURITY & PRIVACY

### Data Handling
- **No server-side storage** - Conversations in browser localStorage
- **No user accounts** - Completely anonymous
- **Rate limiting by IP** - Prevents abuse without tracking users
- **Email opt-in only** - No automatic collection

### Compliance
- GDPR-friendly (no tracking without consent)
- Privacy policy links in footer
- Terms of service for API usage
- Analytics via Plausible (privacy-focused)

---

## 💰 COST PROJECTIONS

### Baseline Assumptions
- 100 conversations/day
- Average 10 messages per conversation
- 30% cache hit rate (conservative)
- 60% Haiku / 40% Sonnet split

### Daily Cost Estimate
```
First messages (cache WRITE):
100 conversations × $0.01 = $1.00

Subsequent messages (cache READ):
900 messages × $0.005 = $4.50

Total daily cost: ~$5.50
Monthly cost: ~$165

With 30% cache hit rate improvement:
Monthly cost: ~$100 ✅
```

### Break-Even Analysis
At $0.01/message average:
- 1,000 email captures = $100 marketing cost
- Value per email (industry avg): $1-5
- Break-even: 20-100 emails

**We're cost-effective from day 1.**

---

## 📞 SUPPORT

### For Deployment Issues
- Check Netlify deploy logs
- Verify environment variables
- Review function logs

### For Feature Requests
- Document in `FEATURE-REQUESTS.md`
- Prioritize based on user feedback
- Maintain MVP focus (no bloat!)

### For Boyd
- **Production URL:** https://maximoon.netlify.app
- **Analytics:** https://plausible.io/maximoon.netlify.app
- **Netlify Dashboard:** https://app.netlify.com
- **Function Logs:** Real-time cost/usage data

---

## ✅ FINAL CHECKLIST

Before going live:

- [ ] `ANTHROPIC_API_KEY` set in Netlify
- [ ] Files renamed for production (MVP → production)
- [ ] Committed and pushed to GitHub
- [ ] Netlify auto-deploy successful
- [ ] Test chat on live site
- [ ] Verify no pricing UI visible
- [ ] Email capture works
- [ ] Share conversation works
- [ ] Analytics tracking events
- [ ] Mobile responsive verified
- [ ] Privacy policy + Terms updated
- [ ] Boyd's social links correct
- [ ] Amazon book link updated (when available)

---

## 🎉 LAUNCH!

**The MVP is ready. Now go build your audience.**

Questions? Check function logs. Iterate based on real user data.

**Remember:** This is a lean MVP. Resist feature creep. Let user needs drive future development.

---

*Built with speed and simplicity. Powered by proof-of-work.* ₿
