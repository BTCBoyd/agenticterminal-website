/**
 * Sovereign Dashboard - Authentication Module
 * Phase 2: Session management with token support for OAuth
 */

const Auth = {
  SESSION_KEY: 'sovereign_session',
  USER_KEY: 'sovereign_user',
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const session = this.getSession();
    if (!session) return false;
    
    if (session.expiresAt && Date.now() > session.expiresAt) {
      this.logout();
      return false;
    }
    
    return true;
  },
  
  /**
   * Get current session
   */
  getSession() {
    try {
      const session = localStorage.getItem(this.SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      console.error('Failed to parse session:', e);
      return null;
    }
  },
  
  /**
   * Login with keypair
   */
  login(displayName, publicKey, token = null) {
    const session = {
      displayName,
      publicKey,
      agentId: CONFIG.AGENT_ID,
      loggedInAt: Date.now(),
      expiresAt: Date.now() + CONFIG.SESSION_TIMEOUT,
      token: token || this.generateToken(),
      authMethod: 'manual',
    };
    
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(this.USER_KEY, JSON.stringify({ displayName, publicKey }));
    
    return session;
  },
  
  /**
   * Login with OAuth data
   */
  loginWithOAuth(provider, userData, tokens) {
    const session = {
      displayName: userData.displayName || userData.name || userData.email,
      publicKey: userData.publicKey || userData.id,
      agentId: CONFIG.AGENT_ID,
      loggedInAt: Date.now(),
      expiresAt: Date.now() + (tokens.expiresIn * 1000 || CONFIG.SESSION_TIMEOUT),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      authMethod: provider,
      provider: provider,
    };
    
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(this.USER_KEY, JSON.stringify({
      displayName: session.displayName,
      publicKey: session.publicKey,
    }));
    
    return session;
  },
  
  /**
   * Logout
   */
  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = '/sovereign/login.html';
  },
  
  /**
   * Get current user
   */
  getUser() {
    try {
      const user = localStorage.getItem(this.USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },
  
  /**
   * Extend session
   */
  extendSession() {
    const session = this.getSession();
    if (session) {
      session.expiresAt = Date.now() + CONFIG.SESSION_TIMEOUT;
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }
  },
  
  /**
   * Generate session token
   */
  generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return 'tok_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },
  
  /**
   * Initialize auth guard
   */
  guard() {
    if (!this.isAuthenticated()) {
      window.location.href = '/sovereign/login.html';
      return false;
    }
    
    const user = this.getUser();
    if (user) {
      document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = user.displayName;
      });
      document.querySelectorAll('.user-pubkey').forEach(el => {
        el.textContent = user.publicKey;
      });
    }
    
    ['click', 'keydown', 'mousemove'].forEach(event => {
      document.addEventListener(event, () => this.extendSession(), { once: true });
    });
    
    return true;
  },
};

// Auto-guard on load
document.addEventListener('DOMContentLoaded', () => {
  if (document.body.dataset.requireAuth === 'true') {
    Auth.guard();
  }
});
