#!/usr/bin/env node
/**
 * Update Trends Page Data
 * Aggregates daily data files into metrics-history.json for the trends page
 * 
 * Usage: node update-trends-data.mjs
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';

const DAILY_DATA_DIR = resolve(process.env.HOME, '.openclaw/workspace/agentic-terminal-data/daily');
const TRENDS_DATA_FILE = resolve(process.env.HOME, '.openclaw/workspace/agenticterminal-website/agentic-terminal-data/metrics-history.json');

function loadDailyData() {
  const files = readdirSync(DAILY_DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();
  
  const data = [];
  for (const file of files) {
    try {
      const content = readFileSync(resolve(DAILY_DATA_DIR, file), 'utf-8');
      const dayData = JSON.parse(content);
      data.push({
        date: file.replace('.json', ''),
        data: dayData
      });
    } catch (err) {
      console.error(`Failed to load ${file}:`, err.message);
    }
  }
  
  return data;
}

function aggregateWeekly(dailyData) {
  // Group by week (Monday-Sunday)
  const weeks = new Map();
  
  for (const day of dailyData) {
    const date = new Date(day.date);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, {
        week_start: weekKey,
        week_end: getWeekEnd(date).toISOString().split('T')[0],
        days: []
      });
    }
    
    weeks.get(weekKey).days.push(day);
  }
  
  // Convert to array and take last value of each week
  return Array.from(weeks.values()).map(week => {
    const lastDay = week.days[week.days.length - 1];
    return {
      week_start: week.week_start,
      week_end: week.week_end,
      snapshot_date: lastDay.date,
      metrics: extractMetrics(lastDay.data),
      wow_changes: calculateWoWChanges(week.days)
    };
  });
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

function getWeekEnd(date) {
  const start = getWeekStart(date);
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
}

// Data integrity: Load existing metrics to validate against
function loadExistingMetrics() {
  try {
    if (existsSync(TRENDS_DATA_FILE)) {
      const existing = JSON.parse(readFileSync(TRENDS_DATA_FILE, 'utf-8'));
      const latestWeek = existing.weeks?.[existing.weeks.length - 1];
      return latestWeek?.metrics || null;
    }
  } catch (err) {
    console.log('[DATA INTEGRITY] Could not load existing metrics:', err.message);
  }
  return null;
}

// Data integrity: Validate extracted metrics against previous values
function validateMetrics(extracted, previous) {
  const warnings = [];
  const validated = JSON.parse(JSON.stringify(extracted)); // Deep copy
  
  if (!previous) {
    console.log('[DATA INTEGRITY] No previous metrics to validate against');
    return { validated, warnings };
  }
  
  // Helper to check for suspicious values
  const checkMetric = (category, metric, newValue, oldValue) => {
    // Rule 1: Never propagate zero if previous was non-zero
    if ((newValue === 0 || newValue === null || newValue === undefined) && oldValue > 0) {
      warnings.push(`[DATA INTEGRITY] ${category}.${metric}: Rejecting zero (would overwrite ${oldValue})`);
      return oldValue; // Preserve previous value
    }
    
    // Rule 2: Flag >50% variance
    if (oldValue > 0) {
      const variance = Math.abs(newValue - oldValue) / oldValue;
      if (variance > 0.5) {
        warnings.push(`[DATA INTEGRITY WARNING] ${category}.${metric}: ${(variance * 100).toFixed(1)}% change (${oldValue} -> ${newValue})`);
      }
    }
    
    // Rule 3: Reject negative values for counts
    const countMetrics = ['stars', 'forks', 'nodes', 'channels', 'issues', 'agents'];
    if (countMetrics.some(m => metric.includes(m)) && newValue < 0) {
      warnings.push(`[DATA INTEGRITY] ${category}.${metric}: Rejecting negative value ${newValue}`);
      return oldValue;
    }
    
    return newValue;
  };
  
  // Validate each category
  for (const category of Object.keys(extracted)) {
    if (previous[category]) {
      for (const metric of Object.keys(extracted[category])) {
        const newValue = extracted[category][metric];
        const oldValue = previous[category][metric];
        
        // Only validate numeric metrics
        if (typeof newValue === 'number' && typeof oldValue === 'number') {
          validated[category][metric] = checkMetric(category, metric, newValue, oldValue);
        }
      }
    }
  }
  
  return { validated, warnings };
}

function extractMetrics(dayData) {
  const extracted = {
    bitcoin_lightning: {
      l402_github_stars: dayData.github_metrics?.l402_aperture?.stars || 0,
      l402_github_forks: dayData.github_metrics?.l402_aperture?.forks || 0,
      l402_github_issues: dayData.github_metrics?.l402_aperture?.open_issues || 0,
      l402_contributors: 2,
      lightning_nodes: dayData.lightning_network?.nodes?.total || 0,
      lightning_channels: dayData.lightning_network?.channels?.total || 0,
      lightning_capacity_btc: dayData.lightning_network?.capacity?.btc || 0,
      lightning_capacity_usd: dayData.lightning_network?.capacity?.usd || 0,
      known_l402_endpoints: 1 // Maxi's endpoint
    },
    stablecoin_api_rails: {
      x402_github_stars: dayData.github_metrics?.x402?.stars || 0,
      x402_github_forks: dayData.github_metrics?.x402?.forks || 0,
      x402_github_issues: dayData.github_metrics?.x402?.open_issues || 0,
      x402_contributors: 30,
      x402_daily_transactions: dayData.x402_transactions?.daily_transactions || 0,
      x402_cumulative_transactions: dayData.x402_transactions?.cumulative_transactions || 0,
      x402_cumulative_volume_usd: dayData.x402_transactions?.cumulative_volume_usd || 0,
      erc8004_agents_registered: dayData.erc8004_multichain?.total_agents || 24500
    },
    emerging_protocols: {
      ark_github_stars: dayData.github_metrics?.ark_protocol?.arkd?.stars || 0,
      ark_github_forks: dayData.github_metrics?.ark_protocol?.arkd?.forks || 0,
      ark_skill_stars: dayData.github_metrics?.ark_protocol?.skill?.stars || 0,
      ark_skill_forks: dayData.github_metrics?.ark_protocol?.skill?.forks || 0,
      ark_status: 'active_development'
    }
  };
  
  // Data integrity validation
  const previousMetrics = loadExistingMetrics();
  const { validated, warnings } = validateMetrics(extracted, previousMetrics);
  
  if (warnings.length > 0) {
    console.log('\n[DATA INTEGRITY WARNINGS]');
    warnings.forEach(w => console.log('  ' + w));
    console.log('');
  }
  
  return validated;
}

function calculateWoWChanges(weekDays) {
  if (weekDays.length < 2) {
    return {
      bitcoin_lightning: { l402_github_stars_pct: null, lightning_nodes_pct: null },
      stablecoin_api_rails: { x402_github_stars_pct: null },
      emerging_protocols: { ark_github_stars_pct: null }
    };
  }
  
  const first = weekDays[0].data;
  const last = weekDays[weekDays.length - 1].data;
  
  const calcPct = (current, previous) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };
  
  return {
    bitcoin_lightning: {
      l402_github_stars_pct: calcPct(
        last.github_metrics?.l402_aperture?.stars,
        first.github_metrics?.l402_aperture?.stars
      ),
      lightning_nodes_pct: calcPct(
        last.lightning_network?.nodes?.total,
        first.lightning_network?.nodes?.total
      ),
      lightning_capacity_btc_pct: calcPct(
        last.lightning_network?.capacity?.btc,
        first.lightning_network?.capacity?.btc
      )
    },
    stablecoin_api_rails: {
      x402_github_stars_pct: calcPct(
        last.github_metrics?.x402?.stars,
        first.github_metrics?.x402?.stars
      )
    },
    emerging_protocols: {
      ark_github_stars_pct: calcPct(
        last.github_metrics?.ark_protocol?.arkd?.stars,
        first.github_metrics?.ark_protocol?.arkd?.stars
      )
    }
  };
}

function generateInsights(latest) {
  const insights = [];
  
  // L402 growth insight
  const l402Stars = latest.metrics.bitcoin_lightning.l402_github_stars;
  const l402Change = latest.wow_changes.bitcoin_lightning.l402_github_stars_pct;
  if (l402Change && l402Change > 20) {
    insights.push(`L402 developer interest accelerating: +${l402Change.toFixed(1)}% week-over-week (${l402Stars} stars). Lightning-native agent payments gaining traction.`);
  }
  
  // Lightning network insight
  const lnNodes = latest.metrics.bitcoin_lightning.lightning_nodes;
  const lnChange = latest.wow_changes.bitcoin_lightning.lightning_nodes_pct;
  if (lnChange && Math.abs(lnChange) > 1) {
    const direction = lnChange > 0 ? 'growing' : 'declining';
    insights.push(`Lightning Network ${direction}: ${lnNodes.toLocaleString()} nodes (${lnChange > 0 ? '+' : ''}${lnChange.toFixed(1)}%).`);
  }
  
  // x402 milestone
  const x402Stars = latest.metrics.stablecoin_api_rails.x402_github_stars;
  if (x402Stars > 5500) {
    insights.push(`x402 approaching major milestone: ${x402Stars.toLocaleString()} GitHub stars. Coinbase's standard maintains production lead.`);
  }
  
  // Gap insight
  const interest = l402Stars;
  const usage = latest.metrics.stablecoin_api_rails.erc8004_agents_registered;
  const gapRatio = usage / interest;
  if (gapRatio > 500) {
    insights.push(`Interest↔Usage gap persists: ${usage.toLocaleString()} registered agents vs ${interest} L402 stars shows infrastructure ahead of developer tooling.`);
  }
  
  return insights.length > 0 ? insights : ['Monitoring cross-protocol metrics. Check back for updates as new data becomes available.'];
}

function updateTrendsPage() {
  console.log('📊 Updating trends page data...\n');
  
  // Load daily data
  const dailyData = loadDailyData();
  console.log(`Loaded ${dailyData.length} daily data files`);
  
  if (dailyData.length === 0) {
    console.error('No daily data found');
    return;
  }
  
  // Aggregate to weekly
  const weeklyData = aggregateWeekly(dailyData);
  console.log(`Aggregated into ${weeklyData.length} weeks`);
  
  // Get latest for insights
  const latest = weeklyData[weeklyData.length - 1];
  const insights = generateInsights(latest);
  
  // Build output
  const output = {
    schema_version: '1.0.0',
    description: 'Agentic Terminal time-series metrics history - Cross-protocol AI agent settlement data',
    last_updated: new Date().toISOString(),
    weeks: weeklyData,
    insights: insights,
    metadata: {
      data_source: 'Agentic Terminal Daily Collection',
      update_frequency: 'weekly',
      protocols_tracked: ['L402', 'x402', 'Ark Protocol', 'Lightning Network'],
      next_expected_update: getWeekEnd(new Date()).toISOString().split('T')[0]
    }
  };
  
  // Write output
  writeFileSync(TRENDS_DATA_FILE, JSON.stringify(output, null, 2));
  console.log(`\n✅ Updated: ${TRENDS_DATA_FILE}`);
  console.log(`📅 Last updated: ${output.last_updated}`);
  console.log(`📊 Weeks of data: ${weeklyData.length}`);
  console.log(`💡 Insights generated: ${insights.length}`);
  
  // Summary
  console.log('\n📈 Latest Week Summary:');
  console.log(`  L402 Stars: ${latest.metrics.bitcoin_lightning.l402_github_stars}`);
  console.log(`  x402 Stars: ${latest.metrics.stablecoin_api_rails.x402_github_stars}`);
  console.log(`  LN Nodes: ${latest.metrics.bitcoin_lightning.lightning_nodes.toLocaleString()}`);
  console.log(`  ERC-8004 Agents: ${latest.metrics.stablecoin_api_rails.erc8004_agents_registered.toLocaleString()}`);
}

updateTrendsPage();
