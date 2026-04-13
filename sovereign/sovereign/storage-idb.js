/**
 * Sovereign Dashboard - IndexedDB Storage
 * Phase 5: Complete client-side storage with encrypted credential management
 * 
 * Storage Architecture:
 * - Private key (encrypted) → IndexedDB ✅
 * - Public key → IndexedDB + localStorage ✅
 * - Passphrase-derived session key → Memory only ✅
 * - Delegation credentials → IndexedDB (encrypted) ✅
 * - Transaction cache → IndexedDB (encrypted) ✅
 * - OP verification receipt → IndexedDB ✅
 * - Backup confirmed flag → IndexedDB ✅
 * - User preferences → localStorage ✅
 * 
 * Replaces localStorage for key material storage
 * - Keys are stored encrypted
 * - Persists across tab close/reopen
 * - Non-exportable private key handling
 */

const StorageIDB = {
  DB_NAME: 'SovereignIdentityDB',
  DB_VERSION: 3,  // Phase 5: Added transaction cache, credentials, OP receipt stores
  STORE_NAME: 'identities',
  SESSION_STORE: 'session',
  SCORE_STORE: 'at_ars_scores',
  
  // Phase 5: New stores
  TRANSACTION_STORE: 'transaction_cache',      // Encrypted transaction cache
  CREDENTIALS_STORE: 'credentials',            // Encrypted delegation credentials
  OP_RECEIPT_STORE: 'op_receipts',             // OP verification receipts
  METADATA_STORE: 'metadata',                  // Backup flags, settings
  
  db: null,
  
  /**
   * Initialize IndexedDB connection
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        
        // Store for encrypted identities
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('publicKey', 'publicKey', { unique: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        // Store for session data
        if (!db.objectStoreNames.contains(this.SESSION_STORE)) {
          db.createObjectStore(this.SESSION_STORE, { keyPath: 'key' });
        }
        
        // Phase 4.5: Store for AT-ARS scores
        if (!db.objectStoreNames.contains(this.SCORE_STORE)) {
          const scoreStore = db.createObjectStore(this.SCORE_STORE, { keyPath: 'id', autoIncrement: true });
          scoreStore.createIndex('pubkey', 'pubkey', { unique: false });
          scoreStore.createIndex('computedAt', 'computedAt', { unique: false });
        }
        
        // Phase 5: Transaction cache store (encrypted blob)
        if (!db.objectStoreNames.contains(this.TRANSACTION_STORE)) {
          const txStore = db.createObjectStore(this.TRANSACTION_STORE, { keyPath: 'id' });
          txStore.createIndex('pubkey', 'pubkey', { unique: false });
          txStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        
        // Phase 5: Credentials store (encrypted delegation credentials)
        if (!db.objectStoreNames.contains(this.CREDENTIALS_STORE)) {
          const credStore = db.createObjectStore(this.CREDENTIALS_STORE, { keyPath: 'id' });
          credStore.createIndex('pubkey', 'pubkey', { unique: false });
          credStore.createIndex('type', 'type', { unique: false });
          credStore.createIndex('issuedAt', 'issuedAt', { unique: false });
        }
        
        // Phase 5: OP verification receipt store
        if (!db.objectStoreNames.contains(this.OP_RECEIPT_STORE)) {
          const receiptStore = db.createObjectStore(this.OP_RECEIPT_STORE, { keyPath: 'pubkey' });
          receiptStore.createIndex('verifiedAt', 'verifiedAt', { unique: false });
          receiptStore.createIndex('status', 'status', { unique: false });
        }
        
        // Phase 5: Metadata store (backup flags, settings)
        if (!db.objectStoreNames.contains(this.METADATA_STORE)) {
          db.createObjectStore(this.METADATA_STORE, { keyPath: 'key' });
        }
        
        console.log(`[StorageIDB] Upgraded database from version ${oldVersion} to ${this.DB_VERSION}`);
      };
    });
  },
  
  /**
   * Store encrypted identity
   * @param {Object} identity - Identity to store
   * @param {string} identity.publicKey - Public key (used as lookup)
   * @param {string} identity.encryptedPrivateKey - Encrypted private key
   * @param {string} identity.displayName - User's display name
   * @returns {Promise<void>}
   */
  async storeIdentity(identity) {
    await this.init();
    
    const record = {
      id: 'current_identity',
      publicKey: identity.publicKey,
      encryptedPrivateKey: identity.encryptedPrivateKey,
      displayName: identity.displayName,
      createdAt: identity.createdAt || Date.now(),
      updatedAt: Date.now(),
      keyType: identity.keyType || 'secp256k1',
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(record);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Get stored identity (encrypted)
   * @returns {Promise<Object|null>} Encrypted identity or null
   */
  async getIdentity() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get('current_identity');
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Delete stored identity (logout/clear)
   * @returns {Promise<void>}
   */
  async deleteIdentity() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete('current_identity');
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Check if identity exists in storage
   * @returns {Promise<boolean>}
   */
  async hasIdentity() {
    const identity = await this.getIdentity();
    return identity !== null;
  },
  
  /**
   * Store session data (non-sensitive or encrypted)
   * @param {string} key - Session key
   * @param {Object} data - Session data
   * @returns {Promise<void>}
   */
  async setSession(key, data) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.SESSION_STORE], 'readwrite');
      const store = transaction.objectStore(this.SESSION_STORE);
      const request = store.put({ key, data, timestamp: Date.now() });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Get session data
   * @param {string} key - Session key
   * @returns {Promise<Object|null>}
   */
  async getSession(key) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.SESSION_STORE], 'readonly');
      const store = transaction.objectStore(this.SESSION_STORE);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Delete session data
   * @param {string} key - Session key
   * @returns {Promise<void>}
   */
  async deleteSession(key) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.SESSION_STORE], 'readwrite');
      const store = transaction.objectStore(this.SESSION_STORE);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Clear all session data (logout)
   * @returns {Promise<void>}
   */
  async clearAllSessions() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.SESSION_STORE], 'readwrite');
      const store = transaction.objectStore(this.SESSION_STORE);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Export all data (for backup)
   * @returns {Promise<Object>}
   */
  async exportAll() {
    await this.init();
    
    const identity = await this.getIdentity();
    const session = await this.getSession('auth_session');
    const credentials = await this.getAllCredentials();
    const receipts = await this.getAllOPReceipts();
    const metadata = await this.getAllMetadata();
    
    return {
      identity,
      session,
      credentials,
      receipts,
      metadata,
      exportedAt: Date.now(),
      version: CONFIG?.VERSION || 'unknown',
    };
  },
  
  /**
   * Import data (for restore)
   * @param {Object} data - Data from exportAll()
   * @returns {Promise<void>}
   */
  async importAll(data) {
    if (data.identity) {
      await this.storeIdentity(data.identity);
    }
    if (data.session) {
      await this.setSession('auth_session', data.session);
    }
    if (data.credentials) {
      for (const cred of data.credentials) {
        await this.storeCredential(cred);
      }
    }
    if (data.receipts) {
      for (const receipt of data.receipts) {
        await this.storeOPReceipt(receipt.pubkey, receipt);
      }
    }
    if (data.metadata) {
      for (const item of data.metadata) {
        await this.setMetadata(item.key, item.value);
      }
    }
  },
  
  /**
   * Check IndexedDB availability
   * @returns {boolean}
   */
  isAvailable() {
    return typeof indexedDB !== 'undefined';
  },
  
  /**
   * Estimate storage usage
   * @returns {Promise<{usage: number, quota: number}>}
   */
  async estimateStorage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate();
    }
    return { usage: 0, quota: 0 };
  },
  
  /**
   * Request persistent storage
   * @returns {Promise<boolean>}
   */
  async requestPersistent() {
    if (navigator.storage && navigator.storage.persist) {
      return navigator.storage.persist();
    }
    return false;
  },
  
  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  },
  
  /**
   * Delete entire database (nuclear option)
   * @returns {Promise<void>}
   */
  async deleteDatabase() {
    this.close();
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Database blocked'));
    });
  },
  
  // ============================================================
  // Phase 4.5: AT-ARS Score Caching
  // ============================================================
  
  /**
   * Cache an AT-ARS score
   * @param {string} pubkey - Agent public key
   * @param {Object} score - Computed AT-ARS score object
   * @returns {Promise<void>}
   */
  async cacheATARSScore(pubkey, score) {
    await this.init();
    
    const record = {
      pubkey: pubkey,
      score: score,
      computedAt: Date.now(),
      vacSource: score.meta?.vacSource || 'unknown',
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.SCORE_STORE], 'readwrite');
      const store = transaction.objectStore(this.SCORE_STORE);
      
      // First, delete any existing scores for this pubkey
      const index = store.index('pubkey');
      const getRequest = index.getAll(pubkey);
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        existing.forEach(item => {
          store.delete(item.id);
        });
        
        // Add new score
        const addRequest = store.add(record);
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  },
  
  /**
   * Get cached AT-ARS score for a pubkey
   * @param {string} pubkey - Agent public key
   * @returns {Promise<Object|null>} Cached score with metadata or null
   */
  async getCachedATARSScore(pubkey) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.SCORE_STORE], 'readonly');
      const store = transaction.objectStore(this.SCORE_STORE);
      const index = store.index('pubkey');
      const request = index.getAll(pubkey);
      
      request.onsuccess = () => {
        const results = request.result;
        if (results && results.length > 0) {
          // Return the most recent
          const mostRecent = results.sort((a, b) => b.computedAt - a.computedAt)[0];
          const ageMs = Date.now() - mostRecent.computedAt;
          resolve({
            score: mostRecent.score,
            cachedAt: mostRecent.computedAt,
            ageMs: ageMs,
            ageHours: Math.floor(ageMs / (1000 * 60 * 60)),
            isStale: ageMs > 3600000, // > 1 hour considered stale
          });
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Check if cached score is available and not stale
   * @param {string} pubkey - Agent public key
   * @param {number} maxAgeMs - Maximum age in milliseconds (default: 1 hour)
   * @returns {Promise<boolean>}
   */
  async hasFreshScore(pubkey, maxAgeMs = 3600000) {
    const cached = await this.getCachedATARSScore(pubkey);
    if (!cached) return false;
    return cached.ageMs < maxAgeMs;
  },
  
  /**
   * Clear all cached scores
   * @returns {Promise<void>}
   */
  async clearAllScores() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.SCORE_STORE], 'readwrite');
      const store = transaction.objectStore(this.SCORE_STORE);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Get all cached scores (for debugging/export)
   * @returns {Promise<Array>}
   */
  async getAllCachedScores() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.SCORE_STORE], 'readonly');
      const store = transaction.objectStore(this.SCORE_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Delete a specific score by ID (internal use)
   * @param {number} id - Score ID
   * @returns {Promise<void>}
   */
  async _deleteScoreById(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.SCORE_STORE], 'readwrite');
      const store = transaction.objectStore(this.SCORE_STORE);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  // ============================================================
  // Phase 5: Delegation Credentials (Encrypted)
  // ============================================================
  
  /**
   * Store encrypted delegation credential
   * @param {Object} credential - Delegation credential
   * @param {string} credential.id - Credential ID
   * @param {string} credential.pubkey - Agent public key
   * @param {string} credential.type - Credential type (agent, service, etc.)
   * @param {string} credential.encryptedData - AES-256-GCM encrypted credential data
   * @returns {Promise<void>}
   */
  async storeCredential(credential) {
    await this.init();
    
    const record = {
      id: credential.id || `cred_${Date.now()}`,
      pubkey: credential.pubkey,
      type: credential.type || 'delegation',
      encryptedData: credential.encryptedData,
      issuedAt: credential.issuedAt || Date.now(),
      expiresAt: credential.expiresAt || null,
      metadata: credential.metadata || {},
      updatedAt: Date.now(),
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.CREDENTIALS_STORE], 'readwrite');
      const store = transaction.objectStore(this.CREDENTIALS_STORE);
      const request = store.put(record);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Get encrypted credential by ID
   * @param {string} id - Credential ID
   * @returns {Promise<Object|null>}
   */
  async getCredential(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.CREDENTIALS_STORE], 'readonly');
      const store = transaction.objectStore(this.CREDENTIALS_STORE);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Get all credentials for a pubkey
   * @param {string} pubkey - Agent public key
   * @returns {Promise<Array>}
   */
  async getCredentialsByPubkey(pubkey) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.CREDENTIALS_STORE], 'readonly');
      const store = transaction.objectStore(this.CREDENTIALS_STORE);
      const index = store.index('pubkey');
      const request = index.getAll(pubkey);
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Get all credentials (for export)
   * @returns {Promise<Array>}
   */
  async getAllCredentials() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.CREDENTIALS_STORE], 'readonly');
      const store = transaction.objectStore(this.CREDENTIALS_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Delete a credential
   * @param {string} id - Credential ID
   * @returns {Promise<void>}
   */
  async deleteCredential(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.CREDENTIALS_STORE], 'readwrite');
      const store = transaction.objectStore(this.CREDENTIALS_STORE);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Clear all credentials for a pubkey
   * @param {string} pubkey - Agent public key
   * @returns {Promise<void>}
   */
  async clearCredentialsByPubkey(pubkey) {
    const credentials = await this.getCredentialsByPubkey(pubkey);
    
    for (const cred of credentials) {
      await this.deleteCredential(cred.id);
    }
  },
  
  // ============================================================
  // Phase 5: OP Verification Receipts
  // ============================================================
  
  /**
   * Store OP verification receipt
   * @param {string} pubkey - Agent public key
   * @param {Object} receipt - Verification receipt from OP
   * @returns {Promise<void>}
   */
  async storeOPReceipt(pubkey, receipt) {
    await this.init();
    
    const record = {
      pubkey: pubkey,
      status: receipt.status || 'pending',
      verifiedAt: receipt.verifiedAt || Date.now(),
      receiptData: receipt,
      updatedAt: Date.now(),
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.OP_RECEIPT_STORE], 'readwrite');
      const store = transaction.objectStore(this.OP_RECEIPT_STORE);
      const request = store.put(record);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Get OP verification receipt for a pubkey
   * @param {string} pubkey - Agent public key
   * @returns {Promise<Object|null>}
   */
  async getOPReceipt(pubkey) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.OP_RECEIPT_STORE], 'readonly');
      const store = transaction.objectStore(this.OP_RECEIPT_STORE);
      const request = store.get(pubkey);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Check if pubkey is verified on OP
   * @param {string} pubkey - Agent public key
   * @returns {Promise<boolean>}
   */
  async isOPVerified(pubkey) {
    const receipt = await this.getOPReceipt(pubkey);
    return receipt && receipt.status === 'verified';
  },
  
  /**
   * Get all OP receipts (for export)
   * @returns {Promise<Array>}
   */
  async getAllOPReceipts() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.OP_RECEIPT_STORE], 'readonly');
      const store = transaction.objectStore(this.OP_RECEIPT_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Delete OP receipt
   * @param {string} pubkey - Agent public key
   * @returns {Promise<void>}
   */
  async deleteOPReceipt(pubkey) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.OP_RECEIPT_STORE], 'readwrite');
      const store = transaction.objectStore(this.OP_RECEIPT_STORE);
      const request = store.delete(pubkey);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  // ============================================================
  // Phase 5: Metadata Store (Backup flags, settings)
  // ============================================================
  
  /**
   * Set metadata value
   * @param {string} key - Metadata key
   * @param {any} value - Value to store
   * @returns {Promise<void>}
   */
  async setMetadata(key, value) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.METADATA_STORE], 'readwrite');
      const store = transaction.objectStore(this.METADATA_STORE);
      const request = store.put({ key, value, updatedAt: Date.now() });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Get metadata value
   * @param {string} key - Metadata key
   * @returns {Promise<any>}
   */
  async getMetadata(key) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.METADATA_STORE], 'readonly');
      const store = transaction.objectStore(this.METADATA_STORE);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Check if backup has been confirmed
   * @returns {Promise<boolean>}
   */
  async isBackupConfirmed() {
    const value = await this.getMetadata('backup_confirmed');
    return value === true;
  },
  
  /**
   * Set backup confirmed flag
   * @param {boolean} confirmed - Backup confirmation status
   * @returns {Promise<void>}
   */
  async setBackupConfirmed(confirmed = true) {
    await this.setMetadata('backup_confirmed', confirmed);
    await this.setMetadata('backup_confirmed_at', Date.now());
  },
  
  /**
   * Get all metadata (for export)
   * @returns {Promise<Array>}
   */
  async getAllMetadata() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.METADATA_STORE], 'readonly');
      const store = transaction.objectStore(this.METADATA_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },
  
  // ============================================================
  // Phase 5: Transaction Cache Store (Encrypted blob storage)
  // ============================================================
  
  /**
   * Store encrypted transaction cache
   * This is used by TransactionPipeline for the encrypted cache blob
   * @param {string} pubkey - Agent public key
   * @param {string} encryptedData - Encrypted cache data (base64)
   * @returns {Promise<void>}
   */
  async storeTransactionCache(pubkey, encryptedData) {
    await this.init();
    
    const record = {
      id: `tx_cache_${pubkey}`,
      pubkey: pubkey,
      encryptedData: encryptedData,
      updatedAt: Date.now(),
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.TRANSACTION_STORE], 'readwrite');
      const store = transaction.objectStore(this.TRANSACTION_STORE);
      const request = store.put(record);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Get encrypted transaction cache
   * @param {string} pubkey - Agent public key
   * @returns {Promise<Object|null>}
   */
  async getTransactionCache(pubkey) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.TRANSACTION_STORE], 'readonly');
      const store = transaction.objectStore(this.TRANSACTION_STORE);
      const request = store.get(`tx_cache_${pubkey}`);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Delete transaction cache
   * @param {string} pubkey - Agent public key
   * @returns {Promise<void>}
   */
  async deleteTransactionCache(pubkey) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.TRANSACTION_STORE], 'readwrite');
      const store = transaction.objectStore(this.TRANSACTION_STORE);
      const request = store.delete(`tx_cache_${pubkey}`);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};

// Make globally available
if (typeof window !== 'undefined') {
  window.StorageIDB = StorageIDB;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageIDB;
}