/**
 * Sovereign Dashboard - Advanced Delegation Management
 * Phase 2: Edit, revoke, renew delegations with history
 */

const DelegationManager = {
  currentDelegation: null,
  delegationHistory: [],
  
  /**
   * Initialize delegation manager
   */
  async init() {
    await this.loadDelegation();
    await this.loadHistory();
    this.render();
  },
  
  /**
   * Load current delegation from API
   */
  async loadDelegation() {
    try {
      const data = await API.getDelegation();
      this.currentDelegation = data.delegation || null;
      return this.currentDelegation;
    } catch (error) {
      console.error('Failed to load delegation:', error);
      return null;
    }
  },
  
  /**
   * Load delegation history
   */
  async loadHistory() {
    try {
      const data = await API.getDelegationHistory();
      this.delegationHistory = data.history || [];
      return this.delegationHistory;
    } catch (error) {
      console.error('Failed to load delegation history:', error);
      return [];
    }
  },
  
  /**
   * Render delegation UI
   */
  render() {
    const container = document.getElementById('delegation-content');
    if (!container) return;
    
    if (!this.currentDelegation) {
      container.innerHTML = this.renderEmptyState();
      return;
    }
    
    container.innerHTML = this.renderDelegationCard() + this.renderHistory();
  },
  
  /**
   * Render empty state
   */
  renderEmptyState() {
    return `
      <div class="delegation-empty">
        <div style="text-align:center;padding:60px 20px;">
          <div style="font-size:48px;margin-bottom:16px;">🔑</div>
          <h3 style="font-size:18px;margin-bottom:8px;">No Active Delegation</h3>
          <p style="font-family:var(--mono);font-size:13px;color:var(--text-secondary);margin-bottom:24px;">
            Create your first delegation to allow your agent to transact on your behalf.
          </p>
          <button class="btn btn-primary" onclick="DelegationManager.showCreateModal()">
            Create Delegation
          </button>
        </div>
      </div>
    `;
  },
  
  /**
   * Render delegation card
   */
  renderDelegationCard() {
    const d = this.currentDelegation;
    const isActive = d.status === 'active';
    const expiresIn = new Date(d.expires_at) - Date.now();
    const daysUntilExpiry = Math.floor(expiresIn / (1000 * 60 * 60 * 24));
    
    return `
      <div class="delegation-card" style="background:var(--bg-surface);border:1px solid var(--bg-border);padding:32px;margin-bottom:24px;">
        <div style="font-family:var(--mono);font-size:10px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--bg-border)">
          SOVEREIGN DELEGATION CREDENTIAL
        </div>
        
        <div style="display:flex;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--bg-border)">
          <div style="font-family:var(--mono);font-size:11px;color:var(--text-tertiary);text-transform:uppercase">Issued by</div>
          <div style="font-family:var(--mono);font-size:13px">${d.issued_by}</div>
        </div>
        
        <div style="display:flex;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--bg-border)">
          <div style="font-family:var(--mono);font-size:11px;color:var(--text-tertiary);text-transform:uppercase">Delegates to</div>
          <div style="font-family:var(--mono);font-size:13px">${d.agent_id}</div>
        </div>
        
        <div style="display:flex;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--bg-border)">
          <div style="font-family:var(--mono);font-size:11px;color:var(--text-tertiary);text-transform:uppercase">Constraints</div>
          <div style="font-family:var(--mono);font-size:13px;text-align:right">
            ${d.constraints.max_per_txn ? `${d.constraints.max_per_txn.toLocaleString()} sat/txn<br>` : ''}
            ${d.constraints.max_per_month ? `${d.constraints.max_per_month.toLocaleString()} sat/mo<br>` : ''}
            <span style="font-size:12px;color:var(--text-secondary)">${d.constraints.rails?.join(' · ') || 'Lightning'}</span>
          </div>
        </div>
        
        <div style="display:flex;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--bg-border)">
          <div style="font-family:var(--mono);font-size:11px;color:var(--text-tertiary);text-transform:uppercase">Issued</div>
          <div style="font-family:var(--mono);font-size:13px">${new Date(d.issued_at).toISOString()}</div>
        </div>
        
        <div style="display:flex;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--bg-border)">
          <div style="font-family:var(--mono);font-size:11px;color:var(--text-tertiary);text-transform:uppercase">Expires</div>
          <div style="font-family:var(--mono);font-size:13px;color:${daysUntilExpiry < 7 ? 'var(--red)' : ''}">
            ${new Date(d.expires_at).toISOString()}
            ${daysUntilExpiry < 30 ? `<br><span style="font-size:11px;color:var(--red)">(${daysUntilExpiry} days)</span>` : ''}
          </div>
        </div>
        
        <div style="display:flex;justify-content:space-between;padding:16px 0">
          <div style="font-family:var(--mono);font-size:11px;color:var(--text-tertiary);text-transform:uppercase">Status</div>
          <div style="font-family:var(--mono);font-size:13px;color:${isActive ? 'var(--teal)' : 'var(--red)'}">
            ● ${isActive ? 'Active' : d.status}
          </div>
        </div>
        
        <div style="display:flex;gap:12px;margin-top:32px;padding-top:24px;border-top:1px solid var(--bg-border)">
          <button class="btn btn-secondary" onclick="DelegationManager.showEditModal()">Edit constraints</button>
          ${daysUntilExpiry < 30 ? `<button class="btn btn-primary" onclick="DelegationManager.renew()">Renew</button>` : ''}
          <button class="btn btn-danger" onclick="DelegationManager.revoke()">Revoke</button>
        </div>
      </div>
    `;
  },
  
  /**
   * Render delegation history
   */
  renderHistory() {
    if (!this.delegationHistory.length) return '';
    
    return `
      <div class="delegation-history" style="background:var(--bg-surface);border:1px solid var(--bg-border);padding:24px;">
        <div style="font-size:14px;font-weight:600;margin-bottom:16px;">Delegation History</div>
        <div class="history-timeline">
          ${this.delegationHistory.map(h => `
            <div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid var(--bg-border);${h === this.delegationHistory[this.delegationHistory.length - 1] ? 'border-bottom:none;' : ''}">
              <div style="font-family:var(--mono);font-size:11px;color:var(--text-tertiary);min-width:120px;">
                ${new Date(h.timestamp).toLocaleDateString()}
              </div>
              <div>
                <div style="font-size:13px;font-weight:500;">${h.action}</div>
                <div style="font-family:var(--mono);font-size:11px;color:var(--text-secondary);margin-top:4px;">
                  ${h.details || ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  /**
   * Show edit constraints modal
   */
  showEditModal() {
    const d = this.currentDelegation;
    if (!d) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="background:var(--bg-surface);border:1px solid var(--bg-border);padding:32px;max-width:500px;width:90%;border-radius:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
          <h3 style="font-size:18px;font-weight:600;">Edit Constraints</h3>
          <button onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:20px;">×</button>
        </div>
        
        <div class="form-group" style="margin-bottom:20px;">
          <label style="display:block;font-family:var(--mono);font-size:11px;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px;">
            Max per Transaction (sats)
          </label>
          <input type="number" id="edit-max-txn" value="${d.constraints.max_per_txn || 50000}" 
                 style="width:100%;background:var(--bg-elevated);border:1px solid var(--bg-border);padding:12px;color:var(--text-primary);font-family:var(--mono);font-size:14px;border-radius:4px;">
        </div>
        
        <div class="form-group" style="margin-bottom:20px;">
          <label style="display:block;font-family:var(--mono);font-size:11px;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px;">
            Max per Month (sats)
          </label>
          <input type="number" id="edit-max-month" value="${d.constraints.max_per_month || 500000}" 
                 style="width:100%;background:var(--bg-elevated);border:1px solid var(--bg-border);padding:12px;color:var(--text-primary);font-family:var(--mono);font-size:14px;border-radius:4px;">
        </div>
        
        <div class="form-group" style="margin-bottom:24px;">
          <label style="display:block;font-family:var(--mono);font-size:11px;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px;">
            Allowed Rails
          </label>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            ${['Lightning', 'x402', 'Solana', 'L402'].map(rail => `
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                <input type="checkbox" value="${rail.toLowerCase()}" 
                       ${d.constraints.rails?.includes(rail.toLowerCase()) ? 'checked' : ''}
                       style="accent-color:var(--teal);">
                <span style="font-family:var(--mono);font-size:12px;">${rail}</span>
              </label>
            `).join('')}
          </div>
        </div>
        
        <div style="display:flex;gap:12px;justify-content:flex-end;">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="DelegationManager.saveConstraints()">Save Changes</button>
        </div>
      </div>
    `;
    
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;';
    document.body.appendChild(modal);
  },
  
  /**
   * Save updated constraints
   */
  async saveConstraints() {
    const maxTxn = parseInt(document.getElementById('edit-max-txn').value);
    const maxMonth = parseInt(document.getElementById('edit-max-month').value);
    
    const checkboxes = document.querySelectorAll('.modal-content input[type="checkbox"]:checked');
    const rails = Array.from(checkboxes).map(cb => cb.value);
    
    try {
      await API.updateDelegation({
        constraints: {
          max_per_txn: maxTxn,
          max_per_month: maxMonth,
          rails,
        },
      });
      
      showNotification('Constraints Updated', 'Your delegation constraints have been updated.');
      document.querySelector('.modal-overlay').remove();
      await this.loadDelegation();
      this.render();
      
    } catch (error) {
      showNotification('Update Failed', error.message, 'error');
    }
  },
  
  /**
   * Renew delegation
   */
  async renew() {
    if (!confirm('Renew this delegation for another 90 days?')) return;
    
    try {
      await API.renewDelegation();
      showNotification('Delegation Renewed', 'Your delegation has been renewed for 90 days.');
      await this.loadDelegation();
      this.render();
    } catch (error) {
      showNotification('Renewal Failed', error.message, 'error');
    }
  },
  
  /**
   * Revoke delegation
   */
  async revoke() {
    if (!confirm('Revoke this delegation? Your agent will no longer be able to transact on your behalf.')) return;
    
    if (!confirm('Are you sure? This action cannot be undone.')) return;
    
    try {
      await API.revokeDelegation();
      showNotification('Delegation Revoked', 'Your agent can no longer transact on your behalf.');
      this.currentDelegation = null;
      this.render();
    } catch (error) {
      showNotification('Revoke Failed', error.message, 'error');
    }
  },
  
  /**
   * Show create delegation modal
   */
  showCreateModal() {
    // Similar to edit modal but for new delegation
    showNotification('Coming Soon', 'Create delegation flow will be available in Phase 3.');
  },
};

// Helper function for notifications
function showNotification(title, message, type = 'success') {
  const notification = document.getElementById('notification');
  if (notification) {
    document.getElementById('notif-title').textContent = title;
    document.getElementById('notif-text').textContent = message;
    notification.classList.add('visible');
    setTimeout(() => notification.classList.remove('visible'), 5000);
  }
}
