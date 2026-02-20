# Rate Limit System - Ask Maxi Chat

**Updated:** 2026-02-08
**Status:** ✅ Live

## Overview

Balanced rate limiting that allows meaningful conversations while preventing abuse.

## Limits

### Daily Limit
- **50 messages per IP per 24-hour rolling window**
- Window starts from first query, resets 24 hours later
- Example: First query at 2:00 PM → resets at 2:00 PM next day

### Burst Protection
- **15 messages per IP per 60-minute rolling window**
- Prevents rapid-fire abuse
- Separate from daily limit (both must be satisfied)

### Minimum Query Length
- **10 characters minimum**
- Prevents spam/test queries
- Error: "Please ask a complete question (at least 10 characters)."

## User Experience

### Warning System

**At 40 messages (10 remaining):**
```
Banner: "You have 10 questions remaining today. Resets in [X hours]."
Color: Orange (warning)
```

**At 48 messages (2 remaining):**
```
Banner: "You have 2 questions remaining today. Resets in [X hours]."
Color: Red (critical)
```

**At 50 messages (limit reached):**
```
Error: "You've reached your daily limit of 50 questions. Your limit resets in [X hours]. Want unlimited access? Check back tomorrow!"
```

### Burst Limit Hit:
```
Error: "Please slow down - you can ask up to 15 questions per hour, with 50 total per day. Try again in [X minutes]."
```

### Display Elements

**Rate Limit Counter (top right):**
- Shows: "42/50 questions today"
- Updates after each message
- Always visible once first message sent

**Warning Banner (above input):**
- Appears at 40 and 48 messages
- Orange at 10 remaining
- Red at 2 remaining
- Dismissible? No - stays visible until reset

## Technical Implementation

### Backend (netlify/functions/chat-mvp.js)

**Rate Limit Storage:**
```javascript
{
  dailyCount: 7,
  dailyWindowStart: 1770576000000,
  hourlyCount: 3,
  hourlyWindowStart: 1770575400000,
  lastMessageTime: 1770575650000
}
```

**Cleanup:**
- Runs on every request
- Removes expired windows
- Cleans up inactive sessions

**Response Format:**
```json
{
  "summary": "...",
  "full": "...",
  "rateLimit": {
    "dailyRemaining": 43,
    "dailyLimit": 50,
    "hourlyRemaining": 12,
    "hourlyLimit": 15,
    "resetInMs": 82800000,
    "warningMessage": null
  }
}
```

**Error Response (429):**
```json
{
  "error": "You've reached your daily limit...",
  "dailyLimit": 50,
  "dailyRemaining": 0,
  "hourlyLimit": 15,
  "hourlyRemaining": 5,
  "resetInMs": 43200000,
  "limitType": "daily"
}
```

### Frontend (chat.html)

**Rate Limit Counter:**
- Element: `#rateLimitCounter`
- Updates: After each successful message
- Hidden: Until first message sent

**Warning Banner:**
- Element: `#rateLimitWarning`
- Shown: When `warningMessage` present in response
- Styling: `.warning` (orange) or `.critical` (red)

**Function: updateRateLimitDisplay()**
- Called: After each successful response
- Updates: Counter text and warning banner
- Tracks: Remaining messages and warning level

## Cost Analysis

**With Current Optimization:**
- Prompt caching: ~90% cost reduction
- Model routing: Haiku for simple, Sonnet for complex
- Target: $0.01-0.015 per conversation

**50 messages/day per user:**
- 100 active users = 5,000 messages/day
- Cost: ~$50-75/day
- Monthly: ~$1,500-2,250

**Sustainable for MVP phase.**

## Future Enhancements

**Planned:**
- User accounts (unlimited with login)
- Premium tier (unlimited + priority)
- Analytics: track peak usage times, common limits hit

**Possible:**
- IP whitelist for trusted users
- Exponential backoff for repeat abusers
- Session-based limits instead of IP-based

## Monitoring

**Track:**
- % of users hitting daily limit
- % of users hitting burst limit
- Average messages per user
- Peak usage times

**Log:**
- All rate limit events (hits, warnings)
- IP addresses (for abuse detection)
- Reset times (for capacity planning)

## Testing

**Test Daily Limit:**
1. Send 40 messages → should see warning banner
2. Send 8 more (48 total) → should see critical warning
3. Send 2 more (50 total) → should get 429 error
4. Wait 24 hours → should reset

**Test Burst Limit:**
1. Send 15 messages rapidly (within 1 minute)
2. Try to send 16th → should get burst limit error
3. Wait 1 hour → should reset

**Test Minimum Length:**
1. Send "hi" → should get error (too short)
2. Send "Hello there" → should work (10+ chars)

## Deployment

**Updated:** 2026-02-08 13:51 EST
**Commit:** ab26346
**Status:** ✅ Live on maximoon.netlify.app

---

**Result:** Users can have meaningful conversations (50 questions is ~5-10 deep exchanges) while preventing abuse and keeping costs sustainable.
