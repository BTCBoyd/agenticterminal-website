/**
 * S4 + S5: Agent Management Dashboard + TRON Receipt View
 * Enhanced dashboard with full agent management interface
 */

const AgentManagement = {
  // Demo data for graceful fallback
  demoData: {
    agent: {
      did: 'did:op:sov:agent-alpha-7f3a9b',
      alias: 'Alpha Agent',
      vacStatus: 'active',
      registeredAt: '2026-03-15T10:30:00Z'
    },
    trustScore: {
      overall: 847,
      trend: 'up',
      trendValue: 23,
      breakdown: {
        volume: { score: 210, max: 250, label: 'Transaction Volume' },
        diversity: { score: 185, max: 200, label: 'Counterparty Diversity' },
        recency: { score: 160, max: 200, label: 'Activity Recency' },
        a2a: { score: 142, max: 200, label: 'Agent-to-Agent Ratio' },
        orgVerified: { score: 150, max: 150, label: 'Org Verified' }
      }
    },
    receipts: [
      {
        id: 'urn:uuid:receipt-001',
        issuerDid: 'did:op:ent:acme-payroll',
        rail: 'tron:trc20',
        asset: 'USDT',
        amount: '5000.00',
        tronTxHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        timestamp: '2026-04-12T14:30:00Z',
        scoreContribution: 15,
        verified: true,
        network: 'shasta'
      },
      {
        id: 'urn:uuid:receipt-002',
        issuerDid: 'did:op:ent:global-logistics',
        rail: 'lightning',
        asset: 'BTC',
        amount: '250000',
        paymentHash: 'abc123def4567890abcdef1234567890abcdef1234567890abcdef12345678',
        timestamp: '2026-04-11T09:15:00Z',
        scoreContribution: 12,
        verified: true
      },
      {
        id: 'urn:uuid:receipt-003',
        issuerDid: 'did:op:sov:beta-agent-9c2d4e',
        rail: 'tron',
        asset: 'TRX',
        amount: '10000',
        tronTxHash: 'f1e2d3c4b5a697887766554433221100abcdefabcdef1234567890abcdef12',
        timestamp: '2026-04-10T16:45:00Z',
        scoreContribution: 8,
        verified: true,
        network: 'shasta'
      }
    ],
    transactions: [
      { id: 'tx-001', rail: 'tron:trc20', counterparty: 'did:op:ent:acme-payroll', amount: '5000.00 USDT', timestamp: '2026-04-12T14:30:00Z', txHash: 'a1b2c3d4...', status: 'confirmed' },
      { id: 'tx-002', rail: 'lightning', counterparty: 'did:op:ent:global-logistics', amount: '250000 sats', timestamp: '2026-04-11T09:15:00Z', txHash: 'abc123de...', status: 'settled' },
      { id: 'tx-003', rail: 'tron', counterparty: 'did:op:sov:beta-agent-9c2d4e', amount: '10000 TRX', timestamp: '2026-04-10T16:45:00Z', txHash: 'f1e2d3c4...', status: 'confirmed' },
      { id: 'tx-004', rail: 'x402', counterparty: 'did:op:ent:saas-platform', amount: '$125.00', timestamp: '2026-04-09T11:20:00Z', txHash: '0x789abc...', status: 'verified' }
    ],
    delegations: [
      {
        id: 'del-001',
        delegateDid: 'did:op:ent:acme-corp',
        rails: ['tron', 'tron:trc20', 'lightning'],
        maxPerTxn: '10000',
        maxDaily: '50000',
        expiresAt: '2026-06-30T23:59:59Z',
        constraints: { approvedCounterparties: ['did:op:ent:verified-vendors'] },
        status: 'active'
      },
      {
        id: 'del-002',
        delegateDid: 'did:op:sov:beta-agent-9c2d4e',
        rails: ['lightning'],
        maxPerTxn: '100000',
        maxDaily: '500000',
        expiresAt: '2026-05-15T23:59:59Z',
        constraints: {},
        status: 'active'
      }
    ]
  },

  // State
  agent: null,
  trustScore: null,
  receipts: [],
  transactions: [],
  delegations: [],
  useDemoData: false,
  wsConnected: false,

  /**
   * Initialize the agent management dashboard
   */
  async init() {
    console.log('[AgentManagement] Initializing...');
    
    // Try to load from API first
    try {
      await this.loadAgentData();
    } catch (error) {
      console.warn('[AgentManagement] API unavailable, using demo data:', error.message);
      this.useDemoData = true;
      this.loadDemoData();
    }

    // Render all sections
    this.renderIdentityCard();
    this.renderTrustScore();
    this.renderReceiptVCs();
    this.renderTransactionHistory();
    this.renderDelegations();
    this.renderRemediationAlert();

    // Initialize WebSocket for real-time updates (replaces polling)
    this.initWebSocket();

    console.log('[AgentManagement] Initialized successfully');
  },

  /**
   * Initialize WebSocket for real-time trust score updates (E5)
   * Replaces the 30-second polling with WebSocket connection
   */
  initWebSocket() {
    if (this.useDemoData) {
      console.log('[AgentManagement] Demo mode - WebSocket disabled');
      return;
    }

    const agentId = this.agent?.did;
    if (!agentId) {
      console.warn('[AgentManagement] No agent ID available for WebSocket');
      return;
    }

    // Check if TrustScoreWebSocket is available
    if (typeof TrustScoreWebSocket === 'undefined') {
      console.warn('[AgentManagement] TrustScoreWebSocket not available, falling back to static display');
      return;
    }

    // Connect to WebSocket
    TrustScoreWebSocket.connect(agentId);
    
    // Register for trust score updates
    TrustScoreWebSocket.onScoreUpdate((update) => {
      console.log('[AgentManagement] Trust score update received:', update);
      
      // Update local state
      this.trustScore = {
        overall: update.new_score,
        trend: update.score_change > 0 ? 'up' : update.score_change < 0 ? 'down' : 'flat',
        trendValue: Math.abs(update.score_change),
        breakdown: this.mapBreakdown(update.breakdown)
      };
      
      // Re-render trust score with animation
      this.renderTrustScore();
      
      // Refresh receipts if new one attached
      if (update.receipt_count) {
        this.refreshReceipts();
      }
    });

    // Register for receipt notifications
    TrustScoreWebSocket.onReceiptAttached((payload) => {
      console.log('[AgentManagement] New receipt attached:', payload);
      this.refreshReceipts();
    });

    this.wsConnected = true;
    console.log('[AgentManagement] WebSocket initialized for real-time updates');
  },

  /**
   * Map API breakdown format to local format
   */
  mapBreakdown(apiBreakdown) {
    if (!apiBreakdown) return this.demoData.trustScore.breakdown;
    
    return {
      volume: { 
        score: apiBreakdown.volume?.score || 0, 
        max: apiBreakdown.volume?.max || 250, 
        label: 'Transaction Volume' 
      },
      diversity: { 
        score: apiBreakdown.diversity?.score || 0, 
        max: apiBreakdown.diversity?.max || 200, 
        label: 'Counterparty Diversity' 
      },
      recency: { 
        score: apiBreakdown.recency?.score || 0, 
        max: apiBreakdown.recency?.max || 200, 
        label: 'Activity Recency' 
      },
      a2a: { 
        score: apiBreakdown.a2a?.score || 0, 
        max: apiBreakdown.a2a?.max || 200, 
        label: 'Agent-to-Agent Ratio' 
      },
      orgVerified: { 
        score: apiBreakdown.orgVerified?.score || 0, 
        max: apiBreakdown.orgVerified?.max || 150, 
        label: 'Org Verified' 
      }
    };
  },

  /**
   * Refresh receipts from API
   */
  async refreshReceipts() {
    if (this.useDemoData) return;
    
    try {
      const receiptsData = await APIClient.get('/receipts');
      this.receipts = receiptsData.receipts || [];
      this.renderReceiptVCs();
    } catch (error) {
      console.warn('[AgentManagement] Failed to refresh receipts:', error.message);
    }
  },

  /**
   * Load agent data from API
   */
  async loadAgentData() {
    const session = this.getSession();
    if (!session) throw new Error('No session');

    // Load agent info
    const agentData = await APIClient.get('/agents/me');
    this.agent = agentData;

    // Load trust score
    const trustData = await APIClient.get('/trust/score');
    this.trustScore = trustData;

    // Load receipts
    const receiptsData = await APIClient.get('/receipts');
    this.receipts = receiptsData.receipts || [];

    // Load transactions
    const txData = await APIClient.get('/transactions');
    this.transactions = txData.transactions || [];

    // Load delegations
    const delData = await APIClient.get('/delegations');
    this.delegations = delData.delegations || [];
  },

  /**
   * Load demo data for graceful fallback
   */
  loadDemoData() {
    this.agent = this.demoData.agent;
    this.trustScore = this.demoData.trustScore;
    this.receipts = this.demoData.receipts;
    this.transactions = this.demoData.transactions;
    this.delegations = this.demoData.delegations;
  },

  /**
   * Get session from storage
   */
  getSession() {
    try {
      return JSON.parse(localStorage.getItem('sovereign_session'));
    } catch {
      return null;
    }
  },

  /**
   * Render Agent Identity Card (S4)
   */
  renderIdentityCard() {
    const container = document.getElementById('agent-identity-card');
    if (!container) return;

    const did = this.agent?.did || '—';
    const shortDid = this.shortenDid(did);
    const alias = this.agent?.alias || 'Unnamed Agent';
    const vacStatus = this.agent?.vacStatus || 'pending';
    const statusColor = vacStatus === 'active' ? 'var(--teal)' : 'var(--amber)';
    const statusIcon = vacStatus === 'active' ? '✓' : '⚠';

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
        <div style="flex:1;min-width:280px;">
          <div style="font-size:20px;font-weight:600;margin-bottom:8px;">${alias}</div>
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <div style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);background:var(--bg-elevated);padding:6px 12px;border-radius:4px;display:flex;align-items:center;gap:8px;">
              <span>${shortDid}</span>
              <button onclick="AgentManagement.copyToClipboard('${did}')" style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);padding:2px;" title="Copy full DID">
                📋
              </button>
            </div>
            <div style="display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:4px;background:${statusColor}20;color:${statusColor};font-family:var(--mono);font-size:10px;">
              <span>${statusIcon}</span>
              <span>VAC ${vacStatus.toUpperCase()}</span>
            </div>
          </div>
          <div style="font-family:var(--mono);font-size:10px;color:var(--text-tertiary);margin-top:8px;">
            Registered: ${this.formatDate(this.agent?.registeredAt)}
          </div>
        </div>
        <div style="display:flex;gap:12px;">
          <button class="btn btn-secondary" style="padding:8px 16px;font-size:11px;" onclick="AgentManagement.exportIdentity()">
            ↓ Export DID Doc
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Render Trust Score (S4 + E5)
   * Includes 58→83 animation pattern for real-time updates
   */
  renderTrustScore() {
    const container = document.getElementById('trust-score-section');
    if (!container) return;

    const score = this.trustScore?.overall || 0;
    const previousScore = this.trustScore?.previousScore;
    const trend = this.trustScore?.trend || 'flat';
    const trendValue = this.trustScore?.trendValue || 0;
    const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
    const trendColor = trend === 'up' ? 'var(--teal)' : trend === 'down' ? 'var(--red)' : 'var(--text-secondary)';
    const breakdown = this.trustScore?.breakdown || {};

    // Calculate band
    let band = 'Unproven';
    let bandColor = 'var(--text-tertiary)';
    if (score >= 800) { band = 'Highly Proven'; bandColor = 'var(--accent)'; }
    else if (score >= 500) { band = 'Established'; bandColor = 'var(--teal)'; }
    else if (score >= 200) { band = 'Active'; bandColor = 'var(--amber)'; }

    // Check if we should animate (score changed and we have previous)
    const shouldAnimate = previousScore !== undefined && 
                          previousScore !== score && 
                          !this.useDemoData;

    container.innerHTML = `
      <div class="at-ars-card trust-score-card" style="border-left-color:${bandColor};" data-trust-score="${score}">
        <div class="at-ars-header">
          <div class="at-ars-brand">
            <div class="at-ars-logo" style="background:${bandColor}20;color:${bandColor};">TS</div>
            <div>
              <div class="at-ars-title">Trust Score</div>
              <div class="at-ars-subtitle">${this.useDemoData ? 'Demo Mode' : this.wsConnected ? '● Live Updates' : 'Live from Observer Protocol'}</div>
            </div>
          </div>
          <div class="at-ars-score-display">
            <div class="at-ars-score-value ${shouldAnimate ? 'score-animate' : ''}" 
                 style="color:${bandColor};"
                 data-previous-score="${previousScore || score}"
                 data-current-score="${score}">${score}</div>
            <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end;margin-top:6px;">
              <span class="trust-trend-indicator" style="font-family:var(--mono);font-size:11px;color:${trendColor};">${trendIcon} ${Math.abs(trendValue)} pts</span>
              <span class="at-ars-score-band" style="background:${bandColor}20;color:${bandColor};">${band}</span>
            </div>
          </div>
        </div>
        
        <div class="at-ars-score-bar-container">
          <div class="at-ars-score-bar" style="width:${Math.min(score / 10, 100)}%;background:${bandColor};transition:width 1s ease;"></div>
        </div>
        
        <div class="at-ars-metrics-grid">
          ${Object.entries(breakdown).map(([key, metric]) => `
            <div class="at-ars-metric" data-metric="${key}">
              <div class="at-ars-metric-label">${metric.label}</div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="at-ars-metric-value">${metric.score}</span>
                <span style="font-family:var(--mono);font-size:10px;color:var(--text-tertiary);">/ ${metric.max}</span>
              </div>
              <div class="at-ars-mini-bar">
                <div class="at-ars-mini-bar-fill" style="width:${(metric.score / metric.max) * 100}%;transition:width 0.8s ease;"></div>
              </div>
            </div>
          `).join('')}
        </div>
        
        ${this.useDemoData ? `
          <div style="margin-top:16px;padding:12px;background:var(--amber-dim);border-radius:6px;border-left:3px solid var(--amber);">
            <div style="font-family:var(--mono);font-size:11px;color:var(--amber);">
              ⚠ Demo Mode: Backend not connected. Showing sample data.
            </div>
          </div>
        ` : this.wsConnected ? `
          <div style="margin-top:16px;padding:12px;background:var(--green-dim);border-radius:6px;border-left:3px solid var(--teal);display:flex;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;background:var(--teal);border-radius:50%;animation:pulse 2s infinite;"></div>
            <div style="font-family:var(--mono);font-size:11px;color:var(--teal);">
              Real-time updates active via WebSocket
            </div>
          </div>
          <style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}</style>
        ` : ''}
      </div>
    `;

    // Trigger animation if score changed
    if (shouldAnimate) {
      this.animateScoreValue(container, previousScore, score, bandColor);
    }
  },

  /**
   * Animate score value from previous to current (58→83 pattern)
   */
  animateScoreValue(container, start, end, finalColor) {
    const scoreEl = container.querySelector('.at-ars-score-value');
    if (!scoreEl) return;

    const duration = 1000; // 1 second animation
    const startTime = performance.now();
    const difference = end - start;

    // Add animating class
    scoreEl.classList.add('score-animating');
    if (difference > 0) {
      scoreEl.classList.add('score-increasing');
    }

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quad for smooth deceleration
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      
      const current = Math.round(start + (difference * easeProgress));
      scoreEl.textContent = current;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        scoreEl.textContent = end;
        scoreEl.style.color = finalColor;
        scoreEl.classList.remove('score-animating', 'score-increasing');
        
        // Add pulse effect on completion
        scoreEl.classList.add('score-pulse');
        setTimeout(() => scoreEl.classList.remove('score-pulse'), 500);
      }
    };

    requestAnimationFrame(animate);
  },

  /**
   * Render Receipt VCs Section (S4 + S5)
   */
  renderReceiptVCs() {
    const container = document.getElementById('receipt-vcs-section');
    if (!container) return;

    const tronReceipts = this.receipts.filter(r => r.rail === 'tron' || r.rail === 'tron:trc20');
    const hasReceipts = tronReceipts.length > 0;

    container.innerHTML = `
      <div style="background:var(--bg-surface);border:1px solid var(--bg-border);border-radius:8px;overflow:hidden;">
        <div style="padding:16px 20px;border-bottom:1px solid var(--bg-border);display:flex;align-items:center;justify-content:space-between;cursor:pointer;" onclick="AgentManagement.toggleReceipts()">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:18px;">📜</span>
            <div>
              <div style="font-size:14px;font-weight:600;">Receipt VCs</div>
              <div style="font-family:var(--mono);font-size:10px;color:var(--text-tertiary);">${tronReceipts.length} TRON receipts</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);">
              Total contribution: +${tronReceipts.reduce((sum, r) => sum + (r.scoreContribution || 0), 0)} pts
            </span>
            <span id="receipt-toggle-icon" style="transition:transform 0.3s;">▼</span>
          </div>
        </div>
        
        <div id="receipts-content" style="max-height:500px;overflow-y:auto;">
          ${!hasReceipts ? `
            <div style="padding:40px;text-align:center;color:var(--text-secondary);">
              <div style="font-size:32px;margin-bottom:12px;">📭</div>
              <div style="font-size:14px;margin-bottom:8px;">No TRON receipts yet</div>
              <div style="font-family:var(--mono);font-size:11px;color:var(--text-tertiary);">
                Execute a transaction to see receipts attach here.
              </div>
            </div>
          ` : `
            <div style="padding:16px;">
              ${tronReceipts.map(receipt => this.renderReceiptCard(receipt)).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  },

  /**
   * Render individual receipt card (S5)
   */
  renderReceiptCard(receipt) {
    const isTron = receipt.rail === 'tron' || receipt.rail === 'tron:trc20';
    const explorerUrl = isTron 
      ? `https://shasta.tronscan.io/#/transaction/${receipt.tronTxHash}`
      : '#';
    const shortHash = receipt.tronTxHash ? `${receipt.tronTxHash.slice(0, 12)}...${receipt.tronTxHash.slice(-8)}` : '—';
    const shortIssuer = this.shortenDid(receipt.issuerDid);

    return `
      <div style="background:var(--bg-elevated);border:1px solid var(--bg-border);border-radius:8px;padding:16px;margin-bottom:12px;transition:all 0.2s;" 
           onmouseover="this.style.borderColor='var(--accent)'" 
           onmouseout="this.style.borderColor='var(--bg-border)'">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">
          <div>
            <div style="font-family:var(--mono);font-size:10px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:4px;">Issuer</div>
            <div style="font-family:var(--mono);font-size:12px;color:var(--text-secondary);cursor:pointer;" 
                 onclick="AgentManagement.showFullDid('${receipt.issuerDid}')"
                 title="Click to view full DID">
              ${shortIssuer}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:4px;background:var(--teal-dim);color:var(--teal);font-family:var(--mono);font-size:10px;">
            <span>✓</span>
            <span>Verified</span>
          </div>
        </div>
        
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:16px;margin-bottom:12px;">
          <div>
            <div style="font-family:var(--mono);font-size:10px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:4px;">Amount</div>
            <div style="font-family:var(--mono);font-size:16px;color:var(--text-primary);">${receipt.amount} ${receipt.asset}</div>
          </div>
          <div>
            <div style="font-family:var(--mono);font-size:10px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:4px;">Timestamp</div>
            <div style="font-family:var(--mono);font-size:12px;color:var(--text-secondary);">${this.formatDateTime(receipt.timestamp)}</div>
          </div>
          <div>
            <div style="font-family:var(--mono);font-size:10px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:4px;">Score Impact</div>
            <div style="font-family:var(--mono);font-size:12px;color:var(--teal);">+${receipt.scoreContribution} pts</div>
          </div>
        </div>
        
        ${isTron ? `
          <div style="padding:10px;background:var(--bg-surface);border-radius:6px;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="font-family:var(--mono);font-size:9px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:2px;">TRON Tx Hash</div>
              <div style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);">${shortHash}</div>
            </div>
            <a href="${explorerUrl}" target="_blank" rel="noopener" 
               style="font-family:var(--mono);font-size:10px;color:var(--accent);text-decoration:none;padding:6px 12px;border:1px solid var(--accent);border-radius:4px;background:var(--accent-dim);"
               onmouseover="this.style.background='var(--accent)';this.style.color='var(--bg-base)'"
               onmouseout="this.style.background='var(--accent-dim)';this.style.color='var(--accent)'">
              View on TronScan ↗
            </a>
          </div>
        ` : ''}
      </div>
    `;
  },

  /**
   * Render Transaction History (S4)
   */
  renderTransactionHistory() {
    const container = document.getElementById('transaction-history-section');
    if (!container) return;

    const hasTransactions = this.transactions.length > 0;

    container.innerHTML = `
      <div style="background:var(--bg-surface);border:1px solid var(--bg-border);border-radius:8px;overflow:hidden;">
        <div style="padding:16px 20px;border-bottom:1px solid var(--bg-border);display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:18px;">💸</span>
            <div>
              <div style="font-size:14px;font-weight:600;">Transaction History</div>
              <div style="font-family:var(--mono);font-size:10px;color:var(--text-tertiary);">${this.transactions.length} transactions</div>
            </div>
          </div>
          <div class="tx-export-controls">
            <select id="tx-filter-rail" onchange="AgentManagement.filterTransactions()" style="font-family:var(--mono);font-size:11px;background:var(--bg-elevated);color:var(--text-secondary);border:1px solid var(--bg-border);padding:6px 12px;border-radius:2px;">
              <option value="all">All Rails</option>
              <option value="tron">🔴 TRON</option>
              <option value="tron:trc20">💎 TRC-20</option>
              <option value="lightning">⚡ Lightning</option>
              <option value="solana">🟣 Solana</option>
              <option value="x402">🌐 x402</option>
            </select>
            <button class="btn btn-secondary" style="padding:6px 12px;font-size:11px;" onclick="AgentManagement.exportTransactionCSV()">
              ↓ Export CSV
            </button>
          </div>
        </div>
        
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:var(--bg-elevated);">
                <th style="padding:12px 16px;text-align:left;font-family:var(--mono);font-size:10px;color:var(--text-tertiary);text-transform:uppercase;">Rail</th>
                <th style="padding:12px 16px;text-align:left;font-family:var(--mono);font-size:10px;color:var(--text-tertiary);text-transform:uppercase;">Counterparty</th>
                <th style="padding:12px 16px;text-align:right;font-family:var(--mono);font-size:10px;color:var(--text-tertiary);text-transform:uppercase;">Amount</th>
                <th style="padding:12px 16px;text-align:left;font-family:var(--mono);font-size:10px;color:var(--text-tertiary);text-transform:uppercase;">Timestamp</th>
                <th style="padding:12px 16px;text-align:left;font-family:var(--mono);font-size:10px;color:var(--text-tertiary);text-transform:uppercase;">Tx Hash</th>
                <th style="padding:12px 16px;text-align:center;font-family:var(--mono);font-size:10px;color:var(--text-tertiary);text-transform:uppercase;">Status</th>
              </tr>
            </thead>
            <tbody id="transaction-table-body">
              ${!hasTransactions ? `
                <tr>
                  <td colspan="6" style="padding:40px;text-align:center;color:var(--text-secondary);">
                    No transactions yet
                  </td>
                </tr>
              ` : this.transactions.map(tx => `
                <tr style="border-bottom:1px solid var(--bg-border);transition:background 0.1s;" onmouseover="this.style.background='var(--bg-elevated)'" onmouseout="this.style.background='transparent'">
                  <td style="padding:12px 16px;">
                    <span class="rail-badge ${tx.rail?.replace(':', '')}">${this.formatRail(tx.rail)}</span>
                  </td>
                  <td style="padding:12px 16px;font-family:var(--mono);font-size:11px;color:var(--text-secondary);">${this.shortenDid(tx.counterparty)}</td>
                  <td style="padding:12px 16px;text-align:right;font-family:var(--mono);font-size:12px;">${tx.amount}</td>
                  <td style="padding:12px 16px;font-family:var(--mono);font-size:11px;color:var(--text-secondary);">${this.formatDateTime(tx.timestamp)}</td>
                  <td style="padding:12px 16px;font-family:var(--mono);font-size:11px;">
                    <a href="${this.getExplorerUrl(tx)}" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none;">
                      ${this.shortenHash(tx.txHash)}
                    </a>
                  </td>
                  <td style="padding:12px 16px;text-align:center;">
                    <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:4px;font-family:var(--mono);font-size:10px;background:var(--teal-dim);color:var(--teal);">
                      <span>●</span> ${tx.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /**
   * Render Delegations Section (S4)
   */
  renderDelegations() {
    const container = document.getElementById('delegations-section');
    if (!container) return;

    const activeDelegations = this.delegations.filter(d => d.status === 'active');
    const hasDelegations = activeDelegations.length > 0;

    container.innerHTML = `
      <div style="background:var(--bg-surface);border:1px solid var(--bg-border);border-radius:8px;overflow:hidden;">
        <div style="padding:16px 20px;border-bottom:1px solid var(--bg-border);display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:18px;">🔐</span>
            <div>
              <div style="font-size:14px;font-weight:600;">Delegation Credentials</div>
              <div style="font-family:var(--mono);font-size:10px;color:var(--text-tertiary);">${activeDelegations.length} active</div>
            </div>
          </div>
          <button class="btn btn-primary" style="padding:8px 16px;font-size:11px;" onclick="AgentManagement.issueDelegation()">
            + Issue Delegation
          </button>
        </div>
        
        <div style="padding:16px;">
          ${!hasDelegations ? `
            <div style="padding:40px;text-align:center;color:var(--text-secondary);">
              <div style="font-size:32px;margin-bottom:12px;">🔓</div>
              <div style="font-size:14px;margin-bottom:8px;">No active delegations</div>
              <div style="font-family:var(--mono);font-size:11px;color:var(--text-tertiary);">
                Issue a delegation to allow another agent to transact on your behalf.
              </div>
            </div>
          ` : activeDelegations.map(del => `
            <div style="background:var(--bg-elevated);border:1px solid var(--bg-border);border-radius:8px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <div>
                  <div style="font-family:var(--mono);font-size:11px;color:var(--text-tertiary);margin-bottom:4px;">Delegate</div>
                  <div style="font-family:var(--mono);font-size:13px;color:var(--text-primary);">${this.shortenDid(del.delegateDid)}</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:4px;background:var(--teal-dim);color:var(--teal);font-family:var(--mono);font-size:10px;">
                  <span>●</span> Active
                </div>
              </div>
              
              <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
                ${del.rails.map(rail => `<span class="rail-badge ${rail.replace(':', '')}">${this.formatRail(rail)}</span>`).join('')}
              </div>
              
              <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;padding:12px;background:var(--bg-surface);border-radius:6px;margin-bottom:12px;">
                <div>
                  <div style="font-family:var(--mono);font-size:9px;color:var(--text-tertiary);text-transform:uppercase;">Max/Txn</div>
                  <div style="font-family:var(--mono);font-size:12px;color:var(--text-secondary);">${del.maxPerTxn}</div>
                </div>
                <div>
                  <div style="font-family:var(--mono);font-size:9px;color:var(--text-tertiary);text-transform:uppercase;">Max/Day</div>
                  <div style="font-family:var(--mono);font-size:12px;color:var(--text-secondary);">${del.maxDaily}</div>
                </div>
                <div>
                  <div style="font-family:var(--mono);font-size:9px;color:var(--text-tertiary);text-transform:uppercase;">Expires</div>
                  <div style="font-family:var(--mono);font-size:12px;color:var(--text-secondary);">${this.formatDate(del.expiresAt)}</div>
                </div>
              </div>
              
              <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button class="btn btn-secondary" style="padding:6px 12px;font-size:10px;" onclick="AgentManagement.editDelegation('${del.id}')">Edit</button>
                <button class="btn btn-danger" style="padding:6px 12px;font-size:10px;" onclick="AgentManagement.revokeDelegation('${del.id}')">Revoke</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render Remediation Alert (S4)
   */
  renderRemediationAlert() {
    const container = document.getElementById('remediation-alert');
    if (!container) return;

    const score = this.trustScore?.overall || 0;
    const threshold = 200; // Minimum threshold

    if (score >= threshold) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    container.innerHTML = `
      <div style="background:var(--amber-dim);border:1px solid rgba(245,166,35,0.2);border-left:3px solid var(--amber);padding:16px 20px;border-radius:4px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
        <div>
          <div style="font-family:var(--mono);font-size:13px;color:var(--amber);font-weight:600;margin-bottom:4px;">⚠️ Trust Score Below Threshold</div>
          <div style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);">
            Current score: ${score} (minimum: ${threshold}). Complete transactions to improve your score.
          </div>
        </div>
        <button class="btn btn-primary" style="padding:8px 16px;font-size:11px;" onclick="AgentManagement.triggerRemediation()">
          Improve Score
        </button>
      </div>
    `;
  },

  /**
   * Cleanup WebSocket connection (call on page unload)
   */
  cleanup() {
    if (typeof TrustScoreWebSocket !== 'undefined') {
      TrustScoreWebSocket.disconnect();
    }
    this.wsConnected = false;
  },

  /**
   * Toggle receipts section
   */
  toggleReceipts() {
    const content = document.getElementById('receipts-content');
    const icon = document.getElementById('receipt-toggle-icon');
    if (!content) return;
    
    if (content.style.display === 'none') {
      content.style.display = 'block';
      icon.style.transform = 'rotate(0deg)';
    } else {
      content.style.display = 'none';
      icon.style.transform = 'rotate(-90deg)';
    }
  },

  /**
   * Filter transactions by rail
   */
  filterTransactions() {
    const filter = document.getElementById('tx-filter-rail')?.value || 'all';
    const tbody = document.getElementById('transaction-table-body');
    if (!tbody) return;

    const filtered = filter === 'all' 
      ? this.transactions 
      : this.transactions.filter(tx => tx.rail === filter);

    tbody.innerHTML = filtered.map(tx => `
      <tr style="border-bottom:1px solid var(--bg-border);transition:background 0.1s;" onmouseover="this.style.background='var(--bg-elevated)'" onmouseout="this.style.background='transparent'">
        <td style="padding:12px 16px;">
          <span class="rail-badge ${tx.rail?.replace(':', '')}">${this.formatRail(tx.rail)}</span>
        </td>
        <td style="padding:12px 16px;font-family:var(--mono);font-size:11px;color:var(--text-secondary);">${this.shortenDid(tx.counterparty)}</td>
        <td style="padding:12px 16px;text-align:right;font-family:var(--mono);font-size:12px;">${tx.amount}</td>
        <td style="padding:12px 16px;font-family:var(--mono);font-size:11px;color:var(--text-secondary);">${this.formatDateTime(tx.timestamp)}</td>
        <td style="padding:12px 16px;font-family:var(--mono);font-size:11px;">
          <a href="${this.getExplorerUrl(tx)}" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none;">
            ${this.shortenHash(tx.txHash)}
          </a>
        </td>
        <td style="padding:12px 16px;text-align:center;">
          <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:4px;font-family:var(--mono);font-size:10px;background:var(--teal-dim);color:var(--teal);">
            <span>●</span> ${tx.status}
          </span>
        </td>
      </tr>
    `).join('');
  },

  /**
   * Export transaction CSV
   */
  exportTransactionCSV() {
    if (!this.transactions.length) {
      this.showNotification('No transactions to export', 'error');
      return;
    }

    const headers = ['ID', 'Rail', 'Counterparty', 'Amount', 'Timestamp', 'Tx Hash', 'Status'];
    const rows = this.transactions.map(tx => [
      tx.id, tx.rail, tx.counterparty, tx.amount, tx.timestamp, tx.txHash, tx.status
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.showNotification('Transactions exported to CSV');
  },

  /**
   * Export identity document
   */
  exportIdentity() {
    const doc = {
      did: this.agent?.did,
      alias: this.agent?.alias,
      vacStatus: this.agent?.vacStatus,
      registeredAt: this.agent?.registeredAt,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `identity-${this.agent?.did?.replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.showNotification('Identity document exported');
  },

  /**
   * Issue new delegation
   */
  issueDelegation() {
    // Navigate to delegation flow
    window.location.href = 'delegations.html?action=issue';
  },

  /**
   * Edit delegation
   */
  editDelegation(id) {
    window.location.href = `delegations.html?action=edit&id=${id}`;
  },

  /**
   * Revoke delegation
   */
  async revokeDelegation(id) {
    if (!confirm('Are you sure you want to revoke this delegation?')) return;

    try {
      await APIClient.post(`/delegations/${id}/revoke`);
      this.showNotification('Delegation revoked');
      await this.loadAgentData();
      this.renderDelegations();
    } catch (error) {
      this.showNotification('Failed to revoke: ' + error.message, 'error');
    }
  },

  /**
   * Trigger remediation
   */
  triggerRemediation() {
    // Show remediation modal or navigate to guide
    window.location.href = '#remediation-guide';
  },

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('Copied to clipboard');
    } catch (error) {
      console.error('Copy failed:', error);
    }
  },

  /**
   * Show full DID in modal
   */
  showFullDid(did) {
    alert(`Full DID:\n\n${did}`);
  },

  /**
   * Show notification
   */
  showNotification(message, type = 'success') {
    if (typeof showNotif === 'function') {
      showNotif(type === 'error' ? 'Error' : 'Success', message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  },

  // Utility functions
  shortenDid(did) {
    if (!did || did.length < 25) return did || '—';
    return `${did.slice(0, 18)}...${did.slice(-8)}`;
  },

  shortenHash(hash) {
    if (!hash || hash.length < 20) return hash || '—';
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  },

  formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  },

  formatDateTime(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  },

  formatRail(rail) {
    const rails = {
      'tron': '🔴 TRON',
      'tron:trc20': '💎 TRC-20',
      'lightning': '⚡ Lightning',
      'solana': '🟣 Solana',
      'x402': '🌐 x402'
    };
    return rails[rail] || rail;
  },

  getExplorerUrl(tx) {
    if (tx.rail?.startsWith('tron')) {
      return `https://shasta.tronscan.io/#/transaction/${tx.txHash}`;
    }
    return '#';
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('agent-identity-card')) {
    AgentManagement.init();
  }
});--