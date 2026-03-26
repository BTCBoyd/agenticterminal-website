/**
 * Sovereign Dashboard - API Module
 * Phase 1: Live data integration with caching and error handling
 */

const API = {
  cache: new Map(),
  cacheTimeout: 30000, // 30 seconds
  
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
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
      // Try live API first
      const data = await this.fetchWithTimeout(
        `${CONFIG.API_BASE}/observer/transactions?limit=${limit}&agent_id=${agentId}`
      );
      
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.warn('API fetch failed, using fallback:', error.message);
      
      // Fallback to localStorage cache if available
      const fallback = localStorage.getItem('SOVEREIGN_TRANSACTIONS_CACHE');
      if (fallback) {
        return JSON.parse(fallback);
      }
      
      // Return empty structure
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
      
      // Clear cache
      this.cache.delete(`delegation_${agentId}`);
      
      return response;
    } catch (error) {
      console.error('Revoke failed:', error);
      throw error;
    }
  },
  
  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
  },
};
