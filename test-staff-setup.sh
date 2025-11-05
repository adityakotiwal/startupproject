#!/bin/bash

# Quick Staff Setup Test for GymSync Pro
echo "🧪 Testing Staff Setup..."

# Check if environment variables are set
if [ -f ".env.local" ]; then
    echo "✅ .env.local file found"
    
    if grep -q "SUPABASE_SERVICE_ROLE_KEY=YOUR_" .env.local; then
        echo "⚠️  WARNING: Service role key not set in .env.local"
        echo "   Please update SUPABASE_SERVICE_ROLE_KEY with your actual key from Supabase Dashboard"
    else
        echo "✅ Service role key appears to be set"
    fi
else
    echo "❌ .env.local file not found"
fi

# Check if staff table SQL exists
if [ -f "setup_staff_rls.sql" ]; then
    echo "✅ Staff RLS setup file found"
else
    echo "❌ Staff RLS setup file not found"
fi

# Check Node modules
if [ -d "node_modules" ]; then
    echo "✅ Node modules installed"
else
    echo "⚠️  Node modules not found - run 'npm install'"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Get your service role key from Supabase Dashboard > Settings > API"
echo "2. Update .env.local with the actual service role key"
echo "3. Run the SQL in setup_staff_rls.sql in your Supabase SQL Editor"
echo "4. Restart your dev server: npm run dev"
echo ""
echo "🎯 Then test the staff page at: http://localhost:3000/staff"