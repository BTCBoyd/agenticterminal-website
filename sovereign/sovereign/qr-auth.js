/**
 * Sovereign Dashboard - QR Code Authentication
 * Phase 2: Scan to login from mobile wallets
 */

const QRAuth = {
  authSession: null,
  pollInterval: null,
  
  /**
   * Generate QR code for authentication
   */
  async generateAuthQR(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Generate session ID
    const sessionId = this.generateSessionId();
    this.authSession = {
      id: sessionId,
      createdAt: Date.now(),
      status: 'pending',
    };
    
    // Create auth URL
    const authUrl = this.createAuthURL(sessionId);
    
    // Generate QR code
    const qrDataUrl = await this.createQRCode(authUrl, 256);
    
    // Render
    container.innerHTML = `
      <div class="qr-auth-container">
        <img src="${qrDataUrl}" alt="Scan to login" class="qr-code-image">
        <div class="qr-auth-status">Waiting for scan...</div>
        <div class="qr-auth-hint">Scan with your Lightning wallet</div>
      </div>
    `;
    
    // Start polling for auth status
    this.startPolling(sessionId);
    
    return sessionId;
  },
  
  /**
   * Create authentication URL
   */
  createAuthURL(sessionId) {
    const params = new URLSearchParams({
      session: sessionId,
      callback: `${CONFIG.FULL_URL}/qr-callback`,
      app: 'Sovereign Dashboard',
    });
    
    // Use lnurl-auth scheme or https fallback
    if (this.isMobile()) {
      return `lightning:login?${params.toString()}`;
    }
    
    return `${CONFIG.FULL_URL}/qr-login?${params.toString()}`;
  },
  
  /**
   * Generate QR code as data URL
   */
  async createQRCode(text, size = 256) {
    // Use a QR code generation library or API
    // For now, use a reliable external API
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=1DB584&bgcolor=07070C`;
  },
  
  /**
   * Start polling for authentication status
   */
  startPolling(sessionId) {
    this.stopPolling();
    
    this.pollInterval = setInterval(async () => {
      try {
        const status = await this.checkAuthStatus(sessionId);
        
        if (status.status === 'authenticated') {
          this.stopPolling();
          await this.completeLogin(status);
        } else if (status.status === 'expired') {
          this.stopPolling();
          this.showExpired();
        } else {
          this.updateStatus(status.status);
        }
      } catch (error) {
        console.error('Auth polling error:', error);
      }
    }, 3000);
    
    // Auto-stop after 5 minutes
    setTimeout(() => this.stopPolling(), 300000);
  },
  
  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  },
  
  /**
   * Check authentication status on server
   */
  async checkAuthStatus(sessionId) {
    // In production, this would check the actual server
    // For now, simulate with localStorage (demo mode)
    const pending = localStorage.getItem(`qr_auth_${sessionId}`);
    if (pending) {
      return JSON.parse(pending);
    }
    return { status: 'pending' };
  },
  
  /**
   * Complete login after QR auth
   */
  async completeLogin(status) {
    const session = {
      displayName: status.displayName || 'Mobile User',
      publicKey: status.publicKey,
      agentId: CONFIG.AGENT_ID,
      loggedInAt: Date.now(),
      expiresAt: Date.now() + CONFIG.SESSION_TIMEOUT,
      authMethod: 'qr_code',
    };
    
    localStorage.setItem(Auth.SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(Auth.USER_KEY, JSON.stringify({
      displayName: session.displayName,
      publicKey: session.publicKey,
    }));
    
    // Redirect to dashboard
    window.location.href = '/sovereign/';
  },
  
  /**
   * Show expired message
   */
  showExpired() {
    const containers = document.querySelectorAll('.qr-auth-status');
    containers.forEach(el => {
      el.textContent = 'QR code expired. Please refresh.';
      el.style.color = 'var(--red)';
    });
  },
  
  /**
   * Update status display
   */
  updateStatus(status) {
    const statusMap = {
      pending: 'Waiting for scan...',
      scanned: 'QR scanned, confirming...',
      confirming: 'Confirming login...',
    };
    
    const containers = document.querySelectorAll('.qr-auth-status');
    containers.forEach(el => {
      el.textContent = statusMap[status] || status;
    });
  },
  
  /**
   * Generate unique session ID
   */
  generateSessionId() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return 'qr_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },
  
  /**
   * Check if mobile device
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  /**
   * Handle QR callback (called from mobile wallet)
   */
  async handleCallback(params) {
    const { session, pubkey, signature } = params;
    
    // Store auth data for polling
    localStorage.setItem(`qr_auth_${session}`, JSON.stringify({
      status: 'authenticated',
      publicKey: pubkey,
      displayName: params.name || 'Mobile User',
    }));
    
    return { success: true };
  },
};

// QR Login page handler
if (window.location.pathname.includes('qr-login')) {
  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');
    
    if (session) {
      // Show mobile login page
      document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#07070C;color:#EEEEF5;font-family:sans-serif;padding:24px;text-align:center;">
          <h1>Complete Login</h1>
          <p>Session: ${session.substring(0, 16)}...</p>
          <button onclick="QRAuth.handleCallback({session:'${session}',pubkey:'demo_key',name:'Mobile User'});alert('Login approved!');window.close();" 
                  style="padding:16px 32px;background:#1DB584;color:#07070C;border:none;border-radius:4px;font-size:16px;cursor:pointer;margin-top:24px;">
            Approve Login
          </button>
        </div>
      `;
    }
  });
}
