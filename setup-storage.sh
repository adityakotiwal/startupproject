#!/bin/bash

# GymSync Pro - Storage Setup Script
# This script helps you set up storage buckets in Supabase

echo "🎨 GymSync Pro - Storage Buckets Setup"
echo "======================================"
echo ""
echo "This script will guide you through setting up storage buckets."
echo ""
echo "📦 Required Buckets:"
echo "  1. profiles     - For gym owner profile pictures"
echo "  2. gym-assets   - For gym logos and other assets"
echo ""
echo "⚠️  IMPORTANT: You need to run SQL scripts in Supabase SQL Editor"
echo ""
echo "Steps to follow:"
echo ""
echo "1️⃣  Go to your Supabase Dashboard"
echo "    URL: https://supabase.com/dashboard/project/YOUR_PROJECT_ID"
echo ""
echo "2️⃣  Navigate to: SQL Editor (in left sidebar)"
echo ""
echo "3️⃣  Click 'New Query'"
echo ""
echo "4️⃣  Copy and paste the contents of these files:"
echo ""
echo "    📄 File 1: create_storage_buckets.sql"
echo "       Creates storage buckets and policies"
echo ""
echo "    📄 File 2: add_image_url_columns.sql"
echo "       Adds columns to store image URLs"
echo ""
echo "5️⃣  Run each query separately"
echo ""
echo "6️⃣  Verify buckets were created:"
echo "    Go to: Storage (in left sidebar)"
echo "    You should see: profiles, gym-assets"
echo ""
echo "======================================"
echo "✅ After setup, your app will be able to:"
echo "   - Upload profile pictures"
echo "   - Upload gym logos"
echo "   - Display images from public URLs"
echo "======================================"
echo ""

read -p "Press Enter to continue..."

echo ""
echo "🔍 Checking if SQL files exist..."
echo ""

if [ -f "create_storage_buckets.sql" ]; then
    echo "✅ create_storage_buckets.sql found"
else
    echo "❌ create_storage_buckets.sql not found"
    echo "   Please ensure you're running this script from the project root"
fi

if [ -f "add_image_url_columns.sql" ]; then
    echo "✅ add_image_url_columns.sql found"
else
    echo "❌ add_image_url_columns.sql not found"
    echo "   Please ensure you're running this script from the project root"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Open Supabase Dashboard"
echo "2. Go to SQL Editor"
echo "3. Run create_storage_buckets.sql"
echo "4. Run add_image_url_columns.sql"
echo "5. Verify in Storage section"
echo ""
echo "💡 Need help? Check the README.md for detailed instructions"
echo ""
