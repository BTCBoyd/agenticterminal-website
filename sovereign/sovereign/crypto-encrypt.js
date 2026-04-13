/**
 * Sovereign Dashboard - AES-256-GCM Encryption
 * Phase 1-2: Private key encryption with passphrase
 * 
 * Uses WebCrypto API for:
 * - PBKDF2 for key derivation (100,000 iterations)
 * - AES-256-GCM for authenticated encryption
 * - Random salt (16 bytes) and IV (12 bytes)
 */

const CryptoEncrypt = {
  // Encryption parameters
  PBKDF2_ITERATIONS: 100000,
  SALT_LENGTH: 16,
  IV_LENGTH: 12,
  KEY_LENGTH: 32, // 256 bits
  ALGORITHM: 'AES-GCM',
  
  /**
   * Encrypt data with a passphrase
   * @param {string} data - Data to encrypt (typically private key hex)
   * @param {string} passphrase - User's passphrase
   * @returns {Promise<string>} Encrypted blob as base64 (salt + iv + ciphertext + authTag)
   */
  async encrypt(data, passphrase) {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    
    // Derive encryption key using PBKDF2
    const key = await this.deriveKey(passphrase, salt);
    
    // Encode data
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    
    // Encrypt using AES-256-GCM
    const encrypted = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv },
      key,
      dataBytes
    );
    
    // Combine salt + iv + ciphertext for storage
    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    // Return as base64
    return this.bytesToBase64(result);
  },
  
  /**
   * Decrypt data with a passphrase
   * @param {string} encryptedBase64 - Encrypted blob from encrypt()
   * @param {string} passphrase - User's passphrase
   * @returns {Promise<string>} Decrypted data
   * @throws {Error} If passphrase is wrong or data is corrupted
   */
  async decrypt(encryptedBase64, passphrase) {
    try {
      // Decode base64
      const encrypted = this.base64ToBytes(encryptedBase64);
      
      // Extract components
      const salt = encrypted.slice(0, this.SALT_LENGTH);
      const iv = encrypted.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const ciphertext = encrypted.slice(this.SALT_LENGTH + this.IV_LENGTH);
      
      // Derive the same key
      const key = await this.deriveKey(passphrase, salt);
      
      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv },
        key,
        ciphertext
      );
      
      // Decode result
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
      
    } catch (error) {
      // Provide clear error without exposing implementation details
      if (error.name === 'OperationError' || error.message?.includes('decrypt')) {
        throw new Error('Incorrect passphrase. Please try again.');
      }
      throw new Error('Decryption failed. The encrypted data may be corrupted.');
    }
  },
  
  /**
   * Verify passphrase without exposing decrypted data
   * @param {string} encryptedBase64 - Encrypted blob
   * @param {string} passphrase - Passphrase to verify
   * @returns {Promise<boolean>} True if passphrase is correct
   */
  async verifyPassphrase(encryptedBase64, passphrase) {
    try {
      await this.decrypt(encryptedBase64, passphrase);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * Derive encryption key from passphrase using PBKDF2
   * @param {string} passphrase - User passphrase
   * @param {Uint8Array} salt - Random salt
   * @returns {Promise<CryptoKey>} Derived AES key
   */
  async deriveKey(passphrase, salt) {
    const encoder = new TextEncoder();
    const passphraseBytes = encoder.encode(passphrase);
    
    // Import passphrase as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passphraseBytes,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derive AES-256 key using PBKDF2
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH * 8 },
      false, // Non-extractable
      ['encrypt', 'decrypt']
    );
  },
  
  /**
   * Change passphrase for encrypted data
   * @param {string} encryptedBase64 - Current encrypted blob
   * @param {string} oldPassphrase - Current passphrase
   * @param {string} newPassphrase - New passphrase
   * @returns {Promise<string>} New encrypted blob
   */
  async changePassphrase(encryptedBase64, oldPassphrase, newPassphrase) {
    // Decrypt with old passphrase
    const decrypted = await this.decrypt(encryptedBase64, oldPassphrase);
    
    // Re-encrypt with new passphrase
    return this.encrypt(decrypted, newPassphrase);
  },
  
  /**
   * Generate a secure random passphrase suggestion
   * @param {number} wordCount - Number of words (default: 6)
   * @returns {string} Suggested passphrase
   */
  generatePassphraseSuggestion(wordCount = 6) {
    const wordList = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
      'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
      'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
      'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
      'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha'
    ];
    
    const words = [];
    for (let i = 0; i < wordCount; i++) {
      const randomIndex = crypto.getRandomValues(new Uint8Array(1))[0] % wordList.length;
      words.push(wordList[randomIndex]);
    }
    
    // Add a number for extra entropy
    const number = crypto.getRandomValues(new Uint8Array(1))[0] % 1000;
    return words.join('-') + '-' + number;
  },
  
  /**
   * Check passphrase strength
   * @param {string} passphrase - Passphrase to check
   * @returns {{score: number, feedback: string}} Strength assessment
   */
  checkPassphraseStrength(passphrase) {
    let score = 0;
    const feedback = [];
    
    // Length check
    if (passphrase.length >= 12) score += 2;
    else if (passphrase.length >= 8) score += 1;
    else feedback.push('Use at least 12 characters');
    
    // Complexity checks
    if (/[A-Z]/.test(passphrase)) score += 1;
    if (/[a-z]/.test(passphrase)) score += 1;
    if (/[0-9]/.test(passphrase)) score += 1;
    if (/[^A-Za-z0-9]/.test(passphrase)) score += 1;
    
    // Word-based passphrase bonus
    if (passphrase.split(/[-_\s]/).length >= 4) score += 1;
    
    const rating = score >= 6 ? 'strong' : score >= 4 ? 'good' : score >= 2 ? 'fair' : 'weak';
    
    return {
      score,
      rating,
      feedback: feedback.length > 0 ? feedback.join(', ') : 'Good passphrase strength',
    };
  },
  
  /**
   * Convert Uint8Array to base64
   */
  bytesToBase64(bytes) {
    const binString = Array.from(bytes)
      .map(byte => String.fromCharCode(byte))
      .join('');
    return btoa(binString);
  },
  
  /**
   * Convert base64 to Uint8Array
   */
  base64ToBytes(base64) {
    const binString = atob(base64);
    return Uint8Array.from(binString, char => char.charCodeAt(0));
  },
};

// Make globally available
if (typeof window !== 'undefined') {
  window.CryptoEncrypt = CryptoEncrypt;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CryptoEncrypt;
}
