/**
 * Sovereign Dashboard - Encrypted Identity Export/Import
 * Phase 1-2: .sovereign file format for backup and restore
 * 
 * File format: JSON with metadata + encrypted private key
 * Extension: .sovereign
 * MIME type: application/x-sovereign-identity
 */

const CryptoExport = {
  // File format version
  FORMAT_VERSION: '1.0',
  FILE_EXTENSION: '.sovereign',
  MIME_TYPE: 'application/x-sovereign-identity',
  
  /**
   * Export identity to .sovereign file
   * @param {Object} identity - Identity object
   * @param {string} identity.publicKey - Public key hex
   * @param {string} identity.encryptedPrivateKey - Encrypted private key (from CryptoEncrypt)
   * @param {string} identity.displayName - User's display name
   * @param {number} identity.createdAt - Creation timestamp
   * @returns {Object} Export object ready for download
   */
  exportIdentity(identity) {
    // Validate required fields
    if (!identity.publicKey || !identity.encryptedPrivateKey) {
      throw new Error('Identity must include publicKey and encryptedPrivateKey');
    }
    
    // Build export structure
    const exportData = {
      version: this.FORMAT_VERSION,
      format: 'sovereign-identity',
      createdAt: Date.now(),
      exportedFrom: typeof window !== 'undefined' ? window.location.origin : 'unknown',
      
      identity: {
        publicKey: identity.publicKey,
        encryptedPrivateKey: identity.encryptedPrivateKey,
        displayName: identity.displayName || 'Anonymous',
        createdAt: identity.createdAt || Date.now(),
        keyType: identity.keyType || 'secp256k1',
      },
      
      // Security metadata (not encrypted, for validation)
      security: {
        algorithm: 'AES-256-GCM',
        kdf: 'PBKDF2-SHA256',
        iterations: 100000,
        keyFingerprint: this.computeFingerprint(identity.publicKey),
      },
    };
    
    return exportData;
  },
  
  /**
   * Convert export data to downloadable blob
   * @param {Object} exportData - Data from exportIdentity()
   * @returns {Blob} File blob
   */
  toBlob(exportData) {
    const json = JSON.stringify(exportData, null, 2);
    return new Blob([json], { type: this.MIME_TYPE });
  },
  
  /**
   * Trigger download of .sovereign file
   * @param {Object} identity - Identity to export
   * @param {string} filename - Optional custom filename
   */
  download(identity, filename = null) {
    const exportData = this.exportIdentity(identity);
    const blob = this.toBlob(exportData);
    const suggestedName = filename || `sovereign-identity-${exportData.identity.publicKey.slice(0, 8)}${this.FILE_EXTENSION}`;
    
    // Use File System Access API if available (modern browsers)
    if ('showSaveFilePicker' in window) {
      return this.downloadWithPicker(blob, suggestedName);
    }
    
    // Fallback to traditional download
    return this.downloadLegacy(blob, suggestedName);
  },
  
  /**
   * Download using File System Access API
   */
  async downloadWithPicker(blob, suggestedName) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{
          description: 'Sovereign Identity File',
          accept: { [this.MIME_TYPE]: [this.FILE_EXTENSION] },
        }],
      });
      
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      
      return { success: true, method: 'picker' };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
      // Fall back to legacy
      return this.downloadLegacy(blob, suggestedName);
    }
  },
  
  /**
   * Legacy download using anchor tag
   */
  downloadLegacy(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return { success: true, method: 'legacy' };
  },
  
  /**
   * Parse uploaded .sovereign file
   * @param {File} file - Uploaded file
   * @returns {Promise<Object>} Parsed identity data
   */
  async parseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const validated = this.validateImport(data);
          resolve(validated);
        } catch (error) {
          reject(new Error('Invalid file format. Please upload a valid .sovereign file.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file.'));
      };
      
      reader.readAsText(file);
    });
  },
  
  /**
   * Validate imported data structure
   * @param {Object} data - Parsed JSON data
   * @returns {Object} Validated data
   * @throws {Error} If invalid
   */
  validateImport(data) {
    // Check version compatibility
    if (!data.version || !data.identity) {
      throw new Error('Invalid file: missing required fields');
    }
    
    // Version check (allow 1.x)
    const majorVersion = parseInt(data.version.split('.')[0]);
    if (majorVersion > 1) {
      throw new Error(`Unsupported file version: ${data.version}. Please update your Sovereign Dashboard.`);
    }
    
    // Required identity fields
    const identity = data.identity;
    if (!identity.publicKey || !identity.encryptedPrivateKey) {
      throw new Error('Invalid file: missing identity keys');
    }
    
    // Validate public key format (hex, 66 chars for compressed secp256k1)
    if (!/^[0-9a-fA-F]{66}$/.test(identity.publicKey)) {
      throw new Error('Invalid public key format in file');
    }
    
    return data;
  },
  
  /**
   * Import and decrypt identity
   * @param {Object} importedData - Data from parseFile()
   * @param {string} passphrase - User's passphrase
   * @returns {Promise<Object>} Decrypted identity ready for use
   */
  async importAndDecrypt(importedData, passphrase) {
    const { identity } = importedData;
    
    // Decrypt private key using CryptoEncrypt
    if (typeof CryptoEncrypt === 'undefined') {
      throw new Error('CryptoEncrypt module not loaded');
    }
    
    try {
      const privateKey = await CryptoEncrypt.decrypt(
        identity.encryptedPrivateKey,
        passphrase
      );
      
      return {
        publicKey: identity.publicKey,
        privateKey,
        displayName: identity.displayName,
        createdAt: identity.createdAt,
        keyType: identity.keyType || 'secp256k1',
        encryptedPrivateKey: identity.encryptedPrivateKey, // Keep for re-storage
      };
    } catch (error) {
      if (error.message.includes('Incorrect passphrase')) {
        throw error;
      }
      throw new Error('Failed to decrypt identity. The file may be corrupted.');
    }
  },
  
  /**
   * Compute key fingerprint (for display/verification)
   * @param {string} publicKey - Public key hex
   * @returns {string} Short fingerprint (first 16 chars)
   */
  computeFingerprint(publicKey) {
    return publicKey.slice(0, 16);
  },
  
  /**
   * Get file metadata without full parsing
   * @param {File} file - The file to inspect
   * @returns {Promise<Object>} Basic metadata
   */
  async getMetadata(file) {
    // Check extension
    if (!file.name.endsWith(this.FILE_EXTENSION)) {
      return { valid: false, error: 'File must have .sovereign extension' };
    }
    
    // Check size (should be small, < 10KB)
    if (file.size > 10240) {
      return { valid: false, error: 'File too large' };
    }
    
    // Parse to get metadata
    try {
      const data = await this.parseFile(file);
      return {
        valid: true,
        version: data.version,
        displayName: data.identity.displayName,
        createdAt: data.identity.createdAt,
        exportedAt: data.createdAt,
        fingerprint: data.security?.keyFingerprint,
        publicKey: data.identity.publicKey.slice(0, 16) + '...',
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  },
  
  /**
   * Create file input handler for import UI
   * @param {Function} onSelect - Callback when file selected
   * @returns {HTMLInputElement} File input element
   */
  createFileInput(onSelect) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = this.FILE_EXTENSION;
    input.style.display = 'none';
    
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        onSelect(file);
      }
    });
    
    return input;
  },
};

// Make globally available
if (typeof window !== 'undefined') {
  window.CryptoExport = CryptoExport;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CryptoExport;
}
