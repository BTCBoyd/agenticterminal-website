// Simple endpoint to view conversation logs
// Access at: /.netlify/functions/conversations-log

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*'
  };

  // Note: This reads from console logs
  // For persistent storage, need Netlify Blobs (upgrade needed)
  
  return {
    statusCode: 200,
    headers,
    body: `Conversation Logs
==================

To view conversation logs:
1. Go to: https://app.netlify.com/sites/maximoon/functions
2. Click "chat" function
3. Click "Function log" tab
4. Look for "=== CONVERSATION LOG ===" entries

Each log entry shows:
- Timestamp
- User question
- Maxi's response
- Conversation turn number
- Language detected
- Lead intent

For better persistent storage, we'll need to:
- Enable Netlify Blobs
- OR set up external logging service
- OR download logs via CLI: netlify functions:log chat > conversations.txt

Current setup uses console.log which Netlify captures and stores.
`
  };
};
