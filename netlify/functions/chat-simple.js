// SIMPLE VERSION - Just works
const https = require('https');

const CONFIG = {
  MAX_MESSAGES_PER_HOUR: 10,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
};

const sessions = new Map();
const rateLimits = new Map();

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  try {
    const { message, sessionId } = JSON.parse(event.body);
    
    // Simple session management
    let session = sessions.get(sessionId) || { messages: [] };
    
    session.messages.push({ role: 'user', content: message });
    
    // Call Anthropic
    const response = await callAnthropic(session.messages);
    const text = response.content[0].text;
    
    session.messages.push({ role: 'assistant', content: text });
    sessions.set(sessionId, session);
    
    // Extract first 2 sentences as summary
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const summary = sentences.slice(0, 2).join(' ').trim() || text.substring(0, 200);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        summary: summary,
        full: text,
        wordCounts: {
          summary: summary.split(/\s+/).length,
          full: text.split(/\s+/).length
        }
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function callAnthropic(messages) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 800,
      temperature: 0.7,
      system: `You are Maxi, Boyd's Bitcoin AI assistant.

CRITICAL: Always lead with your core answer in the FIRST 2 SENTENCES.
Then expand with supporting details if needed.

Keep responses focused and under 400 words.`,
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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}
