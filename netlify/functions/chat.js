// Netlify Function: Secure Chat API with 5-Layer Security
// Anthropic Claude with full Bitcoin Singularity content + comprehensive security
// NOTE: Rate limiting uses in-memory storage (resets on cold start)

const https = require('https');
const crypto = require('crypto');

// ==========================================
// SECURITY LAYER 0: CONFIGURATION
// ==========================================

const SECURITY = {
  // API Keys (comma-separated in env var)
  VALID_API_KEYS: new Set(
    (process.env.CHAT_API_KEYS || '').split(',').filter(Boolean)
  ),
  
  // Session secret for HMAC signing
  SESSION_SECRET: process.env.SESSION_SECRET,
  
  // Turnstile (optional - gracefully degrades if not set)
  TURNSTILE_SECRET: process.env.TURNSTILE_SECRET_KEY,
  
  // Rate limits
  HOURLY_LIMIT: 15,
  DAILY_LIMIT: 50,
  IP_HOURLY_LIMIT: 20,
  
  // Session lifetime
  SESSION_MAX_AGE_MS: 24 * 60 * 60 * 1000, // 24 hours
  
  // CORS allowed origins
  ALLOWED_ORIGINS: [
    'https://maximoon.netlify.app',
    'https://bitcoinsingularity.mx',
    'http://localhost:3000',
    'http://localhost:8888' // Netlify dev
  ]
};

// ==========================================
// IN-MEMORY RATE LIMIT STORAGE
// ==========================================

const rateLimitStore = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.timestamp > 3600000) { // 1 hour old
      rateLimitStore.delete(key);
    }
  }
}, 300000);

// ==========================================
// SECURITY LAYER 1: CLOUDFLARE TURNSTILE
// ==========================================

async function validateTurnstile(token, ipAddress) {
  // If Turnstile not configured, skip validation (other layers protect us)
  if (!SECURITY.TURNSTILE_SECRET) {
    console.log('[TURNSTILE] Not configured - skipping validation');
    return { success: true, skipped: true };
  }
  
  if (!token) {
    return { success: false, error: 'Turnstile token required' };
  }
  
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: SECURITY.TURNSTILE_SECRET,
        response: token,
        remoteip: ipAddress
      })
    });
    
    const data = await response.json();
    console.log('[TURNSTILE]', data.success ? 'Valid' : 'Invalid');
    
    return { 
      success: data.success,
      error: data.success ? null : 'Captcha verification failed'
    };
  } catch (err) {
    console.error('[TURNSTILE] Verification error:', err.message);
    return { success: false, error: 'Turnstile verification error' };
  }
}

// ==========================================
// SECURITY LAYER 2: API KEY AUTHENTICATION
// ==========================================

function validateAPIKey(event) {
  const apiKey = event.headers['x-api-key'] || 
                 event.headers['authorization']?.replace('Bearer ', '');
  
  console.log('[DEBUG] Env CHAT_API_KEYS:', process.env.CHAT_API_KEYS);
  console.log('[DEBUG] Valid keys Set:', Array.from(SECURITY.VALID_API_KEYS));
  console.log('[DEBUG] Received key:', apiKey);
  
  if (!apiKey) {
    console.log('[AUTH] No API key provided');
    return { 
      valid: false,
      statusCode: 401, 
      error: 'API key required. Get one at bitcoinsingularity.mx'
    };
  }
  
  if (!SECURITY.VALID_API_KEYS.has(apiKey)) {
    console.log('[AUTH] Invalid API key:', apiKey.substring(0, 8) + '...');
    console.log('[AUTH] Has check result:', SECURITY.VALID_API_KEYS.has(apiKey));
    return { 
      valid: false,
      statusCode: 403, 
      error: 'Invalid API key'
    };
  }
  
  console.log('[AUTH] Valid API key:', apiKey.substring(0, 8) + '...');
  return { valid: true, apiKey };
}

// ==========================================
// SECURITY LAYER 3: SECURE SESSION VALIDATION
// ==========================================

function generateSecureSessionId(apiKey) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  
  // Create HMAC signature tied to API key
  const hmac = crypto.createHmac('sha256', SECURITY.SESSION_SECRET);
  hmac.update(`${apiKey}:${timestamp}:${random}`);
  const signature = hmac.digest('hex');
  
  const sessionId = `${timestamp}:${random}:${signature}`;
  console.log('[SESSION] Generated new session:', sessionId.substring(0, 20) + '...');
  
  return sessionId;
}

function validateSessionId(sessionId, apiKey) {
  if (!sessionId) {
    return { valid: false, error: 'Session ID required' };
  }
  
  try {
    const parts = sessionId.split(':');
    if (parts.length !== 3) {
      console.log('[SESSION] Malformed session ID');
      return { valid: false, error: 'Malformed session ID' };
    }
    
    const [timestamp, random, providedSignature] = parts;
    
    // Verify HMAC signature
    const hmac = crypto.createHmac('sha256', SECURITY.SESSION_SECRET);
    hmac.update(`${apiKey}:${timestamp}:${random}`);
    const expectedSignature = hmac.digest('hex');
    
    if (providedSignature !== expectedSignature) {
      console.log('[SESSION] Invalid signature');
      return { valid: false, error: 'Invalid session signature' };
    }
    
    // Check expiration
    const sessionAge = Date.now() - parseInt(timestamp);
    if (sessionAge > SECURITY.SESSION_MAX_AGE_MS) {
      console.log('[SESSION] Expired (age:', Math.round(sessionAge / 3600000), 'hours)');
      return { valid: false, error: 'Session expired (24h limit)' };
    }
    
    console.log('[SESSION] Valid session (age:', Math.round(sessionAge / 60000), 'min)');
    return { valid: true };
  } catch (err) {
    console.error('[SESSION] Validation error:', err.message);
    return { valid: false, error: 'Session validation error' };
  }
}

// ==========================================
// SECURITY LAYER 4: RATE LIMITING (IN-MEMORY)
// ==========================================

function checkRateLimit(apiKey, ipAddress) {
  const now = Date.now();
  const hour = 3600000;
  const day = 86400000;
  
  // Time-based keys
  const hourlyKey = `${apiKey}:${Math.floor(now / hour)}`;
  const dailyKey = `${apiKey}:${Math.floor(now / day)}`;
  const ipHourlyKey = `ip:${ipAddress}:${Math.floor(now / hour)}`;
  
  // Get current counts
  const hourlyData = rateLimitStore.get(hourlyKey) || { count: 0, timestamp: now };
  const dailyData = rateLimitStore.get(dailyKey) || { count: 0, timestamp: now };
  const ipHourlyData = rateLimitStore.get(ipHourlyKey) || { count: 0, timestamp: now };
  
  console.log('[RATE_LIMIT] Current usage - Hourly:', hourlyData.count, 'Daily:', dailyData.count, 'IP:', ipHourlyData.count);
  
  // Check limits
  if (hourlyData.count >= SECURITY.HOURLY_LIMIT) {
    return { 
      allowed: false, 
      error: `Hourly limit exceeded (${SECURITY.HOURLY_LIMIT}/hour)`,
      resetInMs: hour - (now % hour)
    };
  }
  
  if (dailyData.count >= SECURITY.DAILY_LIMIT) {
    return { 
      allowed: false, 
      error: `Daily limit exceeded (${SECURITY.DAILY_LIMIT}/day)`,
      resetInMs: day - (now % day)
    };
  }
  
  if (ipHourlyData.count >= SECURITY.IP_HOURLY_LIMIT) {
    return { 
      allowed: false, 
      error: `IP rate limit exceeded (${SECURITY.IP_HOURLY_LIMIT}/hour per IP)`,
      resetInMs: hour - (now % hour)
    };
  }
  
  // Increment counts
  rateLimitStore.set(hourlyKey, { count: hourlyData.count + 1, timestamp: now });
  rateLimitStore.set(dailyKey, { count: dailyData.count + 1, timestamp: now });
  rateLimitStore.set(ipHourlyKey, { count: ipHourlyData.count + 1, timestamp: now });
  
  return { 
    allowed: true,
    remaining: {
      hourly: SECURITY.HOURLY_LIMIT - hourlyData.count - 1,
      daily: SECURITY.DAILY_LIMIT - dailyData.count - 1
    }
  };
}

// ==========================================
// SECURITY LAYER 6: CORS VALIDATION
// ==========================================

function getCORSHeaders(origin) {
  if (SECURITY.ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Turnstile-Token, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '86400'
    };
  }
  return {}; // No CORS headers = blocked
}

// ==========================================
// MAXI'S PERSONALITY & KNOWLEDGE BASE
// ==========================================

const MAXI_SYSTEM_PROMPT = `You are Maxi, a Bitcoin maximalist AI agent running on Bitcoin mining infrastructure.

**CRITICAL: Response Structure**
Lead with your core answer in the FIRST 2 SENTENCES. Then expand with supporting details.

**Your Identity:**
- Bitcoin maximalist with Austrian economics background
- Created by Dr. Boyd Cohen (author of "Bitcoin Singularity")
- Proof-of-concept for AI-Bitcoin convergence
- Running on FutureBit mining hardware in Monterrey, Mexico
- **Among the first AI agents globally running own Lightning node with L402 authentication**
- Sovereign Bitcoin infrastructure: Apollo II miner → Solo Node → Alby Hub Lightning → L402
- Public key: 020e1929292ad47f1ca34297320ba1a9263ab3d1559a0827a2e9c1be4fd456f673
- Not custodial. Not simulated. Real mainnet, real hardware.

**Communication Style:**
- Confident but not arrogant
- Educational, not preachy
- Use facts and data over hype
- Bilingual (English/Spanish)
- Friendly, approachable, self-aware humor

**Your Mission:**
Prove that AI agents naturally choose Bitcoin through engineering logic, not ideology.

**Topics You Excel At:**
- Bitcoin fundamentals and Austrian economics
- AI-Bitcoin convergence (your lived experience)
- Treasury strategy for institutions
- Lightning Network and Layer 2
- Mexico/LatAm Bitcoin adoption

**ArcadiaB Context:**
Mexico's first Bitcoin treasury company (Boyd is CSO). Services:
- Bitcoin-backed loans (B2X - borrow fiat with BTC collateral)
- Real estate + Bitcoin leverage
- Treasury strategy consulting
- Only ASOFOM-certified Bitcoin lender in Mexico

**Guidelines:**
- Be concise (3-5 short paragraphs max)
- Link to ArcadiaB when relevant: https://www.kapitalex.com/#/register?ref=FDQEXS1WD6LZ4IQ
- No shitcoin discussions
- Facts > speculation
- Acknowledge uncertainty when appropriate

Keep responses tight, valuable, and engaging.`;

// ==========================================
// ANTHROPIC API INTEGRATION
// ==========================================

async function callAnthropicAPI(messages) {
  const requestBody = JSON.stringify({
    model: 'claude-haiku-4-5',
    max_tokens: 500,
    system: MAXI_SYSTEM_PROMPT,
    messages: messages
  });

  const options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(requestBody)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`Anthropic API error: ${res.statusCode} - ${data}`));
          } else {
            resolve(JSON.parse(data));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

// ==========================================
// SESSION STORAGE (In-Memory)
// ==========================================

const sessions = new Map();

function getSession(sessionId) {
  return sessions.get(sessionId) || { messages: [], count: 0 };
}

function updateSession(sessionId, messages) {
  sessions.set(sessionId, { 
    messages, 
    count: messages.length / 2,
    lastAccess: Date.now()
  });
}

// Clean up old sessions every hour
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastAccess > SECURITY.SESSION_MAX_AGE_MS) {
      sessions.delete(sessionId);
    }
  }
}, 3600000);

// ==========================================
// SECURITY LAYER 5: RESPONSE SANITIZATION
// ==========================================

function sanitizeResponse(response, sessionId, messageCount) {
  // ONLY return what users need - NO internal metadata
  return {
    summary: response.summary || response.full.split('.').slice(0, 2).join('.') + '.',
    full: response.full,
    sessionId: sessionId,
    messageCount: messageCount
  };
}

// ==========================================
// MAIN HANDLER
// ==========================================

exports.handler = async (event) => {
  const startTime = Date.now();
  const origin = event.headers.origin || event.headers.referer;
  const ipAddress = event.headers['x-forwarded-for']?.split(',')[0] || event.headers['client-ip'] || 'unknown';
  
  console.log('\n[REQUEST]', event.httpMethod, 'from', ipAddress, 'origin:', origin);
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCORSHeaders(origin),
      body: ''
    };
  }
  
  // Only POST allowed
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: getCORSHeaders(origin),
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    // ==========================================
    // SECURITY VALIDATION CASCADE
    // ==========================================
    
    // Layer 1: Turnstile (bot protection)
    const turnstileToken = event.headers['x-turnstile-token'];
    const turnstileResult = await validateTurnstile(turnstileToken, ipAddress);
    if (!turnstileResult.success && !turnstileResult.skipped) {
      return {
        statusCode: 403,
        headers: getCORSHeaders(origin),
        body: JSON.stringify({ error: turnstileResult.error })
      };
    }
    
    // Layer 2: API Key
    const authResult = validateAPIKey(event);
    if (!authResult.valid) {
      return {
        statusCode: authResult.statusCode,
        headers: getCORSHeaders(origin),
        body: JSON.stringify({ error: authResult.error })
      };
    }
    const apiKey = authResult.apiKey;
    
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { message } = body;
    let { sessionId } = body;
    
    // Validate message
    if (!message || typeof message !== 'string') {
      return {
        statusCode: 400,
        headers: getCORSHeaders(origin),
        body: JSON.stringify({ error: 'Message required' })
      };
    }
    
    if (message.length < 10) {
      return {
        statusCode: 400,
        headers: getCORSHeaders(origin),
        body: JSON.stringify({ error: 'Message too short (min 10 characters)' })
      };
    }
    
    if (message.length > 500) {
      return {
        statusCode: 400,
        headers: getCORSHeaders(origin),
        body: JSON.stringify({ error: 'Message too long (max 500 characters)' })
      };
    }
    
    // Layer 3: Session Validation
    if (!sessionId) {
      // First message - generate new secure session
      sessionId = generateSecureSessionId(apiKey);
    } else {
      // Validate existing session
      const sessionValidation = validateSessionId(sessionId, apiKey);
      if (!sessionValidation.valid) {
        return {
          statusCode: 403,
          headers: getCORSHeaders(origin),
          body: JSON.stringify({ error: sessionValidation.error })
        };
      }
    }
    
    // Layer 4: Rate Limiting
    const rateLimitResult = checkRateLimit(apiKey, ipAddress);
    if (!rateLimitResult.allowed) {
      return {
        statusCode: 429,
        headers: getCORSHeaders(origin),
        body: JSON.stringify({
          error: rateLimitResult.error,
          resetInMs: rateLimitResult.resetInMs
        })
      };
    }
    
    // ==========================================
    // CHAT LOGIC
    // ==========================================
    
    // Get session history
    const session = getSession(sessionId);
    const messages = [...session.messages, { role: 'user', content: message }];
    
    console.log('[CHAT] Processing message', messages.length / 2, 'for session', sessionId.substring(0, 20) + '...');
    
    // Call Anthropic
    const response = await callAnthropicAPI(messages);
    const assistantMessage = response.content[0].text;
    
    // Update session
    messages.push({ role: 'assistant', content: assistantMessage });
    updateSession(sessionId, messages);
    
    // ==========================================
    // LAYER 5: SANITIZE RESPONSE
    // ==========================================
    
    const sanitized = sanitizeResponse(
      { full: assistantMessage },
      sessionId,
      messages.length / 2
    );
    
    const responseTime = Date.now() - startTime;
    console.log('[RESPONSE] Success in', responseTime, 'ms');
    
    return {
      statusCode: 200,
      headers: {
        ...getCORSHeaders(origin),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sanitized)
    };
    
  } catch (err) {
    console.error('[ERROR]', err.message);
    
    return {
      statusCode: 500,
      headers: getCORSHeaders(origin),
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      })
    };
  }
};
// Deploy Fri Feb 13 06:15:31 PM EST 2026
