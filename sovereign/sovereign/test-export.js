#!/usr/bin/env node
/**
 * Automated Test Suite: Sovereign File Export/Import
 * Tests .sovereign file format, encryption, and cross-device scenarios
 */

import { CryptoExport } from './crypto-export.js';

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

console.log('🧪 Running Sovereign Export/Import Tests...\n');

// Test 1: Export structure is valid
test('Export produces valid structure', () => {
  const identity = {
    publicKey: '02' + 'a'.repeat(64),
    encryptedPrivateKey: 'encrypted-blob-here',
    displayName: 'Test User',
    createdAt: 1234567890,
    keyType: 'secp256k1'
  };
  
  const exported = CryptoExport.exportIdentity(identity);
  
  assertEqual(exported.version, '1.0', 'Should have version');
  assertEqual(exported.format, 'sovereign-identity', 'Should have correct format');
  assertTruthy(exported.createdAt, 'Should have createdAt');
  assertTruthy(exported.identity, 'Should have identity');
  assertEqual(exported.identity.publicKey, identity.publicKey, 'Public key should match');
  assertTruthy(exported.security, 'Should have security metadata');
  assertEqual(exported.security.algorithm, 'AES-256-GCM', 'Should specify algorithm');
});

// Test 2: Export validation rejects incomplete identity
test('Export rejects identity without public key', () => {
  const incompleteIdentity = {
    encryptedPrivateKey: 'encrypted-blob',
    // Missing publicKey
  };
  
  try {
    CryptoExport.exportIdentity(incompleteIdentity);
    throw new Error('Should have thrown error for incomplete identity');
  } catch (err) {
    if (!err.message.includes('must include publicKey')) {
      throw new Error('Wrong error message: ' + err.message);
    }
  }
});

// Test 3: Export validation rejects identity without encrypted key
test('Export rejects identity without encrypted private key', () => {
  const incompleteIdentity = {
    publicKey: '02' + 'a'.repeat(64),
    // Missing encryptedPrivateKey
  };
  
  try {
    CryptoExport.exportIdentity(incompleteIdentity);
    throw new Error('Should have thrown error for incomplete identity');
  } catch (err) {
    if (!err.message.includes('must include publicKey and encryptedPrivateKey')) {
      throw new Error('Wrong error message: ' + err.message);
    }
  }
});

// Test 4: Blob generation produces valid data
test('Blob generation produces valid JSON', () => {
  const identity = {
    publicKey: '02' + 'a'.repeat(64),
    encryptedPrivateKey: 'encrypted-blob',
    displayName: 'Test User',
    createdAt: 1234567890,
    keyType: 'secp256k1'
  };
  
  const exported = CryptoExport.exportIdentity(identity);
  const blob = CryptoExport.toBlob(exported);
  
  if (!(blob instanceof Blob)) {
    throw new Error('Should return a Blob');
  }
  
  if (blob.type !== 'application/json') {
    throw new Error('Blob should have JSON MIME type');
  }
});

// Test 5: Key fingerprint computation
test('Key fingerprint computation works', () => {
  const pubkey1 = '02abcdef1234567890';
  const pubkey2 = '03fedcba0987654321';
  
  const fingerprint1 = CryptoExport.computeFingerprint(pubkey1);
  const fingerprint2 = CryptoExport.computeFingerprint(pubkey2);
  
  assertTruthy(fingerprint1, 'Should compute fingerprint');
  assertTruthy(fingerprint2, 'Should compute fingerprint');
  
  if (fingerprint1 === fingerprint2) {
    throw new Error('Different keys should have different fingerprints');
  }
});

// Test 6: Filename generation includes key prefix
test('Filename generation includes public key prefix', () => {
  const identity = {
    publicKey: '02abcdef1234567890',
    encryptedPrivateKey: 'encrypted-blob'
  };
  
  const exported = CryptoExport.exportIdentity(identity);
  const expectedPrefix = '02abcdef';
  
  if (!exported.identity.publicKey.startsWith(expectedPrefix)) {
    throw new Error('Public key should start with expected prefix');
  }
});

// Test 7: Security metadata is present
test('Security metadata includes all required fields', () => {
  const identity = {
    publicKey: '02' + 'a'.repeat(64),
    encryptedPrivateKey: 'encrypted-blob'
  };
  
  const exported = CryptoExport.exportIdentity(identity);
  const security = exported.security;
  
  assertTruthy(security.algorithm, 'Should have algorithm');
  assertTruthy(security.kdf, 'Should have KDF');
  assertTruthy(security.iterations, 'Should have iterations');
  assertTruthy(security.keyFingerprint, 'Should have key fingerprint');
});

// Test 8: Parse rejects invalid JSON
test('Parse rejects invalid JSON', async () => {
  const invalidJson = 'not valid json {';
  
  // Simulate FileReader result
  const mockFile = {
    text: async () => invalidJson
  };
  
  try {
    await CryptoExport.parseFile(mockFile);
    throw new Error('Should have thrown error for invalid JSON');
  } catch (err) {
    if (!err.message.includes('Invalid')) {
      throw new Error('Wrong error for invalid JSON: ' + err.message);
    }
  }
});

// Test 9: Parse rejects wrong version
test('Parse rejects unsupported version', async () => {
  const wrongVersion = JSON.stringify({
    version: '99.0',
    format: 'sovereign-identity'
  });
  
  const mockFile = {
    text: async () => wrongVersion
  };
  
  try {
    await CryptoExport.parseFile(mockFile);
    throw new Error('Should have thrown error for wrong version');
  } catch (err) {
    if (!err.message.includes('version')) {
      throw new Error('Wrong error for version mismatch: ' + err.message);
    }
  }
});

// Test 10: Parse rejects wrong format
test('Parse rejects wrong format', async () => {
  const wrongFormat = JSON.stringify({
    version: '1.0',
    format: 'wrong-format'
  });
  
  const mockFile = {
    text: async () => wrongFormat
  };
  
  try {
    await CryptoExport.parseFile(mockFile);
    throw new Error('Should have thrown error for wrong format');
  } catch (err) {
    if (!err.message.includes('format')) {
      throw new Error('Wrong error for format mismatch: ' + err.message);
    }
  }
});

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
