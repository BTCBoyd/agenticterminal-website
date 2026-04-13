/**
 * Sovereign Dashboard - Storage Manager
 * Phase 5: Storage limits, pruning, and quota monitoring
 * 
 * Features:
 * - Monitor storage quota and usage
 * - Enforce configurable storage limits
 * - Prune old data when approaching limits
 * - User prompts for storage management
 * - Storage health monitoring
 */

const StorageManager = {
  // Default storage limit (100MB)
  DEFAULT_LIMIT_MB: 100,
  WARNING_THRESHOLD: 0.8,  // Warn at 80% usage
  CRITICAL_THRESHOLD: 0.95, // Critical at 95% usage
  
  // Storage keys
  LIMIT_KEY: 'SOVEREIGN_STORAGE_LIMIT_MB',
  PRUNE_CONFIRMED_KEY: 'SOVEREIGN_PRUNE_CONFIRMED',
  
  // Cached quota info
  _quotaCache: null,
  _lastQuotaCheck: 0,
  _QUOTA_CACHE_TTL: 30000, // 30 seconds
  
  /**
   * Initialize storage manager
   */
  async init() {
    await this.checkStorageHealth();
  },
  
  /**
   * Get current storage quota information
   * @returns {Promise<Object>} Quota info
   */
  async getQuota() {
    // Use cached value if fresh
    if (this._quotaCache && (Date.now() - this._lastQuotaCheck) < this._QUOTA_CACHE_TTL) {
      return this._quotaCache;
    }
    
    try {
      let usage = 0;
      let quota = 0;
      
      // Try Storage API first (gives best estimate)
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        usage = estimate.usage || 0;
        quota = estimate.quota || 0;
      }
      
      // Calculate our app's usage specifically
      const appUsage = await this._calculateAppUsage();
      
      const limitMB = this.getStorageLimitMB();
      const limitBytes = limitMB * 1024 * 1024;
      
      // Effective quota is the minimum of browser quota and our configured limit
      const effectiveQuota = quota > 0 ? Math.min(quota, limitBytes) : limitBytes;
      
      this._quotaCache = {
        usageBytes: usage,
        quotaBytes: quota,
        appUsageBytes: appUsage,
        limitBytes: limitBytes,
        effectiveQuotaBytes: effectiveQuota,
        usagePercent: effectiveQuota > 0 ? (appUsage / effectiveQuota) : 0,
        availableBytes: Math.max(0, effectiveQuota - appUsage),
        limitMB: limitMB,
        formatted: {
          usage: this._formatBytes(appUsage),
          quota: quota > 0 ? this._formatBytes(quota) : 'Unknown',
          limit: `${limitMB} MB`,
          available: this._formatBytes(Math.max(0, effectiveQuota - appUsage)),
        }
      };
      
      this._lastQuotaCheck = Date.now();
      return this._quotaCache;
      
    } catch (error) {
      console.error('[StorageManager] Failed to get quota:', error.message);
      
      // Return fallback
      return {
        usageBytes: 0,
        quotaBytes: 0,
        appUsageBytes: 0,
        limitBytes: this.getStorageLimitMB() * 1024 * 1024,
        effectiveQuotaBytes: this.getStorageLimitMB() * 1024 * 1024,
        usagePercent: 0,
        availableBytes: this.getStorageLimitMB() * 1024 * 1024,
        limitMB: this.getStorageLimitMB(),
        formatted: {
          usage: 'Unknown',
          quota: 'Unknown',
          limit: `${this.getStorageLimitMB()} MB`,
          available: 'Unknown',
        },
        error: error.message,
      };
    }
  },
  
  /**
   * Calculate Sovereign app storage usage
   * @private
   */
  async _calculateAppUsage() {
    let totalBytes = 0;
    
    try {
      // IndexedDB usage
      const idbUsage = await this._calculateIndexedDBUsage();
      totalBytes += idbUsage;
      
      // localStorage usage (approximate)
      const lsUsage = this._calculateLocalStorageUsage();
      totalBytes += lsUsage;
      
      // Session storage (if any)
      const ssUsage = this._calculateSessionStorageUsage();
      totalBytes += ssUsage;
      
    } catch (error) {
      console.warn('[StorageManager] Error calculating app usage:', error.message);
    }
    
    return totalBytes;
  },
  
  /**
   * Calculate IndexedDB usage
   * @private
   */
  async _calculateIndexedDBUsage() {
    try {
      // Get all data from our stores
      const identity = await StorageIDB.getIdentity();
      const allScores = await StorageIDB.getAllCachedScores();
      
      let bytes = 0;
      
      if (identity) {
        bytes += new Blob([JSON.stringify(identity)]).size;
      }
      
      if (allScores) {
        bytes += new Blob([JSON.stringify(allScores)]).size;
      }
      
      // Add transaction cache if loaded
      if (TransactionPipeline._cache) {
        bytes += new Blob([JSON.stringify(TransactionPipeline._cache)]).size;
      }
      
      // Add credential storage if exists
      const creds = await StorageIDB.getSession('delegation_credentials');
      if (creds) {
        bytes += new Blob([JSON.stringify(creds)]).size;
      }
      
      return bytes;
      
    } catch (error) {
      console.warn('[StorageManager] Error calculating IDB usage:', error.message);
      return 0;
    }
  },
  
  /**
   * Calculate localStorage usage
   * @private
   */
  _calculateLocalStorageUsage() {
    let bytes = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        bytes += new Blob([key]).size;
        bytes += new Blob([value]).size;
      }
    } catch (error) {
      console.warn('[StorageManager] Error calculating localStorage usage:', error.message);
    }
    
    return bytes;
  },
  
  /**
   * Calculate sessionStorage usage
   * @private
   */
  _calculateSessionStorageUsage() {
    let bytes = 0;
    
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        bytes += new Blob([key]).size;
        bytes += new Blob([value]).size;
      }
    } catch (error) {
      console.warn('[StorageManager] Error calculating sessionStorage usage:', error.message);
    }
    
    return bytes;
  },
  
  /**
   * Get configured storage limit in MB
   * @returns {number} Limit in MB
   */
  getStorageLimitMB() {
    const stored = localStorage.getItem(this.LIMIT_KEY);
    if (!stored) return this.DEFAULT_LIMIT_MB;
    
    const limit = parseInt(stored, 10);
    return isNaN(limit) ? this.DEFAULT_LIMIT_MB : limit;
  },
  
  /**
   * Set storage limit in MB
   * @param {number} mb - Limit in megabytes
   */
  setStorageLimitMB(mb) {
    const validMB = Math.max(10, Math.min(1000, mb)); // 10MB to 1GB range
    localStorage.setItem(this.LIMIT_KEY, validMB.toString());
    this._quotaCache = null; // Invalidate cache
  },
  
  /**
   * Check if storage usage is at warning level
   * @returns {Promise<boolean>}
   */
  async isAtWarningLevel() {
    const quota = await this.getQuota();
    return quota.usagePercent >= this.WARNING_THRESHOLD;
  },
  
  /**
   * Check if storage usage is at critical level
   * @returns {Promise<boolean>}
   */
  async isAtCriticalLevel() {
    const quota = await this.getQuota();
    return quota.usagePercent >= this.CRITICAL_THRESHOLD;
  },
  
  /**
   * Get storage health status
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    const quota = await this.getQuota();
    
    let status = 'healthy';
    let message = 'Storage usage is normal';
    let action = null;
    
    if (quota.usagePercent >= this.CRITICAL_THRESHOLD) {
      status = 'critical';
      message = `Storage critically full (${Math.round(quota.usagePercent * 100)}%). Immediate action required.`;
      action = 'prune';
    } else if (quota.usagePercent >= this.WARNING_THRESHOLD) {
      status = 'warning';
      message = `Storage usage high (${Math.round(quota.usagePercent * 100)}%). Consider pruning old data.`;
      action = 'prompt';
    }
    
    return {
      status,
      message,
      action,
      usagePercent: quota.usagePercent,
      formatted: quota.formatted,
    };
  },
  
  /**
   * Check storage health and notify if needed
   */
  async checkStorageHealth() {
    const health = await this.getHealthStatus();
    
    if (health.status === 'critical') {
      // Auto-prune if critical
      await this.autoPrune();
    } else if (health.status === 'warning') {
      // Prompt user if warning and not recently confirmed
      const recentlyConfirmed = this._wasPruneRecentlyConfirmed();
      if (!recentlyConfirmed) {
        this._showPrunePrompt(health);
      }
    }
    
    return health;
  },
  
  /**
   * Auto-prune when critically full
   */
  async autoPrune() {
    console.warn('[StorageManager] Auto-pruning due to critical storage level');
    
    // Prune in order of least importance
    // 1. Old AT-ARS scores
    await this._pruneOldScores();
    
    // 2. Old transactions (reduce cache window temporarily)
    await this._pruneOldTransactions();
    
    // Clear quota cache to get fresh reading
    this._quotaCache = null;
    
    // Check if we're still critical
    const stillCritical = await this.isAtCriticalLevel();
    if (stillCritical) {
      console.error('[StorageManager] Still critical after pruning. User intervention required.');
    }
  },
  
  /**
   * Prune old AT-ARS scores
   * @private
   */
  async _pruneOldScores() {
    try {
      const allScores = await StorageIDB.getAllCachedScores();
      if (!allScores || allScores.length <= 5) return;
      
      // Keep only 5 most recent scores per pubkey
      const scoresByPubkey = {};
      for (const score of allScores) {
        if (!scoresByPubkey[score.pubkey]) {
          scoresByPubkey[score.pubkey] = [];
        }
        scoresByPubkey[score.pubkey].push(score);
      }
      
      let pruned = 0;
      for (const pubkey in scoresByPubkey) {
        const scores = scoresByPubkey[pubkey];
        if (scores.length > 5) {
          // Sort by date, keep newest 5
          scores.sort((a, b) => b.computedAt - a.computedAt);
          const toRemove = scores.slice(5);
          
          // Remove from DB
          for (const score of toRemove) {
            await StorageIDB._deleteScoreById(score.id);
            pruned++;
          }
        }
      }
      
      console.log(`[StorageManager] Pruned ${pruned} old AT-ARS scores`);
    } catch (error) {
      console.error('[StorageManager] Error pruning scores:', error.message);
    }
  },
  
  /**
   * Prune old transactions
   * @private
   */
  async _pruneOldTransactions() {
    try {
      const currentWindow = TransactionPipeline.getCacheWindowDays();
      if (currentWindow <= 30) return; // Already at minimum
      
      // Temporarily reduce window by half
      const newWindow = Math.max(30, Math.floor(currentWindow / 2));
      console.log(`[StorageManager] Reducing transaction cache window to ${newWindow} days`);
      
      TransactionPipeline.setCacheWindowDays(newWindow);
      
      // Restore original window after 24 hours
      setTimeout(() => {
        console.log(`[StorageManager] Restoring transaction cache window to ${currentWindow} days`);
        TransactionPipeline.setCacheWindowDays(currentWindow);
      }, 24 * 60 * 60 * 1000);
      
    } catch (error) {
      console.error('[StorageManager] Error pruning transactions:', error.message);
    }
  },
  
  /**
   * Check if prune was recently confirmed by user
   * @private
   */
  _wasPruneRecentlyConfirmed() {
    const lastConfirmed = localStorage.getItem(this.PRUNE_CONFIRMED_KEY);
    if (!lastConfirmed) return false;
    
    const confirmedTime = parseInt(lastConfirmed, 10);
    const oneHour = 60 * 60 * 1000;
    
    return (Date.now() - confirmedTime) < oneHour;
  },
  
  /**
   * Mark prune as confirmed by user
   */
  confirmPrune() {
    localStorage.setItem(this.PRUNE_CONFIRMED_KEY, Date.now().toString());
  },
  
  /**
   * Show prune prompt to user
   * @private
   */
  _showPrunePrompt(health) {
    // Dispatch event for UI to handle
    window.dispatchEvent(new CustomEvent('storage-warning', {
      detail: health,
    }));
  },
  
  /**
   * Request persistent storage permission
   * @returns {Promise<boolean>}
   */
  async requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
      const granted = await navigator.storage.persist();
      console.log(`[StorageManager] Persistent storage ${granted ? 'granted' : 'denied'}`);
      return granted;
    }
    return false;
  },
  
  /**
   * Check if storage is persistent
   * @returns {Promise<boolean>}
   */
  async isStoragePersistent() {
    if (navigator.storage && navigator.storage.persisted) {
      return await navigator.storage.persisted();
    }
    return false;
  },
  
  /**
   * Clear all Sovereign data (nuclear option)
   * @param {boolean} keepIdentity - If true, keep encrypted identity
   */
  async clearAllData(keepIdentity = false) {
    // Clear transaction cache
    await TransactionPipeline.clearCache();
    
    // Clear AT-ARS scores
    await StorageIDB.clearAllScores();
    
    // Clear session data
    await StorageIDB.clearAllSessions();
    
    // Clear localStorage Sovereign keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('SOVEREIGN_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear identity if requested
    if (!keepIdentity) {
      await StorageIDB.deleteIdentity();
    }
    
    this._quotaCache = null;
    
    console.log('[StorageManager] All data cleared' + (keepIdentity ? ' (identity preserved)' : ''));
  },
  
  /**
   * Export all data for backup
   * @returns {Promise<Object>} All Sovereign data
   */
  async exportAllData() {
    const data = {
      version: CONFIG.VERSION,
      exportDate: new Date().toISOString(),
      identity: await StorageIDB.getIdentity(),
      transactionCache: TransactionPipeline._cache,
      atarsScores: await StorageIDB.getAllCachedScores(),
      preferences: {},
    };
    
    // Collect preferences from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('SOVEREIGN_')) {
        data.preferences[key] = localStorage.getItem(key);
      }
    }
    
    return data;
  },
  
  /**
   * Format bytes to human readable string
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
   * Get storage breakdown by component
   * @returns {Promise<Object>} Storage breakdown
   */
  async getStorageBreakdown() {
    const breakdown = {
      indexedDB: { bytes: 0, items: {} },
      localStorage: { bytes: 0, items: {} },
      sessionStorage: { bytes: 0, items: {} },
      total: 0,
    };
    
    try {
      // IndexedDB breakdown
      const identity = await StorageIDB.getIdentity();
      if (identity) {
        const size = new Blob([JSON.stringify(identity)]).size;
        breakdown.indexedDB.items.identity = size;
        breakdown.indexedDB.bytes += size;
      }
      
      const scores = await StorageIDB.getAllCachedScores();
      if (scores) {
        const size = new Blob([JSON.stringify(scores)]).size;
        breakdown.indexedDB.items.atarsScores = size;
        breakdown.indexedDB.bytes += size;
      }
      
      if (TransactionPipeline._cache) {
        const size = new Blob([JSON.stringify(TransactionPipeline._cache)]).size;
        breakdown.indexedDB.items.transactionCache = size;
        breakdown.indexedDB.bytes += size;
      }
      
      // localStorage breakdown
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        const size = new Blob([key]).size + new Blob([value]).size;
        breakdown.localStorage.items[key] = size;
        breakdown.localStorage.bytes += size;
      }
      
      // sessionStorage breakdown
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        const size = new Blob([key]).size + new Blob([value]).size;
        breakdown.sessionStorage.items[key] = size;
        breakdown.sessionStorage.bytes += size;
      }
      
      breakdown.total = breakdown.indexedDB.bytes + breakdown.localStorage.bytes + breakdown.sessionStorage.bytes;
      
      // Add formatted values
      breakdown.formatted = {
        indexedDB: this._formatBytes(breakdown.indexedDB.bytes),
        localStorage: this._formatBytes(breakdown.localStorage.bytes),
        sessionStorage: this._formatBytes(breakdown.sessionStorage.bytes),
        total: this._formatBytes(breakdown.total),
      };
      
    } catch (error) {
      console.error('[StorageManager] Error getting breakdown:', error.message);
    }
    
    return breakdown;
  },
};

// Make globally available
if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}