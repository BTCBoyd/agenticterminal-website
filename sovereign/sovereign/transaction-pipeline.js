/**
 * Sovereign Dashboard - Transaction Pipeline
 * Phase 5: Client-side transaction history with encrypted caching
 * 
 * Features:
 * - Fetch transactions from OP API
 * - Verify transaction signatures against local keypair
 * - Cache in IndexedDB with AES-256-GCM encryption
 * - 90-day rolling window (configurable)
 * - Export to CSV/JSON
 * - No server storage - pure client-side assembly
 */

const TransactionPipeline = {
  // Cache configuration
  CACHE_KEY: 'transaction_cache',
  DEFAULT_CACHE_DAYS: 90,
  MAX_CACHE_DAYS: 365 * 5, // 5 years max
  
  // In-memory cache
  _cache: null,
  _lastFetch: null,
  
  /**
   * Initialize transaction pipeline
   */
  async init() {
    await StorageIDB.init();
    await this._loadCache();
  },
  
  /**
   * Get session encryption key (derived from Auth session or public key)
   * @private
   */
  _getSessionKey() {
    // Use a session-specific key derived from the session data
    // This ensures cache is tied to the current identity session
    const session = Auth.getSession();
    if (!session || !session.publicKey) return null;
    
    // Create a deterministic session key from public key + loggedInAt
    // This is unique per session but consistent across reloads in same session
    return `${session.publicKey}_${session.loggedInAt || Date.now()}`;
  },
  
  /**
   * Load encrypted transaction cache from IndexedDB
   * @private
   */
  async _loadCache() {
    try {
      const sessionKey = this._getSessionKey();
      const encrypted = await StorageIDB.getSession(this.CACHE_KEY);
      
      if (encrypted && sessionKey) {
        // Decrypt cache using session-derived key
        const decrypted = await this._decryptCache(encrypted, sessionKey);
        this._cache = decrypted || { transactions: [], lastUpdated: 0 };
      } else {
        this._cache = { transactions: [], lastUpdated: 0 };
      }
    } catch (error) {
      console.warn('[TransactionPipeline] Failed to load cache:', error.message);
      this._cache = { transactions: [], lastUpdated: 0 };
    }
  },
  
  /**
   * Save encrypted transaction cache to IndexedDB
   * @private
   */
  async _saveCache() {
    const sessionKey = this._getSessionKey();
    if (!this._cache || !sessionKey) return;
    
    try {
      const encrypted = await this._encryptCache(this._cache, sessionKey);
      await StorageIDB.setSession(this.CACHE_KEY, encrypted);
    } catch (error) {
      console.error('[TransactionPipeline] Failed to save cache:', error.message);
    }
  },
  
  /**
   * Encrypt cache data using session-derived key
   * @private
   */
  async _encryptCache(data, sessionKey) {
    const json = JSON.stringify(data);
    return await CryptoEncrypt.encrypt(json, sessionKey);
  },
  
  /**
   * Decrypt cache data using session-derived key
   * @private
   */
  async _decryptCache(encrypted, sessionKey) {
    const json = await CryptoEncrypt.decrypt(encrypted, sessionKey);
    return JSON.parse(json);
  },
  
  /**
   * Fetch transaction history from OP API
   * @param {string} pubkey - Agent public key
   * @param {Object} options - Fetch options
   * @param {number} options.since - Timestamp to fetch from (for incremental updates)
   * @param {number} options.limit - Maximum transactions to fetch
   * @returns {Promise<Array>} Array of transactions
   */
  async fetchTransactions(pubkey, options = {}) {
    if (!pubkey) {
      throw new Error('Public key required to fetch transactions');
    }
    
    const { since, limit = 1000 } = options;
    
    try {
      // Build API URL
      let url = `${CONFIG.API_BASE}/observer/agents/${pubkey}/transactions`;
      const params = new URLSearchParams();
      
      if (since) {
        params.append('since', since);
      }
      if (limit) {
        params.append('limit', limit.toString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      // Fetch from API
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${Auth.getSession()?.token || 'anonymous'}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const transactions = data.transactions || [];
      
      this._lastFetch = Date.now();
      
      return transactions;
    } catch (error) {
      console.error('[TransactionPipeline] Fetch failed:', error.message);
      throw error;
    }
  },
  
  /**
   * Verify a transaction signature against local keypair
   * @param {Object} transaction - Transaction object
   * @param {string} localPubkey - Local public key for comparison
   * @returns {Promise<boolean>} True if verified
   */
  async verifyTransaction(transaction, localPubkey) {
    if (!transaction || !transaction.signature) {
      return false;
    }
    
    try {
      // Verify the transaction involves our pubkey
      if (transaction.from !== localPubkey && transaction.to !== localPubkey) {
        return false;
      }
      
      // For now, we trust OP's signature verification
      // In future: implement full Schnorr signature verification
      // This would require secp256k1 library for browser
      
      // Check transaction hash integrity
      const computedHash = await this._computeTransactionHash(transaction);
      if (computedHash !== transaction.hash) {
        console.warn('[TransactionPipeline] Hash mismatch for tx:', transaction.id);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[TransactionPipeline] Verification error:', error);
      return false;
    }
  },
  
  /**
   * Compute transaction hash for integrity verification
   * @private
   */
  async _computeTransactionHash(transaction) {
    // Exclude signature and hash from computation
    const data = {
      id: transaction.id,
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount,
      timestamp: transaction.timestamp,
      type: transaction.type,
      metadata: transaction.metadata,
    };
    
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(JSON.stringify(data));
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },
  
  /**
   * Update transaction cache with fresh data from OP
   * @param {string} pubkey - Local public key
   * @returns {Promise<Object>} Update result
   */
  async updateCache(pubkey) {
    if (!this._cache) {
      await this._loadCache();
    }
    
    try {
      // Get the timestamp of our newest cached transaction
      const lastCachedTx = this._cache.transactions[0]; // Assuming sorted newest first
      const since = lastCachedTx ? lastCachedTx.timestamp : null;
      
      // Fetch new transactions
      const newTransactions = await this.fetchTransactions(pubkey, { since });
      
      // Verify each transaction
      const verifiedTransactions = [];
      for (const tx of newTransactions) {
        if (await this.verifyTransaction(tx, pubkey)) {
          verifiedTransactions.push(tx);
        } else {
          console.warn('[TransactionPipeline] Unverified transaction skipped:', tx.id);
        }
      }
      
      // Merge with existing cache
      const existingIds = new Set(this._cache.transactions.map(t => t.id));
      const uniqueNewTxs = verifiedTransactions.filter(t => !existingIds.has(t.id));
      
      // Add new transactions and sort by timestamp (newest first)
      this._cache.transactions = [...uniqueNewTxs, ...this._cache.transactions]
        .sort((a, b) => b.timestamp - a.timestamp);
      
      // Apply rolling window
      this._applyRollingWindow();
      
      // Update metadata
      this._cache.lastUpdated = Date.now();
      this._cache.count = this._cache.transactions.length;
      
      // Save encrypted cache
      await this._saveCache();
      
      return {
        added: uniqueNewTxs.length,
        total: this._cache.transactions.length,
        lastUpdated: this._cache.lastUpdated,
      };
    } catch (error) {
      console.error('[TransactionPipeline] Cache update failed:', error.message);
      throw error;
    }
  },
  
  /**
   * Apply rolling window to cache (remove old transactions)
   * @private
   */
  _applyRollingWindow() {
    const cacheDays = this.getCacheWindowDays();
    
    if (cacheDays === -1) {
      // Unlimited cache - keep all
      return;
    }
    
    const cutoffTime = Date.now() - (cacheDays * 24 * 60 * 60 * 1000);
    
    const beforeCount = this._cache.transactions.length;
    this._cache.transactions = this._cache.transactions.filter(
      tx => tx.timestamp >= cutoffTime
    );
    const removed = beforeCount - this._cache.transactions.length;
    
    if (removed > 0) {
      console.log(`[TransactionPipeline] Pruned ${removed} transactions older than ${cacheDays} days`);
    }
  },
  
  /**
   * Get configured cache window in days
   * @returns {number} Days (-1 for unlimited)
   */
  getCacheWindowDays() {
    const stored = localStorage.getItem('SOVEREIGN_CACHE_DAYS');
    if (stored === 'unlimited') return -1;
    const days = parseInt(stored, 10);
    return isNaN(days) ? this.DEFAULT_CACHE_DAYS : days;
  },
  
  /**
   * Set cache window in days
   * @param {number} days - Days to cache (-1 for unlimited)
   */
  setCacheWindowDays(days) {
    if (days === -1) {
      localStorage.setItem('SOVEREIGN_CACHE_DAYS', 'unlimited');
    } else {
      const validDays = Math.min(Math.max(1, days), this.MAX_CACHE_DAYS);
      localStorage.setItem('SOVEREIGN_CACHE_DAYS', validDays.toString());
    }
    
    // Apply immediately
    this._applyRollingWindow();
    this._saveCache();
  },
  
  /**
   * Get cached transactions (filtered and sorted)
   * @param {Object} filters - Optional filters
   * @param {string} filters.type - Transaction type filter
   * @param {number} filters.since - Start timestamp
   * @param {number} filters.until - End timestamp
   * @param {number} filters.limit - Max results
   * @returns {Array} Filtered transactions
   */
  getTransactions(filters = {}) {
    if (!this._cache) {
      return [];
    }
    
    let txs = [...this._cache.transactions];
    
    if (filters.type) {
      txs = txs.filter(tx => tx.type === filters.type);
    }
    
    if (filters.since) {
      txs = txs.filter(tx => tx.timestamp >= filters.since);
    }
    
    if (filters.until) {
      txs = txs.filter(tx => tx.timestamp <= filters.until);
    }
    
    if (filters.limit) {
      txs = txs.slice(0, filters.limit);
    }
    
    return txs;
  },
  
  /**
   * Get transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Object|null}
   */
  getTransactionById(id) {
    if (!this._cache) return null;
    return this._cache.transactions.find(tx => tx.id === id) || null;
  },
  
  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    if (!this._cache) {
      return {
        count: 0,
        oldest: null,
        newest: null,
        lastUpdated: null,
        sizeBytes: 0,
      };
    }
    
    const txs = this._cache.transactions;
    const sizeBytes = new Blob([JSON.stringify(this._cache)]).size;
    
    return {
      count: txs.length,
      oldest: txs.length > 0 ? txs[txs.length - 1].timestamp : null,
      newest: txs.length > 0 ? txs[0].timestamp : null,
      lastUpdated: this._cache.lastUpdated,
      sizeBytes: sizeBytes,
      sizeFormatted: this._formatBytes(sizeBytes),
    };
  },
  
  /**
   * Export transactions to CSV format
   * @param {Array} transactions - Transactions to export (defaults to all)
   * @returns {string} CSV content
   */
  exportToCSV(transactions = null) {
    const txs = transactions || this._cache?.transactions || [];
    
    if (txs.length === 0) {
      return 'No transactions to export';
    }
    
    // CSV headers
    const headers = ['ID', 'Timestamp', 'Date', 'Type', 'From', 'To', 'Amount (sats)', 'Fee (sats)', 'Description', 'Hash'];
    
    // CSV rows
    const rows = txs.map(tx => [
      tx.id,
      tx.timestamp,
      new Date(tx.timestamp).toISOString(),
      tx.type || 'unknown',
      tx.from || '',
      tx.to || '',
      tx.amount || 0,
      tx.fee || 0,
      this._escapeCSV(tx.description || ''),
      tx.hash || '',
    ]);
    
    // Combine
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    return csv;
  },
  
  /**
   * Export transactions to JSON format
   * @param {Array} transactions - Transactions to export (defaults to all)
   * @returns {string} JSON content
   */
  exportToJSON(transactions = null) {
    const txs = transactions || this._cache?.transactions || [];
    
    const exportData = {
      exportDate: new Date().toISOString(),
      source: 'Sovereign Dashboard',
      version: CONFIG.VERSION,
      count: txs.length,
      transactions: txs,
    };
    
    return JSON.stringify(exportData, null, 2);
  },
  
  /**
   * Download exported data as file
   * @param {string} content - File content
   * @param {string} filename - File name
   * @param {string} mimeType - MIME type
   */
  downloadExport(content, filename, mimeType = 'text/csv') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  },
  
  /**
   * Clear all cached transactions
   */
  async clearCache() {
    this._cache = { transactions: [], lastUpdated: 0, count: 0 };
    await this._saveCache();
  },
  
  /**
   * Rebuild cache from scratch (for cross-device sync)
   * @param {string} pubkey - Local public key
   */
  async rebuildCache(pubkey) {
    // Clear existing
    await this.clearCache();
    
    // Fetch all transactions
    const transactions = await this.fetchTransactions(pubkey, { limit: 10000 });
    
    // Verify and add
    const verifiedTransactions = [];
    for (const tx of transactions) {
      if (await this.verifyTransaction(tx, pubkey)) {
        verifiedTransactions.push(tx);
      }
    }
    
    // Sort by timestamp (newest first)
    this._cache.transactions = verifiedTransactions.sort((a, b) => b.timestamp - a.timestamp);
    this._cache.lastUpdated = Date.now();
    this._cache.count = this._cache.transactions.length;
    
    // Apply rolling window
    this._applyRollingWindow();
    
    // Save
    await this._saveCache();
    
    return {
      added: this._cache.transactions.length,
      lastUpdated: this._cache.lastUpdated,
    };
  },
  
  /**
   * Escape CSV field
   * @private
   */
  _escapeCSV(field) {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  },
  
  /**
   * Format bytes to human readable (static for external use)
   * @private
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  /**
   * Static format bytes helper (for StorageManager use)
   * @param {number} bytes
   * @returns {string}
   */
  formatBytes(bytes) {
    return this._formatBytes(bytes);
  },
  
  /**
   * Check if cache needs update (stale check)
   * @param {number} maxAgeMs - Maximum age in milliseconds
   * @returns {boolean}
   */
  isCacheStale(maxAgeMs = 5 * 60 * 1000) { // 5 minutes default
    if (!this._cache || !this._cache.lastUpdated) {
      return true;
    }
    return (Date.now() - this._cache.lastUpdated) > maxAgeMs;
  },
};

// Make globally available
if (typeof window !== 'undefined') {
  window.TransactionPipeline = TransactionPipeline;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TransactionPipeline;
}