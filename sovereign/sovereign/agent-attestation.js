/**
 * Sovereign Dashboard - Agent Attestation Module
 * Phase 4: Connect human's Sovereign identity to their agent(s)
 */

const AgentAttestation = {
  currentAgent: null,
  pendingCredential: null,
  attestedAgents: [],
  
  AGENT_TYPES: {
    alby_hub: {
      id: 'alby_hub',
      name: 'Alby Hub',
      description: 'Connect via WebLN browser extension',
      icon: '⚡',
      color: '#F7931A',
      detectionMethod: 'webln',
      inputPlaceholder: 'Auto-detected from browser',
    },
    lnd_node: {
      id: 'lnd_node',
      name: 'LND Node',
      description: 'Paste your LND node pubkey',
      icon: '🔷',
      color: '#3399FF',
      detectionMethod: 'manual',
      inputPlaceholder: 'Node public key (66 hex chars)',
      validate: (key) => /^[0-9a-fA-F]{66}$/.test(key),
    },
    x402: {
      id: 'x402',
      name: 'x402 / L402 Agent',
      description: 'Paste agent public key or endpoint URL',
      icon: '🔗',
      color: '#6B5CE7',
      detectionMethod: 'manual',
      inputPlaceholder: 'Public key or https://...',
      validate: (key) => key.length >= 32,
    },
    solana: {
      id: 'solana',
      name: 'Solana Agent',
      description: 'Paste Solana wallet address',
      icon: '🟣',
      color: '#9945FF',
      detectionMethod: 'manual',
      inputPlaceholder: 'Solana address (32-44 chars)',
      validate: (key) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(key),
    },
    op_registered: {
      id: 'op_registered',
      name: 'OP-Registered Agent',
      description: 'Paste agent OP pubkey',
      icon: '✓',
      color: '#1DB584',
      detectionMethod: 'manual',
      inputPlaceholder: 'OP public key (66 hex chars)',
      validate: (key) => /^[0-9a-fA-F]{66}$/.test(key),
    },
    other: {
      id: 'other',
      name: 'Other Agent',
      description: 'Paste any public identifier',
      icon: '🔑',
      color: '#7A7A92',
      detectionMethod: 'manual',
      inputPlaceholder: 'Public identifier or key',
      validate: (key) => key.length >= 16,
    },
  },
  
  async init() {
    await this.loadAttestedAgents();
  },
  
  async detectAlbyHub() {
    try {
      if (typeof window === 'undefined' || !window.webln) {
        return { detected: false, reason: 'WebLN not available' };
      }
      if (!window.webln.enabled) {
        await window.webln.enable();
      }
      const info = await window.webln.getInfo();
      if (!info || !info.node) {
        return { detected: false, reason: 'No node info available' };
      }
      return {
        detected: true,
        pubkey: info.node.pubkey,
        info: {
          alias: info.node.alias,
          color: info.node.color,
          network: info.node.network || 'bitcoin',
        },
      };
    } catch (error) {
      console.error('[AgentAttestation] Alby detection failed:', error);
      return { detected: false, reason: error.message };
    }
  },
  
  openModal() {
    const modal = document.createElement('div');
    modal.id = 'agent-attestation-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = this.renderAgentTypeSelection();
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,7,12,0.95);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;';
    document.body.appendChild(modal);
    this.checkAlbyHub();
  },
  
  closeModal() {
    const modal = document.getElementById('agent-attestation-modal');
    if (modal) modal.remove();
    this.currentAgent = null;
    this.pendingCredential = null;
  },
  
  renderAgentTypeSelection() {
    const types = Object.values(this.AGENT_TYPES);
    return `
      <div class="attestation-modal-content" style="background:var(--bg-surface);border:1px solid var(--bg-border);border-radius:8px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;">
        <div style="padding:24px;border-bottom:1px solid var(--bg-border);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h3 style="font-size:18px;font-weight:600;margin-bottom:4px;">Attest Agent</h3>
            <p style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);">Connect your Sovereign identity to an agent</p>
          </div>
          <button onclick="AgentAttestation.closeModal()" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:20px;padding:4px;">×</button>
        </div>
        <div style="padding:24px;">
          <div style="font-family:var(--mono);font-size:10px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:16px;">Step 1: Select Agent Type</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;" id="agent-type-grid">
            ${types.map(type => `
              <button class="agent-type-tile" data-type="${type.id}" onclick="AgentAttestation.selectAgentType('${type.id}')" style="background:var(--bg-elevated);border:1px solid var(--bg-border);border-radius:8px;padding:20px;cursor:pointer;text-align:left;transition:all 0.2s;display:flex;flex-direction:column;gap:8px;" onmouseover="this.style.borderColor='${type.color}'" onmouseout="this.style.borderColor='var(--bg-border)'">
                <div style="font-size:32px;">${type.icon}</div>
                <div style="font-size:14px;font-weight:600;">${type.name}</div>
                <div style="font-family:var(--mono);font-size:10px;color:var(--text-secondary);line-height:1.4;">${type.description}</div>
                ${type.id === 'alby_hub' ? '<div id="alby-status" style="font-family:var(--mono);font-size:9px;color:var(--text-tertiary);margin-top:4px;">Checking...</div>' : ''}
              </button>
            `).join('')}
          </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid var(--bg-border);display:flex;justify-content:space-between;align-items:center;">
          <div style="font-family:var(--mono);font-size:10px;color:var(--text-tertiary);">Your public key: <span style="color:var(--text-secondary);">${Auth.getPublicKey()?.slice(0, 20) || '—'}...</span></div>
          <button class="btn btn-secondary" onclick="AgentAttestation.closeModal()" style="padding:8px 16px;font-size:11px;">Cancel</button>
        </div>
      </div>
    `;
  },
  
  async checkAlbyHub() {
    const statusEl = document.getElementById('alby-status');
    if (!statusEl) return;
    const result = await this.detectAlbyHub();
    if (result.detected) {
      statusEl.innerHTML = `<span style="color:var(--teal);">● Detected: ${result.info.alias}</span>`;
      statusEl.dataset.pubkey = result.pubkey;
      statusEl.dataset.info = JSON.stringify(result.info);
    } else {
      statusEl.innerHTML = `<span style="color:var(--text-tertiary);">Not detected</span>`;
    }
  },
  
  async selectAgentType(typeId) {
    const type = this.AGENT_TYPES[typeId];
    if (!type) return;
    this.currentAgent = { type: typeId };
    if (typeId === 'alby_hub') {
      const result = await this.detectAlbyHub();
      if (result.detected) {
        this.currentAgent.pubkey = result.pubkey;
        this.currentAgent.info = result.info;
        this.showConstraintForm();
        return;
      }
    }
    this.showAgentIdentification(type);
  },
  
  showAgentIdentification(type) {
    const content = document.querySelector('.attestation-modal-content');
    if (!content) return;
    content.innerHTML = `
      <div style="padding:24px;border-bottom:1px solid var(--bg-border);display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h3 style="font-size:18px;font-weight:600;margin-bottom:4px;">Identify ${type.name}</h3>
          <p style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);">Step 2 of 4</p>
        </div>
        <button onclick="AgentAttestation.closeModal()" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:20px;padding:4px;">×</button>
      </div>
      <div style="padding:24px;">
        <div style="background:var(--bg-elevated);border:1px solid var(--bg-border);border-radius:8px;padding:20px;margin-bottom:24px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <div style="font-size:32px;">${type.icon}</div>
            <div>
              <div style="font-size:14px;font-weight:600;">${type.name}</div>
              <div style="font-family:var(--mono);font-size:10px;color:var(--text-secondary);">${type.description}</div>
            </div>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:20px;">
          <label style="display:block;font-family:var(--mono);font-size:11px;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px;">Agent Public Key / Identifier</label>
          <input type="text" id="agent-pubkey-input" placeholder="${type.inputPlaceholder}" style="width:100%;background:var(--bg-elevated);border:1px solid var(--bg-border);padding:12px;color:var(--text-primary);font-family:var(--mono);font-size:13px;border-radius:4px;" oninput="AgentAttestation.validateAgentPubkey(this.value)">
          <div id="pubkey-validation" style="font-family:var(--mono);font-size:10px;margin-top:8px;height:16px;"></div>
        </div>
      </div>
      <div style="padding:16px 24px;border-top:1px solid var(--bg-border);display:flex;justify-content:space-between;align-items:center;">
        <button class="btn btn-secondary" onclick="AgentAttestation.openModal()" style="padding:10px 20px;font-size:12px;">← Back</button>
        <button class="btn btn-primary" id="continue-btn" onclick="AgentAttestation.proceedToConstraints()" style="padding:10px 24px;font-size:12px;" disabled>Continue →</button>
      </div>
    `;
  },
  
  validateAgentPubkey(value) {
    const type = this.AGENT_TYPES[this.currentAgent?.type];
    const validationEl = document.getElementById('pubkey-validation');
    const continueBtn = document.getElementById('continue-btn');
    if (!type || !validationEl) return;
    if (!value) {
      validationEl.textContent = '';
      continueBtn.disabled = true;
      return;
    }
    const isValid = type.validate ? type.validate(value) : value.length >= 16;
    if (isValid) {
      validationEl.innerHTML = '<span style="color:var(--teal);">✓ Valid format</span>';
      continueBtn.disabled = false;
      this.currentAgent.pubkey = value;
    } else {
      validationEl.innerHTML = '<span style="color:var(--red);">✗ Invalid format</span>';
      continueBtn.disabled = true;
    }
  },
  
  proceedToConstraints() {
    this.showConstraintForm();
  },
  
  showConstraintForm() {
    const content = document.querySelector('.attestation-modal-content');
    if (!content) return;
    const type = this.AGENT_TYPES[this.currentAgent.type];
    const defaultExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const minExpiry = new Date().toISOString().split('T')[0];
    content.innerHTML = `
      <div style="padding:24px;border-bottom:1px solid var(--bg-border);display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h3 style="font-size:18px;font-weight:600;margin-bottom:4px;">Set Delegation Constraints</h3>
          <p style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);">Step 3 of 4</p>
        </div>
        <button onclick="AgentAttestation.closeModal()" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:20px;padding:4px;">×</button>
      </div>
      <div style="padding:24px;">
        <div style="background:var(--bg-elevated);border:1px solid var(--bg-border);border-radius:8px;padding:16px;margin-bottom:24px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:24px;">${type.icon}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;">${type.name}</div>
              <div style="font-family:var(--mono);font-size:10px;color:var(--text-secondary);word-break:break-all;">${this.currentAgent.pubkey}</div>
            </div>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:20px;">
          <label style="display:block;font-family:var(--mono);font-size:11px;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px;">Max per Transaction (sats)</label>
          <input type="number" id="constraint-max-txn" value="50000" min="1000" max="10000000" step="1000" style="width:100%;background:var(--bg-elevated);border:1px solid var(--bg-border);padding:12px;color:var(--text-primary);font-family:var(--mono);font-size:14px;border-radius:4px;">
          <div style="font-family:var(--mono);font-size:10px;color:var(--text-tertiary);margin-top:4px;">Minimum: 1,000 sats | Maximum: 10,000,000 sats</div>
        </div>
        <div class="form-group" style="margin-bottom:20px;">
          <label style="display:block;font-family:var(--mono);font-size:11px;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px;">Max per Month (sats)</label>
          <input type="number" id="constraint-max-month" value="500000" min="10000" max="100000000" step="10000" style="width:100%;background:var(--bg-elevated);border:1px solid var(--bg-border);padding:12px;color:var(--text-primary);font-family:var(--mono);font-size:14px;border-radius:4px;">
          <div style="font-family:var(--mono);font-size:10px;color:var(--text-tertiary);margin-top:4px;">Minimum: 10,000 sats | Maximum: 100,000,000 sats</div>
        </div>
        <div class="form-group" style="margin-bottom:20px;">
          <label style="display:block;font-family:var(--mono);font-size:11px;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px;">Allowed Payment Rails</label>
          <div style="display:flex;gap:16px;flex-wrap:wrap;">
            ${['lightning', 'x402', 'l402', 'solana'].map(rail => `
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                <input type="checkbox" name="rail" value="${rail}" ${rail === 'lightning' ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--teal);">
                <span style="font-family:var(--mono);font-size:12px;text-transform:capitalize;">${rail}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <div class="form-group" style="margin-bottom:20px;">
          <label style="display:block;font-family:var(--mono);font-size:11px;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px;">Expiry Date</label>
          <input type="date" id="constraint-expiry" value="${defaultExpiry}" min="${minExpiry}" style="width:100%;background:var(--bg-elevated);border:1px solid var(--bg-border);padding:12px;color:var(--text-primary);font-family:var(--mono);font-size:14px;border-radius:4px;">
        </div>
      </div>
      <div style="padding:16px 24px;border-top:1px solid var(--bg-border);display:flex;justify-content:space-between;align-items:center;">
        <button class="btn btn-secondary" onclick="AgentAttestation.showAgentIdentification(AgentAttestation.AGENT_TYPES['${this.currentAgent.type}'])" style="padding:10px 20px;font-size:12px;">← Back</button>
        <button class="btn btn-primary" onclick="AgentAttestation.signDelegation()" style="padding:10px 24px;font-size:12px;">Sign Delegation →</button>
      </div>
    `;
  },
  
  async signDelegation() {
    try {
      const maxTxn = parseInt(document.getElementById('constraint-max-txn').value);
      const maxMonth = parseInt(document.getElementById('constraint-max-month').value);
      const expiryDate = document.getElementById('constraint-expiry').value;
      const checkboxes = document.querySelectorAll('input[name="rail"]:checked');
      const rails = Array.from(checkboxes).map(cb => cb.value);
      const expiryDays = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      const humanPubkey = Auth.getPublicKey();
      if (!humanPubkey) {
        throw new Error('No human public key available. Please log in.');
      }
      
      this.pendingCredential = DelegationCredential.create({
        agentPubkey: this.currentAgent.pubkey,
        agentType: this.currentAgent.type,
        constraints: {
          max_per_txn_sats: maxTxn,
          max_per_month_sats: maxMonth,
          rails: rails,
        },
        humanPubkey: humanPubkey,
        expiryDays: expiryDays,
      });
      
      await this.showSigningStep();
    } catch (error) {
      console.error('[AgentAttestation] Sign delegation error:', error);
      this.showError(error.message);
    }
  },
  
  async showSigningStep() {
    const content = document.querySelector('.attestation-modal-content');
    if (!content) return;
    const type = this.AGENT_TYPES[this.currentAgent.type];
    content.innerHTML = `
      <div style="padding:24px;border-bottom:1px solid var(--bg-border);display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h3 style="font-size:18px;font-weight:600;margin-bottom:4px;">Sign Delegation</h3>
          <p style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);">Step 4 of 4</p>
        </div>
        <button onclick="AgentAttestation.closeModal()" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:20px;padding:4px;">×</button>
      </div>
      <div style="padding:24px;">
        <div style="background:var(--bg-elevated);border:1px solid var(--bg-border);border-radius:8px;padding:16px;margin-bottom:24px;">
          <div style="font-family:var(--mono);font-size:10px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:12px;">Delegation Summary</div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--bg-border);">
            <span style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);">Agent Type</span>
            <span style="font-family:var(--mono);font-size:11px;">${type.name}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--bg-border);">
            <span style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);">Max per Txn</span>
            <span style="font-family:var(--mono);font-size:11px;">${this.pendingCredential.constraints.max_per_txn_sats.toLocaleString()} sats</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--bg-border);">
            <span style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);">Max per Month</span>
            <span style="font-family:var(--mono);font-size:11px;">${this.pendingCredential.constraints.max_per_month_sats.toLocaleString()} sats</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--bg-border);">
            <span style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);">Rails</span>
            <span style="font-family:var(--mono);font-size:11px;">${this.pendingCredential.constraints.rails.join(', ')}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;">
            <span style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);">Expires</span>
            <span style="font-family:var(--mono);font-size:11px;">${new Date(this.pendingCredential.expires_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div id="signing-status" style="text-align:center;padding:20px;">
          <div style="font-size:48px;margin-bottom:16px;">✍️</div>
          <div style="font-size:14px;font-weight:600;margin-bottom:8px;">Ready to Sign</div>
          <div style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);margin-bottom:24px;">Click below to sign this delegation with your private key</div>
          <button class="btn btn-primary" onclick="AgentAttestation.executeSigning()" style="padding:12px 32px;font-size:14px;">Sign with My Key</button>
        </div>
      </div>
    `;
  },
  
  async executeSigning() {
    const statusEl = document.getElementById('signing-status');
    if (!statusEl) return;
    statusEl.innerHTML = `
      <div style="font-size:48px;margin-bottom:16px;">⏳</div>
      <div style="font-size:14px;font-weight:600;margin-bottom:8px;">Signing...</div>
      <div style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);">Creating cryptographic signature</div>
    `;
    try {
      const privateKey = await Auth.getPrivateKeyForSigning();
      if (!privateKey) {
        throw new Error('Unable to access private key. Make sure you are logged in with a self-custodial identity.');
      }
      this.pendingCredential = await DelegationCredential.signWithHuman(this.pendingCredential, privateKey);
      await this.attemptAgentCosignature();
    } catch (error) {
      console.error('[AgentAttestation] Signing error:', error);
      statusEl.innerHTML = `
        <div style="font-size:48px;margin-bottom:16px;">❌</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:var(--red);">Signing Failed</div>
        <div style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);margin-bottom:16px;">${error.message}</div>
        <button class="btn btn-secondary" onclick="AgentAttestation.showSigningStep()" style="padding:8px 16px;font-size:11px;">Try Again</button>
      `;
    }
  },
  
  async attemptAgentCosignature() {
    const statusEl = document.getElementById('signing-status');
    if (!statusEl) return;
    statusEl.innerHTML = `
      <div style="font-size:48px;margin-bottom:16px;">🤖</div>
      <div style="font-size:14px;font-weight:600;margin-bottom:8px;">Requesting Agent Co-Signature</div>
      <div style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);">Checking if agent is online...</div>
    `;
    try {
      const agentOnline = await this.checkAgentOnline();
      if (agentOnline && agentOnline.canCosign) {
        const agentSig = await this.requestAgentSignature();
        if (agentSig) {
          this.pendingCredential = DelegationCredential.addAgentCosignature(this.pendingCredential, agentSig);
          statusEl.innerHTML = `
            <div style="font-size:48px;margin-bottom:16px;">✅</div>
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:var(--teal);">Bilaterally Verified!</div>
            <div style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);margin-bottom:24px;">Both you and your agent have signed this delegation.</div>
          `;
        } else {
          throw new Error('Agent did not provide signature');
        }
      } else {
        statusEl.innerHTML = `
          <div style="font-size:48px;margin-bottom:16px;">⏸️</div>
          <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:var(--amber);">Human-Attested Only</div>
          <div style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);margin-bottom:24px;">Agent is offline or does not support co-signing. The delegation is valid but pending agent confirmation.</div>
        `;
      }
      await this.finalizeAttestation();
    } catch (error) {
      console.error('[AgentAttestation] Co-signature error:', error);
      await this.finalizeAttestation();
    }
  },
  
  async checkAgentOnline() {
    if (this.currentAgent.type === 'alby_hub' && window.webln) {
      try {
        await window.webln.getInfo();
        return { canCosign: false };
      } catch (e) {
        return { canCosign: false };
      }
    }
    return { canCosign: false };
  },
  
  async requestAgentSignature() {
    return null;
  },
  
  async finalizeAttestation() {
    try {
      await this.storeCredential(this.pendingCredential);
      await this.submitToOP(this.pendingCredential);
      this.attestedAgents.push({
        pubkey: this.currentAgent.pubkey,
        type: this.currentAgent.type,
        credential: this.pendingCredential,
        attestedAt: Date.now(),
      });
      const statusEl = document.getElementById('signing-status');
      if (statusEl) {
        const existingBtn = statusEl.querySelector('button');
        if (existingBtn) existingBtn.remove();
        const doneBtn = document.createElement('button');
        doneBtn.className = 'btn btn-primary';
        doneBtn.textContent = 'Done';
        doneBtn.style.cssText = 'padding:12px 32px;font-size:14px;margin-top:16px;';
        doneBtn.onclick = () => {
          this.closeModal();
          if (typeof DelegationManager !== 'undefined') {
            DelegationManager.render();
          }
        };
        statusEl.appendChild(doneBtn);
      }
      this.showNotification('Agent Attested', `${this.AGENT_TYPES[this.currentAgent.type].name} has been attested successfully`);
    } catch (error) {
      console.error('[AgentAttestation] Finalize error:', error);
      this.showError('Failed to store delegation: ' + error.message);
    }
  },
  
  async storeCredential(credential) {
    const stored = await StorageIDB.getSession('attested_agents') || { agents: [] };
    stored.agents.push({
      credential: credential,
      storedAt: Date.now(),
    });
    await StorageIDB.setSession('attested_agents', stored);
  },
  
  async loadAttestedAgents() {
    const stored = await StorageIDB.getSession('attested_agents');
    if (stored && stored.agents) {
      this.attestedAgents = stored.agents.map(a => ({
        pubkey: a.credential.delegate,
        type: a.credential.agent_type,
        credential: a.credential,
        attestedAt: a.storedAt,
      }));
    }
  },
  
  async submitToOP(credential) {
    try {
      if (typeof API !== 'undefined' && API.submitDelegation) {
        await API.submitDelegation(credential);
      } else {
        const response = await fetch(`${CONFIG.API_BASE}/observer/delegations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Auth.getSession()?.token || 'anonymous'}`,
          },
          body: JSON.stringify(credential),
        });
        if (!response.ok) {
          console.warn('[AgentAttestation] OP submission failed:', response.status);
        }
      }
    } catch (error) {
      console.warn('[AgentAttestation] OP submission error:', error);
    }
  },
  
  getAttestedAgents() {
    return this.attestedAgents;
  },
  
  showError(message) {
    if (typeof showNotif === 'function') {
      showNotif('Error', message, 'error');
    } else {
      alert(message);
    }
  },
  
  showNotification(title, message) {
    if (typeof showNotif === 'function') {
      showNotif(title, message);
    }
  },
};

if (typeof window !== 'undefined') {
  window.AgentAttestation = AgentAttestation;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AgentAttestation;
}
