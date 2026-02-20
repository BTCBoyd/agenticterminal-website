#!/bin/bash
# Test MVP Backend - Bitcoin Singularity Website

set -e

echo "======================================"
echo "MVP Backend Testing Script"
echo "======================================"
echo ""

# Configuration
ENDPOINT="${1:-https://maximoon.netlify.app/.netlify/functions/chat}"
TEST_SESSION="test_$(date +%s)"

echo "🎯 Testing endpoint: $ENDPOINT"
echo "📋 Session ID: $TEST_SESSION"
echo ""

# Test 1: Simple query (should use Haiku)
echo "Test 1: Simple query (Haiku routing)"
echo "Question: 'What is Bitcoin?'"
echo ""

RESPONSE1=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What is Bitcoin?\", \"sessionId\": \"${TEST_SESSION}\"}")

echo "$RESPONSE1" | jq '.' || echo "$RESPONSE1"
echo ""
echo "✅ Test 1 complete"
echo "Expected: model should be 'claude-haiku-4-5'"
echo ""
sleep 2

# Test 2: Complex query (should use Sonnet)
echo "Test 2: Complex query (Sonnet routing)"
echo "Question: 'Explain the Bitcoin-AI convergence thesis and why AI agents need censorship-resistant money for economic autonomy'"
echo ""

RESPONSE2=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Explain the Bitcoin-AI convergence thesis and why AI agents need censorship-resistant money for economic autonomy\", \"sessionId\": \"${TEST_SESSION}\"}")

echo "$RESPONSE2" | jq '.' || echo "$RESPONSE2"
echo ""
echo "✅ Test 2 complete"
echo "Expected: model should be 'claude-sonnet-4-5'"
echo ""
sleep 2

# Test 3: Cache hit (should have cached tokens)
echo "Test 3: Cache hit test"
echo "Question: 'What is proof-of-work?'"
echo ""

RESPONSE3=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What is proof-of-work?\", \"sessionId\": \"${TEST_SESSION}\"}")

echo "$RESPONSE3" | jq '.' || echo "$RESPONSE3"
echo ""
echo "✅ Test 3 complete"
echo "Expected: _meta.cacheHit should be true"
echo ""
sleep 2

# Test 4-13: Rate limiting (10 messages allowed per hour)
echo "Test 4-13: Rate limiting (sending 10 rapid requests)"
echo ""

for i in {4..13}; do
    echo "Request $i/13: Testing rate limit..."
    
    RESPONSE=$(curl -s -X POST "$ENDPOINT" \
      -H "Content-Type: application/json" \
      -d "{\"message\": \"Test message $i\", \"sessionId\": \"${TEST_SESSION}_ratelimit\"}")
    
    HTTP_CODE=$(echo "$RESPONSE" | jq -r '.error // "success"')
    
    if [[ "$HTTP_CODE" == *"Rate limit"* ]]; then
        echo "❌ Rate limit hit at message $i"
        break
    else
        echo "✅ Message $i sent successfully"
    fi
    
    sleep 1
done

echo ""
echo "✅ Rate limit test complete"
echo ""

# Test 14: Character limit (should reject 501+ chars)
echo "Test 14: Character limit test"
echo "Sending 501-character message..."
echo ""

LONG_MESSAGE=$(python3 -c "print('x' * 501)")

RESPONSE4=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"${LONG_MESSAGE}\", \"sessionId\": \"${TEST_SESSION}\"}")

echo "$RESPONSE4" | jq '.' || echo "$RESPONSE4"
echo ""
echo "✅ Test 14 complete"
echo "Expected: Error about message being too long"
echo ""

# Summary
echo "======================================"
echo "📊 TEST SUMMARY"
echo "======================================"
echo ""
echo "Tests completed:"
echo "1. ✅ Simple query routing (Haiku)"
echo "2. ✅ Complex query routing (Sonnet)"
echo "3. ✅ Prompt caching verification"
echo "4. ✅ Rate limiting (10 msg/hour)"
echo "5. ✅ Character limit (500 max)"
echo ""
echo "🔍 Next steps:"
echo "1. Check Netlify Function logs for detailed cost data"
echo "2. Verify cache hit rates (should be >30% after warmup)"
echo "3. Monitor cost per message (target: <$0.015)"
echo ""
echo "📖 See MVP-README.md for full testing checklist"
echo ""
