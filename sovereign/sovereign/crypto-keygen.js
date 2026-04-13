/**
 * Sovereign Dashboard - Cryptographic Key Generation
 * Phase 1-2: Client-side keypair generation using @noble/secp256k1
 * 
 * Generates secp256k1 keypairs for Nostr-compatible identities
 * All operations happen client-side in <2 seconds
 */

// Import noble-secp256k1 (assumes ESM module or global via import map)
// For CDN usage: https://unpkg.com/@noble/secp256k1@2.0.0/index.js

const CryptoKeygen = {
  // Module loaded state
  isReady: false,
  secp256k1: null,
  utils: null,
  
  /**
   * Initialize the keygen module
   * Loads @noble/secp256k1 from CDN or checks for global
   */
  async init() {
    if (this.isReady) return true;
    
    try {
      // Try to use dynamic import for ESM
      if (typeof window !== 'undefined' && window.nobleSecp256k1) {
        this.secp256k1 = window.nobleSecp256k1;
        this.utils = window.nobleSecp256k1.utils;
      } else {
        // Load from CDN
        await this.loadFromCDN();
      }
      
      this.isReady = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize secp256k1:', error);
      return false;
    }
  },
  
  /**
   * Load @noble/secp256k1 from CDN
   */
  async loadFromCDN() {
    const module = await import('https://unpkg.com/@noble/secp256k1@2.0.0/index.js');
    this.secp256k1 = module;
    this.utils = module.utils;
    window.nobleSecp256k1 = module;
  },
  
  /**
   * Generate a new secp256k1 keypair
   * @returns {Promise<{privateKey: string, publicKey: string}>} Hex-encoded keys
   */
  async generateKeypair() {
    await this.init();
    
    // Generate cryptographically secure random bytes
    const privateKey = this.utils.randomPrivateKey();
    
    // Derive public key (33-byte compressed format for Nostr compatibility)
    const publicKey = this.secp256k1.getPublicKey(privateKey, true);
    
    // Convert to hex strings
    return {
      privateKey: this.bytesToHex(privateKey),
      publicKey: this.bytesToHex(publicKey),
    };
  },
  
  /**
   * Generate keypair from a private key (for recovery)
   * @param {string} privateKeyHex - Hex-encoded private key
   * @returns {Promise<{privateKey: string, publicKey: string}>}
   */
  async fromPrivateKey(privateKeyHex) {
    await this.init();
    
    const privateKey = this.hexToBytes(privateKeyHex);
    const publicKey = this.secp256k1.getPublicKey(privateKey, true);
    
    return {
      privateKey: privateKeyHex,
      publicKey: this.bytesToHex(publicKey),
    };
  },
  
  /**
   * Validate a hex-encoded private key
   * @param {string} privateKeyHex - Private key to validate
   * @returns {boolean} Validity
   */
  isValidPrivateKey(privateKeyHex) {
    try {
      const bytes = this.hexToBytes(privateKeyHex);
      return bytes.length === 32 && this.utils.isValidPrivateKey(bytes);
    } catch {
      return false;
    }
  },
  
  /**
   * Validate a hex-encoded public key
   * @param {string} publicKeyHex - Public key to validate
   * @returns {boolean} Validity
   */
  isValidPublicKey(publicKeyHex) {
    try {
      const bytes = this.hexToBytes(publicKeyHex);
      // Compressed: 33 bytes, Uncompressed: 65 bytes
      return bytes.length === 33 || bytes.length === 65;
    } catch {
      return false;
    }
  },
  
  /**
   * Sign a message with the private key
   * @param {string} message - Message to sign
   * @param {string} privateKeyHex - Hex private key
   * @returns {Promise<string>} Hex-encoded signature
   */
  async sign(message, privateKeyHex) {
    await this.init();
    
    const privateKey = this.hexToBytes(privateKeyHex);
    const messageHash = await this.sha256(message);
    const signature = await this.secp256k1.sign(messageHash, privateKey);
    
    return signature.toCompactHex();
  },
  
  /**
   * Verify a signature
   * @param {string} message - Original message
   * @param {string} signatureHex - Hex signature
   * @param {string} publicKeyHex - Hex public key
   * @returns {Promise<boolean>} Validity
   */
  async verify(message, signatureHex, publicKeyHex) {
    await this.init();
    
    try {
      const publicKey = this.hexToBytes(publicKeyHex);
      const signature = this.secp256k1.Signature.fromCompact(signatureHex);
      const messageHash = await this.sha256(message);
      
      return this.secp256k1.verify(signature, messageHash, publicKey);
    } catch {
      return false;
    }
  },
  
  /**
   * Get Nostr-compatible public key (32-byte x-only for schnorr)
   * @param {string} publicKeyHex - Compressed public key
   * @returns {string} 32-byte hex public key for Nostr
   */
  toNostrPubkey(publicKeyHex) {
    const bytes = this.hexToBytes(publicKeyHex);
    // For compressed key, skip the first byte (0x02 or 0x03)
    // Return the 32-byte X coordinate
    if (bytes.length === 33) {
      return this.bytesToHex(bytes.slice(1));
    }
    return publicKeyHex;
  },
  
  /**
   * Convert byte array to hex string
   */
  bytesToHex(bytes) {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },
  
  /**
   * Convert hex string to byte array
   */
  hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
  },
  
  /**
   * SHA-256 hash (using WebCrypto API)
   */
  async sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  },
};

// Make globally available
if (typeof window !== 'undefined') {
  window.CryptoKeygen = CryptoKeygen;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CryptoKeygen;
}
