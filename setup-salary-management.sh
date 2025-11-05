#!/bin/bash

# GymSync Pro - Salary Management Quick Setup Script
# This script helps you set up the salary management feature

echo "💰 GymSync Pro - Salary Management Setup"
echo "========================================"
echo ""
echo "📋 This will help you set up the salary payment tracking system."
echo ""

# Check if user is in the right directory
if [ ! -f "create_staff_salary_payments.sql" ]; then
    echo "❌ Error: create_staff_salary_payments.sql not found!"
    echo "   Please run this script from the project root directory."
    exit 1
fi

echo "✅ Found SQL file"
echo ""

# Instructions
echo "📝 SETUP INSTRUCTIONS:"
echo "====================="
echo ""
echo "1. Open your Supabase Dashboard"
echo "   → https://app.supabase.com/"
echo ""
echo "2. Select your project"
echo ""
echo "3. Go to SQL Editor (left sidebar)"
echo ""
echo "4. Click 'New Query'"
echo ""
echo "5. Copy the contents of: create_staff_salary_payments.sql"
echo ""
echo "6. Paste into the SQL Editor"
echo ""
echo "7. Click 'Run' or press Ctrl+Enter"
echo ""
echo "8. You should see: 'Success. No rows returned'"
echo ""

read -p "Press Enter once you've completed the database setup..."

echo ""
echo "🔍 VERIFICATION:"
echo "==============="
echo ""
echo "Let's verify the setup..."
echo ""
echo "Go back to Supabase SQL Editor and run this query:"
echo ""
echo "  SELECT COUNT(*) FROM staff_salary_payments;"
echo ""
echo "You should see '0' (zero rows) without any errors."
echo ""

read -p "Did you see '0' without errors? (y/n): " verification

if [ "$verification" != "y" ] && [ "$verification" != "Y" ]; then
    echo ""
    echo "⚠️  Setup might not be complete. Please check:"
    echo "   1. Did you run the SQL script in Supabase?"
    echo "   2. Did you get any errors?"
    echo "   3. Try running the verification query again"
    echo ""
    echo "   If problems persist, check STAFF_SALARY_MANAGEMENT_GUIDE.md"
    exit 1
fi

echo ""
echo "✅ SETUP COMPLETE!"
echo "=================="
echo ""
echo "🎉 Your salary management system is ready!"
echo ""
echo "🚀 NEXT STEPS:"
echo "=============="
echo "1. Start your development server: npm run dev"
echo "2. Navigate to /staff page"
echo "3. Click the 'Pay' button (emerald/green) on any staff card"
echo "4. Record your first salary payment!"
echo "5. Click 'History' button (indigo) to view payment history"
echo ""
echo "📖 For detailed usage guide, see: STAFF_SALARY_MANAGEMENT_GUIDE.md"
echo ""
echo "💡 NEW FEATURES:"
echo "   • Pay Salary button - Record salary payments"
echo "   • History button - View all past payments"
echo "   • Bonus & deduction tracking"
echo "   • CSV export for salary records"
echo "   • Smart duplicate detection"
echo "   • Multiple payment modes"
echo ""
echo "✨ Happy managing! 💪"
