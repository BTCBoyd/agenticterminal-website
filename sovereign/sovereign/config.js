/**
 * Sovereign Dashboard - Configuration
 * Phase 5: Complete client-side storage architecture
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
  
  // Cryptographic Configuration
  CRYPTO: {
    // Key generation
    KEY_TYPE: 'secp256k1',
    KEY_FORMAT: 'compressed',
    
    // Encryption
    ALGORITHM: 'AES-GCM',
    KEY_LENGTH: 256,
    IV_LENGTH: 12,
    SALT_LENGTH: 16,
    
    // PBKDF2
    PBKDF2_ITERATIONS: 100000,
    PBKDF2_HASH: 'SHA-256',
    
    // Mnemonic
    MNEMONIC_STRENGTH: 256,
    MNEMONIC_WORDLIST: 'english',
  },
  
  // Phase 5: Storage Configuration
  STORAGE: {
    DB_NAME: 'SovereignIdentityDB',
    DB_VERSION: 3,
    IDENTITY_STORE: 'identities',
    SESSION_STORE: 'session',
    SCORE_STORE: 'at_ars_scores',
    TRANSACTION_STORE: 'transaction_cache',
    CREDENTIALS_STORE: 'credentials',
    OP_RECEIPT_STORE: 'op_receipts',
    METADATA_STORE: 'metadata',
    
    // Storage limits (Phase 5)
    DEFAULT_LIMIT_MB: 100,
    MAX_LIMIT_MB: 1000,
    MIN_LIMIT_MB: 10,
    WARNING_THRESHOLD: 0.8,
    CRITICAL_THRESHOLD: 0.95,
    
    // Cache windows (Phase 5)
    DEFAULT_CACHE_DAYS: 90,
    MAX_CACHE_DAYS: 1825, // 5 years
    MIN_CACHE_DAYS: 7,
    
    // Cache keys
    LIMIT_KEY: 'SOVEREIGN_STORAGE_LIMIT_MB',
    CACHE_DAYS_KEY: 'SOVEREIGN_CACHE_DAYS',
    PRUNE_CONFIRMED_KEY: 'SOVEREIGN_PRUNE_CONFIRMED',
  },
  
  // Phase 5: Transaction Pipeline Configuration
  TRANSACTIONS: {
    FETCH_TIMEOUT: 15000,
    MAX_FETCH_LIMIT: 10000,
    DEFAULT_LIMIT: 1000,
    VERIFY_HASHES: true,
    CACHE_KEY: 'transaction_cache',
    CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
  },
  
  // Feature Flags
  FEATURES: {
    liveUpdates: true,
    webSocket: true,
    notifications: true,
    exportCSV: true,
    exportJSON: true,           // Phase 5: JSON export
    delegationManagement: true,
    albyOAuth: true,
    qrAuth: true,
    pushNotifications: true,
    selfCustodialIdentity: true,
    encryptedExport: true,
    mnemonicBackup: true,
    opRegistration: true,
    agentAttestation: true,
    atarsScore: true,
    transactionCache: true,      // Phase 5
    storageManagement: true,     // Phase 5
    crossDeviceSync: true,       // Phase 5
  },
  
  // Refresh intervals (ms)
  REFRESH_INTERVAL: 30000,
  SESSION_TIMEOUT: 3600000,
  INACTIVITY_TIMEOUT: 1800000,
  WS_RECONNECT_INTERVAL: 5000,
  WS_HEARTBEAT_INTERVAL: 30000,
  
  // Phase 5: Session Management
  SESSION: {
    INACTIVITY_TIMEOUT: 30 * 60 * 1000,  // 30 minutes
    EXTENDED_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours (if "remember me")
    WARNING_BEFORE_EXPIRY: 5 * 60 * 1000, // 5 minutes warning
  },
  
  // Security
  SECURITY: {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 300000,
    REQUIRE_HTTPS: true,
    ENFORCE_PASSPHRASE_MIN_LENGTH: 8,
    PASSPHRASE_MIN_STRENGTH: 2, // 0-6 scale
  },
  
  // Version
  VERSION: '2.5.0-phase5-storage-architecture',
  BUILD_DATE: '2026-03-26',
  CRYPTO_VERSION: '1.0',
  OP_VERSION: '1.0',
  AGENT_ATTESTATION_VERSION: '1.0',
  STORAGE_VERSION: '1.0',       // Phase 5
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

// Log configuration on load (development)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('[Sovereign] Config loaded:', { 
    version: CONFIG.VERSION, 
    crypto: CONFIG.CRYPTO_VERSION,
    storage: CONFIG.STORAGE_VERSION,
  });
}