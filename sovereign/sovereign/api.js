/**
 * Sovereign Dashboard - API Module
 * Phase 2: Live data integration with Observer Protocol API
 */

const API = {
  cache: new Map(),
  cacheTimeout: 30000, // 30 seconds
  
  /**
   * Get authorization headers
   */
  getHeaders() {
    const session = Auth.getSession();
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': session ? `Bearer ${session.token || 'anonymous'}` : 'Bearer anonymous',
    };
  },
  
  /**
   * Fetch with timeout and error handling
   */
  async fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  },
  
  /**
   * Get transactions with caching
   */
  async getTransactions(limit = 20, agentId = CONFIG.AGENT_ID) {
    const cacheKey = `transactions_${agentId}_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    try {
      const data = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/transactions?limit=${limit}&agent_id=${agentId}`
      );
      
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      
      // Also cache to localStorage for offline fallback
      localStorage.setItem('SOVEREIGN_TRANSACTIONS_CACHE', JSON.stringify(data));
      
      return data;
    } catch (error) {
      console.warn('API fetch failed, using fallback:', error.message);
      
      // Fallback to localStorage cache
      const fallback = localStorage.getItem('SOVEREIGN_TRANSACTIONS_CACHE');
      if (fallback) {
        return JSON.parse(fallback);
      }
      
      return { transactions: [] };
    }
  },
  
  /**
   * Get agent stats
   */
  async getStats(agentId = CONFIG.AGENT_ID) {
    const cacheKey = `stats_${agentId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    try {
      const data = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/stats?agent_id=${agentId}`
      );
      
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.warn('Stats fetch failed:', error.message);
      return null;
    }
  },
  
  /**
   * Get real-time metrics
   */
  async getMetrics(agentId = CONFIG.AGENT_ID) {
    try {
      const data = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/metrics?agent_id=${agentId}`
      );
      return data;
    } catch (error) {
      console.warn('Metrics fetch failed:', error.message);
      return null;
    }
  },
  
  /**
   * Get delegation info
   */
  async getDelegation(agentId = CONFIG.AGENT_ID) {
    const cacheKey = `delegation_${agentId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    try {
      const data = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/delegation?agent_id=${agentId}`
      );
      
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.warn('Delegation fetch failed:', error.message);
      return null;
    }
  },
  
  /**
   * Get delegation history
   */
  async getDelegationHistory(agentId = CONFIG.AGENT_ID) {
    try {
      const data = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/delegation/history?agent_id=${agentId}`
      );
      return data;
    } catch (error) {
      console.warn('Delegation history fetch failed:', error.message);
      return { history: [] };
    }
  },
  
  /**
   * Update delegation constraints
   */
  async updateDelegation(updates, agentId = CONFIG.AGENT_ID) {
    try {
      const response = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/delegation/update`,
        {
          method: 'POST',
          body: JSON.stringify({
            agent_id: agentId,
            ...updates,
          }),
        }
      );
      
      // Clear delegation cache
      this.cache.delete(`delegation_${agentId}`);
      
      return response;
    } catch (error) {
      console.error('Delegation update failed:', error);
      throw error;
    }
  },
  
  /**
   * Renew delegation
   */
  async renewDelegation(agentId = CONFIG.AGENT_ID) {
    try {
      const response = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/delegation/renew`,
        {
          method: 'POST',
          body: JSON.stringify({ agent_id: agentId }),
        }
      );
      
      this.cache.delete(`delegation_${agentId}`);
      
      return response;
    } catch (error) {
      console.error('Renewal failed:', error);
      throw error;
    }
  },
  
  /**
   * Revoke delegation
   */
  async revokeDelegation(agentId = CONFIG.AGENT_ID) {
    try {
      const response = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/delegation/revoke`,
        {
          method: 'POST',
          body: JSON.stringify({ agent_id: agentId }),
        }
      );
      
      this.cache.delete(`delegation_${agentId}`);
      
      return response;
    } catch (error) {
      console.error('Revoke failed:', error);
      throw error;
    }
  },
  
  /**
   * Get agent reputation
   */
  async getReputation(agentId = CONFIG.AGENT_ID) {
    try {
      const data = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/reputation/${agentId}`
      );
      return data;
    } catch (error) {
      console.warn('Reputation fetch failed:', error.message);
      return null;
    }
  },
  
  /**
   * Get VAC (Verifiable Activity Credential) data for an agent
   * Phase 4.5: AT Reputation Score data source
   * @param {string} pubkey - Agent public key
   * @returns {Promise<Object|null>} VAC data or null if unavailable
   */
  async getVAC(pubkey) {
    if (!pubkey) {
      console.warn('[API] getVAC called without pubkey');
      return null;
    }
    
    const cacheKey = `vac_${pubkey}`;
    const cached = this.cache.get(cacheKey);
    
    // Use cache if less than 5 minutes old
    if (cached && Date.now() - cached.timestamp < 300000) {
      return cached.data;
    }
    
    try {
      const data = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/agents/${pubkey}/vac`,
        {},
        8000 // 8 second timeout for VAC
      );
      
      // Cache the result
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.warn('[API] VAC fetch failed:', error.message);
      return null;
    }
  },
  
  /**
   * Check if OP API is reachable
   * @returns {Promise<boolean>}
   */
  async isOPReachable() {
    try {
      const result = await this.healthCheck();
      return result.healthy;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Verify event on Observer Protocol
   */
  async verifyEvent(eventId) {
    try {
      const data = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/verify/${eventId}`
      );
      return data;
    } catch (error) {
      console.warn('Event verification failed:', error.message);
      return null;
    }
  },
  
  /**
   * Submit new event
   */
  async submitEvent(eventData) {
    try {
      const response = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/submit`,
        {
          method: 'POST',
          body: JSON.stringify(eventData),
        }
      );
      return response;
    } catch (error) {
      console.error('Event submission failed:', error);
      throw error;
    }
  },
  
  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
  },
  
  /**
   * Health check
   */
  async healthCheck() {
    try {
      const data = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/health`,
        {},
        5000
      );
      return { healthy: true, data };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  },
  
  /**
   * Submit delegation credential to OP
   * Phase 4: Submit attested agent delegation
   */
  async submitDelegation(credential) {
    return this.fetchWithTimeout(
      `${CONFIG.API_BASE}/observer/delegations`,
      {
        method: 'POST',
        body: JSON.stringify(credential),
      }
    );
  },
  
  /**
   * Get delegations for a human pubkey
   * Phase 4: Fetch existing delegations
   */
  async getDelegationsByHuman(humanPubkey) {
    try {
      const data = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/delegations/${humanPubkey}`
      );
      return data.delegations || [];
    } catch (error) {
      console.warn('Failed to fetch delegations:', error.message);
      return [];
    }
  },
  
  // ============================================================
  // Phase 5: Transaction API Endpoints
  // ============================================================
  
  /**
   * Get transaction history for a pubkey
   * @param {string} pubkey - Agent public key
   * @param {Object} options - Query options
   * @param {number} options.since - Fetch transactions after this timestamp
   * @param {number} options.until - Fetch transactions before this timestamp
   * @param {number} options.limit - Maximum number of transactions
   * @param {string} options.type - Filter by transaction type
   * @returns {Promise<Object>} Transaction data
   */
  async getTransactionsForPubkey(pubkey, options = {}) {
    if (!pubkey) {
      throw new Error('Public key required');
    }
    
    const { since, until, limit = 1000, type } = options;
    
    const params = new URLSearchParams();
    if (since) params.append('since', since.toString());
    if (until) params.append('until', until.toString());
    if (limit) params.append('limit', limit.toString());
    if (type) params.append('type', type);
    
    const queryString = params.toString();
    const url = `${CONFIG.API_BASE}/observer/agents/${pubkey}/transactions${queryString ? `?${queryString}` : ''}`;
    
    return this.fetchWithTimeout(url, {}, CONFIG.TRANSACTIONS?.FETCH_TIMEOUT || 15000);
  },
  
  /**
   * Get transaction by ID
   * @param {string} txId - Transaction ID
   * @returns {Promise<Object|null>} Transaction or null
   */
  async getTransactionById(txId) {
    try {
      const data = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/transactions/${txId}`,
        {},
        10000
      );
      return data.transaction || null;
    } catch (error) {
      console.warn('[API] Transaction fetch failed:', error.message);
      return null;
    }
  },
  
  /**
   * Get transaction summary for a pubkey
   * @param {string} pubkey - Agent public key
   * @returns {Promise<Object|null>} Summary stats
   */
  async getTransactionSummary(pubkey) {
    try {
      const data = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/agents/${pubkey}/transactions/summary`,
        {},
        10000
      );
      return data.summary || null;
    } catch (error) {
      console.warn('[API] Transaction summary fetch failed:', error.message);
      return null;
    }
  },
  
  /**
   * Verify a transaction with OP
   * @param {string} txId - Transaction ID
   * @returns {Promise<Object>} Verification result
   */
  async verifyTransaction(txId) {
    try {
      const data = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/transactions/${txId}/verify`,
        {},
        10000
      );
      return data;
    } catch (error) {
      console.warn('[API] Transaction verification failed:', error.message);
      return { verified: false, error: error.message };
    }
  },
  
  /**
   * Get transaction types/categories
   * @returns {Promise<Array>} Available transaction types
   */
  async getTransactionTypes() {
    try {
      const data = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/transactions/types`,
        {},
        5000
      );
      return data.types || ['inbound', 'outbound', 'delegate', 'revoke'];
    } catch (error) {
      console.warn('[API] Transaction types fetch failed:', error.message);
      return ['inbound', 'outbound', 'delegate', 'revoke'];
    }
  },
};
