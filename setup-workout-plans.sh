#!/bin/bash

# 🏋️ Workout Plans Database Setup Script
# This script sets up the workout plans feature in Supabase

echo "🏋️ Setting up Workout Plans Database..."
echo "========================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "📥 Install it with: npm install -g supabase"
    echo "   Or use the SQL Editor in Supabase Dashboard instead"
    echo ""
    echo "📋 Manual Setup Instructions:"
    echo "   1. Open https://app.supabase.com"
    echo "   2. Select your project"
    echo "   3. Go to SQL Editor"
    echo "   4. Copy contents of create_workout_plans_tables.sql"
    echo "   5. Paste and run in SQL Editor"
    exit 1
fi

# Check if project is linked
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "⚠️  Supabase project not linked!"
    echo "🔗 Run: supabase link --project-ref your-project-ref"
    exit 1
fi

echo "✅ Supabase CLI found"
echo "📤 Executing SQL schema..."
echo ""

# Run the SQL file
if supabase db push --db-url "$(supabase status --output json | jq -r .db_url)" < create_workout_plans_tables.sql; then
    echo ""
    echo "✅ Database schema created successfully!"
    echo ""
    echo "📊 Verifying tables..."
    
    # Verify tables
    TABLES=$(supabase db execute "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%workout%'" --output csv | tail -1)
    
    if [ "$TABLES" -eq "6" ]; then
        echo "✅ All 6 tables created:"
        echo "   - workout_plan_templates"
        echo "   - workout_exercises"
        echo "   - member_workout_plans"
        echo "   - member_workout_exercises"
        echo "   - workout_logs"
        echo "   - exercise_library"
        echo ""
        
        # Check exercise library
        EXERCISES=$(supabase db execute "SELECT COUNT(*) FROM exercise_library" --output csv | tail -1)
        echo "✅ Exercise library populated with $EXERCISES exercises"
        echo ""
        
        echo "🎉 Setup Complete!"
        echo ""
        echo "📋 Next Steps:"
        echo "   1. Start your dev server: npm run dev"
        echo "   2. Navigate to: http://localhost:3000/workout-plans"
        echo "   3. Start creating workout plans!"
        echo ""
        
    else
        echo "⚠️  Expected 6 tables but found $TABLES"
        echo "   Please check for errors above"
    fi
else
    echo ""
    echo "❌ Error executing SQL schema"
    echo "💡 Try manual setup instead:"
    echo "   1. Open Supabase Dashboard SQL Editor"
    echo "   2. Copy contents of create_workout_plans_tables.sql"
    echo "   3. Paste and run"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ Workout Plans Setup Complete!"
echo "========================================"
