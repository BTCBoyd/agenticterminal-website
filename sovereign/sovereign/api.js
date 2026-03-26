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
};
