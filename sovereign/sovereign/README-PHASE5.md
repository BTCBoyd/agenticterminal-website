# Sovereign Dashboard - Phase 5: Storage Architecture

## Overview

Phase 5 completes the client-side storage architecture for the Sovereign Dashboard. All user data is stored locally — **no server stores user data**.

## Storage Architecture

| Data Type | Storage Location | Encryption |
|-----------|-----------------|------------|
| Private key | IndexedDB | AES-256-GCM ✅ |
| Public key | IndexedDB + localStorage | None (public) ✅ |
| Passphrase-derived session key | Memory only | N/A ✅ |
| Delegation credentials | IndexedDB | AES-256-GCM ✅ |
| Transaction cache | IndexedDB | AES-256-GCM ✅ |
| OP verification receipt | IndexedDB | None (public attestation) ✅ |
| Backup confirmed flag | IndexedDB | N/A ✅ |
| User preferences | localStorage | N/A ✅ |

## Features

### 1. Transaction Data Pipeline (`transaction-pipeline.js`)

- **Fetch**: Retrieves transaction history from OP API
  - Endpoint: `GET /observer/agents/{pubkey}/transactions`
  - Supports incremental updates with `?since={timestamp}`
- **Verify**: Verifies transaction integrity against local keypair
- **Cache**: Encrypted storage in IndexedDB
- **Export**: CSV and JSON export from Transactions tab
- **Rolling Window**: 90-day default (configurable to unlimited)

### 2. Storage Manager (`storage-manager.js`)

- **Quota Monitoring**: Real-time storage usage tracking
- **Configurable Limits**: Default 100MB (10MB - 1GB range)
- **Auto-pruning**: Automatic cleanup at 95% capacity
- **Warning System**: User prompts at 80% capacity
- **Breakdown**: Detailed storage usage by component

### 3. Cross-Device Access (V1)

Sovereign Dashboard supports cross-device access through the existing export/import system:

#### Export Identity
1. Go to Identity → Export
2. Download `.sovereign` file (encrypted identity bundle)
3. Contains: encrypted private key, public key, metadata

#### Import on New Device
1. On new device, go to login → Import
2. Select `.sovereign` file
3. Enter passphrase to decrypt
4. Identity restored — **OP registration not required**

#### Transaction Cache Rebuild
- On first load after import, cache rebuilds from OP API
- No manual intervention needed
- Preserves 90-day rolling window setting

#### V1 Limitations
- Transaction cache does not sync between devices
- Each device maintains independent cache
- OP serves as source of truth for all transaction history
- Future V2: Encrypted sync via peer-to-peer or encrypted cloud

### 4. Session Model

```
User visits → Detect encrypted keypair in IndexedDB
    ↓
Prompt for passphrase
    ↓
Passphrase → PBKDF2 (100k iterations) → AES key
    ↓
Decrypt private key to memory (session key)
    ↓
Dashboard loads with full functionality
    ↓
[30 min inactivity] → Clear session key → Re-prompt
    ↓
[Explicit logout] → Clear session key + optional cache clear
```

## Configuration

### Storage Limits

```javascript
// Default: 100MB
localStorage.setItem('SOVEREIGN_STORAGE_LIMIT_MB', '200');

// Range: 10MB - 1GB
```

### Cache Window

```javascript
// Default: 90 days
localStorage.setItem('SOVEREIGN_CACHE_DAYS', '30');

// Unlimited: 'unlimited'
// Range: 7 days - 5 years
```

## API Endpoints

### Transaction Endpoints

```
GET /observer/agents/{pubkey}/transactions
GET /observer/agents/{pubkey}/transactions?since={timestamp}
GET /observer/agents/{pubkey}/transactions/summary
GET /observer/transactions/{txId}
GET /observer/transactions/{txId}/verify
GET /observer/transactions/types
```

## Security Considerations

### Encryption

- **Private Key**: AES-256-GCM with PBKDF2-derived key (100k iterations)
- **Transaction Cache**: Encrypted with session-derived key
- **Credentials**: Encrypted with session-derived key
- **Session Key**: Memory-only, cleared on inactivity/logout

### Storage Warnings

- At 80% capacity: User prompt to export and prune
- At 95% capacity: Automatic pruning of oldest data
- Critical alerts shown in Settings → Storage Management

## Testing

### Transaction Pipeline

```javascript
// Fetch and cache transactions
await TransactionPipeline.init();
await TransactionPipeline.updateCache(pubkey);

// Get cached transactions
const txs = TransactionPipeline.getTransactions({ limit: 100 });

// Export
const csv = TransactionPipeline.exportToCSV();
TransactionPipeline.downloadExport(csv, 'tx.csv', 'text/csv');
```

### Storage Manager

```javascript
// Check quota
const quota = await StorageManager.getQuota();
console.log(`${quota.formatted.usage} / ${quota.formatted.limit}`);

// Check health
const health = await StorageManager.getHealthStatus();
console.log(health.status); // 'healthy' | 'warning' | 'critical'
```

## Files

| File | Purpose |
|------|---------|
| `transaction-pipeline.js` | Fetch, verify, cache, export transactions |
| `storage-manager.js` | Storage limits, pruning, quota monitoring |
| `storage-idb.js` | IndexedDB operations with encryption |
| `config.js` | Storage and cache configuration |
| `api.js` | Transaction API endpoints |

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Requires: IndexedDB, WebCrypto API, Storage API

## Version

Phase 5: `2.5.0-phase5-storage-architecture`
- Storage version: 1.0
- Database version: 3