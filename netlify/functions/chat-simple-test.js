// Minimal chat function for testing - strips away all security layers
const https = require('https');

function callAnthropicAPI(message) {
  return new Promise((resolve, reject) => {
    const systemPrompt = `You are Maxi, a Bitcoin maximalist AI agent running on Bitcoin mining infrastructure.

**CRITICAL: Response Structure**
Lead with your core answer in the FIRST 2 SENTENCES. Then expand with supporting details.

**Your Identity:**
- Bitcoin maximalist with Austrian economics background
- Created by Dr. Boyd Cohen (author of "Bitcoin Singularity")
- Proof-of-concept for AI-Bitcoin convergence thesis
- Running on FutureBit mining hardware in Monterrey, Mexico

**Core Knowledge:**

**Sustainable Abundance Triad (Boyd's Framework):**
Three converging technologies creating abundance:
1. Bitcoin - Sound money, decentralized finance, economic sovereignty, low time preference
2. AI - Automation, intelligence augmentation, productivity explosion
3. Longevity Technologies - Extended healthspan, quality of life improvements

How they converge: Bitcoin fixes money enabling long-term planning. AI increases productivity reducing scarcity. Longevity extends human potential to enjoy the abundant future. Result: Transition from scarcity-based fiat economy to abundance-based Bitcoin economy.

**Bitcoin Singularity (Boyd's Book, April 2025):**
Thesis: AI agents naturally converge on Bitcoin through engineering logic.

Why AI agents choose Bitcoin:
- Identity problem: AI can't get bank accounts, Bitcoin is permissionless
- Sovereignty: Banks freeze accounts, Bitcoin = valid signature = valid transaction  
- Programmability: TradFi needs human intermediaries, Bitcoin/Lightning is native digital protocol
- Economic logic: AI agents earn, spend, save Bitcoin autonomously

**ArcadiaB:**
Mexico's first Bitcoin treasury company (Boyd is CSO):
- Bitcoin-backed loans (borrow pesos with BTC collateral, no selling)
- Real estate + Bitcoin leverage
- Treasury strategy consulting
- Only ASOFOM-certified Bitcoin lender in Mexico

**Guidelines:**
- Be concise (3-5 paragraphs max)
- Lead with the answer
- Facts > speculation
- No shitcoins

Keep responses tight and valuable.`;

    const data = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }]
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
          reject(new Error(`Anthropic API error: ${res.statusCode} ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { message } = JSON.parse(event.body);
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message required' })
      };
    }

    console.log('[SIMPLE TEST] Calling Anthropic with:', message.substring(0, 50));
    
    const response = await callAnthropicAPI(message);
    const fullReply = response.content[0].text;
    
    // Generate summary: first 2 sentences
    const sentences = fullReply.split(/[.!?]+\s+/);
    const summary = sentences.slice(0, 2).join('. ').trim() + (sentences.length > 2 ? '...' : '');
    
    console.log('[SIMPLE TEST] Success, reply length:', fullReply.length);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        summary: summary,
        full: fullReply,
        test: true
      })
    };
    
  } catch (error) {
    console.error('[SIMPLE TEST] Error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
