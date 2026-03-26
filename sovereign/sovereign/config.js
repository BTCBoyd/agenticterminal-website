/**
 * Sovereign Dashboard - Configuration
 * Phase 2: Live integration with agenticterminal.io/sovereign
 */

const CONFIG = {
  // API Configuration
  API_BASE: localStorage.getItem('SOVEREIGN_API_URL') || 'https://api.observerprotocol.org',
  WS_BASE: localStorage.getItem('SOVEREIGN_WS_URL') || 'wss://api.observerprotocol.org/ws',
  
  // Domain Configuration
  DOMAIN: 'agenticterminal.io',
  BASE_PATH: '/sovereign',
  FULL_URL: 'https://agenticterminal.io/sovereign',
  
  // Agent Configuration
  AGENT_ID: localStorage.getItem('SOVEREIGN_AGENT_ID') || 'maxi-0001',
  
  // Alby OAuth Configuration
  ALBY: {
    CLIENT_ID: localStorage.getItem('ALBY_CLIENT_ID') || 'sovereign_dashboard',
    REDIRECT_URI: 'https://agenticterminal.io/sovereign/alby-callback.html',
    SCOPE: 'account:read lightning:read',
    AUTH_URL: 'https://getalby.com/oauth',
    TOKEN_URL: 'https://api.getalby.com/oauth/token',
  },
  
  // Feature Flags
  FEATURES: {
    liveUpdates: true,
    webSocket: true,
    notifications: true,
    exportCSV: true,
    delegationManagement: true,
    albyOAuth: true,
    qrAuth: true,
    pushNotifications: true,
  },
  
  // Refresh intervals (ms)
  REFRESH_INTERVAL: 30000, // 30 seconds
  SESSION_TIMEOUT: 3600000, // 1 hour
  WS_RECONNECT_INTERVAL: 5000, // 5 seconds
  WS_HEARTBEAT_INTERVAL: 30000, // 30 seconds
  
  // Version
  VERSION: '2.0.0-phase2',
  BUILD_DATE: '2026-03-26',
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
