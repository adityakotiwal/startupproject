#!/bin/bash

# Setup script for GymSync Pro database
echo "Setting up GymSync Pro database tables..."

# Check if we have supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Run the SQL to create members table
echo "Creating members table..."
supabase db push --db-url "postgresql://postgres.crhgmqcjmiarbgmxagkk:GymSync2024@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" --file sql/create_members_table.sql

echo "Database setup complete!"
echo "You can now add members to your gym management system."