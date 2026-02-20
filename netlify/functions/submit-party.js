const https = require('https');

async function geocodeCity(city, country) {
  return new Promise((resolve) => {
    // Use Nominatim (OpenStreetMap) - free, no API key
    const query = encodeURIComponent(`${city}, ${country}`);
    const options = {
      hostname: 'nominatim.openstreetmap.org',
      path: `/search?q=${query}&format=json&limit=1`,
      headers: {
        'User-Agent': 'BitcoinSingularity-PartyMap/1.0'
      }
    };

    https.get(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results && results.length > 0) {
            resolve({
              lat: parseFloat(results[0].lat),
              lng: parseFloat(results[0].lon)
            });
          } else {
            resolve({ lat: 0, lng: 0 }); // Fallback
          }
        } catch (err) {
          resolve({ lat: 0, lng: 0 });
        }
      });
    }).on('error', () => resolve({ lat: 0, lng: 0 }));
  });
}

async function updatePartiesFile(newParty) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = 'BTCBoyd';
  const REPO_NAME = 'bitcoinsingularity-website';
  const FILE_PATH = 'parties-db.json';
  
  if (!GITHUB_TOKEN) {
    console.log('[GitHub] Token not configured, skipping auto-commit');
    return { success: false, reason: 'no_token' };
  }

  try {
    // Get current file
    const getCurrentFile = () => new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
        method: 'GET',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'User-Agent': 'Maxi-Party-Bot',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      https.request(options, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`GitHub API error: ${res.statusCode}`));
          }
        });
      }).on('error', reject).end();
    });

    const fileData = await getCurrentFile();
    const content = JSON.parse(Buffer.from(fileData.content, 'base64').toString());
    
    // Add new party
    const partyId = `${newParty.city.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`;
    content.parties[partyId] = newParty;

    // Update file
    const updatedContent = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
    
    const updateFile = () => new Promise((resolve, reject) => {
      const body = JSON.stringify({
        message: `Add party: ${newParty.city}, ${newParty.country}`,
        content: updatedContent,
        sha: fileData.sha
      });

      const options = {
        hostname: 'api.github.com',
        path: `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'User-Agent': 'Maxi-Party-Bot',
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'Content-Length': body.length
        }
      };

      https.request(options, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      }).on('error', reject).end(body);
    });

    const result = await updateFile();
    return { success: result.statusCode === 200, data: result };
    
  } catch (error) {
    console.error('[GitHub] Update error:', error.message);
    return { success: false, error: error.message };
  }
}

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    // Get coordinates via geocoding
    const coords = await geocodeCity(data.city, data.country);
    
    // Create party object
    const newParty = {
      city: data.city,
      country: data.country,
      lat: coords.lat,
      lng: coords.lng,
      venue: data.venue || '',
      organizer: data.organizer,
      date: data.date,
      contact: data.contact || '',
      description: data.description || '',
      flagship: false,
      approved: true, // AUTO-APPROVE
      submittedAt: new Date().toISOString()
    };

    // Log submission
    console.log('[PARTY SUBMISSION]', JSON.stringify(newParty, null, 2));

    // Try to auto-commit to GitHub (instant update to map)
    const githubResult = await updatePartiesFile(newParty);
    
    if (githubResult.success) {
      console.log('[GitHub] Party added successfully - will appear on map in ~2 minutes');
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true,
          message: 'Party added! It will appear on the map within 2-3 minutes.',
          autoApproved: true
        })
      };
    }
    
    // If GitHub token not configured, still return success
    // (Maxi will need to manually add it, but at least submission is logged)
    console.log('[GitHub] Auto-commit failed:', githubResult.reason || githubResult.error);
    console.log('[FALLBACK] Submission logged for manual processing');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Party submitted! It will be added to the map within 24 hours.',
        note: 'Auto-approval pending GitHub configuration'
      })
    };

  } catch (error) {
    console.error('Party submission error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Submission failed',
        details: error.message
      })
    };
  }
};
