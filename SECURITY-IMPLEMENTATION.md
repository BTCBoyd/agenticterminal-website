# Security Implementation Plan - Chat MVP

## ⚠️ Current Vulnerabilities (PATCHED - SITE DOWN)

**Discovered by security expert on 2026-02-10:**

1. ❌ **No authentication** - anyone can call API directly
2. ❌ **Session hijacking** - sessionIds are made-up/guessable
3. ❌ **Unlimited abuse** - change IP/sessionId bypasses all limits
4. ❌ **Metadata leakage** - exposes model, costs, limits, internal details
5. ❌ **Cost attack vector** - could drain entire API budget in minutes

**Result:** Chat taken down immediately. All vulnerabilities must be fixed before redeployment.

---

## 🛡️ 6-Layer Security Architecture (Priority Order)

### Layer 0: Anthropic Spending Cap (CRITICAL - DO FIRST)

**The ultimate failsafe - even if everything else fails, this protects you.**

**Implementation:**
1. Go to https://console.anthropic.com/settings/limits
2. Set monthly spending limit: **$50/month** (or your comfort level)
3. Enable email alerts:
   - 50% of limit
   - 80% of limit
   - 90% of limit
4. **Hard stop** at 100%

**Why this matters:**
- Even with perfect security, bugs happen
- Prevents financial disaster
- Gives you time to react to unusual usage
- **Cost: $0 | Time: 5 minutes | Impact: Prevents bankruptcy**

---

### Layer 1: Cloudflare Turnstile (Invisible Bot Protection)

**Blocks automated attacks before they reach your API.**

**Why Turnstile?**
- ✅ Invisible (no puzzles for users)
- ✅ Blocks bots, scrapers, automated abuse
- ✅ Free tier: 1M requests/month
- ✅ Works seamlessly with Netlify

**Setup Steps:**

1. **Get Turnstile credentials:**
   - Go to: https://dash.cloudflare.com/
   - Sign up (free account)
   - Add site → Turnstile
   - Get **Site Key** (public) and **Secret Key** (private)

2. **Add to Netlify env vars:**
```
TURNSTILE_SECRET_KEY=0x4AAA...your_secret_key
```

3. **Frontend (chat-mvp.html):**
```html
<!DOCTYPE html>
<html>
<head>
    <!-- Load Turnstile -->
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body>
    <!-- Add invisible widget -->
    <div class="cf-turnstile" 
         data-sitekey="YOUR_SITE_KEY"
         data-callback="onTurnstileSuccess"
         data-theme="light"></div>

    <script>
    let turnstileToken = null;

    function onTurnstileSuccess(token) {
        turnstileToken = token;
        console.log('Turnstile verified');
    }

    async function sendMessage(message, sessionId) {
        // Block if Turnstile not ready
        if (!turnstileToken) {
            alert('Please wait for verification...');
            return;
        }

        const response = await fetch('/.netlify/functions/chat-mvp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY,
                'X-Turnstile-Token': turnstileToken
            },
            body: JSON.stringify({ message, sessionId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        // Reset Turnstile after each request
        const data = await response.json();
        turnstileToken = null;
        turnstile.reset();

        return data;
    }
    </script>
</body>
</html>
```

4. **Backend (netlify/functions/chat-mvp.js):**
```javascript
async function validateTurnstile(token, ipAddress) {
    if (!token) {
        return { success: false, error: 'Turnstile token missing' };
    }

    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: token,
                remoteip: ipAddress
            })
        });

        const data = await response.json();
        return { 
            success: data.success,
            error: data.success ? null : 'Captcha verification failed'
        };
    } catch (err) {
        return { success: false, error: 'Turnstile verification error' };
    }
}

exports.handler = async (event) => {
    // Validate Turnstile FIRST
    const turnstileToken = event.headers['x-turnstile-token'];
    const ipAddress = event.headers['x-forwarded-for']?.split(',')[0] || event.headers['client-ip'];
    
    const turnstileResult = await validateTurnstile(turnstileToken, ipAddress);
    if (!turnstileResult.success) {
        return {
            statusCode: 403,
            body: JSON.stringify({ error: turnstileResult.error })
        };
    }

    // Continue with rest of security layers...
};
```

**What this blocks:**
- ✅ Bots and scrapers
- ✅ Automated abuse scripts
- ✅ DDoS attempts
- ✅ API farming/scraping

---

### Layer 2: API Key Authentication (Block Unauthorized Access)

**Only users with valid API keys can call the function.**

**Implementation:**

1. **Generate secure API keys:**
```bash
# Generate 3 API keys
node -e "console.log('Key 1:', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('Key 2:', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('Key 3:', require('crypto').randomBytes(32).toString('hex'))"
```

2. **Add to Netlify env vars:**
```
CHAT_API_KEYS=abc123def456...,ghi789jkl012...,mno345pqr678...
```

3. **Backend validation:**
```javascript
const VALID_API_KEYS = new Set(
    (process.env.CHAT_API_KEYS || '').split(',').filter(Boolean)
);

function validateAPIKey(event) {
    const apiKey = event.headers['x-api-key'] || 
                   event.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
        return { 
            statusCode: 401, 
            body: JSON.stringify({ error: 'API key required' }) 
        };
    }
    
    if (!VALID_API_KEYS.has(apiKey)) {
        return { 
            statusCode: 403, 
            body: JSON.stringify({ error: 'Invalid API key' }) 
        };
    }
    
    return null; // Valid
}

exports.handler = async (event) => {
    // After Turnstile validation...
    const authError = validateAPIKey(event);
    if (authError) return authError;
    
    const apiKey = event.headers['x-api-key'];
    
    // Continue...
};
```

4. **Frontend usage:**
```javascript
const API_KEY = 'your_api_key_here'; // Or prompt user to enter

await fetch('/.netlify/functions/chat-mvp', {
    headers: {
        'X-API-Key': API_KEY,
        // ...
    }
});
```

**What this blocks:**
- ✅ Unauthorized API access
- ✅ Public scraping of your endpoint
- ✅ Cost attacks from random users

---

### Layer 3: Secure Session Validation (CRITICAL - Prevents Hijacking)

**⚡ THIS IS THE BIGGEST HOLE - Sessions must be server-validated with HMAC signatures.**

**Current vulnerability:**
```bash
# Anyone can make up ANY sessionId
curl -d '{"message":"test","sessionId":"i_made_this_up"}'
```

**Why this is critical:**
- Made-up sessionIds bypass rate limits (each fake session = fresh limits)
- Session hijacking (guess someone's sessionId → access their chat history)
- Cross-account access (no validation of who owns what session)

**Secure implementation:**

1. **Add SESSION_SECRET to Netlify env vars:**
```bash
# Generate a strong secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

```
SESSION_SECRET=your_very_long_random_secret_here
```

2. **Server-side session generation:**
```javascript
const crypto = require('crypto');

function generateSecureSessionId(apiKey) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    
    // Create HMAC signature tied to API key
    const hmac = crypto.createHmac('sha256', process.env.SESSION_SECRET);
    hmac.update(`${apiKey}:${timestamp}:${random}`);
    const signature = hmac.digest('hex');
    
    // Format: timestamp:random:signature
    return `${timestamp}:${random}:${signature}`;
}

function validateSessionId(sessionId, apiKey) {
    try {
        const parts = sessionId.split(':');
        if (parts.length !== 3) {
            return { valid: false, error: 'Malformed session ID' };
        }
        
        const [timestamp, random, providedSignature] = parts;
        
        // Verify HMAC signature
        const hmac = crypto.createHmac('sha256', process.env.SESSION_SECRET);
        hmac.update(`${apiKey}:${timestamp}:${random}`);
        const expectedSignature = hmac.digest('hex');
        
        if (providedSignature !== expectedSignature) {
            return { valid: false, error: 'Invalid session signature' };
        }
        
        // Check if expired (24 hour lifetime)
        const sessionAge = Date.now() - parseInt(timestamp);
        if (sessionAge > 86400000) {
            return { valid: false, error: 'Session expired (24h limit)' };
        }
        
        return { valid: true };
    } catch (err) {
        return { valid: false, error: 'Session validation error' };
    }
}
```

3. **Use in handler:**
```javascript
exports.handler = async (event) => {
    // After Turnstile + API key validation...
    
    const body = JSON.parse(event.body);
    const apiKey = event.headers['x-api-key'];
    
    let sessionId = body.sessionId;
    
    if (!sessionId) {
        // First message - generate new secure session
        sessionId = generateSecureSessionId(apiKey);
    } else {
        // Validate existing session
        const validation = validateSessionId(sessionId, apiKey);
        if (!validation.valid) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: validation.error })
            };
        }
    }
    
    // Use validated sessionId for chat logic...
};
```

**What this blocks:**
- ✅ Made-up sessionIds (signature won't match)
- ✅ Session hijacking (can't guess valid HMAC)
- ✅ Cross-account access (session tied to API key)
- ✅ Expired sessions (auto-rejected after 24h)
- ✅ Rate limit bypass (each session validated)

---

### Layer 4: Rate Limiting (Cost Protection)

**Prevent abuse even with valid API keys.**

**Limits per API key:**
- 15 requests/hour
- 50 requests/day

**Plus IP-based limits:**
- 20 requests/hour per IP (prevents key sharing + VPN rotation)

**Implementation with Netlify Blobs:**

```javascript
const { getStore } = require('@netlify/blobs');

async function checkRateLimit(apiKey, ipAddress) {
    const store = getStore('rate-limits');
    const now = Date.now();
    const hour = 3600000;
    const day = 86400000;
    
    // Time-based keys
    const hourlyKey = `${apiKey}:${Math.floor(now / hour)}`;
    const dailyKey = `${apiKey}:${Math.floor(now / day)}`;
    const ipHourlyKey = `ip:${ipAddress}:${Math.floor(now / hour)}`;
    
    // Get counts
    const hourlyCount = parseInt(await store.get(hourlyKey) || '0');
    const dailyCount = parseInt(await store.get(dailyKey) || '0');
    const ipHourlyCount = parseInt(await store.get(ipHourlyKey) || '0');
    
    // Check limits
    if (hourlyCount >= 15) {
        return { 
            allowed: false, 
            error: 'Hourly limit exceeded (15/hour)',
            resetInMs: hour - (now % hour)
        };
    }
    
    if (dailyCount >= 50) {
        return { 
            allowed: false, 
            error: 'Daily limit exceeded (50/day)',
            resetInMs: day - (now % day)
        };
    }
    
    if (ipHourlyCount >= 20) {
        return { 
            allowed: false, 
            error: 'IP rate limit exceeded (20/hour)',
            resetInMs: hour - (now % hour)
        };
    }
    
    // Increment counts with TTL
    await store.set(hourlyKey, String(hourlyCount + 1), { ttl: hour / 1000 });
    await store.set(dailyKey, String(dailyCount + 1), { ttl: day / 1000 });
    await store.set(ipHourlyKey, String(ipHourlyCount + 1), { ttl: hour / 1000 });
    
    return { 
        allowed: true,
        remaining: {
            hourly: 15 - hourlyCount - 1,
            daily: 50 - dailyCount - 1
        }
    };
}

exports.handler = async (event) => {
    // After all previous validations...
    
    const apiKey = event.headers['x-api-key'];
    const ipAddress = event.headers['x-forwarded-for']?.split(',')[0];
    
    const rateLimit = await checkRateLimit(apiKey, ipAddress);
    
    if (!rateLimit.allowed) {
        return {
            statusCode: 429,
            body: JSON.stringify({
                error: rateLimit.error,
                resetInMs: rateLimit.resetInMs
            })
        };
    }
    
    // Continue with chat...
};
```

**What this blocks:**
- ✅ Cost attacks (max $3.75/month per key)
- ✅ API key sharing (IP limits prevent abuse)
- ✅ VPN rotation (still limited per key)
- ✅ Runaway costs

---

### Layer 5: Metadata Sanitization (CRITICAL - Stop Info Leakage)

**⚠️ Current response exposes EVERYTHING:**

```json
{
  "model": "claude-haiku-4-5",           // ❌ Attackers learn your model
  "costPerMessage": "0.0025",            // ❌ Attackers learn your costs
  "cacheHit": false,                     // ❌ Internal optimization details
  "responseTime": 4122,                  // ❌ Performance profiling
  "rateLimit": {
    "dailyRemaining": 49,                // ⚠️ Helps attackers time attacks
    "dailyLimit": 50,                    // ❌ Reveals your limits
    "hourlyRemaining": 14,               // ⚠️ Shows when to attack
    "hourlyLimit": 15                    // ❌ Shows vulnerability window
  },
  "_meta": {
    "costPerMessage": "0.0025",          // ❌ Duplicate exposure
    "cacheHit": false,
    "responseTime": 4122,
    "leadIntent": false,
    "approach": "two-pass (full + AI summary)"  // ❌ Reveals your architecture
  }
}
```

**What attackers learn from this:**
- Your exact model and pricing
- Your rate limits (when to attack)
- Your internal architecture
- Performance characteristics
- When you're close to limits

**Sanitized response (ONLY send this):**

```json
{
  "summary": "Bitcoin Core is the reference implementation...",
  "full": "Bitcoin Core is the reference implementation of the Bitcoin protocol...",
  "sessionId": "1707609600000:a3f2d8e9c1b4f6a8:9d8f7e6c5b4a3f2d1e0c9b8a7f6e5d4c3b2a1f0e",
  "messageCount": 1
}
```

**Implementation:**

```javascript
function sanitizeResponse(response) {
    // Only return what users need - NOTHING ELSE
    return {
        summary: response.summary,
        full: response.full,
        sessionId: response.sessionId,
        messageCount: response.messageCount
    };
    // Everything else is DELETED before sending
}

exports.handler = async (event) => {
    // ... all security checks ...
    // ... generate response ...
    
    const sanitized = sanitizeResponse(fullResponse);
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin
        },
        body: JSON.stringify(sanitized)
    };
};
```

**What this blocks:**
- ✅ Cost visibility (attackers can't calculate damage)
- ✅ Limit discovery (attackers don't know when you're vulnerable)
- ✅ Model fingerprinting (can't target specific model weaknesses)
- ✅ Architecture leakage (can't reverse-engineer your system)

---

### Layer 6: CORS Restrictions (Origin Validation)

**Only allow requests from your own domains.**

```javascript
const ALLOWED_ORIGINS = [
    'https://maximoon.netlify.app',
    'https://bitcoinsingularity.mx',  // When custom domain ready
    'http://localhost:3000'           // For local dev
];

function getCORSHeaders(origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
        return {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Turnstile-Token',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        };
    }
    return {}; // Block unknown origins
}

exports.handler = async (event) => {
    const origin = event.headers.origin;
    const corsHeaders = getCORSHeaders(origin);
    
    // Handle OPTIONS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }
    
    // ... rest of logic ...
    
    return {
        statusCode: 200,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sanitizedResponse)
    };
};
```

---

## 📋 Implementation Checklist

### Phase 0: Anthropic Spending Cap (YOU DO THIS - 5 min)
- [ ] Go to https://console.anthropic.com/settings/limits
- [ ] Set monthly cap: $50 (or your preference)
- [ ] Enable 50%, 80%, 90% email alerts
- [ ] Verify cap is active

### Phase 1: Cloudflare Turnstile (30 min)
- [ ] Sign up for Cloudflare (free)
- [ ] Get Turnstile Site Key + Secret Key
- [ ] Add `TURNSTILE_SECRET_KEY` to Netlify env vars
- [ ] Update frontend HTML with Turnstile widget
- [ ] Update backend with validation logic
- [ ] Test: bot requests should fail

### Phase 2: API Key Authentication (30 min)
- [ ] Generate 3 secure API keys
- [ ] Add `CHAT_API_KEYS` to Netlify env vars
- [ ] Update backend with key validation
- [ ] Update frontend to send API key
- [ ] Test: requests without key should fail (401)
- [ ] Test: requests with invalid key should fail (403)

### Phase 3: Secure Session Validation (30 min)
- [ ] Generate `SESSION_SECRET`
- [ ] Add to Netlify env vars
- [ ] Implement `generateSecureSessionId()`
- [ ] Implement `validateSessionId()`
- [ ] Update handler to validate all sessions
- [ ] Test: made-up sessionIds should fail (403)
- [ ] Test: expired sessions should fail (403)

### Phase 4: Rate Limiting (45 min)
- [ ] Install `@netlify/blobs` package
- [ ] Implement `checkRateLimit()`
- [ ] Test: 16th request in hour should fail (429)
- [ ] Test: 51st request in day should fail (429)
- [ ] Test: IP rotation still limited

### Phase 5: Metadata Sanitization (15 min)
- [ ] Implement `sanitizeResponse()`
- [ ] Remove ALL internal metadata
- [ ] Verify response only has: summary, full, sessionId, messageCount
- [ ] Test: no model/cost/limits in response

### Phase 6: CORS Restrictions (15 min)
- [ ] Define ALLOWED_ORIGINS
- [ ] Implement getCORSHeaders()
- [ ] Test: requests from unknown origins blocked
- [ ] Test: OPTIONS preflight works

### Phase 7: Deploy & Security Testing (30 min)
- [ ] Deploy to Netlify
- [ ] Test: no API key → 401
- [ ] Test: invalid API key → 403
- [ ] Test: no Turnstile → 403
- [ ] Test: fake sessionId → 403
- [ ] Test: rate limits enforced
- [ ] Test: no metadata leakage
- [ ] Try to bypass each layer (penetration testing)
- [ ] Monitor logs for suspicious activity

**Total time: ~3 hours**

---

## 💰 Cost Protection Summary

**With all layers active:**

Per API key:
- Max 15 requests/hour
- Max 50 requests/day
- Max cost: $0.125/day = **$3.75/month per key**

With 3 API keys:
- Max cost: **$11.25/month**

Plus Anthropic hard cap:
- **$50/month absolute maximum**

**Even if all security fails, you're protected at $50/month.**

---

## 🔒 Final Security Posture

**6 Layers of Defense:**

1. ✅ **Turnstile** → Blocks bots/scrapers
2. ✅ **API Keys** → Blocks unauthorized users
3. ✅ **Session Validation** → Blocks hijacking/abuse
4. ✅ **Rate Limits** → Blocks cost attacks
5. ✅ **Metadata Sanitization** → Blocks information leakage
6. ✅ **CORS** → Blocks cross-origin abuse

**Ultimate Failsafe:**
- ✅ **Anthropic Spending Cap** → $50/month hard stop

**This is production-ready security.** ✅

---

## 🚀 Ready to Deploy?

Once all checklist items are complete:

1. Test each layer independently
2. Test combined (full stack)
3. Attempt to bypass (pen testing)
4. Monitor for 24 hours
5. Gradually increase API key distribution

**The chat will be secure, scalable, and cost-protected.** 🔒
