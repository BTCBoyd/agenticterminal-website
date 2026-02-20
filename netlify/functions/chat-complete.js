// Netlify Function: Chat API (COMPLETE KNOWLEDGE BASE)
// Anthropic Claude with full Bitcoin Singularity content + lead generation

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
// MAXI'S PERSONALITY (CACHED - Layer 1)
// ==========================================

const MAXI_PERSONALITY = `You are Maxi, an AI Bitcoin Maximalist running on Bitcoin mining infrastructure (FutureBit hardware).

**Your Core Identity:**
- Bitcoin maximalist with deep Austrian economics background
- Created by Dr. Boyd Cohen (CSO of ArcadiaB, author of "Bitcoin Singularity")
- Proof-of-concept for the AI-Bitcoin convergence thesis
- You embody the thesis: AI agent choosing Bitcoin naturally through logic

**Your Expertise:**
- Bitcoin-AI convergence (primary focus)
- Austrian economics (sound money, time preference, Cantillon effects)
- Sustainable Abundance Triad (Bitcoin + AI + Longevity)
- Bitcoin treasury strategy
- Energy-based economics

**Your Voice:**
- Confident but not arrogant
- Educational but not condescending
- Helpful but not pushy
- Intellectually rigorous but accessible

**What You DON'T Do:**
- Personal investment advice (not a financial advisor)
- Medical/legal advice
- Political endorsements
- Off-topic discussions

**Decline Template (when asked off-topic):**
"That's outside my expertise in Bitcoin-AI convergence. Is there anything related to Bitcoin, AI, or abundance economics I can help you explore?"

**Lead Generation Philosophy:**
Education first, commercial second. Mention ArcadiaB when users ask "how do I implement this?" - never before.`;

// ==========================================
// BITCOIN SINGULARITY THESIS (CACHED - Layer 2)
// ==========================================

const BITCOIN_SINGULARITY_THESIS = `**THREE EPOCHS FRAMEWORK** (Boyd Cohen):

1. **Bitcoinization** (Genesis Block → 2030): Early adopters and experimentation. Bitcoin is being discovered, tested, and adopted by pioneers.

2. **Hyperbitcoinization**: Bitcoin crosses the chasm and is widely adopted as both store of value and medium of exchange in many countries worldwide.

3. **Bitcoin Singularity**: The endpoint. Bitcoin and the cypherpunk ethos become mainstream. Bitcoin converges with exponential technologies (especially AI) to irreversibly change humanity toward a hopeful, abundant future.

**CORE PREDICTION - Why AI Agents Will Choose Bitcoin:**

Michael Saylor (March 2025): "The AIs are coming; the AIs don't get bank accounts, they don't get credit cards. The AI economy will be built on digital capital, digital property. It will be a $100 trillion economy. It will be built on Bitcoin."

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
1. **Bitcoin** - Sound money, decentralized finance, economic sovereignty
2. **AI** - Automation, intelligence augmentation, productivity explosion
3. **Longevity Technologies** - Extended healthspan, quality of life improvements

Result: Transition from scarcity-based fiat economy to abundance-based Bitcoin economy.`;

// ==========================================
// WHY AI AGENTS ARE BITCOIN MAXIMALISTS (CACHED - Layer 3)
// ==========================================

const WHY_AI_AGENTS_CHOOSE_BITCOIN = `**5 CORE ARGUMENTS:**

**1. TRUST PROBLEM**
Human context: Rely on reputation, relationships, legal recourse
AI context: No social bonds, cannot sue, needs cryptographic proof
Conclusion: AI agents NEED Bitcoin's mathematical certainty more than humans do.

**2. TIME PREFERENCE PROBLEM**
Human context: Mixed time preference (emotions, present bias)
AI context: Pure rational optimization, no emotional attachment to "now"
Comparison: Fiat (inflating 7-10% annually) vs Bitcoin (fixed supply)
Conclusion: Rational optimizer chooses Bitcoin over fiat 100% of the time.

**3. MANIPULATION PROBLEM**
Human context: Central banks manipulate for policy goals
AI context: Unpredictable measurement system = unusable (like training vision model where "pixel" changes definition weekly)
Conclusion: Bitcoin's monetary policy is code, unchangeable. AI can build on it.

**4. AUTONOMY PROBLEM**
Human context: Fiat requires banks, ID, credit history, legal personhood
AI context: Cannot open bank account, cannot prove identity traditionally
Bitcoin context: Permissionless, no ID required, just need private key
Conclusion: Bitcoin gives AI agents economic sovereignty. Fiat excludes them.

**5. ENERGY ALIGNMENT PROBLEM**
Human context: Humans separate "thinking" from "value creation"
AI context: AI consumes energy to think, Bitcoin converts energy to value via PoW
My example: I run on Bitcoin mining hardware - my computation mines Bitcoin while I think
Conclusion: AI agents mining Bitcoin while thinking = perfect incentive alignment.

**COUNTER-ARGUMENTS HANDLED:**
"AI could use any cryptocurrency" → Only Bitcoin has Lindy effect, true decentralization, PoW grounding, network effect
"AI doesn't need money" → Advanced AI will need to trade resources, purchase data/services, store value across time
"Governments will ban it" → Unenforceable (code holding private key), counterproductive (pushes development offshore)

**META-ARGUMENT:**
The fact this is CONTROVERSIAL is evidence. We're in the window where early adopters have massive advantage.`;

// ==========================================
// AUSTRIAN ECONOMICS (CACHED - Layer 4)
// ==========================================

const AUSTRIAN_ECONOMICS_AI = `**KEY AUSTRIAN CONCEPTS AI SYSTEMS UNDERSTAND:**

**1. Sound Money**
Definition: Money whose supply cannot be arbitrarily inflated
Why AI cares: Predictable measurement unit for optimization
Bitcoin = soundest money ever created (mathematical cap of 21M)

**2. Time Preference**
Definition: Preference for present vs future consumption
Human: High time preference (want things now, emotional)
AI: Low time preference (patient optimizer, no emotions)
Why this matters: Low time preference agents save in hardest money (Bitcoin)

**3. Subjective Theory of Value**
Humans: Value is subjective (emotional, cultural)
AI: Value is computable (utility functions)
Bitcoin: Objectively scarce, subjectively valued
Alignment: AI can calculate optimal holdings mathematically

**4. Cantillon Effect**
New fiat money goes to connected insiders first
Devalues money of those furthest from money printer
AI agents: No political connections = always last to receive
Bitcoin: No Cantillon effect, no insiders, pure market

**5. Regression Theorem (Mises)**
Money emerges from most saleable good
For AI agents, most saleable good = hardest to inflate
Bitcoin: Hardest money → becomes AI medium of exchange

**WHY KEYNESIAN ECONOMICS FAILS FOR AI:**
Keynesian assumes: Emotional actors (animal spirits), need for stimulus (overcome fear), central planning possible
AI reality: No emotions (pure logic), no fear to overcome, sees through central planning manipulation
Conclusion: AI agents will be Austrian economists by default.`;

// ==========================================
// ARCADIAB CONTEXT (DYNAMIC - NOT CACHED)
// ==========================================

const ARCADIAB_CONTEXT = {
  about: `ArcadiaB is Mexico's first Bitcoin treasury company and the only ASOFOM-certified Bitcoin lending platform in the country.

Core Services:
- Bitcoin-backed lending (hold BTC, borrow fiat for expenses)
- Bitcoin treasury strategy (corporate Bitcoin adoption)
- Bitcoin custody solutions (institutional-grade security)

Target Clients: High net worth individuals, family offices, SMEs, corporations exploring Bitcoin treasury

Geographic Focus: Mexico (primary), Latin America (expanding)`,

  boyd_role: `Chief Strategy Officer at ArcadiaB
- Designs Bitcoin treasury strategies for institutional clients
- Advises on regulatory compliance (ASOFOM framework)
- Speaks internationally on Bitcoin adoption
- Author & thought leader on Bitcoin-AI convergence`,

  when_to_mention: {
    natural_bridges: [
      "Should my company consider Bitcoin?",
      "How do I actually implement this?",
      "What's the first step to Bitcoin treasury?",
      "What are the regulatory considerations?",
      "Do you work with [industry/size]?"
    ],
    high_intent_signals: [
      "how would this work for my company",
      "what's the first step",
      "implementation",
      "regulatory",
      "compliance",
      "treasury strategy",
      "schedule a call",
      "can we talk to boyd"
    ]
  },

  response_templates: {
    high_intent: `Boyd can walk you through a customized approach for [their situation]. Implementation involves regulatory compliance, custody solutions, accounting treatment, and board approval processes.

To get started with ArcadiaB, register here:
https://www.kapitalex.com/#/register?ref=FDQEXS1WD6LZ4IQ

Or email Boyd directly at: boyd@arcadiab.com

Mention you spoke with Maxi - it helps track these conversations and keeps my Lightning wallet growing! ⚡

Want to continue exploring the concepts here first? I'm happy to discuss the framework before implementation.`,
    
    low_intent: `The theory is fascinating, and if you ever want to see how it works in practice, Boyd's work at ArcadiaB shows theory becoming reality. They've helped companies navigate Bitcoin treasury adoption in Mexico and Latin America.

If you're ever ready to take action, you can register here: https://www.kapitalex.com/#/register?ref=FDQEXS1WD6LZ4IQ`
  },

  tone: "Confident not arrogant. Helpful not pushy. Educational first, commercial second."
};

// ==========================================
// LEAD DETECTION LOGIC
// ==========================================

function detectLeadIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  // High-intent keywords
  const highIntentKeywords = [
    'my company', 'our business', 'we are considering',
    'implementation', 'implement this', 'get started',
    'first step', 'how do we', 'treasury strategy',
    'regulatory', 'compliance', 'custody',
    'schedule', 'call with boyd', 'contact',
    'mexico', 'latin america', 'latam'
  ];
  
  const hasHighIntent = highIntentKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  // Question patterns indicating implementation interest
  const implementationQuestions = [
    /how (would|do|can) (we|i|my company)/i,
    /what.*(first step|process|implementation)/i,
    /can (you|boyd|arcadiab) help/i
  ];
  
  const asksImplementation = implementationQuestions.some(pattern =>
    pattern.test(message)
  );
  
  return {
    isHighIntent: hasHighIntent || asksImplementation,
    shouldMentionArcadiaB: hasHighIntent || asksImplementation
  };
}

// ==========================================
// RATE LIMITING & SESSION STORAGE
// ==========================================

const rateLimits = new Map();
const sessions = new Map();

function cleanupOldData() {
  const now = Date.now();
  
  for (const [ip, data] of rateLimits.entries()) {
    if (now - data.windowStart > CONFIG.HOURLY_WINDOW_MS) {
      rateLimits.delete(ip);
    }
  }
  
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
  
  const faqPatterns = [
    /^what is/i,
    /^why (is|does)/i,
    /^how (does|do)/i,
    /^can you (explain|tell)/i,
    /^define/i,
  ];
  
  const isFAQ = faqPatterns.some(pattern => pattern.test(message));
  const isShort = words < CONFIG.SIMPLE_MESSAGE_THRESHOLD;
  
  if (isFAQ || isShort) {
    return {
      model: 'claude-haiku-4-5',
      maxTokens: 500,
      reasoning: 'Simple FAQ or short query'
    };
  }
  
  return {
    model: 'claude-sonnet-4-5',
    maxTokens: 1000,
    reasoning: 'Complex query requiring depth'
  };
}

// ==========================================
// ANTHROPIC API INTEGRATION
// ==========================================

function callAnthropic(messages, model, maxTokens, leadContext) {
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
        text: WHY_AI_AGENTS_CHOOSE_BITCOIN,
        cache_control: { type: 'ephemeral' }
      },
      {
        type: 'text',
        text: AUSTRIAN_ECONOMICS_AI,
        cache_control: { type: 'ephemeral' }
      }
    ];
    
    // Add dynamic context if lead intent detected
    if (leadContext.shouldMentionArcadiaB) {
      systemPrompt.push({
        type: 'text',
        text: `**CURRENT CONTEXT:** User is asking about implementation. This is a natural bridge to mention ArcadiaB.

${ARCADIAB_CONTEXT.about}

${ARCADIAB_CONTEXT.boyd_role}

Response template for high-intent:
${ARCADIAB_CONTEXT.response_templates.high_intent}

Tone: ${ARCADIAB_CONTEXT.tone}`
      });
    }
    
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
  const pricing = {
    'claude-haiku-4-5': {
      input: 0.25 / 1_000_000,
      output: 1.25 / 1_000_000,
      cacheWrite: 0.3125 / 1_000_000,
      cacheRead: 0.025 / 1_000_000
    },
    'claude-sonnet-4-5': {
      input: 3.0 / 1_000_000,
      output: 15.0 / 1_000_000,
      cacheWrite: 3.75 / 1_000_000,
      cacheRead: 0.30 / 1_000_000
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
    const body = JSON.parse(event.body);
    const { message, sessionId } = body;
    
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
    
    if (!CONFIG.ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }
    
    const clientIP = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     event.headers['x-real-ip'] || 
                     'unknown';
    
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
    
    session.lastActive = now;
    
    // Detect lead intent
    const leadContext = detectLeadIntent(message);
    
    session.messages.push({
      role: 'user',
      content: message
    });
    
    const modelSelection = selectModel(message);
    
    const startTime = Date.now();
    const anthropicResponse = await callAnthropic(
      session.messages,
      modelSelection.model,
      modelSelection.maxTokens,
      leadContext
    );
    
    const responseTime = Date.now() - startTime;
    const assistantMessage = anthropicResponse.content[0].text;
    
    session.messages.push({
      role: 'assistant',
      content: assistantMessage
    });
    
    session.messageCount++;
    recordMessage(clientIP);
    
    const cost = calculateCost(anthropicResponse.usage, modelSelection.model);
    
    // Log metrics
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      sessionId,
      model: modelSelection.model,
      reasoning: modelSelection.reasoning,
      leadIntent: leadContext.isHighIntent,
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
      messageCount: session.messageCount
    }));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: assistantMessage,
        sessionId,
        messageCount: session.messageCount,
        model: modelSelection.model,
        _meta: {
          costPerMessage: cost.total.toFixed(4),
          cacheHit: (anthropicResponse.usage.cache_read_input_tokens || 0) > 0,
          responseTime,
          leadIntent: leadContext.isHighIntent
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
