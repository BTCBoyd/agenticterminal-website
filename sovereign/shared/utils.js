/**
 * Wallet Connection Utilities
 * Shared across Sovereign and Enterprise dashboards
 */

const WalletUtils = {
  // Check if MetaMask is installed
  hasMetamask() {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
  },

  // Check if Alby is installed
  hasAlby() {
    return typeof window.webln !== 'undefined';
  },

  // Connect to MetaMask
  async connectMetamask() {
    if (!this.hasMetamask()) {
      throw new Error('MetaMask not installed. Please install MetaMask extension.');
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      const address = accounts[0];
      
      // Get chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      return {
        type: 'metamask',
        address: address,
        chainId: parseInt(chainId, 16),
        publicKey: address // Simplified - address serves as identifier
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to connect to MetaMask');
    }
  },

  // Connect to Alby
  async connectAlby() {
    if (!this.hasAlby()) {
      // Open Alby installation page
      window.open('https://getalby.com', '_blank');
      throw new Error('Alby not installed. Opening installation page...');
    }

    try {
      await window.webln.enable();
      const info = await window.webln.getInfo();

      return {
        type: 'alby',
        node: info.node,
        publicKey: info.node?.pubkey,
        alias: info.node?.alias
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to connect to Alby');
    }
  },

  // Sign message with MetaMask
  async signWithMetamask(message, address) {
    if (!this.hasMetamask()) {
      throw new Error('MetaMask not available');
    }

    try {
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address]
      });
      return signature;
    } catch (error) {
      throw new Error('Message signing rejected');
    }
  },

  // Sign message with Alby (if supported)
  async signWithAlby(message) {
    if (!this.hasAlby()) {
      throw new Error('Alby not available');
    }

    // Alby doesn't support message signing directly via WebLN standard
    // This would typically go through a custom provider
    throw new Error('Message signing with Alby requires custom implementation');
  },

  // Listen for account changes
  onAccountChange(callback) {
    if (this.hasMetamask()) {
      window.ethereum.on('accountsChanged', (accounts) => {
        callback(accounts[0] || null);
      });
    }
  },

  // Listen for chain changes
  onChainChange(callback) {
    if (this.hasMetamask()) {
      window.ethereum.on('chainChanged', (chainId) => {
        callback(parseInt(chainId, 16));
      });
    }
  }
};

/**
 * DID Derivation Utilities
 */

const DIDUtils = {
  // Derive DID from public key
  deriveDID(publicKey, method = 'key') {
    if (!publicKey) return null;

    switch (method) {
      case 'key':
        // did:key - base58 encoded public key
        return `did:key:z${this.base58Encode(publicKey.substring(0, 32))}`;
      
      case 'ethr':
        // did:ethr - Ethereum address
        return `did:ethr:${publicKey}`;
      
      case 'op':
        // did:op - Observer Protocol specific
        return `did:op:${this.hashPublicKey(publicKey)}`;
      
      default:
        return `did:key:${publicKey}`;
    }
  },

  // Shorten DID for display
  shorten(did, prefixLength = 12, suffixLength = 6) {
    if (!did || did.length <= prefixLength + suffixLength + 3) return did;
    return `${did.substring(0, prefixLength)}...${did.substring(did.length - suffixLength)}`;
  },

  // Validate DID format
  isValid(did) {
    return typeof did === 'string' && did.startsWith('did:') && did.length > 10;
  },

  // Extract method from DID
  getMethod(did) {
    if (!this.isValid(did)) return null;
    const parts = did.split(':');
    return parts.length >= 2 ? parts[1] : null;
  },

  // Helper: Simple base58 encode (for demo)
  base58Encode(str) {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    // Simplified encoding for demo
    return btoa(str).replace(/=/g, '').substring(0, 32);
  },

  // Helper: Hash public key
  hashPublicKey(publicKey) {
    // Simplified hash for demo
    return btoa(publicKey).replace(/=/g, '').substring(0, 24);
  }
};

/**
 * API Client
 */

const APIClient = {
  baseURL: '/api/v1',

  // Get auth token from session
  getToken() {
    const sovereignSession = localStorage.getItem('sovereign_session');
    const enterpriseSession = localStorage.getItem('enterprise_session');
    
    if (sovereignSession) {
      const session = JSON.parse(sovereignSession);
      return session.token;
    }
    
    if (enterpriseSession) {
      const session = JSON.parse(enterpriseSession);
      return session.token;
    }
    
    return null;
  },

  // Make authenticated request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('sovereign_session');
        localStorage.removeItem('enterprise_session');
        window.location.href = '/sovereign/sovereign/login.html';
        return;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // GET request
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  // POST request
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // PUT request
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // DELETE request
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

/**
 * Session Management
 */

const SessionManager = {
  // Store sovereign session
  setSovereign(session) {
    localStorage.setItem('sovereign_session', JSON.stringify(session));
  },

  // Get sovereign session
  getSovereign() {
    const data = localStorage.getItem('sovereign_session');
    return data ? JSON.parse(data) : null;
  },

  // Store enterprise session
  setEnterprise(session) {
    localStorage.setItem('enterprise_session', JSON.stringify(session));
  },

  // Get enterprise session
  getEnterprise() {
    const data = localStorage.getItem('enterprise_session');
    return data ? JSON.parse(data) : null;
  },

  // Clear all sessions
  clear() {
    localStorage.removeItem('sovereign_session');
    localStorage.removeItem('enterprise_session');
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!(this.getSovereign() || this.getEnterprise());
  },

  // Check if user is org admin
  isOrgAdmin() {
    const enterprise = this.getEnterprise();
    return enterprise && (enterprise.role === 'admin' || enterprise.permissions?.includes('admin'));
  },

  // Get current DID
  getDID() {
    const sovereign = this.getSovereign();
    const enterprise = this.getEnterprise();
    return sovereign?.did || enterprise?.did || null;
  },

  // Get org ID
  getOrgId() {
    const enterprise = this.getEnterprise();
    return enterprise?.orgId || null;
  }
};

/**
 * Rail Utilities
 */

const RailUtils = {
  // Supported rails
  RAILS: {
    'tron': { name: 'TRON', icon: '🔴', color: '#FF0202' },
    'tron:trc20': { name: 'TRC-20', icon: '💎', color: '#FF6666' },
    'lightning': { name: 'Lightning', icon: '⚡', color: '#F7931A' },
    'solana': { name: 'Solana', icon: '🟣', color: '#9945FF' },
    'x402': { name: 'x402', icon: '🌐', color: '#6B5CE7' }
  },

  // Get rail info
  getInfo(rail) {
    return this.RAILS[rail] || { name: rail, icon: '🔗', color: '#888' };
  },

  // Get all rails
  getAll() {
    return Object.entries(this.RAILS).map(([key, value]) => ({
      id: key,
      ...value
    }));
  },

  // Check if rail is TRON-based
  isTron(rail) {
    return rail === 'tron' || rail === 'tron:trc20';
  },

  // Format rail name for display
  formatName(rail) {
    return this.getInfo(rail).name;
  },

  // Get rail icon
  getIcon(rail) {
    return this.getInfo(rail).icon;
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WalletUtils, DIDUtils, APIClient, SessionManager, RailUtils };
}
