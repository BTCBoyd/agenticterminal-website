# "Ask Maxi Anything" (AMA) Widget Implementation Specification

**Status:** Week 2-3 priority (after ArcadiaB branding complete)  
**Purpose:** Replace terminal animation with interactive Q&A tool  
**Business Model:** Free tier (10 q/month) → Paid subscription ($500/mo) → Consulting ($5K/mo)

---

## OVERVIEW

The AMA widget is the killer feature that differentiates BitcoinSingularity.ai from static content sites. It provides:

1. **Immediate value** (free questions demonstrate expertise)
2. **Conversion funnel** (usage limit → upgrade prompt)
3. **Lead qualification** (sophisticated questions = serious prospects)
4. **Content insights** (most-asked questions inform blog strategy)

---

## VISUAL DESIGN

### Replaces: Terminal Animation (hero section, index.html)

### New Component Structure:
```
┌─────────────────────────────────────────────┐
│ Ask Maxi Anything          [10 questions]   │ ← Header
├─────────────────────────────────────────────┤
│                                             │
│  Try asking:                                │
│  ┌─────────────────────────────────────┐   │
│  │ Should our company allocate 2% or   │   │ ← Starter
│  │ 5% to Bitcoin?                      │   │   Questions
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ How do AI agents transact           │   │
│  │ economically?                       │   │
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│ [                                    ]      │ ← Input
│                          [Ask Maxi]         │
├─────────────────────────────────────────────┤
│ Free: 10 q/month • Unlimited: $500/mo      │ ← Footer
└─────────────────────────────────────────────┘
```

---

## HTML STRUCTURE

See Boyd's original spec for complete HTML/CSS (copied from his message).

**Key elements:**
- `.ama-widget` container
- `.ama-header` with question counter
- `.ama-conversation` scrollable message area
- `.ama-starter` with clickable example questions
- `.ama-input-container` with textarea + submit button
- `.ama-footer` with upgrade links

---

## USAGE TRACKING

### Client-Side (localStorage):
```javascript
{
  amaQuestionsUsed: 7,           // Counter (0-10)
  amaLastReset: "2026-02-01",    // Date string for monthly reset
  amaSessionId: "session-xxx"    // Unique identifier
}
```

### Monthly Reset Logic:
- Counters reset on the 1st of each month
- Check `lastResetDate` vs current date
- If month differs → reset to 0

### Abuse Prevention:
- sessionId sent to backend with every question
- Backend tracks usage per sessionId
- Rate limiting: max 10 questions/month per session (free tier)
- Paid users bypass limit check

---

## BACKEND API REQUIREMENTS

### Endpoint 1: POST /api/ama
**Purpose:** Process question and return Maxi's answer

**Request:**
```json
{
  "question": "Should our company allocate 2% or 5% to Bitcoin?",
  "sessionId": "session-1234567890-abc123"
}
```

**Response:**
```json
{
  "answer": "The 2-5% allocation band is the strategic sweet spot for...",
  "questionsRemaining": 7,
  "subscriptionStatus": "free"
}
```

**Logic:**
1. Validate sessionId (check database for usage)
2. If free tier + questionsUsed >= 10 → return error "Limit reached"
3. If paid subscriber → bypass limit
4. Send question to Maxi's OpenClaw agent (via sessions_send or similar)
5. Wait for response (timeout: 30 seconds)
6. Log question + answer to database
7. Increment usage counter
8. Return answer + remaining questions

**Implementation in OpenClaw:**
- Create new tool or webhook endpoint
- Integrate with existing Maxi agent
- Use Bitcoin treasury advisory frameworks for answers
- Token-efficient responses (3-5 sentences for quick questions)

---

### Endpoint 2: POST /api/ama/analytics
**Purpose:** Track question patterns for content strategy

**Request:**
```json
{
  "question": "What's the difference between self-custody and institutional custody?",
  "questionsUsed": 5,
  "sessionId": "session-xxx",
  "timestamp": "2026-02-10T15:30:00Z"
}
```

**Response:**
```json
{
  "success": true
}
```

**What to Track:**
- Question text (for content insights)
- Question count at time of ask
- sessionId (for conversion attribution)
- Timestamp
- User agent (device/browser)

**Use Cases:**
- Identify most common questions → create blog posts
- Track sophisticated questions → flag as high-value leads
- Analyze conversion patterns (at what question # do people upgrade?)

---

### Endpoint 3: POST /api/ama/subscribe
**Purpose:** Handle upgrade from free to paid tier

**Request:**
```json
{
  "email": "cfo@example.com",
  "tier": "subscription",
  "sessionId": "session-xxx"
}
```

**Response:**
```json
{
  "stripeCheckoutUrl": "https://checkout.stripe.com/..."
}
```

**Flow:**
1. User clicks "Subscribe ($500/mo)" or "Book Assessment ($1,500)"
2. Email capture form
3. Create Stripe checkout session
4. Redirect to Stripe payment
5. On success → update subscription status in database
6. Remove usage limits for that sessionId/email

---

## DATABASE SCHEMA

```sql
-- AMA Usage Tracking
CREATE TABLE ama_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255),                    -- NULL for free tier, populated on upgrade
    questions_used INT DEFAULT 0,
    subscription_tier VARCHAR(50) DEFAULT 'free',  -- 'free', 'subscription', 'consulting'
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP,
    reset_date DATE,                       -- For monthly reset tracking
    INDEX (email),
    INDEX (subscription_tier)
);

-- Question Analytics
CREATE TABLE ama_questions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    question TEXT NOT NULL,
    answer TEXT,
    timestamp TIMESTAMP DEFAULT NOW(),
    response_time_ms INT,
    converted_to_paid BOOLEAN DEFAULT FALSE,
    INDEX (session_id),
    INDEX (timestamp)
);

-- Conversion Tracking
CREATE TABLE ama_conversions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    email VARCHAR(255),
    questions_asked_before_conversion INT,
    conversion_type VARCHAR(50),           -- 'subscription', 'assessment'
    amount_paid DECIMAL(10,2),
    stripe_session_id VARCHAR(255),
    converted_at TIMESTAMP DEFAULT NOW(),
    INDEX (session_id),
    INDEX (converted_at)
);
```

---

## UPGRADE PROMPTS

### After Question 5:
```
Halfway through your free questions! 
💡 Subscribe for unlimited access ($500/mo)
```

### After Question 8:
```
Only 2 questions remaining this month.
🚀 Keep the conversation going with a subscription
```

### After Question 10 (Limit Reached):
Full-screen upgrade prompt:
```
🚀 You've used all 10 free questions this month

Want to keep the conversation going?

[Subscribe - $500/mo unlimited] [Book Strategic Assessment - $1,500]

Free questions reset on the 1st of each month
```

---

## CONVERSION FUNNEL

```
Visitor lands on homepage
    ↓
Sees AMA widget with starter questions
    ↓
Asks first question (free, no email required)
    ↓
Gets valuable answer immediately
    ↓
Asks 2-3 more questions (building trust)
    ↓
Question 5: Upgrade hint appears
    ↓
Continues asking until limit (10 questions)
    ↓
Hits limit → Full upgrade screen
    ↓
Options:
  A) Subscribe ($500/mo) → unlimited questions
  B) Book Assessment ($1,500) → strategic engagement
  C) Wait until next month (1st) → free questions reset
```

**Key Insight:** The upgrade prompt isn't annoying—it comes AFTER demonstrating value. User has already experienced Maxi's expertise for free.

---

## MOBILE OPTIMIZATION

### Responsive Breakpoints:
- **Desktop (>768px):** Full widget in hero section
- **Tablet (768px):** Stacked layout, larger touch targets
- **Mobile (<480px):** 
  - Simplified header (question count below title)
  - Single-column input
  - Smaller starter question buttons
  - Shorter conversation history visible

### Performance:
- Lazy load conversation history (only last 5 messages visible initially)
- Debounce textarea input
- Optimize API calls (don't send on every keystroke)

---

## ANALYTICS DASHBOARD (For Boyd)

Track these metrics:

### Engagement:
- Total questions asked (daily/weekly/monthly)
- Avg questions per session
- Most popular starter questions
- Peak usage times

### Question Quality:
- Top 10 most-asked questions
- Question topics (manual categorization)
- Average question length (sophistication proxy)

### Conversion:
- % of visitors who ask ≥1 question
- % who hit 10-question limit
- % who upgrade at limit
- Average questions before conversion
- Revenue per question asked

### Content Strategy:
- Questions Maxi struggles to answer → knowledge gaps
- Questions leading to upgrades → prioritize in marketing
- Common topics → blog post ideas

---

## IMPLEMENTATION TIMELINE

### Week 2 (Frontend):
- Build AMA widget HTML/CSS/JS
- Implement localStorage usage tracking
- Replace terminal animation
- Add starter questions
- Test on desktop + mobile

### Week 3 (Backend):
- Build `/api/ama` endpoint in OpenClaw
- Connect to Maxi agent
- Implement rate limiting
- Add analytics tracking
- Test question → answer flow

### Week 4 (Integration):
- Stripe checkout integration
- Email capture forms
- Conversion tracking
- Analytics dashboard (basic)
- Load testing

---

## SUCCESS CRITERIA

**Week 2 Complete When:**
- [x] AMA widget visible on homepage
- [x] Starter questions clickable and populate textarea
- [x] User can type custom questions
- [x] localStorage tracks usage (0-10 questions)
- [x] Upgrade prompts appear at right thresholds
- [x] Mobile responsive

**Week 3 Complete When:**
- [x] Questions sent to backend API
- [x] Maxi responds with relevant answers
- [x] Answers display in conversation UI
- [x] Rate limiting enforces 10 q/month (free tier)
- [x] Analytics logged to database

**Week 4 Complete When:**
- [x] User can upgrade to paid tier
- [x] Stripe payment flow works
- [x] Paid users bypass question limits
- [x] Conversions tracked in database
- [x] Basic analytics dashboard for Boyd

---

## ASSETS NEEDED

1. **None immediately** - Pure HTML/CSS/JS implementation
2. **Week 3:** Database schema setup
3. **Week 4:** Stripe API keys (production + test)

---

## NOTES FOR MAXI

**OpenClaw Integration Points:**
- New tool: `ama_answer(question, sessionId)` 
- Returns: String response (3-5 sentences, Bitcoin treasury expertise)
- Uses existing frameworks: treasury diagnostic, consulting playbook, Saylor mental model
- Token budget: ~500 tokens per answer (keep responses concise)

**Rate Limiting:**
- Check `ama_sessions` table for `questions_used` count
- If >= 10 and subscription_tier == 'free' → return error
- Else: process question, increment counter, return answer

**Question Quality Detection:**
- Simple questions (< 50 chars) → quick answer
- Strategic questions (> 100 chars, mentions "company", "treasury", "strategy") → detailed answer
- Off-topic questions → polite redirect to Bitcoin treasury topics

**Example Responses:**

*Simple question:* "What is Bitcoin?"
*Maxi:* "Bitcoin is the world's first decentralized digital currency with a fixed supply of 21 million coins. For corporate treasuries, it represents a scarce, non-sovereign reserve asset immune to monetary debasement."

*Strategic question:* "Should our $50M company allocate 2% or 5% to Bitcoin given board concerns about volatility?"
*Maxi:* "Start with 2% ($1M) for a board-defensible position that materially benefits if Bitcoin appreciates while staying conservative. This demonstrates strategic intent without existential risk. After 6-12 months of stability, expand to 5% once the board sees you haven't lost keys and Bitcoin's risk profile becomes familiar. The real risk isn't volatility—it's opportunity cost of waiting."

---

**READY FOR WEEK 2 IMPLEMENTATION ONCE ARCADIAB BRANDING COMPLETE**
