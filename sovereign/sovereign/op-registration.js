/**
 * Sovereign Dashboard - Observer Protocol Registration
 * Phase 3: On-chain identity verification and attestation readiness
 * 
 * Flow:
 * 1. Check if already registered on OP (GET /observer/agents/{pubkey})
 * 2. If not, initiate registration (POST /observer/agents/register) → get challenge
 * 3. Sign challenge with private key using WebCrypto
 * 4. Submit signed challenge (POST /observer/agents/verify) → get receipt
 * 5. Store receipt in IndexedDB
 * 6. Dashboard shows "VERIFIED ON OP" badge
 */

const OPRegistration = {
  // OP API endpoints
  API_BASE: CONFIG.API_BASE || 'https://api.observerprotocol.org',
  TIMEOUT_MS: 5000,
  
  // Registration states
  STATE: {
    UNREGISTERED: 'unregistered',
    PENDING: 'pending',
    REGISTERED: 'registered',
    FAILED: 'failed',
    SKIP: 'skipped',
  },
  
  // Current state
  _registrationState: null,
  _receipt: null,
  _onStateChangeCallbacks: [],
  
  /**
   * Initialize OP registration module
   * Check if already registered and load receipt from storage
   */
  async init() {
    try {
      // Load stored receipt from IndexedDB
      const stored = await StorageIDB.getSession('op_registration');
      if (stored && stored.receipt) {
        this._receipt = stored.receipt;
        this._registrationState = this.STATE.REGISTERED;
        return { state: this.STATE.REGISTERED, receipt: this._receipt };
      }
      
      // Check if user has self-custodial identity
      if (!Auth.hasSelfCustodialIdentity()) {
        // OAuth users don't need OP registration for basic functionality
        this._registrationState = this.STATE.SKIP;
        return { state: this.STATE.SKIP };
      }
      
      // Check if already registered on OP
      const pubkey = Auth.getPublicKey();
      if (pubkey) {
        const checkResult = await this.checkRegistrationStatus(pubkey);
        if (checkResult.registered) {
          this._registrationState = this.STATE.REGISTERED;
          this._receipt = checkResult.receipt;
          await this.storeReceipt(this._receipt);
          return { state: this.STATE.REGISTERED, receipt: this._receipt };
        }
      }
      
      this._registrationState = this.STATE.UNREGISTERED;
      return { state: this.STATE.UNREGISTERED };
      
    } catch (error) {
      console.error('[OP] Init error:', error);
      this._registrationState = this.STATE.UNREGISTERED;
      return { state: this.STATE.UNREGISTERED, error: error.message };
    }
  },
  
  /**
   * Check if pubkey is already registered on OP
   * @param {string} pubkey - Public key to check
   * @returns {Promise<{registered: boolean, receipt?: Object}>}
   */
  async checkRegistrationStatus(pubkey) {
    try {
      // Use hex pubkey for API
      const hexPubkey = pubkey.startsWith('0') ? pubkey.slice(2) : pubkey;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
      
      const response = await fetch(
        `${this.API_BASE}/observer/agents/${hexPubkey}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.status === 200) {
        const data = await response.json();
        return {
          registered: true,
          receipt: {
            pubkey: pubkey,
            pubkeyHash: data.pubkey_hash || this.hashPubkey(pubkey),
            registeredAt: data.registered_at || Date.now(),
            verifiedAt: Date.now(),
          },
        };
      }
      
      if (response.status === 404) {
        return { registered: false };
      }
      
      throw new Error(`Unexpected response: ${response.status}`);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('OP request timed out');
      }
      console.error('[OP] Status check failed:', error);
      throw error;
    }
  },
  
  /**
   * Start registration flow
   * 1. Get challenge from OP
   * 2. Sign challenge with private key
   * 3. Submit signed challenge
   * @returns {Promise<{success: boolean, receipt?: Object, error?: string}>}
   */
  async register() {
    if (!Auth.hasSelfCustodialIdentity()) {
      return { success: false, error: 'Self-custodial identity required' };
    }
    
    this._setState(this.STATE.PENDING);
    
    try {
      const pubkey = Auth.getPublicKey();
      
      // Step 1: Get challenge from OP
      const challenge = await this.requestChallenge(pubkey);
      
      // Step 2: Sign challenge with private key
      const signature = await Auth.sign(challenge);
      
      // Step 3: Submit signed challenge
      const receipt = await this.submitVerification(pubkey, challenge, signature);
      
      // Store receipt
      this._receipt = receipt;
      await this.storeReceipt(receipt);
      this._setState(this.STATE.REGISTERED);
      
      return { success: true, receipt };
      
    } catch (error) {
      console.error('[OP] Registration failed:', error);
      this._setState(this.STATE.FAILED);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Request challenge from OP
   * POST /observer/agents/register
   */
  async requestChallenge(pubkey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
    
    try {
      const response = await fetch(
        `${this.API_BASE}/observer/agents/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            pubkey: pubkey,
            agent_id: CONFIG.AGENT_ID,
            timestamp: Date.now(),
          }),
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Registration failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.challenge) {
        throw new Error('Invalid response: no challenge received');
      }
      
      return data.challenge;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('OP registration timed out. Please try again.');
      }
      throw error;
    }
  },
  
  /**
   * Submit signed challenge to OP
   * POST /observer/agents/verify
   */
  async submitVerification(pubkey, challenge, signature) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
    
    try {
      const response = await fetch(
        `${this.API_BASE}/observer/agents/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            pubkey: pubkey,
            challenge: challenge,
            signature: signature,
            agent_id: CONFIG.AGENT_ID,
          }),
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Signature verification failed. Your keypair may be corrupted.');
        }
        if (response.status === 409) {
          // Already registered
          return {
            pubkey: pubkey,
            pubkeyHash: this.hashPubkey(pubkey),
            registeredAt: Date.now(),
            verifiedAt: Date.now(),
            existing: true,
          };
        }
        
        throw new Error(errorData.message || `Verification failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        pubkey: pubkey,
        pubkeyHash: data.pubkey_hash || this.hashPubkey(pubkey),
        receiptHash: data.receipt_hash,
        registeredAt: data.registered_at || Date.now(),
        verifiedAt: Date.now(),
      };
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Verification timed out. Please try again.');
      }
      throw error;
    }
  },
  
  /**
   * Store registration receipt in IndexedDB
   */
  async storeReceipt(receipt) {
    await StorageIDB.setSession('op_registration', {
      receipt,
      storedAt: Date.now(),
    });
  },
  
  /**
   * Get stored receipt
   */
  async getReceipt() {
    if (this._receipt) return this._receipt;
    
    const stored = await StorageIDB.getSession('op_registration');
    if (stored && stored.receipt) {
      this._receipt = stored.receipt;
      return stored.receipt;
    }
    
    return null;
  },
  
  /**
   * Clear stored receipt (for testing/debugging)
   */
  async clearReceipt() {
    this._receipt = null;
    this._registrationState = this.STATE.UNREGISTERED;
    await StorageIDB.deleteSession('op_registration');
  },
  
  /**
   * Check if user is verified on OP
   */
  async isVerified() {
    if (this._registrationState === this.STATE.REGISTERED) return true;
    
    const receipt = await this.getReceipt();
    return receipt !== null;
  },
  
  /**
   * Get current registration state
   */
  getState() {
    return this._registrationState;
  },
  
  /**
   * Skip registration (user chooses to defer)
   */
  async skip() {
    this._setState(this.STATE.SKIP);
    await StorageIDB.setSession('op_registration', {
      skipped: true,
      skippedAt: Date.now(),
    });
  },
  
  /**
   * Check if registration was skipped
   */
  async wasSkipped() {
    const stored = await StorageIDB.getSession('op_registration');
    return stored && stored.skipped === true;
  },
  
  /**
   * Register callback for state changes
   */
  onStateChange(callback) {
    this._onStateChangeCallbacks.push(callback);
  },
  
  /**
   * Update state and notify listeners
   */
  _setState(newState) {
    const oldState = this._registrationState;
    this._registrationState = newState;
    
    this._onStateChangeCallbacks.forEach(cb => {
      try {
        cb(newState, oldState);
      } catch (e) {
        console.error('[OP] State change callback error:', e);
      }
    });
  },
  
  /**
   * Hash pubkey for display/storage
   */
  hashPubkey(pubkey) {
    // Simple hash for display - in production use proper hash
    return pubkey.slice(0, 16) + '...' + pubkey.slice(-8);
  },
  
  /**
   * Format registration date
   */
  formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },
};

// Make globally available
if (typeof window !== 'undefined') {
  window.OPRegistration = OPRegistration;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OPRegistration;
}
