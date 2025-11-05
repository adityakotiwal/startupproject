#!/bin/bash

# WhatsApp Database Setup Script
# This script will create the whatsapp_messages table in your Supabase database

echo "🚀 Setting up WhatsApp Messages Database..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

# Load environment variables
source .env.local

# Check if required variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    echo "Please add these to your .env.local file"
    exit 1
fi

echo "📊 Database: $SUPABASE_URL"
echo "📝 Running SQL migration..."
echo ""

# Execute the SQL file using curl
RESPONSE=$(curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d @<(cat <<EOF
{
  "query": "$(cat create_whatsapp_messages_table.sql | sed 's/"/\\"/g' | tr '\n' ' ')"
}
EOF
))

# Alternatively, use psql if you have it installed
if command -v psql &> /dev/null; then
    echo "Using psql to execute migration..."
    
    # Extract database connection details from SUPABASE_URL
    DB_HOST=$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/\.supabase\.co.*//')
    
    # Note: You'll need your database password for this
    echo ""
    echo "Manual SQL Execution:"
    echo "1. Go to: ${SUPABASE_URL/https:\/\//https://app.supabase.com/project/}"
    echo "2. Click 'SQL Editor' in the left sidebar"
    echo "3. Copy content from: create_whatsapp_messages_table.sql"
    echo "4. Paste and click 'Run'"
    echo ""
else
    echo ""
    echo "⚠️  Automatic execution not available"
    echo ""
    echo "📝 Please run the SQL manually:"
    echo ""
    echo "1. Go to: https://app.supabase.com/project/wqslptbmmujqctbedthu"
    echo "2. Click 'SQL Editor' in the left sidebar"
    echo "3. Click 'New Query'"
    echo "4. Copy ENTIRE content from: create_whatsapp_messages_table.sql"
    echo "5. Paste and click 'Run'"
    echo "6. Look for 'Success' message ✅"
    echo ""
fi

echo "✅ Setup instructions displayed!"
echo ""
echo "📱 Next: Join WhatsApp Sandbox"
echo "   1. Open WhatsApp on your phone"
echo "   2. Chat with: +1 415 523 8886"
echo "   3. Send: join product-thick"
echo "   4. Wait for confirmation"
echo ""
