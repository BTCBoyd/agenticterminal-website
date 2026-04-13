/**
 * Sovereign Dashboard - Authentication Module
 * Phase 1-2: Self-custodial identity with cryptographic foundation
 * 
 * Features:
 * - Client-side keypair generation
 * - AES-256-GCM encrypted key storage in IndexedDB
 * - Session management with timeout
 * - No private key exposure in localStorage
 */

const Auth = {
  // Legacy localStorage keys (for migration/alternative auth)
  SESSION_KEY: 'sovereign_session',
  USER_KEY: 'sovereign_user',
  
  // In-memory key storage (non-exportable)
  _sessionKey: null,
  _sessionData: null,
  
  // Inactivity tracking
  _inactivityTimer: null,
  _lastActivity: Date.now(),
  
  /**
   * Initialize auth system
   */
  async init() {
    // Initialize IndexedDB
    if (StorageIDB && !StorageIDB.db) {
      await StorageIDB.init();
    }
    
    // Check for existing session
    await this.checkSession();
    
    // Setup inactivity monitoring
    this.setupInactivityMonitor();
  },
  
  /**
   * Check if user is authenticated
   * Returns true if we have a valid session (in-memory or recoverable)
   */
  isAuthenticated() {
    // Check in-memory session first
    if (this._sessionKey && this._sessionData) {
      // Check expiration
      if (this._sessionData.expiresAt && Date.now() > this._sessionData.expiresAt) {
        this.logout();
        return false;
      }
      return true;
    }
    
    // Fall back to legacy check (for OAuth/Alby sessions)
    const session = this.getLegacySession();
    if (session) {
      if (session.expiresAt && Date.now() > session.expiresAt) {
        this.logout();
        return false;
      }
      // This is an OAuth session without in-memory key
      return true;
    }
    
    return false;
  },
  
  /**
   * Check if we have a self-custodial identity (not OAuth)
   */
  hasSelfCustodialIdentity() {
    return this._sessionKey !== null;
  },
  
  /**
   * Get current session data
   */
  getSession() {
    return this._sessionData || this.getLegacySession();
  },
  
  /**
   * Get legacy session from localStorage
   */
  getLegacySession() {
    try {
      const session = localStorage.getItem(this.SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      console.error('Failed to parse session:', e);
      return null;
    }
  },
  
  /**
   * Create new self-custodial identity
   * Flow: Generate keypair → Show mnemonic → Confirm → Encrypt → Store
   */
  async createIdentity(displayName) {
    // Generate new keypair
    const keypair = await CryptoKeygen.generateKeypair();
    
    // Generate mnemonic (optional - can be used for recovery)
    const mnemonic = await CryptoMnemonic.generate(256);
    
    return {
      displayName,
      publicKey: keypair.publicKey,
      privateKey: keypair.privateKey,
      mnemonic,
      createdAt: Date.now(),
    };
  },
  
  /**
   * Complete identity creation after passphrase set
   * @param {Object} identity - Identity object from createIdentity()
   * @param {string} passphrase - User's passphrase
   */
  async finalizeIdentityCreation(identity, passphrase) {
    // Encrypt private key
    const encryptedPrivateKey = await CryptoEncrypt.encrypt(
      identity.privateKey,
      passphrase
    );
    
    // Store in IndexedDB
    await StorageIDB.storeIdentity({
      publicKey: identity.publicKey,
      encryptedPrivateKey,
      displayName: identity.displayName,
      createdAt: identity.createdAt,
      keyType: 'secp256k1',
    });
    
    // Create session
    await this.createSession(identity.publicKey, identity.displayName, 'self_custody');
    
    // Clear sensitive data from memory
    identity.privateKey = null;
    identity.mnemonic = null;
    
    return true;
  },
  
  /**
   * Import identity from .sovereign file
   * @param {File} file - .sovereign file
   * @param {string} passphrase - Decryption passphrase
   */
  async importIdentity(file, passphrase) {
    // Parse the file
    const importedData = await CryptoExport.parseFile(file);
    
    // Decrypt and validate
    const identity = await CryptoExport.importAndDecrypt(importedData, passphrase);
    
    // Verify the decrypted key matches the public key
    const derivedPubkey = await CryptoKeygen.fromPrivateKey(identity.privateKey);
    if (derivedPubkey.publicKey !== identity.publicKey) {
      throw new Error('Imported key verification failed');
    }
    
    // Store encrypted in IndexedDB
    await StorageIDB.storeIdentity({
      publicKey: identity.publicKey,
      encryptedPrivateKey: identity.encryptedPrivateKey,
      displayName: identity.displayName,
      createdAt: identity.createdAt,
      keyType: identity.keyType || 'secp256k1',
    });
    
    // Create session (decrypt private key to memory)
    await this.createSession(identity.publicKey, identity.displayName, 'import');
    this._sessionKey = identity.privateKey;
    
    return identity;
  },
  
  /**
   * Unlock existing identity with passphrase
   * @param {string} passphrase - User's passphrase
   */
  async unlockIdentity(passphrase) {
    // Get encrypted identity from IndexedDB
    const stored = await StorageIDB.getIdentity();
    
    if (!stored) {
      throw new Error('No identity found. Please create or import an identity.');
    }
    
    // Decrypt private key
    try {
      const privateKey = await CryptoEncrypt.decrypt(
        stored.encryptedPrivateKey,
        passphrase
      );
      
      // Verify key is valid
      if (!CryptoKeygen.isValidPrivateKey(privateKey)) {
        throw new Error('Invalid private key after decryption');
      }
      
      // Load into memory
      this._sessionKey = privateKey;
      
      // Create session
      await this.createSession(
        stored.publicKey,
        stored.displayName,
        'unlock'
      );
      
      return {
        publicKey: stored.publicKey,
        displayName: stored.displayName,
      };
    } catch (error) {
      if (error.message.includes('Incorrect passphrase')) {
        throw error;
      }
      throw new Error('Failed to unlock identity. Please try again.');
    }
  },
  
  /**
   * Create session data
   */
  async createSession(publicKey, displayName, authMethod) {
    const session = {
      displayName,
      publicKey,
      agentId: CONFIG.AGENT_ID,
      loggedInAt: Date.now(),
      expiresAt: Date.now() + CONFIG.SESSION_TIMEOUT,
      authMethod,
      token: this.generateToken(),
    };
    
    // Store in memory
    this._sessionData = session;
    
    // Also store in IndexedDB (non-sensitive)
    await StorageIDB.setSession('auth_session', session);
    
    // Legacy: store minimal info in localStorage for other tabs
    // DO NOT store private key
    localStorage.setItem(this.SESSION_KEY, JSON.stringify({
      displayName,
      publicKey,
      agentId: session.agentId,
      loggedInAt: session.loggedInAt,
      expiresAt: session.expiresAt,
      authMethod,
      token: session.token,
    }));
    
    localStorage.setItem(this.USER_KEY, JSON.stringify({ 
      displayName, 
      publicKey,
    }));
    
    return session;
  },
  
  /**
   * Check and restore session from storage
   */
  async checkSession() {
    // Check for IndexedDB session
    const session = await StorageIDB.getSession('auth_session');
    if (session) {
      if (session.expiresAt && Date.now() < session.expiresAt) {
        this._sessionData = session;
        return true;
      }
    }
    
    // Check legacy localStorage
    const legacy = this.getLegacySession();
    if (legacy && legacy.expiresAt && Date.now() < legacy.expiresAt) {
      this._sessionData = legacy;
      return true;
    }
    
    return false;
  },
  
  /**
   * Login with OAuth (Alby, etc.)
   * These don't have local private keys
   */
  async loginWithOAuth(provider, userData, tokens) {
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
    
    // OAuth sessions don't have _sessionKey (no local private key)
    this._sessionKey = null;
    this._sessionData = session;
    
    await StorageIDB.setSession('auth_session', session);
    
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(this.USER_KEY, JSON.stringify({
      displayName: session.displayName,
      publicKey: session.publicKey,
    }));
    
    return session;
  },
  
  /**
   * Legacy: Manual login with public key only
   * (No self-custody - just session-based)
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
    
    this._sessionKey = null;
    this._sessionData = session;
    
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(this.USER_KEY, JSON.stringify({ displayName, publicKey }));
    
    return session;
  },
  
  /**
   * Logout - clear all session data
   */
  async logout() {
    // Clear memory
    this._sessionKey = null;
    this._sessionData = null;
    
    // Clear inactivity timer
    if (this._inactivityTimer) {
      clearTimeout(this._inactivityTimer);
      this._inactivityTimer = null;
    }
    
    // Clear storage
    await StorageIDB.clearAllSessions();
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    // Close DB connection
    StorageIDB.close();
    
    // Redirect to login
    window.location.href = '/sovereign/login.html';
  },
  
  /**
   * Get current user info
   */
  getUser() {
    if (this._sessionData) {
      return {
        displayName: this._sessionData.displayName,
        publicKey: this._sessionData.publicKey,
        authMethod: this._sessionData.authMethod,
      };
    }
    
    try {
      const user = localStorage.getItem(this.USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },
  
  /**
   * Get public key (for Nostr operations, etc.)
   */
  getPublicKey() {
    return this._sessionData?.publicKey || this.getUser()?.publicKey;
  },
  
  /**
   * Sign data with private key (only for self-custodial)
   * @param {string} message - Message to sign
   * @returns {Promise<string>} Signature
   */
  async sign(message) {
    if (!this._sessionKey) {
      throw new Error('No private key available. Sign in with self-custodial identity.');
    }
    
    return CryptoKeygen.sign(message, this._sessionKey);
  },
  
  /**
   * Get private key for signing delegation credentials
   * Phase 4: Required for agent attestation
   * @returns {Promise<string|null>} Private key hex or null if not available
   */
  async getPrivateKeyForSigning() {
    // Return in-memory key if available
    if (this._sessionKey) {
      return this._sessionKey;
    }
    
    // Try to get from IndexedDB and decrypt
    try {
      const stored = await StorageIDB.getIdentity();
      if (!stored) {
        return null;
      }
      
      // We can't decrypt without passphrase - user needs to be logged in
      // This is a security feature - private key is only in memory after unlock
      return null;
    } catch (error) {
      console.error('[Auth] Failed to get private key:', error);
      return null;
    }
  },
  
  /**
   * Extend session on user activity
   */
  extendSession() {
    this._lastActivity = Date.now();
    
    if (this._sessionData) {
      this._sessionData.expiresAt = Date.now() + CONFIG.SESSION_TIMEOUT;
      StorageIDB.setSession('auth_session', this._sessionData);
      
      // Also update legacy storage
      const legacy = this.getLegacySession();
      if (legacy) {
        legacy.expiresAt = this._sessionData.expiresAt;
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(legacy));
      }
    }
  },
  
  /**
   * Setup inactivity monitoring
   */
  setupInactivityMonitor() {
    const activityEvents = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        this._lastActivity = Date.now();
        this.extendSession();
      }, { passive: true });
    });
    
    // Check inactivity every minute
    this._inactivityTimer = setInterval(() => {
      const inactiveTime = Date.now() - this._lastActivity;
      if (inactiveTime > CONFIG.SESSION_TIMEOUT) {
        console.log('Session expired due to inactivity');
        this.logout();
      }
    }, 60000);
  },
  
  /**
   * Export identity to .sovereign file
   */
  async exportIdentity() {
    const stored = await StorageIDB.getIdentity();
    if (!stored) {
      throw new Error('No self-custodial identity to export');
    }
    
    return CryptoExport.download(stored);
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
   * Auth guard for protected pages
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
    
    return true;
  },
  
  /**
   * Check if user needs to unlock (has identity but no active session)
   */
  async needsUnlock() {
    const hasIdentity = await StorageIDB.hasIdentity();
    const hasSession = await StorageIDB.getSession('auth_session');
    return hasIdentity && (!hasSession || Date.now() > hasSession.expiresAt);
  },
  
  /**
   * Check if user needs OP registration
   * Phase 3: Redirect to OP registration after identity creation/import
   */
  async needsOPRegistration() {
    // OAuth users don't need OP registration
    if (!this.hasSelfCustodialIdentity()) {
      return false;
    }
    
    // Check if already registered
    const opSession = await StorageIDB.getSession('op_registration');
    if (opSession && (opSession.receipt || opSession.skipped)) {
      return false;
    }
    
    return true;
  },
  
  /**
   * Redirect to OP registration if needed
   * Call this after successful identity creation/import/unlock
   */
  async redirectToOPRegistrationIfNeeded() {
    if (await this.needsOPRegistration()) {
      window.location.href = '/sovereign/op-registration.html';
      return true;
    }
    return false;
  },
  
  /**
   * Check OP verification status
   * @returns {Promise<{verified: boolean, skipped: boolean, receipt: Object|null}>}
   */
  async getOPStatus() {
    const opSession = await StorageIDB.getSession('op_registration');
    
    if (!opSession) {
      return { verified: false, skipped: false, receipt: null };
    }
    
    return {
      verified: !!opSession.receipt,
      skipped: !!opSession.skipped,
      receipt: opSession.receipt || null,
    };
  },
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => {
  Auth.init().catch(console.error);
  
  if (document.body.dataset.requireAuth === 'true') {
    Auth.guard();
  }
});

// Make globally available
if (typeof window !== 'undefined') {
  window.Auth = Auth;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Auth;
}
