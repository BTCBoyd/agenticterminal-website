#!/bin/bash
# View Maxi conversations in readable format
# Usage: ./view-conversations.sh [hours]
# Example: ./view-conversations.sh 24 (shows last 24 hours)

HOURS=${1:-24}
OUTPUT_FILE="conversations-$(date +%Y-%m-%d).txt"

echo "Fetching conversations from last $HOURS hours..."
echo "Output file: $OUTPUT_FILE"
echo ""

# Fetch function logs from Netlify
netlify functions:log chat --since "${HOURS}h" 2>/dev/null | \
  grep -A 30 "CONVERSATION LOG" | \
  grep -E "(timestamp|userQuestion|maxiResponse|conversationTurn|language)" | \
  sed 's/^[[:space:]]*//' > "$OUTPUT_FILE"

if [ -s "$OUTPUT_FILE" ]; then
  echo "✅ Conversations saved to: $OUTPUT_FILE"
  echo ""
  echo "Preview (first 50 lines):"
  echo "========================="
  head -50 "$OUTPUT_FILE"
  echo ""
  echo "Full file: $OUTPUT_FILE"
else
  echo "❌ No conversations found in last $HOURS hours"
  echo ""
  echo "Possible reasons:"
  echo "1. No one has used the chat yet"
  echo "2. Netlify CLI not authenticated (run: netlify login)"
  echo "3. Wrong site context (run: netlify link)"
  rm -f "$OUTPUT_FILE"
fi
