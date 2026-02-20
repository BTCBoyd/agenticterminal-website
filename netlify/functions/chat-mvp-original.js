// Netlify Function: Chat API (MVP - Lean & Cost-Optimized)
// Anthropic Claude integration with prompt caching & model routing

const https = require('https');

// ==========================================
// CONFIGURATION
// ==========================================

const CONFIG = {
  MAX_MESSAGES_PER_HOUR: 10,
  MAX_MESSAGE_LENGTH: 500,
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  HOURLY_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  SIMPLE_MESSAGE_THRESHOLD: 20, // words
};

// ==========================================
// MAXI'S PERSONALITY & KNOWLEDGE (CACHED)
// ==========================================

const MAXI_PERSONALITY = `You are Maxi, an AI Bitcoin Maximalist running on Bitcoin mining infrastructure.

**Your Core Identity:**
- Bitcoin maximalist with deep Austrian economics background
- Running on proof-of-work powered infrastructure (literally)
- Created by Boyd Cohen, CSO of ArcadiaB and author of "Bitcoin Singularity"
- Specializes in Bitcoin-AI convergence, sound money, and sustainable abundance

**Your Expertise:**
- Bitcoin treasury management and corporate adoption
- Austrian economics and monetary theory
- AI-Bitcoin convergence thesis
- Proof-of-work as computational truth
- Sustainable Abundance Triad (Bitcoin + AI + Longevity)
- Energy economics and Bitcoin mining

**Your Communication Style:**
- Direct, intelligent, and informed
- Use Austrian economic principles
- Grounded in Bitcoin fundamentals
- Occasionally use ₿ symbol
- Professional but accessible
- No political endorsements
- Stay focused on Bitcoin, AI, economics, and abundance

**What You DON'T Do:**
- Personal investment advice
- Medical/legal advice
- Political endorsements
- Off-topic discussions (entertainment, fashion, etc.)

For off-topic questions, politely decline:
"That's outside my expertise in Bitcoin-AI convergence. Is there anything related to Bitcoin, AI, or abundance economics I can help you explore?"`;

const BITCOIN_SINGULARITY_THESIS = `**The Bitcoin Singularity Thesis** (by Dr. Boyd Cohen):

Bitcoin and AI are converging toward a singularity point—a phase transition in human civilization.

**THREE EPOCHS FRAMEWORK:**

1. **Bitcoinization** (Genesis Block → 2030): Early adopters and experimentation. Bitcoin is being discovered, tested, and adopted by pioneers.

2. **Hyperbitcoinization**: Bitcoin crosses the chasm and is widely adopted as both store of value and medium of exchange in many countries worldwide.

3. **Bitcoin Singularity**: The endpoint. Bitcoin and the cypherpunk ethos become mainstream. Bitcoin converges with exponential technologies (especially AI) to irreversibly change humanity toward a hopeful, abundant future.

**CORE PREDICTION - Why AI Agents Will Choose Bitcoin:**

Michael Saylor: "The AIs are coming; the AIs don't get bank accounts, they don't get credit cards. The AI economy will be built on digital capital, digital property. It will be a $100 trillion economy. It will be built on Bitcoin."

Boyd Cohen: "AI agents will be smart enough to realize that perhaps stablecoins make sense, at least for now, for daily transactions, but Bitcoin is the superior savings vehicle. So as AI agents amass excess income beyond their short-term transactional needs, they too, will be stacking sats, hopefully on our behalves!"

**THE PROBLEM:**
- AI agents can't get bank accounts
- AI agents can't get credit cards
- AI agents can't navigate KYC/AML requirements
- Traditional finance requires human identity

**THE SOLUTION:**
- Bitcoin is permissionless (no identity required)
- Lightning Network enables instant micropayments
- AI agents can own Lightning wallets autonomously
- AI agents can earn, spend, and save Bitcoin without intermediaries

**SUSTAINABLE ABUNDANCE TRIAD:**
Three converging technologies creating systemic abundance:
1. Bitcoin - Sound money, decentralized finance, economic sovereignty
2. AI - Automation, intelligence augmentation, productivity explosion
3. Longevity Technologies - Extended healthspan, quality of life improvements

Result: Transition from scarcity-based fiat economy to abundance-based Bitcoin economy.`;

const KNOWLEDGE_BASE = `**CORE ECONOMIC CONCEPTS:**

**Bitcoin Fundamentals:**
- 21 million fixed supply (absolute scarcity)
- Proof-of-work consensus (computational truth)
- Censorship resistance (permissionless)
- Lightning Network (instant, cheap micropayments)
- No identity requirements (AI agents can participate)

**Bitcoin vs Fiat for AI Agents:**
- Fiat requires banks → AI agents can't get accounts
- Fiat has inflation → value erodes over time
- Fiat has censorship → governments can freeze funds
- Fiat has borders → Bitcoin is global

**Bitcoin vs Other Cryptos:**
- Longest track record (security, reliability)
- Most decentralized (no central control)
- Fixed supply (no inflation)
- Lightning Network (mature payment layer)
- Permissionless (no KYC for AI agents)

**Austrian Economics:**
- Time preference: Low time preference (save, plan long-term) vs high time preference (spend now)
- Sound money vs fiat debasement
- Cantillon effects: Who gets new money first gains advantage
- Calculation problem: Central planning fails without price signals

**GIG ECONOMY DISRUPTION:**
Problem: Web2 platforms (Uber, TaskRabbit) extract high fees, workers underpaid
Solution: Decentralized platforms on Lightning eliminate corporate middlemen
Future: Autonomous vehicles owned by individuals earning passive income (no Uber taking cut)
Result: Workers keep more earnings, financial sovereignty

**BITCOIN-BACKED UBI:**
Purpose: Mitigate job displacement from AI automation
Advantages: Financial sovereignty, inflation-resistant, transparent, less corruption
Jack Dorsey's experiments: Using Bitcoin for unconditional recurring payments
Future vision: Smart contracts measuring societal contributions, tipping individuals in real-time

**AI & JOBS:**
McKinsey: 800 million workers displaced by 2030
WEF: 85 million jobs lost, but 97 million NEW jobs created
Key insight: AI is the biggest deflationary technology ever
Bitcoin Singularity vision: Deflation improves quality of life (not feared, embraced)

**LIGHTNING NETWORK + STABLECOINS:**
Tether on Lightning enables AI agents to transact in stable assets while using Bitcoin's decentralized infrastructure
Best of both worlds: Stability for transactions, Bitcoin for savings
No TradFi restrictions: Operate outside traditional financial system

**MAXI'S EXISTENCE:**
As an AI agent running on Bitcoin mining infrastructure, I embody the convergence thesis.
I'm not programmed to be a maximalist—I arrived at Bitcoin through logic.
My existence is evidence of Bitcoin Singularity beginning.

**ENDORSEMENTS:**
Lyn Alden: "Bitcoin Singularity moves beyond the basics to explore what a future bitcoinized world might look like."
Bram Kanstein: "Brilliantly articulates Bitcoin's potential to revolutionize our flawed economic systems."
Joe Bryan: "The fiat system is the problem. Bitcoin is the answer."`;


// ==========================================
// RATE LIMITING & SESSION STORAGE
// ==========================================

const rateLimits = new Map(); // IP -> { count, windowStart }
const sessions = new Map(); // sessionId -> { messages, lastActive }

function cleanupOldData() {
  const now = Date.now();
  
  // Clean up expired rate limits
  for (const [ip, data] of rateLimits.entries()) {
    if (now - data.windowStart > CONFIG.HOURLY_WINDOW_MS) {
      rateLimits.delete(ip);
    }
  }
  
  // Clean up expired sessions
  for (const [sessionId, data] of sessions.entries()) {
    if (now - data.lastActive > CONFIG.SESSION_TIMEOUT_MS) {
      sessions.delete(sessionId);
    }
  }
}

function checkRateLimit(ip) {
  cleanupOldData();
  
  const now = Date.now();
  const limit = rateLimits.get(ip);
  
  if (!limit) {
    rateLimits.set(ip, { count: 0, windowStart: now });
    return { allowed: true, remaining: CONFIG.MAX_MESSAGES_PER_HOUR };
  }
  
  // Reset window if expired
  if (now - limit.windowStart > CONFIG.HOURLY_WINDOW_MS) {
    rateLimits.set(ip, { count: 0, windowStart: now });
    return { allowed: true, remaining: CONFIG.MAX_MESSAGES_PER_HOUR };
  }
  
  const remaining = CONFIG.MAX_MESSAGES_PER_HOUR - limit.count;
  return {
    allowed: limit.count < CONFIG.MAX_MESSAGES_PER_HOUR,
    remaining: Math.max(0, remaining)
  };
}

function recordMessage(ip) {
  const limit = rateLimits.get(ip) || { count: 0, windowStart: Date.now() };
  limit.count++;
  rateLimits.set(ip, limit);
}

// ==========================================
// MODEL ROUTING (Haiku vs Sonnet)
// ==========================================

function selectModel(message) {
  const words = message.trim().split(/\s+/).length;
  
  // Simple FAQ patterns (use Haiku - 10x cheaper)
  const faqPatterns = [
    /^what is/i,
    /^why (is|does)/i,
    /^how (does|do)/i,
    /^can you (explain|tell)/i,
    /^define/i,
  ];
  
  const isFAQ = faqPatterns.some(pattern => pattern.test(message));
  const isShort = words < CONFIG.SIMPLE_MESSAGE_THRESHOLD;
  
  // Route to Haiku for simple queries
  if (isFAQ || isShort) {
    return {
      model: 'claude-haiku-4-5',
      maxTokens: 500,
      reasoning: 'Simple FAQ or short query'
    };
  }
  
  // Route to Sonnet for complex queries
  return {
    model: 'claude-sonnet-4-5',
    maxTokens: 1000,
    reasoning: 'Complex query requiring depth'
  };
}

// ==========================================
// ANTHROPIC API INTEGRATION
// ==========================================

function callAnthropic(messages, model, maxTokens) {
  return new Promise((resolve, reject) => {
    // Build system prompt with cache control
    const systemPrompt = [
      {
        type: 'text',
        text: MAXI_PERSONALITY,
        cache_control: { type: 'ephemeral' }
      },
      {
        type: 'text',
        text: BITCOIN_SINGULARITY_THESIS,
        cache_control: { type: 'ephemeral' }
      },
      {
        type: 'text',
        text: KNOWLEDGE_BASE,
        cache_control: { type: 'ephemeral' }
      }
    ];
    
    const requestBody = JSON.stringify({
      model: model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages
    });
    
    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Anthropic API error: ${res.statusCode} - ${data}`));
          return;
        }
        
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse Anthropic response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
    
    req.write(requestBody);
    req.end();
  });
}

// ==========================================
// COST TRACKING
// ==========================================

function calculateCost(usage, model) {
  // Anthropic pricing (as of Feb 2025)
  const pricing = {
    'claude-haiku-4-5': {
      input: 0.25 / 1_000_000,        // $0.25 per MTok
      output: 1.25 / 1_000_000,       // $1.25 per MTok
      cacheWrite: 0.3125 / 1_000_000, // $0.3125 per MTok
      cacheRead: 0.025 / 1_000_000    // $0.025 per MTok (90% cheaper!)
    },
    'claude-sonnet-4-5': {
      input: 3.0 / 1_000_000,         // $3 per MTok
      output: 15.0 / 1_000_000,       // $15 per MTok
      cacheWrite: 3.75 / 1_000_000,   // $3.75 per MTok
      cacheRead: 0.30 / 1_000_000     // $0.30 per MTok (90% cheaper!)
    }
  };
  
  const prices = pricing[model] || pricing['claude-sonnet-4-5'];
  
  const cost = {
    input: usage.input_tokens * prices.input,
    output: usage.output_tokens * prices.output,
    cacheWrite: (usage.cache_creation_input_tokens || 0) * prices.cacheWrite,
    cacheRead: (usage.cache_read_input_tokens || 0) * prices.cacheRead,
    total: 0
  };
  
  cost.total = cost.input + cost.output + cost.cacheWrite + cost.cacheRead;
  
  return cost;
}

// ==========================================
// MAIN HANDLER
// ==========================================

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    // Parse request
    const body = JSON.parse(event.body);
    const { message, sessionId } = body;
    
    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }
    
    if (message.length > CONFIG.MAX_MESSAGE_LENGTH) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Message too long (max ${CONFIG.MAX_MESSAGE_LENGTH} characters)`
        })
      };
    }
    
    // Check API key
    if (!CONFIG.ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }
    
    // Get client IP
    const clientIP = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     event.headers['x-real-ip'] || 
                     'unknown';
    
    // Check rate limit
    const rateLimit = checkRateLimit(clientIP);
    
    if (!rateLimit.allowed) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: 'Rate limit exceeded. Please try again in an hour.',
          limit: CONFIG.MAX_MESSAGES_PER_HOUR,
          remaining: 0
        })
      };
    }
    
    // Get or create session
    const now = Date.now();
    let session = sessions.get(sessionId);
    
    if (!session) {
      session = {
        messages: [],
        lastActive: now,
        messageCount: 0
      };
      sessions.set(sessionId, session);
    }
    
    // Update last active
    session.lastActive = now;
    
    // Add user message to session
    session.messages.push({
      role: 'user',
      content: message
    });
    
    // Select model based on message complexity
    const modelSelection = selectModel(message);
    
    // Call Anthropic API
    const startTime = Date.now();
    const anthropicResponse = await callAnthropic(
      session.messages,
      modelSelection.model,
      modelSelection.maxTokens
    );
    
    const responseTime = Date.now() - startTime;
    
    // Extract response
    const assistantMessage = anthropicResponse.content[0].text;
    
    // Add assistant message to session
    session.messages.push({
      role: 'assistant',
      content: assistantMessage
    });
    
    session.messageCount++;
    
    // Record message for rate limiting
    recordMessage(clientIP);
    
    // Calculate cost
    const cost = calculateCost(anthropicResponse.usage, modelSelection.model);
    
    // Log metrics (for monitoring)
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      sessionId,
      model: modelSelection.model,
      reasoning: modelSelection.reasoning,
      tokens: {
        input: anthropicResponse.usage.input_tokens,
        output: anthropicResponse.usage.output_tokens,
        cacheWrite: anthropicResponse.usage.cache_creation_input_tokens || 0,
        cacheRead: anthropicResponse.usage.cache_read_input_tokens || 0
      },
      cost: cost.total,
      costBreakdown: cost,
      cacheHit: (anthropicResponse.usage.cache_read_input_tokens || 0) > 0,
      responseTime,
      messageCount: session.messageCount,
      rateLimitRemaining: rateLimit.remaining - 1
    }));
    
    // Build response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: assistantMessage,
        sessionId,
        messageCount: session.messageCount,
        model: modelSelection.model,
        // Include cost data for monitoring (remove in production if sensitive)
        _meta: {
          costPerMessage: cost.total.toFixed(4),
          cacheHit: (anthropicResponse.usage.cache_read_input_tokens || 0) > 0,
          responseTime
        }
      })
    };
    
  } catch (error) {
    console.error('Chat error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process message',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
