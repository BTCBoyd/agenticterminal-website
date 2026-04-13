# AT Reputation Score (AT-ARS) - Phase 4.5 Implementation Report

## Overview
Phase 4.5 of the Sovereign Dashboard introduces the AT Reputation Score (AT-ARS), a client-side computed reputation score based on Observer Protocol VAC (Verifiable Activity Credential) data.

## Files Created

### 1. `at-ars-score.js` (11,576 bytes)
**Purpose:** Core score computation module

**Key Features:**
- `ATARS.computeScore(vac)` - Main computation function
- Weighted scoring algorithm (25% transactions, 20% counterparties, 20% recency, 15% A2A ratio, 20% age)
- Normalization ranges with capping (500 txns, 100 counterparties, 30d recency, 365d age)
- Score bands: UNPROVEN (0-25), ACTIVE (26-50), ESTABLISHED (51-75), HIGHLY PROVEN (76-100)
- Maxi Agent 1 showcase data
- VAC validation and formatting utilities

**Exports:** `ATARS` global object

### 2. `at-ars-test.html` (14,269 bytes)
**Purpose:** Comprehensive test suite for score computation

**Test Coverage:**
- Boundary value tests (all score bands)
- Maxi Agent 1 score verification
- Weight validation (sums to 100%)
- Normalization range tests
- Edge cases (null, empty, missing data)

## Files Modified

### 3. `api.js` (Added VAC fetching)
**Changes:**
- Added `API.getVAC(pubkey)` - Fetches VAC data from OP API
- Added `API.isOPReachable()` - Health check for OP connectivity
- 8-second timeout for VAC requests
- 5-minute client-side caching

### 4. `storage-idb.js` (Added score caching)
**Changes:**
- DB_VERSION bumped from 1 to 2
- Added `at_ars_scores` object store with pubkey and computedAt indexes
- `cacheATARSScore(pubkey, score)` - Stores computed scores
- `getCachedATARSScore(pubkey)` - Retrieves cached scores with staleness check
- `hasFreshScore(pubkey, maxAgeMs)` - Checks cache freshness
- `clearAllScores()` - Clears all cached scores
- `getAllCachedScores()` - Debug/export utility

### 5. `index.html` (Added AT-ARS Score Card UI)
**Changes:**
- Added AT-ARS Score Card CSS (dark terminal aesthetic)
- Added Score Card HTML section with 5 dashboard states
- Added `at-ars-score.js` script import
- Added `ATARSCard` JavaScript module with:
  - 5 dashboard state handling
  - Maxi Agent 1 showcase
  - OP reachability detection
  - Stale score warnings
  - Score refresh capability

### 6. `config.js` (Updated version and feature flags)
**Changes:**
- VERSION: `2.4.0-phase4.5-atars-score`
- Added `atarsScore: true` to FEATURES

## Dashboard States (5 States)

### 1. UNVERIFIED (pre-Phase 3)
- **Trigger:** User not registered on Observer Protocol
- **UI:** Greyed card, lock icon (🔒)
- **Copy:** "Complete OP registration to unlock AT Reputation Score"
- **Action:** Button to navigate to OP registration

### 2. VERIFIED_NO_AGENT (pre-Phase 4)
- **Trigger:** User verified but no agents attested
- **UI:** Card outline with Maxi showcase
- **Copy:** "Agent 1 on Observer Protocol. Maxi — AI co-founder of OP and AT — is the first agent scored on AT-ARS-1.0."
- **Action:** "+ Attest Your First Agent" button

### 3. AGENT_UNPROVEN (<5 transactions)
- **Trigger:** User has attested agent with <5 transactions
- **UI:** Score displayed, UNPROVEN band (grey)
- **Copy:** "Score will strengthen as your agent transacts more"

### 4. ACTIVE (normal operation)
- **Trigger:** User has active agent with ≥5 transactions
- **UI:** Full score display with appropriate band color
- **Metrics:** 2×3 grid (Transactions, Counterparties, Age, Rail Diversity, Recency, A2A Ratio)

### 5. OP_UNREACHABLE
- **Trigger:** OP API unreachable, cached score displayed
- **UI:** Amber warning border
- **Copy:** "⚠ Score may be stale · Xh old"

## Score Card UI Components

### Header
- AT Logo (branded badge)
- Title: "AT Reputation Score"
- Score value (large, colored by band)
- Band label (prominent badge)

### Score Bar
- Horizontal filled bar showing score percentage
- Color-coded by band (grey, amber, teal, purple)
- Animated width transition

### Metrics Grid (2×3)
1. **Transactions** - Raw / Max (e.g., "142 / 500")
2. **Counterparties** - Raw / Max (e.g., "31 / 100")
3. **Age** - Formatted (e.g., "107d" or "3mo" or "1yr")
4. **Rail Diversity** - 5 dot indicators (filled for each rail used)
5. **Recency (30d)** - Mini bar chart showing 30-day activity
6. **A2A Ratio** - Percentage (e.g., "87%")

### Footer
- "⚡ Powered by Agentic Terminal" (muted)
- Model version and timestamp

## Maxi Agent 1 (Showcase Data)

```json
{
  "total_transactions": 142,
  "unique_counterparties": 31,
  "transactions_last_30d": 28,
  "a2a_transactions": 124,
  "first_transaction_timestamp": "2025-12-09T10:00:00Z",
  "rails": ["lightning", "x402"]
}
```

**Computed Score:** 51 (ESTABLISHED band)

## Score Computation Formula

```javascript
score = (
  normalize(transactions, 0-500) × 0.25 +
  normalize(counterparties, 0-100) × 0.20 +
  normalize(recency_30d, 0-30) × 0.20 +
  (a2a_ratio) × 0.15 +
  normalize(age_days, 0-365) × 0.20
) × 100
```

All values are capped at their maximums (linear normalization).

## Testing Results

| Test | Result |
|------|--------|
| Maxi Agent 1 Score | ✓ PASS (51, ESTABLISHED) |
| UNPROVEN Band (0-25) | ✓ PASS |
| ESTABLISHED Band (51-75) | ✓ PASS |
| HIGHLY PROVEN Band (76-100) | ✓ PASS |
| Weight Sum (100%) | ✓ PASS |
| Transaction Capping | ✓ PASS |
| Null VAC Handling | ✓ PASS |

## Browser Compatibility

- Chrome/Edge: ✓ Supported (IndexedDB, ES6)
- Firefox: ✓ Supported (IndexedDB, ES6)
- Safari: ✓ Supported (IndexedDB, ES6)

## Security Considerations

1. **Client-side computation:** Score is computed in browser from OP VAC data
2. **IndexedDB caching:** Scores cached with pubkey index, not plaintext localStorage
3. **Staleness detection:** Cached scores >1 hour flagged as stale
4. **No sensitive data:** VAC data contains only activity metrics, no private keys

## API Endpoints Used

- `GET /observer/agents/{pubkey}/vac` - Fetch VAC data (5-min cache)
- `GET /health` - OP reachability check

## Next Steps / Future Enhancements

1. Score history tracking (trend analysis)
2. Peer comparison (percentile rankings)
3. Score change notifications
4. Export score credentials
5. Rail diversity expansion (beyond 5 dots)

## Implementation Checklist

- [x] `at-ars-score.js` - Score computation
- [x] `api.js` - VAC fetching
- [x] `storage-idb.js` - Score caching
- [x] `index.html` - Score card UI
- [x] 5 dashboard states
- [x] Maxi Agent 1 showcase
- [x] Test suite
- [x] Documentation

## Version

**AT-ARS Model:** 1.0  
**Dashboard Version:** 2.4.0-phase4.5-atars-score  
**Implementation Date:** 2026-03-26
