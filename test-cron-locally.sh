#!/bin/bash

# Test the cron job locally (requires CRON_SECRET from .env.local)

# Read CRON_SECRET from .env.local
CRON_SECRET=$(grep '^CRON_SECRET=' .env.local | cut -d '=' -f 2)

if [ -z "$CRON_SECRET" ]; then
  echo "❌ Error: CRON_SECRET not found in .env.local"
  exit 1
fi

echo "🔍 Testing cron job locally..."
echo "📧 This will attempt to send any pending reminders"
echo ""

# Make request to local dev server
curl -X POST http://localhost:3000/api/cron/send-reminders \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Check the output above for results"
echo "💡 Tip: Make sure 'npm run dev' is running first!"
