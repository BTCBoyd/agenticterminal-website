/**
 * Sovereign Dashboard - Delegation Credential Module
 * Phase 4: Create and sign delegation credentials
 * 
 * Creates cryptographically signed delegation credentials that link
 * a human's Sovereign identity to their agent(s) with spending constraints.
 */

const DelegationCredential = {
  // Credential version for future compatibility
  VERSION: '1.0',
  
  // Default constraints
  DEFAULTS: {
    max_per_txn_sats: 50000,
    max_per_month_sats: 500000,
    rails: ['lightning'],
    expiry_days: 90,
  },
  
  // Valid agent types
  AGENT_TYPES: {
    ALBY_HUB: 'alby_hub',
    LND_NODE: 'lnd_node',
    X402: 'x402',
    SOLANA: 'solana',
    OP_REGISTERED: 'op_registered',
    OTHER: 'other',
  },
  
  /**
   * Create a new delegation credential
   * @param {Object} params - Credential parameters
   * @param {string} params.agentPubkey - Agent's public key/identifier
   * @param {string} params.agentType - Type of agent (from AGENT_TYPES)
   * @param {Object} params.constraints - Spending constraints
   * @param {string} params.humanPubkey - Human's public key (issuer)
   * @param {number} params.expiryDays - Days until expiry
   * @returns {Object} Unsigned credential
   */
  create({
    agentPubkey,
    agentType,
    constraints = {},
    humanPubkey,
    expiryDays = this.DEFAULTS.expiry_days,
  }) {
    if (!agentPubkey) throw new Error('Agent public key is required');
    if (!humanPubkey) throw new Error('Human public key is required');
    
    const now = Date.now();
    const expiresAt = new Date(now + (expiryDays * 24 * 60 * 60 * 1000));
    
    // Merge with defaults
    const mergedConstraints = {
      max_per_txn_sats: constraints.max_per_txn_sats ?? this.DEFAULTS.max_per_txn_sats,
      max_per_month_sats: constraints.max_per_month_sats ?? this.DEFAULTS.max_per_month_sats,
      rails: constraints.rails ?? this.DEFAULTS.rails,
    };
    
    // Validate constraints
    this.validateConstraints(mergedConstraints);
    
    return {
      version: this.VERSION,
      issuer: humanPubkey,
      delegate: agentPubkey,
      agent_type: agentType,
      constraints: mergedConstraints,
      issued_at: new Date(now).toISOString(),
      expires_at: expiresAt.toISOString(),
      signature: null, // To be filled after signing
      agent_signature: null, // To be filled after co-signature
      verification_status: 'pending', // pending, human_attested, bilateral
    };
  },
  
  /**
   * Validate spending constraints
   * @param {Object} constraints - Constraints to validate
   */
  validateConstraints(constraints) {
    if (constraints.max_per_txn_sats < 1000) {
      throw new Error('Minimum per-transaction limit is 1,000 sats');
    }
    if (constraints.max_per_txn_sats > 10000000) {
      throw new Error('Maximum per-transaction limit is 10,000,000 sats');
    }
    if (constraints.max_per_month_sats < 10000) {
      throw new Error('Minimum monthly limit is 10,000 sats');
    }
    if (constraints.max_per_month_sats > 100000000) {
      throw new Error('Maximum monthly limit is 100,000,000 sats');
    }
    if (!Array.isArray(constraints.rails) || constraints.rails.length === 0) {
      throw new Error('At least one payment rail must be specified');
    }
    
    const validRails = ['lightning', 'x402', 'l402', 'solana', 'onchain'];
    const invalidRails = constraints.rails.filter(r => !validRails.includes(r));
    if (invalidRails.length > 0) {
      throw new Error(`Invalid rails: ${invalidRails.join(', ')}`);
    }
  },
  
  /**
   * Get canonical string for signing (deterministic serialization)
   * @param {Object} credential - Credential to serialize
   * @returns {string} Canonical JSON string
   */
  getCanonicalString(credential) {
    // Create deterministic serialization by sorting keys
    const canonical = {
      version: credential.version,
      issuer: credential.issuer,
      delegate: credential.delegate,
      agent_type: credential.agent_type,
      constraints: {
        max_per_txn_sats: credential.constraints.max_per_txn_sats,
        max_per_month_sats: credential.constraints.max_per_month_sats,
        rails: [...credential.constraints.rails].sort(),
      },
      issued_at: credential.issued_at,
      expires_at: credential.expires_at,
    };
    
    return JSON.stringify(canonical, Object.keys(canonical).sort());
  },
  
  /**
   * Sign credential with human's private key
   * @param {Object} credential - Credential to sign
   * @param {string} privateKey - Human's private key (hex)
   * @returns {Promise<Object>} Signed credential
   */
  async signWithHuman(credential, privateKey) {
    if (!privateKey) {
      throw new Error('Private key required for signing');
    }
    
    const canonicalString = this.getCanonicalString(credential);
    const signature = await CryptoKeygen.sign(canonicalString, privateKey);
    
    return {
      ...credential,
      signature,
      verification_status: 'human_attested',
    };
  },
  
  /**
   * Add agent co-signature to credential
   * @param {Object} credential - Human-signed credential
   * @param {string} agentSignature - Agent's signature (hex)
   * @returns {Object} Bilaterally signed credential
   */
  addAgentCosignature(credential, agentSignature) {
    if (!credential.signature) {
      throw new Error('Credential must be human-signed first');
    }
    if (!agentSignature) {
      throw new Error('Agent signature required');
    }
    
    return {
      ...credential,
      agent_signature: agentSignature,
      verification_status: 'bilateral',
      cosigned_at: new Date().toISOString(),
    };
  },
  
  /**
   * Verify human signature on credential
   * @param {Object} credential - Credential to verify
   * @returns {Promise<boolean>} Validity of human signature
   */
  async verifyHumanSignature(credential) {
    if (!credential.signature) return false;
    
    const canonicalString = this.getCanonicalString(credential);
    return CryptoKeygen.verify(canonicalString, credential.signature, credential.issuer);
  },
  
  /**
   * Verify agent co-signature on credential
   * @param {Object} credential - Credential to verify
   * @returns {Promise<boolean>} Validity of agent signature
   */
  async verifyAgentCosignature(credential) {
    if (!credential.agent_signature) return false;
    
    const canonicalString = this.getCanonicalString(credential);
    return CryptoKeygen.verify(canonicalString, credential.agent_signature, credential.delegate);
  },
  
  /**
   * Check if credential is expired
   * @param {Object} credential - Credential to check
   * @returns {boolean} True if expired
   */
  isExpired(credential) {
    const expiresAt = new Date(credential.expires_at);
    return Date.now() > expiresAt.getTime();
  },
  
  /**
   * Check if credential is valid (signatures and expiry)
   * @param {Object} credential - Credential to validate
   * @returns {Promise<{valid: boolean, reason?: string}>}
   */
  async validate(credential) {
    // Check expiry
    if (this.isExpired(credential)) {
      return { valid: false, reason: 'Credential expired' };
    }
    
    // Check human signature
    const humanValid = await this.verifyHumanSignature(credential);
    if (!humanValid) {
      return { valid: false, reason: 'Invalid human signature' };
    }
    
    // Check agent co-signature if present
    if (credential.agent_signature) {
      const agentValid = await this.verifyAgentCosignature(credential);
      if (!agentValid) {
        return { valid: false, reason: 'Invalid agent signature' };
      }
    }
    
    return { valid: true };
  },
  
  /**
   * Get days until expiry
   * @param {Object} credential - Credential
   * @returns {number} Days until expiry
   */
  getDaysUntilExpiry(credential) {
    const expiresAt = new Date(credential.expires_at);
    const msUntilExpiry = expiresAt.getTime() - Date.now();
    return Math.floor(msUntilExpiry / (1000 * 60 * 60 * 24));
  },
  
  /**
   * Format credential for display
   * @param {Object} credential - Credential to format
   * @returns {Object} Formatted credential
   */
  formatForDisplay(credential) {
    const daysUntilExpiry = this.getDaysUntilExpiry(credential);
    
    return {
      issuer: credential.issuer.slice(0, 16) + '...',
      delegate: credential.delegate.slice(0, 16) + '...',
      agentType: this.formatAgentType(credential.agent_type),
      constraints: {
        perTxn: credential.constraints.max_per_txn_sats.toLocaleString() + ' sats',
        perMonth: credential.constraints.max_per_month_sats.toLocaleString() + ' sats',
        rails: credential.constraints.rails.map(r => r.charAt(0).toUpperCase() + r.slice(1)),
      },
      issuedAt: new Date(credential.issued_at).toLocaleDateString(),
      expiresAt: new Date(credential.expires_at).toLocaleDateString(),
      daysUntilExpiry,
      isExpired: daysUntilExpiry < 0,
      status: credential.verification_status,
      isBilateral: credential.verification_status === 'bilateral',
    };
  },
  
  /**
   * Format agent type for display
   * @param {string} type - Agent type
   * @returns {string} Formatted type
   */
  formatAgentType(type) {
    const formats = {
      [this.AGENT_TYPES.ALBY_HUB]: 'Alby Hub',
      [this.AGENT_TYPES.LND_NODE]: 'LND Node',
      [this.AGENT_TYPES.X402]: 'x402 / L402',
      [this.AGENT_TYPES.SOLANA]: 'Solana',
      [this.AGENT_TYPES.OP_REGISTERED]: 'OP-Registered Agent',
      [this.AGENT_TYPES.OTHER]: 'Other',
    };
    return formats[type] || 'Unknown';
  },
  
  /**
   * Export credential to JSON string
   * @param {Object} credential - Credential to export
   * @returns {string} JSON string
   */
  export(credential) {
    return JSON.stringify(credential, null, 2);
  },
  
  /**
   * Import credential from JSON string
   * @param {string} json - JSON string
   * @returns {Object} Parsed credential
   */
  import(json) {
    try {
      return JSON.parse(json);
    } catch (error) {
      throw new Error('Invalid credential format');
    }
  },
};

// Make globally available
if (typeof window !== 'undefined') {
  window.DelegationCredential = DelegationCredential;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DelegationCredential;
}
