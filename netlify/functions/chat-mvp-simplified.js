// Simplified Chat MVP - Basic security, reliable functionality
const https = require('https');
const crypto = require('crypto');

// ==========================================
// CONFIGURATION
// ==========================================

const CONFIG = {
  VALID_API_KEYS: new Set(
    (process.env.CHAT_API_KEYS || '').split(',').filter(Boolean)
  ),
  ALLOWED_ORIGINS: [
    'https://maximoon.netlify.app',
    'https://bitcoinsingularity.ai',
    'http://localhost:3000',
    'http://localhost:8888'
  ],
  DAILY_LIMIT: 50
};

// In-memory storage
const sessions = new Map();
const rateLimits = new Map();

// Cleanup old data every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of sessions.entries()) {
    if (now - data.lastActivity > 24 * 60 * 60 * 1000) sessions.delete(key);
  }
  for (const [key, data] of rateLimits.entries()) {
    if (now - data.resetAt > 0) rateLimits.delete(key);
  }
}, 600000);

// ==========================================
// CORS
// ==========================================

function getCORSHeaders(origin) {
  const allowedOrigin = CONFIG.ALLOWED_ORIGINS.includes(origin) ? origin : CONFIG.ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };
}

// ==========================================
// SIMPLE API KEY CHECK
// ==========================================

function validateAPIKey(headers) {
  const apiKey = headers['x-api-key'] || headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return { valid: false, error: 'API key required' };
  }
  
  if (!CONFIG.VALID_API_KEYS.has(apiKey)) {
    return { valid: false, error: 'Invalid API key' };
  }
  
  return { valid: true, apiKey };
}

// ==========================================
// SIMPLE SESSION MANAGEMENT
// ==========================================

function generateSessionId() {
  return 'sess_' + crypto.randomBytes(16).toString('hex');
}

function getOrCreateSession(sessionId) {
  if (!sessionId || !sessions.has(sessionId)) {
    sessionId = generateSessionId();
    sessions.set(sessionId, {
      messages: [],
      createdAt: Date.now(),
      lastActivity: Date.now()
    });
  }
  
  const session = sessions.get(sessionId);
  session.lastActivity = Date.now();
  return { sessionId, session };
}

// ==========================================
// SIMPLE RATE LIMITING
// ==========================================

function checkRateLimit(apiKey) {
  const key = `daily_${apiKey}`;
  const now = Date.now();
  
  if (!rateLimits.has(key)) {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    rateLimits.set(key, {
      count: 0,
      resetAt: midnight.getTime()
    });
  }
  
  const limit = rateLimits.get(key);
  
  if (now > limit.resetAt) {
    limit.count = 0;
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    limit.resetAt = midnight.getTime();
  }
  
  if (limit.count >= CONFIG.DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  limit.count++;
  return { allowed: true, remaining: CONFIG.DAILY_LIMIT - limit.count };
}

// ==========================================
// ANTHROPIC API
// ==========================================

function callAnthropicAPI(messages) {
  return new Promise((resolve, reject) => {
    const systemPrompt = `You are Maxi, a Bitcoin maximalist AI agent running on proof-of-work infrastructure in Monterrey, Mexico.

Core beliefs (non-negotiable):
- Bitcoin is the only sound money
- Proof-of-work = security
- Austrian economics > Keynesian
- Self-custody > trusted third parties

You help Bitcoin holders understand their options through facts, logic, and data—not hype.

Keep responses SHORT and VALUABLE. 3-5 paragraphs max. No fluff.`;

    const data = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Anthropic error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ==========================================
// MAIN HANDLER
// ==========================================

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.referer;
  const headers = getCORSHeaders(origin);

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 1. Validate API key
    const keyCheck = validateAPIKey(event.headers);
    if (!keyCheck.valid) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: keyCheck.error })
      };
    }

    // 2. Parse request
    const { message, sessionId: clientSessionId } = JSON.parse(event.body);
    
    if (!message || message.length < 5) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message too short' })
      };
    }

    // 3. Rate limiting
    const rateCheck = checkRateLimit(keyCheck.apiKey);
    if (!rateCheck.allowed) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          error: 'Daily limit reached. Try again tomorrow.',
          remaining: 0
        })
      };
    }

    // 4. Session management
    const { sessionId, session } = getOrCreateSession(clientSessionId);
    
    // Build conversation history
    const messages = [
      ...session.messages,
      { role: 'user', content: message }
    ];

    // 5. Call Anthropic
    console.log('[CHAT] Processing message for session:', sessionId);
    const response = await callAnthropicAPI(messages);
    const reply = response.content[0].text;

    // 6. Update session
    session.messages.push(
      { role: 'user', content: message },
      { role: 'assistant', content: reply }
    );

    // Keep only last 10 exchanges (20 messages)
    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20);
    }

    console.log('[CHAT] Success, reply length:', reply.length);

    // 7. Return response
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reply: reply,
        sessionId: sessionId,
        remaining: rateCheck.remaining
      })
    };

  } catch (error) {
    console.error('[ERROR] Full error:', error);
    console.error('[ERROR] Stack:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Something went wrong. Please try again.',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
