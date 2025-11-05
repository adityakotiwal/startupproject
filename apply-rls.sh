#!/bin/bash

# Apply Row Level Security Policies for GymSync Pro
# This script ensures proper data isolation between gyms

echo "🔒 Applying Row Level Security policies to ensure gym data isolation..."

# Read the SQL file and execute it
if [ -f "sql/rls_policies.sql" ]; then
    echo "📄 Found RLS policies file. Executing..."
    
    # Check if SUPABASE_URL and SUPABASE_ANON_KEY are set
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set"
        echo "Please add these to your .env.local file:"
        echo "SUPABASE_URL=your_supabase_url"
        echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
        exit 1
    fi
    
    # Use curl to execute the SQL via Supabase REST API
    response=$(curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"sql\": \"$(cat sql/rls_policies.sql | sed 's/"/\\"/g' | tr '\n' ' ')\"}")
    
    if [ $? -eq 0 ]; then
        echo "✅ RLS policies applied successfully!"
        echo "🔐 Data isolation is now enforced at the database level"
        echo ""
        echo "What this means:"
        echo "- Each gym can only access its own data"
        echo "- No cross-gym data leakage is possible"
        echo "- Security is enforced even if frontend bugs exist"
    else
        echo "❌ Error applying RLS policies"
        echo "Response: $response"
    fi
else
    echo "❌ RLS policies file not found at sql/rls_policies.sql"
    echo "Please run this script from the project root directory"
fi