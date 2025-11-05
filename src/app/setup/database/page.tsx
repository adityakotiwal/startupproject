'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DatabaseSetup() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const createMembershipPlansTable = async () => {
    setLoading(true)
    setResult('')

    try {
      console.log('Creating membership_plans table...')
      
      // First check if table exists
      const { data: tables, error: listError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'membership_plans')

      if (listError) {
        console.log('Cannot check existing tables, proceeding with creation...')
      }

      // Create the table
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
        CREATE TABLE IF NOT EXISTS membership_plans (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL CHECK (price > 0),
          duration_days INTEGER NOT NULL CHECK (duration_days > 0),
          features JSONB,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- RLS Policy
        ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Gym owners can manage their membership plans" ON membership_plans;
        CREATE POLICY "Gym owners can manage their membership plans" ON membership_plans
          FOR ALL USING (
            gym_id IN (
              SELECT id FROM gyms WHERE owner_id = auth.uid()
            )
          );
        `
      })

      if (error) {
        console.error('Error creating table:', error)
        setResult(`Error: ${error.message}`)
      } else {
        setResult('✅ membership_plans table created successfully!')
        console.log('Table created successfully')
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setResult(`Unexpected error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testTableAccess = async () => {
    setLoading(true)
    setResult('')

    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('count(*)')
        .limit(1)

      if (error) {
        setResult(`❌ Table access error: ${error.message}`)
      } else {
        setResult('✅ membership_plans table is accessible!')
      }
    } catch (error) {
      setResult(`❌ Test failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Database Setup Utility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              onClick={createMembershipPlansTable} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create membership_plans Table'}
            </Button>
            
            <Button 
              onClick={testTableAccess} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Table Access'}
            </Button>
          </div>

          {result && (
            <div className={`p-4 rounded-md ${
              result.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {result}
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p><strong>Instructions:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Click &quot;Create membership_plans Table&quot; to set up the database table</li>
              <li>Click &quot;Test Table Access&quot; to verify everything works</li>
              <li>Go back to <a href="/setup/membership-plans" className="text-blue-600 underline">Membership Plans</a></li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}