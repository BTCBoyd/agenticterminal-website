/**
 * AT Reputation Score (AT-ARS) Computation Module
 * Phase 4.5: Agent reputation scoring from OP VAC data
 * 
 * This is AT's interpretation of agent reputation - not OP's canonical score.
 * Computed client-side from Verifiable Activity Credential (VAC) data.
 */

const ATARS = {
  // Model version
  VERSION: '1.0',
  MODEL_NAME: 'AT-ARS-1.0',
  
  // Weight configuration (must sum to 100%)
  WEIGHTS: {
    totalTransactions: 0.25,      // 25%
    uniqueCounterparties: 0.20,   // 20%
    transactionRecency: 0.20,     // 20%
    a2aRatio: 0.15,               // 15%
    agentAge: 0.20,               // 20%
  },
  
  // Normalization ranges (v1)
  RANGES: {
    transactions: { min: 0, max: 500, cap: true },      // Linear 0-500, cap at 500
    counterparties: { min: 0, max: 100, cap: true },    // Linear 0-100, cap at 100
    recency: { min: 0, max: 30, cap: true },            // 0-30 txns in 30d
    a2aRatio: { min: 0, max: 1, cap: true },            // 0-100% (direct)
    age: { min: 0, max: 365, cap: true },               // 0-365 days, cap at 1 year
  },
  
  // Score bands
  BANDS: {
    UNPROVEN: { min: 0, max: 25, label: 'UNPROVEN', color: '#7A7A92' },
    ACTIVE: { min: 26, max: 50, label: 'ACTIVE', color: '#F5A623' },
    ESTABLISHED: { min: 51, max: 75, label: 'ESTABLISHED', color: '#1DB584' },
    HIGHLY_PROVEN: { min: 76, max: 100, label: 'HIGHLY PROVEN', color: '#6B5CE7' },
  },
  
  // Maxi Agent 1 - Bootstrap showcase data
  MAXI_AGENT: {
    pubkey: 'maxi-agent-001',
    displayName: 'Maxi',
    description: 'AI co-founder of OP and AT',
    vac: {
      total_transactions: 142,
      unique_counterparties: 31,
      transactions_last_30d: 28,
      a2a_transactions: 124,
      first_transaction_timestamp: '2025-12-09T10:00:00Z',
      rails: ['lightning', 'x402'],
    },
  },

  /**
   * Compute AT-ARS score from VAC data
   * @param {Object} vac - VAC data from OP API
   * @param {number} vac.total_transactions - Total transaction count
   * @param {number} vac.unique_counterparties - Unique counterparty count
   * @param {number} vac.transactions_last_30d - Transactions in last 30 days
   * @param {number} vac.a2a_transactions - Agent-to-agent transaction count
   * @param {string} vac.first_transaction_timestamp - ISO timestamp of first tx
   * @param {string[]} vac.rails - Array of payment rails used
   * @returns {Object} Structured score object
   */
  computeScore(vac) {
    if (!vac || typeof vac !== 'object') {
      return this.getDefaultScore();
    }

    // Normalize each component (0-1 scale)
    const normalized = {
      transactions: this.normalize(vac.total_transactions || 0, this.RANGES.transactions),
      counterparties: this.normalize(vac.unique_counterparties || 0, this.RANGES.counterparties),
      recency: this.normalize(vac.transactions_last_30d || 0, this.RANGES.recency),
      a2aRatio: this.normalizeA2ARatio(vac.a2a_transactions || 0, vac.total_transactions || 1),
      age: this.normalizeAge(vac.first_transaction_timestamp),
    };

    // Calculate weighted score
    const weighted = {
      transactions: normalized.transactions * this.WEIGHTS.totalTransactions,
      counterparties: normalized.counterparties * this.WEIGHTS.uniqueCounterparties,
      recency: normalized.recency * this.WEIGHTS.transactionRecency,
      a2aRatio: normalized.a2aRatio * this.WEIGHTS.a2aRatio,
      age: normalized.age * this.WEIGHTS.agentAge,
    };

    // Final score (0-100)
    const totalScore = Math.round(
      (weighted.transactions + 
       weighted.counterparties + 
       weighted.recency + 
       weighted.a2aRatio + 
       weighted.age) * 100
    );

    // Determine band
    const band = this.getBand(totalScore);

    // Calculate rail diversity score
    const railDiversity = this.calculateRailDiversity(vac.rails || []);

    return {
      score: totalScore,
      band: band.label,
      bandColor: band.color,
      components: {
        transactions: {
          raw: vac.total_transactions || 0,
          normalized: normalized.transactions,
          weighted: weighted.transactions,
          max: this.RANGES.transactions.max,
        },
        counterparties: {
          raw: vac.unique_counterparties || 0,
          normalized: normalized.counterparties,
          weighted: weighted.counterparties,
          max: this.RANGES.counterparties.max,
        },
        recency: {
          raw: vac.transactions_last_30d || 0,
          normalized: normalized.recency,
          weighted: weighted.recency,
          max: this.RANGES.recency.max,
        },
        a2aRatio: {
          raw: vac.a2a_transactions || 0,
          normalized: normalized.a2aRatio,
          weighted: weighted.a2aRatio,
          percentage: Math.round(normalized.a2aRatio * 100),
        },
        age: {
          raw: this.calculateAgeInDays(vac.first_transaction_timestamp),
          normalized: normalized.age,
          weighted: weighted.age,
          max: this.RANGES.age.max,
        },
      },
      railDiversity: {
        rails: vac.rails || [],
        count: (vac.rails || []).length,
        score: railDiversity,
      },
      meta: {
        version: this.VERSION,
        model: this.MODEL_NAME,
        computedAt: new Date().toISOString(),
        vacSource: 'Observer Protocol',
      },
    };
  },

  /**
   * Normalize a value to 0-1 range
   * @param {number} value - Raw value
   * @param {Object} range - Range config with min, max, cap
   * @returns {number} Normalized value (0-1)
   */
  normalize(value, range) {
    if (range.cap) {
      value = Math.min(value, range.max);
    }
    const normalized = (value - range.min) / (range.max - range.min);
    return Math.max(0, Math.min(1, normalized));
  },

  /**
   * Normalize A2A ratio
   * @param {number} a2aCount - A2A transaction count
   * @param {number} totalCount - Total transaction count
   * @returns {number} Normalized ratio (0-1)
   */
  normalizeA2ARatio(a2aCount, totalCount) {
    if (totalCount === 0) return 0;
    const ratio = a2aCount / totalCount;
    return Math.min(ratio, 1);
  },

  /**
   * Normalize agent age
   * @param {string} firstTxTimestamp - ISO timestamp of first transaction
   * @returns {number} Normalized age (0-1)
   */
  normalizeAge(firstTxTimestamp) {
    if (!firstTxTimestamp) return 0;
    const ageInDays = this.calculateAgeInDays(firstTxTimestamp);
    return this.normalize(ageInDays, this.RANGES.age);
  },

  /**
   * Calculate age in days from timestamp
   * @param {string} timestamp - ISO timestamp
   * @returns {number} Age in days
   */
  calculateAgeInDays(timestamp) {
    if (!timestamp) return 0;
    const firstTx = new Date(timestamp);
    const now = new Date();
    const diffMs = now - firstTx;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  },

  /**
   * Get band for a score
   * @param {number} score - Total score (0-100)
   * @returns {Object} Band configuration
   */
  getBand(score) {
    if (score <= 25) return this.BANDS.UNPROVEN;
    if (score <= 50) return this.BANDS.ACTIVE;
    if (score <= 75) return this.BANDS.ESTABLISHED;
    return this.BANDS.HIGHLY_PROVEN;
  },

  /**
   * Calculate rail diversity score
   * @param {string[]} rails - Array of rails used
   * @returns {number} Diversity score (0-1)
   */
  calculateRailDiversity(rails) {
    if (!rails || rails.length === 0) return 0;
    // More rails = higher diversity, cap at 5 rails for max score
    return Math.min(rails.length / 5, 1);
  },

  /**
   * Get default score for unverified/no-data state
   * @returns {Object} Default score object
   */
  getDefaultScore() {
    return {
      score: 0,
      band: 'UNPROVEN',
      bandColor: '#7A7A92',
      components: {
        transactions: { raw: 0, normalized: 0, weighted: 0, max: this.RANGES.transactions.max },
        counterparties: { raw: 0, normalized: 0, weighted: 0, max: this.RANGES.counterparties.max },
        recency: { raw: 0, normalized: 0, weighted: 0, max: this.RANGES.recency.max },
        a2aRatio: { raw: 0, normalized: 0, weighted: 0, percentage: 0 },
        age: { raw: 0, normalized: 0, weighted: 0, max: this.RANGES.age.max },
      },
      railDiversity: { rails: [], count: 0, score: 0 },
      meta: {
        version: this.VERSION,
        model: this.MODEL_NAME,
        computedAt: new Date().toISOString(),
        vacSource: null,
      },
    };
  },

  /**
   * Compute score for Maxi Agent 1 (showcase)
   * @returns {Object} Maxi's score
   */
  computeMaxiScore() {
    return {
      ...this.computeScore(this.MAXI_AGENT.vac),
      agent: {
        pubkey: this.MAXI_AGENT.pubkey,
        displayName: this.MAXI_AGENT.displayName,
        description: this.MAXI_AGENT.description,
        isShowcase: true,
      },
    };
  },

  /**
   * Validate VAC data structure
   * @param {Object} vac - VAC data to validate
   * @returns {boolean} Is valid
   */
  isValidVAC(vac) {
    if (!vac || typeof vac !== 'object') return false;
    const required = ['total_transactions', 'unique_counterparties'];
    return required.every(field => typeof vac[field] === 'number');
  },

  /**
   * Get score trend (placeholder for future implementation)
   * @param {Object} currentScore - Current score object
   * @param {Object} previousScore - Previous score object (optional)
   * @returns {string} Trend indicator
   */
  getTrend(currentScore, previousScore) {
    if (!previousScore) return 'NEW';
    const diff = currentScore.score - previousScore.score;
    if (diff > 5) return '↑ Rising';
    if (diff < -5) return '↓ Falling';
    return '→ Stable';
  },

  /**
   * Format score for display
   * @param {Object} score - Score object
   * @returns {Object} Formatted display values
   */
  formatForDisplay(score) {
    if (!score) return null;
    
    return {
      score: score.score,
      band: score.band,
      bandColor: score.bandColor,
      barWidth: `${score.score}%`,
      metrics: {
        transactions: `${score.components.transactions.raw.toLocaleString()} / ${score.components.transactions.max}`,
        counterparties: `${score.components.counterparties.raw} / ${score.components.counterparties.max}`,
        age: this.formatAge(score.components.age.raw),
        rails: score.railDiversity.rails,
        railCount: score.railDiversity.count,
        recency: `${score.components.recency.raw} txns (30d)`,
        recencyBar: `${(score.components.recency.normalized * 100).toFixed(0)}%`,
        a2aRatio: `${score.components.a2aRatio.percentage}%`,
      },
      footer: {
        model: score.meta.model,
        computedAt: this.formatTimestamp(score.meta.computedAt),
      },
    };
  },

  /**
   * Format age for display
   * @param {number} days - Age in days
   * @returns {string} Formatted age
   */
  formatAge(days) {
    if (days < 30) return `${days}d`;
    if (days < 365) return `${Math.floor(days / 30)}mo`;
    return `${Math.floor(days / 365)}yr`;
  },

  /**
   * Format timestamp for display
   * @param {string} isoTimestamp - ISO timestamp
   * @returns {string} Formatted timestamp
   */
  formatTimestamp(isoTimestamp) {
    if (!isoTimestamp) return '—';
    const date = new Date(isoTimestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
};

// Make globally available
if (typeof window !== 'undefined') {
  window.ATARS = ATARS;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ATARS;
}