/**
 * Sovereign Dashboard - Charts & Data Visualization
 * Phase 1: Transaction charts, metrics visualization
 */

const Charts = {
  /**
   * Create a simple SVG line chart
   */
  createLineChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container || !data || data.length === 0) return;
    
    const { width = 300, height = 100, color = '#1DB584' } = options;
    
    // Calculate scales
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    
    const svg = `
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="width:100%;height:100%;">
        <polyline
          fill="none"
          stroke="${color}"
          stroke-width="2"
          points="${points}"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        ${data.map((val, i) => {
          const x = (i / (data.length - 1)) * width;
          const y = height - ((val - min) / range) * height;
          return `<circle cx="${x}" cy="${y}" r="3" fill="${color}" />`;
        }).join('')}
      </svg>
    `;
    
    container.innerHTML = svg;
  },
  
  /**
   * Create bar chart
   */
  createBarChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container || !data || data.length === 0) return;
    
    const { height = 100, color = '#1DB584' } = options;
    const max = Math.max(...data.map(d => d.value));
    const barWidth = 100 / data.length;
    
    const bars = data.map((d, i) => {
      const barHeight = max > 0 ? (d.value / max) * 80 : 0;
      const y = 100 - barHeight;
      return `
        <rect x="${i * barWidth + 2}%" y="${y}%" width="${barWidth - 4}%" height="${barHeight}%" 
              fill="${color}" rx="2" opacity="0.8">
          <title>${d.label}: ${d.value}</title>
        </rect>
      `;
    }).join('');
    
    const svg = `
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:${height}px;">
        ${bars}
      </svg>
    `;
    
    container.innerHTML = svg;
  },
  
  /**
   * Calculate transaction metrics
   */
  calculateMetrics(transactions) {
    if (!transactions || transactions.length === 0) {
      return {
        total: 0,
        volume: 0,
        inbound: 0,
        outbound: 0,
        avgAmount: 0,
        byDay: {},
        byRail: {},
      };
    }
    
    const metrics = {
      total: transactions.length,
      volume: 0,
      inbound: 0,
      outbound: 0,
      avgAmount: 0,
      byDay: {},
      byRail: {},
    };
    
    transactions.forEach(tx => {
      const amount = tx.amount_sats || 0;
      metrics.volume += amount;
      
      if (tx.direction === 'inbound') {
        metrics.inbound += amount;
      } else {
        metrics.outbound += amount;
      }
      
      // By day
      const day = tx.created_at ? tx.created_at.split('T')[0] : 'unknown';
      metrics.byDay[day] = (metrics.byDay[day] || 0) + amount;
      
      // By rail
      const rail = tx.protocol || 'unknown';
      metrics.byRail[rail] = (metrics.byRail[rail] || 0) + amount;
    });
    
    metrics.avgAmount = metrics.total > 0 ? Math.round(metrics.volume / metrics.total) : 0;
    
    return metrics;
  },
  
  /**
   * Render volume chart
   */
  renderVolumeChart(transactions, containerId) {
    const metrics = this.calculateMetrics(transactions);
    const days = Object.keys(metrics.byDay).sort().slice(-7); // Last 7 days
    
    const data = days.map(day => ({
      label: day,
      value: metrics.byDay[day],
    }));
    
    this.createBarChart(containerId, data, { color: '#1DB584' });
  },
  
  /**
   * Render activity sparkline
   */
  renderActivitySparkline(transactions, containerId) {
    const metrics = this.calculateMetrics(transactions);
    const days = Object.keys(metrics.byDay).sort();
    
    const data = days.map(day => metrics.byDay[day]);
    
    this.createLineChart(containerId, data, { color: '#6B5CE7' });
  },
};
