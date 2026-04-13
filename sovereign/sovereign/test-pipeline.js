#!/usr/bin/env node
/**
 * Automated Test Suite: Transaction Pipeline
 * Tests transaction fetching, caching, verification, and export
 */

import { TransactionPipeline } from './transaction-pipeline.js';

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

console.log('🧪 Running Transaction Pipeline Tests...\n');

// Test 1: 90-day window calculation
test('90-day window calculation is correct', () => {
  const now = Date.now();
  const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
  const window = TransactionPipeline.getCacheWindow();
  
  const diff = Math.abs(window.start - ninetyDaysAgo);
  if (diff > 1000) { // Allow 1 second tolerance
    throw new Error(`90-day window incorrect: diff=${diff}ms`);
  }
});

// Test 2: Transaction hash verification
test('Hash verification catches tampered transaction', () => {
  const tx = {
    id: 'tx-123',
    amount: 1000,
    recipient: 'recipient-pubkey',
    timestamp: Date.now()
  };
  
  // Generate hash
  const hash = TransactionPipeline.computeHash(tx);
  assertTruthy(hash, 'Should generate hash');
  
  // Verify original
  const isValid = TransactionPipeline.verifyTransactionHash(tx, hash);
  if (!isValid) {
    throw new Error('Original transaction should verify');
  }
  
  // Tamper and verify fails
  const tamperedTx = { ...tx, amount: 2000 };
  const isTamperedValid = TransactionPipeline.verifyTransactionHash(tamperedTx, hash);
  if (isTamperedValid) {
    throw new Error('Tampered transaction should fail verification');
  }
});

// Test 3: CSV export format
test('CSV export produces valid format', () => {
  const transactions = [
    {
      id: 'tx-1',
      timestamp: Date.now(),
      amount: 1000,
      recipient: 'recipient-1',
      description: 'Test payment',
      rail: 'lightning'
    }
  ];
  
  const csv = TransactionPipeline.exportToCSV(transactions);
  
  // Check headers
  if (!csv.includes('ID,Timestamp,Amount,Recipient,Description,Rail')) {
    throw new Error('CSV missing expected headers');
  }
  
  // Check data row
  if (!csv.includes('tx-1')) {
    throw new Error('CSV missing transaction data');
  }
  
  // Check proper escaping
  if (csv.includes('Test,payment')) {
    throw new Error('CSV not properly escaping commas');
  }
});

// Test 4: JSON export round-trip
test('JSON export round-trips correctly', () => {
  const transactions = [
    {
      id: 'tx-1',
      timestamp: 1234567890,
      amount: 1000,
      recipient: 'recipient-1',
      description: 'Test payment',
      rail: 'lightning'
    }
  ];
  
  const json = TransactionPipeline.exportToJSON(transactions);
  const parsed = JSON.parse(json);
  
  if (parsed.length !== 1) {
    throw new Error('JSON export should contain 1 transaction');
  }
  
  if (parsed[0].id !== 'tx-1') {
    throw new Error('JSON round-trip failed: ID mismatch');
  }
});

// Test 5: Empty transactions handling
test('Zero transactions produces valid empty export', () => {
  const csv = TransactionPipeline.exportToCSV([]);
  assertEqual(csv, 'No transactions to export', 'Empty CSV should return message');
  
  const json = TransactionPipeline.exportToJSON([]);
  assertEqual(json, '[]', 'Empty JSON should be empty array');
});

// Test 6: Cache size estimation
test('Cache size estimation works', () => {
  const cache = {
    transactions: Array(100).fill({ id: 'tx', amount: 1000 }),
    lastUpdated: Date.now()
  };
  
  const size = TransactionPipeline.estimateCacheSize(cache);
  if (size <= 0) {
    throw new Error('Cache size should be positive');
  }
});

// Test 7: Transaction validation
test('Invalid transactions are rejected', () => {
  const invalidTx = {
    // Missing required fields
    amount: 1000
  };
  
  const isValid = TransactionPipeline.validateTransaction(invalidTx);
  if (isValid) {
    throw new Error('Invalid transaction should be rejected');
  }
});

// Test 8: Pruning old transactions
test('Pruning removes oldest transactions first', () => {
  const now = Date.now();
  const oldTx = { id: 'old', timestamp: now - (100 * 24 * 60 * 60 * 1000) }; // 100 days old
  const newTx = { id: 'new', timestamp: now - (10 * 24 * 60 * 60 * 1000) };  // 10 days old
  
  const transactions = [newTx, oldTx];
  const pruned = TransactionPipeline.pruneTo90Days(transactions);
  
  if (pruned.length !== 1) {
    throw new Error('Should prune to 1 transaction (90 days)');
  }
  
  if (pruned[0].id !== 'new') {
    throw new Error('Should keep newer transaction, not older');
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
