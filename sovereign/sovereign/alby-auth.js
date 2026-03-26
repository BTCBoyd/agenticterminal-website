/**
 * Sovereign Dashboard - Alby OAuth Integration
 * Phase 2: One-click login with Alby browser extension
 */

const AlbyAuth = {
  /**
   * Check if Alby extension is available
   */
  isExtensionAvailable() {
    return typeof window.webln !== 'undefined';
  },
  
  /**
   * Initialize Alby OAuth flow
   */
  async initiateLogin() {
    if (!this.isExtensionAvailable()) {
      // Fallback to OAuth flow
      return this.initiateOAuth();
    }
    
    try {
      // Try extension-based login first
      await window.webln.enable();
      const info = await window.webln.getInfo();
      
      // Create session with Alby account info
      const session = {
        displayName: info.node?.alias || 'Alby User',
        publicKey: info.node?.pubkey || 'alby_' + Date.now(),
        agentId: CONFIG.AGENT_ID,
        loggedInAt: Date.now(),
        expiresAt: Date.now() + CONFIG.SESSION_TIMEOUT,
        authMethod: 'alby_extension',
        albyConnected: true,
      };
      
      localStorage.setItem(Auth.SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(Auth.USER_KEY, JSON.stringify({
        displayName: session.displayName,
        publicKey: session.publicKey,
      }));
      
      return { success: true, method: 'extension' };
      
    } catch (error) {
      console.log('Extension login failed, falling back to OAuth:', error);
      return this.initiateOAuth();
    }
  },
  
  /**
   * Initiate OAuth flow via Alby
   */
  initiateOAuth() {
    const state = this.generateState();
    localStorage.setItem('alby_oauth_state', state);
    
    const params = new URLSearchParams({
      client_id: CONFIG.ALBY.CLIENT_ID,
      redirect_uri: CONFIG.ALBY.REDIRECT_URI,
      response_type: 'code',
      scope: CONFIG.ALBY.SCOPE,
      state: state,
    });
    
    const authUrl = `${CONFIG.ALBY.AUTH_URL}?${params.toString()}`;
    window.location.href = authUrl;
    
    return { success: true, method: 'oauth_redirect' };
  },
  
  /**
   * Handle OAuth callback
   */
  async handleCallback(code, state) {
    const savedState = localStorage.getItem('alby_oauth_state');
    
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }
    
    localStorage.removeItem('alby_oauth_state');
    
    // Exchange code for token
    const tokenResponse = await fetch(CONFIG.ALBY.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        grant_type: 'authorization_code',
        redirect_uri: CONFIG.ALBY.REDIRECT_URI,
        client_id: CONFIG.ALBY.CLIENT_ID,
      }),
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Token exchange failed');
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get account info
    const accountResponse = await fetch('https://api.getalby.com/user/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (!accountResponse.ok) {
      throw new Error('Failed to get account info');
    }
    
    const accountData = await accountResponse.json();
    
    // Create session
    const session = {
      displayName: accountData.name || accountData.email || 'Alby User',
      publicKey: accountData.lightning_address || accountData.identifier,
      agentId: CONFIG.AGENT_ID,
      loggedInAt: Date.now(),
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      authMethod: 'alby_oauth',
      albyConnected: true,
      albyToken: tokenData.access_token,
      albyRefreshToken: tokenData.refresh_token,
    };
    
    localStorage.setItem(Auth.SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(Auth.USER_KEY, JSON.stringify({
      displayName: session.displayName,
      publicKey: session.publicKey,
    }));
    
    return { success: true, account: accountData };
  },
  
  /**
   * Generate random state parameter
   */
  generateState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },
  
  /**
   * Refresh Alby token if needed
   */
  async refreshToken() {
    const session = Auth.getSession();
    if (!session || !session.albyRefreshToken) {
      return false;
    }
    
    try {
      const response = await fetch(CONFIG.ALBY.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: session.albyRefreshToken,
          client_id: CONFIG.ALBY.CLIENT_ID,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      
      session.albyToken = data.access_token;
      session.albyRefreshToken = data.refresh_token;
      session.expiresAt = Date.now() + (data.expires_in * 1000);
      
      localStorage.setItem(Auth.SESSION_KEY, JSON.stringify(session));
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  },
  
  /**
   * Check if user is connected via Alby
   */
  isAlbyConnected() {
    const session = Auth.getSession();
    return session && session.albyConnected;
  },
  
  /**
   * Get Alby connection status for UI
   */
  getStatus() {
    if (this.isExtensionAvailable()) {
      return { available: true, method: 'extension' };
    }
    return { available: true, method: 'oauth' };
  },
};

// Handle callback page logic
if (window.location.pathname.includes('alby-callback')) {
  document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    
    if (error) {
      console.error('Alby OAuth error:', error);
      window.location.href = '/sovereign/login.html?error=alby_denied';
      return;
    }
    
    if (code && state) {
      try {
        await AlbyAuth.handleCallback(code, state);
        window.location.href = '/sovereign/';
      } catch (error) {
        console.error('Callback handling failed:', error);
        window.location.href = '/sovereign/login.html?error=callback_failed';
      }
    }
  });
}
