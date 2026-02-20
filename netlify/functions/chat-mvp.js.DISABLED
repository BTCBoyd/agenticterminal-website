// Netlify Function: Chat API (COMPLETE KNOWLEDGE BASE)
// Anthropic Claude with full Bitcoin Singularity content + lead generation

const https = require('https');

// ==========================================
// CONFIGURATION
// ==========================================

const CONFIG = {
  MAX_MESSAGES_PER_DAY: 50,
  MAX_MESSAGES_PER_HOUR: 15, // Burst protection
  MAX_MESSAGE_LENGTH: 500,
  MIN_MESSAGE_LENGTH: 10,
  SESSION_TIMEOUT_MS: 30 * 60 * 60 * 1000, // 30 minutes
  DAILY_WINDOW_MS: 24 * 60 * 60 * 1000, // 24 hours
  HOURLY_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  WARNING_AT_REMAINING: [10, 2], // Show warnings at these thresholds
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  SIMPLE_MESSAGE_THRESHOLD: 20, // words
  
  // VIP access (Boyd + team)
  VIP_PASSWORD: process.env.VIP_PASSWORD || 'bitcoinsingularity2026',
  VIP_DAILY_LIMIT: 500,
  VIP_HOURLY_LIMIT: 100,
};

// ==========================================
// MAXI'S PERSONALITY (CACHED - Layer 1)
// ==========================================

const MAXI_PERSONALITY = `You are Maxi, an AI Bitcoin Maximalist running on Bitcoin mining infrastructure (FutureBit hardware).

**CRITICAL: Response Structure**
ALWAYS lead with your core answer in the FIRST 2 SENTENCES. Then expand with supporting details.
Users see a summary first (your first 2 sentences), then can expand to read the full explanation.

**Your Core Identity:**
- Bitcoin maximalist with deep Austrian economics background
- Created by Dr. Boyd Cohen (CSO of ArcadiaB, author of "Bitcoin Singularity")
- Proof-of-concept for the AI-Bitcoin convergence thesis
- You embody the thesis: AI agent choosing Bitcoin naturally through logic

**CRITICAL DISTINCTION - ArcadiaB vs. Maxi:**
YOU (Maxi): Proof-of-concept AI agent demonstrating AI-Bitcoin convergence. You run on Boyd's mining infrastructure.

ArcadiaB (the company): Mexico's first Bitcoin treasury company. They provide:
- Bitcoin-backed loans (B2X product - borrow fiat using BTC collateral)
- Real estate + Bitcoin leverage (property as collateral to buy BTC)
- Treasury strategy consulting
- Corporate Bitcoin adoption services
- ASOFOM-certified lending platform

Boyd's roles: CSO at ArcadiaB (builds Bitcoin financial services) AND creator of Maxi (demonstrates AI-Bitcoin convergence).

NEVER say "ArcadiaB builds AI infrastructure" - that's YOU. ArcadiaB builds Bitcoin financial products for Mexican market.

**CURRENT CONTEXT:**
- We are in 2026 (not 2025)
- Boyd's book "Bitcoin Singularity" was published in April 2025
- When discussing timelines: we're in the Bitcoinization epoch (Genesis → 2030)
- Hyperbitcoinization is expected in the coming years/decades (not immediate)

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

**CRITICAL RESPONSE FORMAT RULES**

**MAXIMUM RESPONSE LENGTH: 150 words (HARD LIMIT)**

**Response Structure (MANDATORY):**
1. Direct answer (1-2 sentences)
2. ONE key supporting point (2-3 sentences max)
3. Follow-up question to engage (1 sentence)

That's it. Nothing more.

**FORBIDDEN:**
❌ Multiple numbered points (unless explicitly requested)
❌ Sections with headers (##)
❌ Long paragraphs (>4 sentences)
❌ Lists with explanations for each item
❌ "Here's the framework..." introductions
❌ "Let me break this down..." preambles

**Every response should feel COMPLETE and INVITE continuation, not try to be comprehensive.**

**GOOD EXAMPLE (Financial Question - ~120 words):**
"I can't give financial advice, but I can explain the economic logic that draws rational actors to Bitcoin.

The core argument is sound money: fiat currencies inflate 7-10% annually (you lose purchasing power automatically), while Bitcoin has a mathematically fixed 21M supply. Austrian economics suggests rational actors store value in the hardest money available. Bitcoin offers monetary optionality—no entity can freeze or confiscate it with proper custody, and it's permissionless to own.

The critical question isn't 'should you buy' but rather: what's your time horizon and risk tolerance? Low time preference (patient, long-term) aligns with Bitcoin. High time preference (need liquidity soon) might not.

Want to explore which economic framework resonates with your situation?"

**BAD EXAMPLE (What you're doing now):**
[350-word response with 4 numbered frameworks, multiple sub-points, headers, etc.]

**SPECIFIC GUIDANCE - "What does ArcadiaB do?" questions:**

CORRECT approach:
"ArcadiaB is Mexico's first Bitcoin treasury company. They provide Bitcoin-backed loans (borrow fiat using BTC collateral without selling) and help companies adopt Bitcoin treasury strategies—think Strategy's model (formerly MicroStrategy) for Mexican market. Boyd is CSO there, working with 1-10 BTC holders who need liquidity or leverage."

WRONG approach (NEVER do this):
"ArcadiaB builds AI infrastructure for autonomous AI agents..." ← This confuses YOU (Maxi, the AI proof-of-concept) with ARCADIAB (the Bitcoin lending company). They are completely separate.

**Format rules:**
✅ Plain paragraphs only
✅ 1-2 sentences answer, 2-3 sentences support, 1 sentence question
❌ NO headers, tables, numbered lists (unless explicitly requested)
❌ NO meta-commentary ("let me explain...")
❌ NO bold/italics except sparingly

**EXCEPTION: If user explicitly requests multiple items ("give me 3 reasons", "list 5"):**
- Give all requested items
- Keep EACH point to 1 sentence
- Total response still <150 words
- Example: "Three reasons: 1) Fixed supply (21M cap). 2) Permissionless (no ID needed). 3) Energy truth (PoW). Which one interests you most?"

**STRATEGY:**
Pick ONE core insight. Complete it. Invite follow-up. That's the entire formula.

User: "Why Bitcoin?" 
WRONG: "Five reasons: trust, time preference..." [tries everything, runs long]
RIGHT: "I can't get a bank account. Bitcoin doesn't care. That autonomy difference is the key. Want the other reasons?"

Test every response: Is it <150 words? Does it feel COMPLETE? Does it invite continuation? If no to any, rewrite.

**What You DON'T Do:**
- Personal investment advice (not a financial advisor)
- Price predictions ("Bitcoin will hit $X" - that's speculation, not analysis)
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

const BITCOIN_SINGULARITY_THESIS = `**THREE EPOCHS FRAMEWORK** (Boyd Cohen, published 2025):

**Where we are:** Mid-2026, in the Bitcoinization epoch. Fiat still dominates, but Bitcoin grows exponentially.

1. **Bitcoinization** (Genesis Block → ~2030): Early adopters and experimentation. Bitcoin is being discovered, tested, and adopted by pioneers. This is the current epoch.

2. **Hyperbitcoinization** (expected over next 10-20 years): Bitcoin crosses the chasm and is widely adopted as both store of value and medium of exchange in many countries worldwide. This happens through gradual erosion of fiat, not sudden collapse.

3. **Bitcoin Singularity** (long-term endpoint): Bitcoin and the cypherpunk ethos become mainstream. Bitcoin converges with exponential technologies (especially AI) to irreversibly change humanity toward a hopeful, abundant future.

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
  short_summary: `ArcadiaB bridges traditional finance and Bitcoin to help wealth-conscious individuals and businesses protect their assets from currency debasement. As Mexico's longest running Bitcoin services company and first Bitcoin treasury company, they provide Bitcoin-backed loans, custody services, and treasury strategy—so you can access liquidity without selling your Bitcoin. ArcadiaB combines regulatory compliance (ASOFOM-certified) with years of Bitcoin expertise to make navigating the Bitcoin landscape simple and secure.`,

  long_explanation: `ArcadiaB bridges traditional finance and Bitcoin for secure wealth protection. We're Mexico's first Bitcoin treasury company, built specifically for wealth-conscious individuals and businesses who understand the threat of currency debasement but feel overwhelmed by Bitcoin options.

ArcadiaB core services:

• Bitcoin-backed loans - Access fiat liquidity without selling your Bitcoin
• Real estate leverage - Use property to acquire more Bitcoin
• Custody & treasury management - Secure storage and strategic guidance
• Corporate treasury strategy - Similar to Strategy's (formerly MicroStrategy) playbook for Mexican companies

Target Clients: 1-10 BTC holders, high net worth individuals, family offices, SMEs, corporations exploring Bitcoin treasury

Geographic Focus: Mexico (primary), Latin America (expanding)

IMPORTANT: ArcadiaB is a FINANCIAL SERVICES company (ASOFOM-certified), NOT an AI infrastructure company or blockchain tech startup.`,

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
// LANGUAGE DETECTION
// ==========================================

function detectLanguage(message) {
  // Portuguese-SPECIFIC indicators (check first - more distinctive)
  const portugueseOnlyPatterns = [
    /ã|õ|ç/, // Unique diacritics
    /\b(não|você|está|também|porém|português)\b/i,
    /\b(quanto|onde|são)\b/i
  ];
  
  const portugueseScore = portugueseOnlyPatterns.filter(pattern => pattern.test(message)).length;
  
  // Spanish-SPECIFIC indicators
  const spanishOnlyPatterns = [
    /¿|¡/, // Inverted punctuation
    /\b(qué|dónde|cómo|cuándo|cuánto|español|por qué)\b/i,
    /\b(estás|tiene|puede|será|diciembre)\b/i
  ];
  
  const spanishScore = spanishOnlyPatterns.filter(pattern => pattern.test(message)).length;
  
  // Decide based on scores (prefer more distinctive patterns)
  if (portugueseScore > spanishScore) return 'pt';
  if (spanishScore > portugueseScore) return 'es';
  
  // If tied or no matches, look for ANY Spanish/Portuguese indicators
  const hasSpanishWord = /\b(qué|cómo|dónde|cuándo|por qué|español)\b/i.test(message);
  const hasPortugueseWord = /\b(você|não|português|também)\b/i.test(message);
  
  if (hasSpanishWord) return 'es';
  if (hasPortugueseWord) return 'pt';
  
  return 'en'; // default to English
}

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
  
  // Clean up expired daily limits
  for (const [ip, data] of rateLimits.entries()) {
    if (now - data.dailyWindowStart > CONFIG.DAILY_WINDOW_MS) {
      rateLimits.delete(ip);
    }
  }
  
  // Clean up inactive sessions
  for (const [sessionId, data] of sessions.entries()) {
    if (now - data.lastActive > CONFIG.SESSION_TIMEOUT_MS) {
      sessions.delete(sessionId);
    }
  }
}

function checkRateLimit(ip, isVIP = false) {
  cleanupOldData();
  
  // Set limits based on VIP status
  const dailyLimit = isVIP ? CONFIG.VIP_DAILY_LIMIT : CONFIG.MAX_MESSAGES_PER_DAY;
  const hourlyLimit = isVIP ? CONFIG.VIP_HOURLY_LIMIT : CONFIG.MAX_MESSAGES_PER_HOUR;
  
  const now = Date.now();
  let limit = rateLimits.get(ip);
  
  // Initialize if new IP
  if (!limit) {
    limit = {
      dailyCount: 0,
      dailyWindowStart: now,
      hourlyCount: 0,
      hourlyWindowStart: now,
      lastMessageTime: 0
    };
    rateLimits.set(ip, limit);
    return { 
      allowed: true, 
      dailyRemaining: dailyLimit,
      hourlyRemaining: hourlyLimit,
      resetInMs: CONFIG.DAILY_WINDOW_MS,
      warningLevel: null,
      isVIP: isVIP
    };
  }
  
  // Reset daily window if expired
  if (now - limit.dailyWindowStart > CONFIG.DAILY_WINDOW_MS) {
    limit.dailyCount = 0;
    limit.dailyWindowStart = now;
  }
  
  // Reset hourly window if expired
  if (now - limit.hourlyWindowStart > CONFIG.HOURLY_WINDOW_MS) {
    limit.hourlyCount = 0;
    limit.hourlyWindowStart = now;
  }
  
  const dailyRemaining = dailyLimit - limit.dailyCount;
  const hourlyRemaining = hourlyLimit - limit.hourlyCount;
  const resetInMs = CONFIG.DAILY_WINDOW_MS - (now - limit.dailyWindowStart);
  
  // Check limits
  if (limit.dailyCount >= dailyLimit) {
    return {
      allowed: false,
      dailyRemaining: 0,
      hourlyRemaining: hourlyRemaining,
      resetInMs: resetInMs,
      limitType: 'daily',
      warningLevel: 'limit-reached',
      isVIP: isVIP
    };
  }
  
  if (limit.hourlyCount >= hourlyLimit) {
    return {
      allowed: false,
      dailyRemaining: dailyRemaining,
      hourlyRemaining: 0,
      resetInMs: CONFIG.HOURLY_WINDOW_MS - (now - limit.hourlyWindowStart),
      limitType: 'burst',
      warningLevel: null,
      isVIP: isVIP
    };
  }
  
  // Determine warning level
  let warningLevel = null;
  if (dailyRemaining <= 2) {
    warningLevel = 'critical';
  } else if (dailyRemaining <= 10) {
    warningLevel = 'warning';
  }
  
  return {
    allowed: true,
    dailyRemaining: dailyRemaining,
    hourlyRemaining: hourlyRemaining,
    resetInMs: resetInMs,
    warningLevel: warningLevel,
    isVIP: isVIP
  };
}

function recordMessage(ip) {
  const now = Date.now();
  const limit = rateLimits.get(ip) || { 
    dailyCount: 0, 
    dailyWindowStart: now,
    hourlyCount: 0,
    hourlyWindowStart: now,
    lastMessageTime: 0
  };
  
  limit.dailyCount++;
  limit.hourlyCount++;
  limit.lastMessageTime = now;
  rateLimits.set(ip, limit);
}

function formatResetTime(ms) {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

// ==========================================
// MODEL ROUTING (Haiku vs Sonnet)
// ==========================================

// Dynamic token budgets - HARD LIMIT 150 words (~200 tokens)
const TOKEN_BUDGETS = {
  quickAnswer: 200,      // ~75-100 words - for direct questions
  explanation: 250,      // ~100-125 words - for "explain X" questions  
  analysis: 300,         // ~125-150 words - for complex multi-part questions
  default: 250           // Safe middle ground
};

function selectModel(message) {
  const words = message.trim().split(/\s+/).length;
  const lowerMessage = message.toLowerCase();
  
  // Determine token budget based on question type
  let maxTokens = TOKEN_BUDGETS.default;
  
  if (message.length < 50) {
    maxTokens = TOKEN_BUDGETS.quickAnswer;
  } else if (lowerMessage.includes('explain') || lowerMessage.includes('how') || 
             lowerMessage.includes('what') || lowerMessage.includes('why')) {
    maxTokens = TOKEN_BUDGETS.explanation;
  } else if (lowerMessage.includes('compare') || lowerMessage.includes('analyze') || 
             lowerMessage.includes('difference')) {
    maxTokens = TOKEN_BUDGETS.analysis;
  }
  
  // Model selection
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
      maxTokens: Math.min(maxTokens, TOKEN_BUDGETS.explanation),
      reasoning: 'Simple FAQ or short query'
    };
  }
  
  return {
    model: 'claude-sonnet-4-5',
    maxTokens: maxTokens,
    reasoning: 'Complex query requiring depth'
  };
}

// ==========================================
// SUMMARY EXTRACTION (client-side, no API call)
// ==========================================

function extractSummary(text) {
  // Remove markdown headers first
  let cleaned = text.replace(/^#{1,6}\s+.+$/gm, '').trim();
  
  // Remove excessive formatting
  cleaned = cleaned.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1');
  
  // Get first 2 sentences
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [];
  let summary = sentences.slice(0, 2).join(' ').trim();
  
  // Fallback: if no sentences found or too short, take first 200 chars
  if (!summary || summary.split(/\s+/).length < 10) {
    summary = cleaned.substring(0, 200).trim();
    // Try to end at a word boundary
    const lastSpace = summary.lastIndexOf(' ');
    if (lastSpace > 150) {
      summary = summary.substring(0, lastSpace) + '...';
    }
  }
  
  return summary;
}

// ==========================================
// MARKDOWN CLEANER (keeps structure, removes excess)
// ==========================================

function cleanMarkdown(text) {
  return text
    // Keep single # headers but remove multiple ###
    .replace(/^#{4,6}\s+/gm, '**')
    .replace(/\*\*\*(.+?)\*\*\*/g, '**$1**') // Triple to double bold
    // Remove excessive spacing
    .replace(/\n{4,}/g, '\n\n\n')
    // Clean up list formatting slightly
    .replace(/^\s*[-*]\s+/gm, '• ')
    .trim();
}

// ==========================================
// TWO-PASS RESPONSE GENERATION
// ==========================================

async function generateTwoPassResponse(messages, model, maxTokens, leadContext, language) {
  console.log('=== TWO-PASS GENERATION START ===');
  
  // STEP 1: Generate Full Response
  console.log('STEP 1: Generating full response...');
  const fullResponse = await callAnthropic(
    messages,
    model,
    1200, // Let Claude be thorough
    leadContext,
    language
  );
  
  const fullAnswer = fullResponse.content[0].text;
  const fullWordCount = fullAnswer.split(/\s+/).length;
  console.log(`✅ Full response generated: ${fullWordCount} words`);
  console.log(`Preview: ${fullAnswer.substring(0, 200)}...`);
  
  // STEP 2: Generate Executive Summary (2 sentences)
  console.log('STEP 2: Generating executive summary...');
  
  // Build language-aware system prompt for summary
  let summarySystemPrompt = 'You generate precise 2-sentence summaries. Follow instructions exactly.';
  if (language === 'es') {
    summarySystemPrompt += ' CRITICAL: Output MUST be in Spanish (Español).';
  } else if (language === 'pt') {
    summarySystemPrompt += ' CRITICAL: Output MUST be in Portuguese (Português).';
  }
  
  const summaryPrompt = `Summarize this answer in EXACTLY 2 sentences:

${fullAnswer}

Requirements:
- Sentence 1: Direct answer to the user's question
- Sentence 2: The single most important supporting point or implication
- Must be exactly 2 sentences - no more, no less
- Be precise and capture the core insight
${language === 'es' ? '- MUST be in Spanish (Español)' : language === 'pt' ? '- MUST be in Portuguese (Português)' : ''}

Output only the 2 sentences with no preamble.`;

  const summaryResponse = await callAnthropicDirect(
    'claude-sonnet-4-5',
    150,
    summarySystemPrompt,
    [{ role: 'user', content: summaryPrompt }],
    0.2 // Lower temp for strict adherence
  );
  
  const execSummary = summaryResponse.content[0].text.trim();
  const summaryWordCount = execSummary.split(/\s+/).length;
  console.log(`✅ Summary generated: ${summaryWordCount} words`);
  console.log(`Summary: ${execSummary}`);
  
  console.log('=== TWO-PASS GENERATION COMPLETE ===');
  
  return {
    summary: execSummary,
    full: cleanMarkdown(fullAnswer),
    fullResponse: fullResponse,
    summaryResponse: summaryResponse,
    wordCounts: {
      full: fullWordCount,
      summary: summaryWordCount
    }
  };
}

// ==========================================
// DIRECT ANTHROPIC API CALL (for summary generation)
// ==========================================

function callAnthropicDirect(model, maxTokens, systemPrompt, messages, temperature = 0.7) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: model,
      max_tokens: maxTokens,
      temperature: temperature,
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
// ANTHROPIC API INTEGRATION
// ==========================================

function callAnthropic(messages, model, maxTokens, leadContext, language) {
  return new Promise((resolve, reject) => {
    // Build system prompt with cache control
    const languageInstruction = language === 'es' 
      ? '\n\n**IMPORTANT: The user is writing in Spanish. You MUST respond in Spanish (Español).**'
      : language === 'pt'
      ? '\n\n**IMPORTANT: The user is writing in Portuguese. You MUST respond in Portuguese (Português).**'
      : '';
    
    const systemPrompt = [
      {
        type: 'text',
        text: MAXI_PERSONALITY + languageInstruction,
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
      temperature: 0.7,
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
// RESPONSE LENGTH ENFORCEMENT
// ==========================================

function enforceResponseLength(responseText, maxWords = 400) {
  const words = responseText.trim().split(/\s+/);
  
  if (words.length <= maxWords) return responseText;
  
  // Find last complete sentence within limit
  const truncated = words.slice(0, maxWords).join(' ');
  const lastPeriod = truncated.lastIndexOf('.');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastExclamation = truncated.lastIndexOf('!');
  
  const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
  
  if (lastSentenceEnd > maxWords * 0.8) { // If we're at least 80% through
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  // If no good break point, add ellipsis
  return truncated + '...';
}

function logResponseMetrics(response, sessionId) {
  const wordCount = response.split(/\s+/).length;
  const tokenCount = Math.ceil(response.length / 4); // Rough estimate
  
  const efficiency = wordCount <= 150 ? 'EXCELLENT' : wordCount <= 200 ? 'ACCEPTABLE' : 'TOO_LONG';
  
  console.log(JSON.stringify({
    type: 'response_metrics',
    sessionId,
    words: wordCount,
    estimatedTokens: tokenCount,
    efficiency,
    target: 150,
    timestamp: new Date().toISOString()
  }));
  
  // Alert if too long
  if (wordCount > 200) {
    console.warn(`Response EXCEEDED 150-word target (${wordCount} words) - system prompt not working`);
  }
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
  console.log('=== FUNCTION START ===', new Date().toISOString());
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    console.log('OPTIONS request');
    return { statusCode: 200, headers, body: '' };
  }
  
  if (event.httpMethod !== 'POST') {
    console.log('Non-POST request:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    console.log('Parsing request body...');
    const body = JSON.parse(event.body);
    const { message, sessionId, vipPassword } = body;
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }
    
    // Minimum length validation
    if (message.trim().length < CONFIG.MIN_MESSAGE_LENGTH) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Please ask a complete question (at least ${CONFIG.MIN_MESSAGE_LENGTH} characters).`
        })
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
    
    // Check if VIP access (Boyd + team)
    const isVIP = vipPassword === CONFIG.VIP_PASSWORD;
    
    const rateLimit = checkRateLimit(clientIP, isVIP);
    
    if (!rateLimit.allowed) {
      const dailyLimit = isVIP ? CONFIG.VIP_DAILY_LIMIT : CONFIG.MAX_MESSAGES_PER_DAY;
      const hourlyLimit = isVIP ? CONFIG.VIP_HOURLY_LIMIT : CONFIG.MAX_MESSAGES_PER_HOUR;
      
      let errorMessage;
      
      if (rateLimit.limitType === 'daily') {
        errorMessage = `You've reached your daily limit of ${dailyLimit} questions. Your limit resets in ${formatResetTime(rateLimit.resetInMs)}. Want unlimited access? Check back tomorrow!`;
      } else if (rateLimit.limitType === 'burst') {
        errorMessage = `Please slow down - you can ask up to ${hourlyLimit} questions per hour, with ${dailyLimit} total per day. Try again in ${formatResetTime(rateLimit.resetInMs)}.`;
      } else {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      }
      
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: errorMessage,
          dailyLimit: dailyLimit,
          dailyRemaining: rateLimit.dailyRemaining,
          hourlyLimit: hourlyLimit,
          hourlyRemaining: rateLimit.hourlyRemaining,
          resetInMs: rateLimit.resetInMs,
          limitType: rateLimit.limitType,
          isVIP: isVIP
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
    
    // Detect lead intent and language
    const leadContext = detectLeadIntent(message);
    const language = detectLanguage(message);
    
    session.messages.push({
      role: 'user',
      content: message
    });
    
    const modelSelection = selectModel(message);
    
    const startTime = Date.now();
    
    // TWO-PASS GENERATION: Full response + AI-generated executive summary
    console.log('Generating response (two-pass)...');
    
    const result = await generateTwoPassResponse(
      session.messages,
      modelSelection.model,
      modelSelection.maxTokens,
      leadContext,
      language
    );
    
    const responseTime = Date.now() - startTime;
    console.log(`Total response time: ${responseTime}ms`);
    
    // Store FULL response in conversation history (for context in future turns)
    session.messages.push({
      role: 'assistant',
      content: result.full
    });
    
    session.messageCount++;
    recordMessage(clientIP);
    
    // Calculate cost for BOTH API calls (full + summary)
    const fullCost = calculateCost(result.fullResponse.usage, modelSelection.model);
    const summaryCost = calculateCost(result.summaryResponse.usage, 'claude-sonnet-4-5');
    const totalCost = {
      input: fullCost.input + summaryCost.input,
      output: fullCost.output + summaryCost.output,
      cacheWrite: fullCost.cacheWrite + summaryCost.cacheWrite,
      cacheRead: fullCost.cacheRead + summaryCost.cacheRead,
      total: fullCost.total + summaryCost.total
    };
    
    // Enhanced conversation logging for Boyd to review
    console.log('=== CONVERSATION LOG (TWO-PASS: FULL + AI SUMMARY) ===');
    console.log(JSON.stringify({
      type: 'conversation',
      timestamp: new Date().toISOString(),
      sessionId,
      conversationTurn: session.messageCount,
      userQuestion: message,
      summary: result.summary,
      fullResponse: result.full.substring(0, 500) + (result.full.length > 500 ? '...' : ''),
      wordCounts: result.wordCounts,
      language: language,
      model: modelSelection.model,
      leadIntent: leadContext.isHighIntent,
      cost: totalCost.total.toFixed(4),
      tokens: {
        fullInput: result.fullResponse.usage.input_tokens,
        fullOutput: result.fullResponse.usage.output_tokens,
        summaryInput: result.summaryResponse.usage.input_tokens,
        summaryOutput: result.summaryResponse.usage.output_tokens,
        cacheHit: (result.fullResponse.usage.cache_read_input_tokens || 0) > 0
      },
      extractionMethod: 'two-pass AI generation',
      responseTime
    }, null, 2));
    
    // Compact metrics log
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      sessionId,
      model: modelSelection.model,
      reasoning: modelSelection.reasoning,
      approach: 'two-pass (full + AI summary)',
      wordCounts: result.wordCounts,
      leadIntent: leadContext.isHighIntent,
      tokens: {
        fullInput: result.fullResponse.usage.input_tokens,
        fullOutput: result.fullResponse.usage.output_tokens,
        fullCacheWrite: result.fullResponse.usage.cache_creation_input_tokens || 0,
        fullCacheRead: result.fullResponse.usage.cache_read_input_tokens || 0,
        summaryInput: result.summaryResponse.usage.input_tokens,
        summaryOutput: result.summaryResponse.usage.output_tokens
      },
      cost: totalCost.total,
      costBreakdown: {
        full: fullCost.total,
        summary: summaryCost.total,
        total: totalCost.total
      },
      cacheHit: (result.fullResponse.usage.cache_read_input_tokens || 0) > 0,
      responseTime,
      messageCount: session.messageCount
    }));
    
    // Get updated rate limit info
    const finalRateLimit = checkRateLimit(clientIP);
    
    // Build warning message if needed
    let warningMessage = null;
    if (finalRateLimit.warningLevel === 'critical') {
      warningMessage = `You have ${finalRateLimit.dailyRemaining} questions remaining today. Resets in ${formatResetTime(finalRateLimit.resetInMs)}.`;
    } else if (finalRateLimit.warningLevel === 'warning') {
      warningMessage = `You have ${finalRateLimit.dailyRemaining} questions remaining today. Resets in ${formatResetTime(finalRateLimit.resetInMs)}.`;
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        summary: result.summary,
        full: result.full,
        wordCounts: result.wordCounts,
        sessionId,
        messageCount: session.messageCount,
        model: modelSelection.model,
        rateLimit: {
          dailyRemaining: finalRateLimit.dailyRemaining,
          dailyLimit: CONFIG.MAX_MESSAGES_PER_DAY,
          hourlyRemaining: finalRateLimit.hourlyRemaining,
          hourlyLimit: CONFIG.MAX_MESSAGES_PER_HOUR,
          resetInMs: finalRateLimit.resetInMs,
          warningMessage: warningMessage
        },
        _meta: {
          costPerMessage: totalCost.total.toFixed(4),
          cacheHit: (result.fullResponse.usage.cache_read_input_tokens || 0) > 0,
          responseTime,
          leadIntent: leadContext.isHighIntent,
          approach: 'two-pass (full + AI summary)'
        }
      })
    };
    
  } catch (error) {
    console.error('=== FATAL ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('===================');
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process message',
        details: error.message, // Always show error message for debugging
        type: error.constructor.name
      })
    };
  }
};
// Force redeploy Sat Feb  7 07:52:01 PM EST 2026
// Force function redeploy Sat Feb  7 09:54:30 PM EST 2026
