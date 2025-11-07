#!/bin/bash

# Add notes column to equipment table
# Run this script to enable notes tracking for maintenance and warranty actions

echo "🔧 Adding notes column to equipment table..."

# Run the migration
psql $DATABASE_URL -f supabase/migrations/20251107_add_notes_to_equipment.sql

echo "✅ Notes column added successfully!"
echo ""
echo "You can now:"
echo "  - Add notes when marking maintenance as completed"
echo "  - Add notes when extending warranty"
echo "  - Add notes when filing warranty claims"
echo "  - Track equipment history with detailed notes"
