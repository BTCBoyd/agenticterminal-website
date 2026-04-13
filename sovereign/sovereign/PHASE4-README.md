# Phase 4: Agent Attestation - Implementation Report

## Overview
Phase 4 connects the human's Sovereign identity to their agent(s) through cryptographically signed delegation credentials. This enables:
- Agent transactions to be visible in the dashboard
- Delegation constraints to be enforced
- Bilateral verification (human + agent signatures)
- OP submission of delegation credentials

## Files Created

### 1. `delegation-credential.js`
**Purpose:** Create and cryptographically sign delegation credentials

**Key Features:**
- `DelegationCredential.create()` - Creates unsigned credential with constraints
- `DelegationCredential.signWithHuman()` - Signs credential with human's private key
- `DelegationCredential.addAgentCosignature()` - Adds agent co-signature
- `DelegationCredential.validate()` - Validates signatures and expiry
- `DelegationCredential.formatForDisplay()` - Human-readable formatting
- Constraint validation (min/max limits, valid rails)
- Deterministic canonical JSON serialization for signing

**Credential Format:**
```json
{
  "version": "1.0",
  "issuer": "<human_pubkey>",
  "delegate": "<agent_pubkey>",
  "agent_type": "lnd_node",
  "constraints": {
    "max_per_txn_sats": 50000,
    "max_per_month_sats": 500000,
    "rails": ["lightning", "x402"]
  },
  "issued_at": "2026-03-26T...",
  "expires_at": "2026-06-24T...",
  "signature": "<secp256k1_sig>",
  "agent_signature": null,
  "verification_status": "human_attested"
}
```

### 2. `agent-attestation.js`
**Purpose:** UI flow for agent identification and attestation

**Key Features:**
- `AgentAttestation.openModal()` - Opens attestation modal
- `AgentAttestation.detectAlbyHub()` - Auto-detects Alby via WebLN
- Six agent types supported:
  - Alby Hub (WebLN auto-detection)
  - LND Node (manual pubkey entry)
  - x402/L402 Agent (manual entry)
  - Solana Agent (wallet address)
  - OP-Registered Agent (OP pubkey)
  - Other (any public identifier)
- 4-step wizard:
  1. Select agent type
  2. Identify agent (auto or manual)
  3. Set constraints (spending limits, rails, expiry)
  4. Sign delegation
- Attempts agent co-signature if online
- Stores credentials in IndexedDB
- Submits to OP via API

**Agent Type Definitions:**
```javascript
{
  alby_hub: { icon: '⚡', color: '#F7931A', detection: 'webln' },
  lnd_node: { icon: '🔷', color: '#3399FF', validate: /[0-9a-fA-F]{66}/ },
  x402: { icon: '🔗', color: '#6B5CE7' },
  solana: { icon: '🟣', color: '#9945FF', validate: /[1-9A-HJ-NP-Za-km-z]{32,44}/ },
  op_registered: { icon: '✓', color: '#1DB584' },
  other: { icon: '🔑', color: '#7A7A92' }
}
```

### 3. `phase4-test.html`
**Purpose:** Standalone test page for Phase 4 features

**Tests:**
- Module loading
- Credential creation
- Credential signing with secp256k1
- Agent type definitions
- Constraint validation
- Sample credential generation

## Files Modified

### 1. `auth.js`
**Added:**
- `Auth.getPrivateKeyForSigning()` - Returns in-memory private key for signing delegation credentials (Phase 4)

### 2. `delegation-manager.js`
**Added:**
- `loadAttestedAgents()` - Loads agents from AgentAttestation module
- `renderAttestedAgents()` - Renders attested agents list with:
  - Agent type icon and name
  - Bilateral verification status badge
  - Spending constraints
  - Expiry countdown
  - Payment rails
- "Attest Agent" button in empty state
- "+ Attest Agent" button in attested agents section

### 3. `api.js`
**Added:**
- `API.submitDelegation(credential)` - POST to `/observer/delegations`
- `API.getDelegationsByHuman(pubkey)` - GET from `/observer/delegations/{pubkey}`

### 4. `index.html`
**Added:**
- Script includes: `delegation-credential.js`, `agent-attestation.js`
- "+ Attest Agent" button in identity card header
- Title updated to "Phase 4 Agent Attestation"
- AgentAttestation initialization in `initDashboard()`

### 5. `config.js`
**Updated:**
- Version: `2.3.0-phase4-agent-attestation`
- Added: `AGENT_ATTESTATION_VERSION: '1.0'`

## UI Flow

### Step 1: Select Agent Type
- Modal opens with 6 agent type tiles
- Each tile shows icon, name, description
- Alby Hub shows detection status

### Step 2: Identify Agent
- **Alby Hub:** Auto-detected from WebLN (skip to constraints)
- **Others:** Manual input with validation
- Input validation based on agent type regex

### Step 3: Set Constraints
- Max per transaction (1,000 - 10,000,000 sats)
- Max per month (10,000 - 100,000,000 sats)
- Payment rails checkboxes (lightning, x402, l402, solana)
- Expiry date picker (default: 90 days)

### Step 4: Sign Delegation
- Shows delegation summary
- "Sign with My Key" button
- Displays signing status
- Attempts agent co-signature
- Shows final status:
  - ✅ Bilateral (both signed)
  - ⏸️ Human-attested only (agent offline)

### Post-Signing
- Credential stored in IndexedDB
- Submitted to OP (if reachable)
- UI updates to show attested agent
- Rep scoring begins (bilateral = full weight)

## Verification Status

| Status | Badge | Description |
|--------|-------|-------------|
| `bilateral` | ✅ Verified | Both human and agent signed |
| `human_attested` | ⏸️ Pending | Human signed, awaiting agent |
| `pending` | ⏳ Creating | In progress |

## Constraint Enforcement

Constraints are validated at:
1. **Creation time** - UI enforces min/max values
2. **Signing time** - Module validates before signing
3. **Storage time** - IndexedDB stores verified constraints
4. **OP submission** - Server validates constraints

## API Endpoints

```
POST /observer/delegations
- Submit delegation credential
- Body: Credential JSON
- Response: { success: true, receipt: {...} }

GET /observer/delegations/{human_pubkey}
- Fetch human's delegations
- Response: { delegations: [...] }
```

## Storage Schema

### IndexedDB: `attested_agents` session
```javascript
{
  agents: [
    {
      credential: { /* DelegationCredential */ },
      storedAt: 1711468800000,
    }
  ]
}
```

## Testing

### Manual Testing Checklist
- [ ] Open "Attest Agent" modal from dashboard
- [ ] Select each agent type (UI renders correctly)
- [ ] Test Alby Hub detection (if extension installed)
- [ ] Test manual pubkey entry with validation
- [ ] Set custom constraints
- [ ] Sign delegation (requires unlocked identity)
- [ ] Verify credential stored in IndexedDB
- [ ] Check attested agent appears in Delegation tab
- [ ] Test bilateral vs human-attested display

### Browser Testing
- [ ] Chrome (WebLN support)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## Security Considerations

1. **Private Key Handling**
   - Only accessible when identity is unlocked
   - Stored only in memory (never localStorage)
   - Signing happens client-side only

2. **Credential Validation**
   - Constraints validated before signing
   - Signatures verified before storage
   - Expiry checked on load

3. **Agent Verification**
   - Bilateral = both parties signed
   - Human-attested = agent pending confirmation
   - Unverified = unknown counterparty

## Known Limitations

1. **Agent Co-Signature**
   - Currently placeholder implementation
   - Full implementation requires agent-side OP integration
   - Human-attested credentials are functional but at reduced rep weight

2. **WebLN Dependency**
   - Alby Hub detection requires browser extension
   - Falls back to manual entry if not available

3. **OP Submission**
   - Best-effort submission (doesn't block on failure)
   - Credentials are valid even if OP submission fails

## Future Enhancements

- Real-time agent co-signature via WebSocket
- Agent-initiated attestation requests
- Multi-signature agent support
- Constraint templates (conservative, moderate, aggressive)
- Agent reputation preview before attesting
