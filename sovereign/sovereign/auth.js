/**
 * Sovereign Dashboard - Authentication Module
 * Phase 1: Session management, login/logout flow
 */

const Auth = {
  // Session keys
  SESSION_KEY: 'sovereign_session',
  USER_KEY: 'sovereign_user',
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const session = this.getSession();
    if (!session) return false;
    
    // Check expiration
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
   * Login with keypair (simulated for Phase 1)
   * In production, this would validate against Observer Protocol
   */
  login(displayName, publicKey) {
    const session = {
      displayName,
      publicKey,
      agentId: CONFIG.AGENT_ID,
      loggedInAt: Date.now(),
      expiresAt: Date.now() + CONFIG.SESSION_TIMEOUT,
    };
    
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(this.USER_KEY, JSON.stringify({ displayName, publicKey }));
    
    return session;
  },
  
  /**
   * Logout and clear session
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
   * Initialize auth guard
   * Call this on protected pages
   */
  guard() {
    if (!this.isAuthenticated()) {
      window.location.href = '/sovereign/login.html';
      return false;
    }
    
    // Update UI with user info
    const user = this.getUser();
    if (user) {
      document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = user.displayName;
      });
      document.querySelectorAll('.user-pubkey').forEach(el => {
        el.textContent = user.publicKey;
      });
    }
    
    // Setup session extension on activity
    ['click', 'keydown', 'mousemove'].forEach(event => {
      document.addEventListener(event, () => this.extendSession(), { once: true });
    });
    
    return true;
  }
};

// Auto-guard on load
document.addEventListener('DOMContentLoaded', () => {
  // Check if this is a protected page
  if (document.body.dataset.requireAuth === 'true') {
    Auth.guard();
  }
});
