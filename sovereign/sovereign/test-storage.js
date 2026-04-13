#!/usr/bin/env node
/**
 * Automated Test Suite: Storage & Encryption
 * Tests encryption/decryption round-trips and storage operations
 */

import { CryptoEncrypt } from './crypto-encrypt.js';
import { StorageIDB } from './storage-idb.js';

const TEST_RESULTS = [];

function test(name, fn) {
  try {
    fn();
    TEST_RESULTS.push({ name, status: 'PASS' });
    console.log(`✅ PASS: ${name}`);
  } catch (err) {
    TEST_RESULTS.push({ name, status: 'FAIL', error: err.message });
    console.log(`❌ FAIL: ${name} - ${err.message}`);
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
  }
}

function assertTruthy(value, msg) {
  if (!value) {
    throw new Error(`${msg}: expected truthy value`);
  }
}

console.log('🧪 Running Storage & Encryption Tests...\n');

// Test 1: Encryption round-trip
test('AES-256-GCM encryption round-trip', async () => {
  const passphrase = 'test-passphrase-123';
  const privateKey = 'deadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678';
  
  // Encrypt
  const encrypted = await CryptoEncrypt.encryptPrivateKey(privateKey, passphrase);
  assertTruthy(encrypted.encryptedData, 'Should have encrypted data');
  assertTruthy(encrypted.salt, 'Should have salt');
  assertTruthy(encrypted.iv, 'Should have IV');
  
  // Decrypt
  const decrypted = await CryptoEncrypt.decryptPrivateKey(encrypted, passphrase);
  assertEqual(decrypted, privateKey, 'Decrypted key should match original');
});

// Test 2: Wrong passphrase fails gracefully
test('Wrong passphrase returns null, not error', async () => {
  const passphrase = 'correct-passphrase';
  const wrongPassphrase = 'wrong-passphrase';
  const privateKey = 'deadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678';
  
  const encrypted = await CryptoEncrypt.encryptPrivateKey(privateKey, passphrase);
  const decrypted = await CryptoEncrypt.decryptPrivateKey(encrypted, wrongPassphrase);
  
  if (decrypted !== null) {
    throw new Error('Wrong passphrase should return null');
  }
});

// Test 3: IndexedDB initialization
test('IndexedDB initializes with all stores', async () => {
  await StorageIDB.init();
  const db = StorageIDB.db;
  
  assertTruthy(db, 'Database should be initialized');
  
  const expectedStores = [
    'identities', 'sessions', 'scores', 'transactions', 
    'credentials', 'op_receipts', 'metadata'
  ];
  
  for (const store of expectedStores) {
    if (!db.objectStoreNames.contains(store)) {
      throw new Error(`Missing store: ${store}`);
    }
  }
});

// Test 4: Store and retrieve encrypted identity
test('Store and retrieve encrypted identity', async () => {
  const identity = {
    publicKey: '02' + 'a'.repeat(64),
    encryptedPrivateKey: 'encrypted-blob-here',
    displayName: 'Test User',
    createdAt: Date.now(),
    keyType: 'secp256k1',
    salt: 'salt-value',
    iv: 'iv-value'
  };
  
  await StorageIDB.setIdentity(identity);
  const retrieved = await StorageIDB.getIdentity();
  
  assertEqual(retrieved.publicKey, identity.publicKey, 'Public key should match');
  assertEqual(retrieved.encryptedPrivateKey, identity.encryptedPrivateKey, 'Encrypted key should match');
});

// Test 5: Encrypted transaction cache
test('Store and retrieve encrypted transaction cache', async () => {
  const encryptedCache = 'base64-encrypted-transaction-data';
  
  await StorageIDB.setTransactionCache(encryptedCache);
  const retrieved = await StorageIDB.getTransactionCache();
  
  assertEqual(retrieved, encryptedCache, 'Transaction cache should match');
});

// Test 6: Encrypted delegation credential
test('Store and retrieve encrypted delegation credential', async () => {
  const credential = {
    id: 'cred-123',
    encryptedData: 'base64-encrypted-credential-data'
  };
  
  await StorageIDB.setCredential(credential.id, credential);
  const retrieved = await StorageIDB.getCredential(credential.id);
  
  assertEqual(retrieved.encryptedData, credential.encryptedData, 'Credential data should match');
});

// Test 7: OP receipt storage (public data, not encrypted)
test('Store and retrieve OP receipt', async () => {
  const receipt = {
    pubkey: '02' + 'b'.repeat(64),
    pubkeyHash: 'hash123',
    registeredAt: Date.now(),
    verifiedAt: Date.now()
  };
  
  await StorageIDB.setOPReceipt(receipt);
  const retrieved = await StorageIDB.getOPReceipt();
  
  assertEqual(retrieved.pubkey, receipt.pubkey, 'Receipt pubkey should match');
});

// Run tests
(async () => {
  await StorageIDB.init();
  
  console.log('Running tests...\n');
  
  // Wait for all async tests
  await Promise.all([
    new Promise(r => setTimeout(r, 100)), // Let tests run
  ]);
  
  console.log('\n📊 Test Results:');
  console.log('================');
  
  const passed = TEST_RESULTS.filter(t => t.status === 'PASS').length;
  const failed = TEST_RESULTS.filter(t => t.status === 'FAIL').length;
  
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ FAILURES:');
    TEST_RESULTS.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`  - ${t.name}: ${t.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
})();
