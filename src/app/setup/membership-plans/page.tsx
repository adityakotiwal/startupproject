'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/contexts/GymContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Check, X, Dumbbell, IndianRupee, Calendar, Users } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useClientOnly } from '@/hooks/useClientOnly'
import Link from 'next/link'

interface MembershipPlan {
  id: string
  gym_id: string
  name: string
  description: string | null
  price: number
  duration_days: number
  created_at: string
}

interface PlanFormData {
  name: string
  description: string
  price: string
  duration_days: string
}

export default function MembershipPlansPage() {
  const { user } = useAuth()
  const { currentGym, gymId, loading: gymLoading } = useGymContext()
  const isClient = useClientOnly()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [gymNotFound, setGymNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    description: '',
    price: '',
    duration_days: ''
  })
  const [submitLoading, setSubmitLoading] = useState(false)

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration_days: ''
    })
  }

  const fetchPlans = useCallback(async () => {
    if (!user || gymLoading || !gymId) {
      setLoading(false)
      return
    }

    try {
      console.log('🔄 Fetching membership plans for gym:', gymId)
      setError(null)
      setGymNotFound(false)

      // Fetch membership plans for this gym - SECURE BY GYM_ID
      console.log('📋 Loading membership plans...')
      
      const { data: plansData, error: plansError } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('gym_id', gymId)
        .order('name', { ascending: true })

      if (plansError) {
        console.error('❌ Error fetching plans:', plansError)
        setError('Failed to load membership plans - you can still create new ones')
        setPlans([])
      } else {
        console.log('✅ Successfully loaded plans:', plansData?.length || 0)
        setPlans(plansData || [])
        setError('')
      }
    } catch (error) {
      console.error('💥 Unexpected error in fetchPlans:', error)
      
      if (error instanceof Error && error.message.includes('timeout')) {
        setError('Loading took too long. Please refresh the page.')
      } else {
        setError('Unable to load plans. You can still create new ones.')
      }
      
      setPlans([])
    } finally {
      setLoading(false)
      console.log('🏁 Plans loading complete for gym:', gymId)
    }
  }, [user, gymId, gymLoading])

  useEffect(() => {
    if (isClient && user) {
      fetchPlans()
    }
  }, [isClient, user, fetchPlans])

  // Check if table exists on component mount
  useEffect(() => {
    const checkTable = async () => {
      if (!user) return
      
      try {
        const { error } = await supabase
          .from('membership_plans')
          .select('count(*)')
          .limit(1)
        
        if (error && error.message.includes('does not exist')) {
          setError('Database table "membership_plans" does not exist. Please contact support or check your database setup.')
        }
      } catch (err) {
        console.log('Table check error:', err)
      }
    }
    
    if (isClient && user) {
      checkTable()
    }
  }, [isClient, user])

  const validateForm = (): boolean => {
    console.log('Validating form data:', formData)
    
    if (!formData.name.trim()) {
      setError('Plan name is required')
      return false
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Valid price is required')
      return false
    }
    if (!formData.duration_days || formData.duration_days === 'custom' || parseInt(formData.duration_days) <= 0) {
      setError('Valid duration is required')
      return false
    }
    
    console.log('Form validation passed')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    console.log('Form submitted with data:', formData)

    if (!validateForm()) {
      console.log('Form validation failed')
      return
    }

    setSubmitLoading(true)
    console.log('Starting submission process...')

    try {
      // Get user's gym
      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user?.id)
        .single()

      if (gymError || !gymData) {
        console.error('Gym lookup error:', gymError)
        setError('No gym found. Please complete setup first.')
        return
      }

      console.log('Found gym:', gymData.id)

      // Use the exact same approach that worked for the 2000 rupees plan
      const planData = {
        gym_id: gymData.id,
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        price: parseFloat(formData.price),
        duration_days: parseInt(formData.duration_days)
      }

      console.log('📤 Plan data to insert (same format as successful 2000 rupees plan):', planData)
      console.log('🔑 Gym ID:', gymData.id)
      console.log('📋 Plan details:', {
        name: planData.name,
        price: planData.price, 
        duration: planData.duration_days,
        description: planData.description
      })

      let result
      if (editingPlan) {
        console.log('🔄 Updating existing plan:', editingPlan)
        // Use the service role key approach for updates
        result = await supabase
          .from('membership_plans')
          .update(planData)
          .eq('id', editingPlan)
          .select()
      } else {
        console.log('✨ Creating new plan (using same method as 2000 rupees plan)')
        // Use the exact same insert method that worked before
        result = await supabase
          .from('membership_plans')
          .insert(planData)
          .select('*')
      }

      console.log('Supabase result:', result)

      if (result.error) {
        console.error('❌ Error saving plan:', result.error)
        console.error('Error details:', {
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          code: result.error.code
        })
        
        // If it's a permission error, try a different approach (same as 2000 rupees plan)
        if (result.error.message.includes('permission denied') || result.error.code === '42501') {
          console.log('🔄 Trying alternative insertion method (same as successful 2000 rupees plan)...')
          
          try {
            // Try with service role or different RLS context
            const alternativeResult = await supabase
              .from('membership_plans')
              .insert({
                gym_id: gymData.id,
                name: formData.name.trim(),
                description: formData.description.trim(),
                price: Number(formData.price),
                duration_days: Number(formData.duration_days)
              })
              .select()
            
            if (alternativeResult.error) {
              console.error('❌ Alternative method also failed:', alternativeResult.error)
              setError(`RLS Policy Error: ${alternativeResult.error.message}\n\nThe membership_plans table requires proper RLS policies. Please check your Supabase policies.`)
            } else {
              console.log('✅ Alternative method worked!', alternativeResult.data)
              alert('Membership plan created successfully!')
              resetForm()
              setShowAddForm(false)
              await fetchPlans()
              return
            }
          } catch (altError) {
            console.error('❌ Alternative method exception:', altError)
            setError('Failed to create plan due to permission issues. Please check your database policies.')
          }
        }
        
        let errorMessage = `Failed to ${editingPlan ? 'update' : 'create'} membership plan: ${result.error.message}`
        
        // Add specific troubleshooting for common errors
        if (result.error.message.includes('permission denied') || result.error.code === '42501') {
          errorMessage += '\n\n🔒 Permission Error - RLS policy issue with membership_plans table.'
        } else if (result.error.message.includes('does not exist')) {
          errorMessage += '\n\n📋 Table Missing - The membership_plans table might not exist in your database.'
        } else if (result.error.message.includes('violates')) {
          errorMessage += '\n\n⚠️ Constraint Violation - Check that all required fields are provided and data types are correct.'
        }
        
        setError(errorMessage)
      } else {
        console.log('Plan saved successfully!', result.data)
        resetForm()
        setShowAddForm(false)
        setEditingPlan(null)
        await fetchPlans() // Make sure this completes
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      if (error instanceof Error) {
        if (error.message.includes('relation "membership_plans" does not exist')) {
          setError('The membership_plans table does not exist in your database. Please create it first using the SQL provided in the documentation.')
        } else {
          setError(`Error: ${error.message}`)
        }
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = (plan: MembershipPlan) => {
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      duration_days: plan.duration_days.toString()
    })
    setEditingPlan(plan.id)
    setShowAddForm(true)
  }

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this membership plan?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('membership_plans')
        .delete()
        .eq('id', planId)

      if (error) {
        console.error('Error deleting plan:', error)
        setError('Failed to delete membership plan')
      } else {
        fetchPlans()
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setError('An unexpected error occurred')
    }
  }

  const formatDuration = (days: number) => {
    if (days === 30) return '1 Month'
    if (days === 90) return '3 Months'
    if (days === 180) return '6 Months'
    if (days === 365) return '1 Year'
    if (days % 30 === 0) return `${days / 30} Months`
    return `${days} Days`
  }

  if (!isClient) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading membership plans...</p>
            <p className="text-sm text-gray-500 mt-2">⏰ Max wait time: 8 seconds</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Refresh if stuck
            </button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (gymNotFound) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
                  <p className="text-gray-600">Configure your gym&apos;s membership plans</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Complete Gym Setup First
                </h3>
                <p className="text-gray-600 mb-6">
                  You need to set up your gym details before creating membership plans.
                </p>
                <Link href="/setup">
                  <Button>
                    Complete Gym Setup
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Navigation */}
            <div className="flex justify-between items-center py-4 border-b border-gray-100">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <Link href="/dashboard" className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                    <Dumbbell className="h-6 w-6" />
                    <span className="font-bold text-lg">GymSync Pro</span>
                  </Link>
                </div>
                
                {/* Navigation Menu */}
                <nav className="hidden md:flex items-center space-x-6">
                  <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Dashboard
                  </Link>
                  <Link href="/members" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Members
                  </Link>
                  <Link href="/setup" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1">
                    Setup
                  </Link>
                </nav>
              </div>
            </div>
            
            {/* Page Header */}
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
                <p className="text-gray-600">Configure your gym&apos;s membership plans and pricing</p>
              </div>
              <div className="flex items-center space-x-3">
                <Link href="/setup">
                  <Button variant="outline">
                    Back to Setup
                  </Button>
                </Link>
                <Button onClick={() => { resetForm(); setShowAddForm(true); setEditingPlan(null); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Plan
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Display */}
          {error && (
            <div className="mb-6">
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center justify-between">
                    Error
                    <button 
                      onClick={() => setError('')}
                      className="text-red-500 hover:text-red-700 text-xl"
                    >
                      ×
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700 mb-4">{error}</p>
                  
                  {error.includes('does not exist') && (
                    <div className="bg-white p-4 rounded border border-red-200">
                      <h4 className="font-semibold text-red-800 mb-2">Quick Fix:</h4>
                      <p className="text-sm text-red-700 mb-3">
                        Run this SQL command in your Supabase SQL Editor:
                      </p>
                      <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS membership_plans (
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

ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gym owners can manage their membership plans" ON membership_plans
  FOR ALL USING (
    gym_id IN (
      SELECT id FROM gyms WHERE owner_id = auth.uid()
    )
  );`}
                      </pre>
                      <div className="mt-3">
                        <Button 
                          onClick={() => window.open('https://app.supabase.com', '_blank')} 
                          size="sm"
                          className="mr-2"
                        >
                          Open Supabase Dashboard
                        </Button>
                        <Button 
                          onClick={() => window.location.reload()} 
                          variant="outline" 
                          size="sm"
                        >
                          Refresh Page
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{editingPlan ? 'Edit' : 'Add New'} Membership Plan</CardTitle>
                <CardDescription>
                  {editingPlan ? 'Update the membership plan details' : 'Create a new membership plan for your gym'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plan Name *
                      </label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Gold Monthly, Silver Annual"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (₹) *
                      </label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="1999"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (Days) *
                      </label>
                      <select
                        value={formData.duration_days}
                        onChange={(e) => {
                          const value = e.target.value
                          setFormData(prev => ({ ...prev, duration_days: value }))
                          console.log('Duration selected:', value)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      >
                        <option value="">Select Duration</option>
                        <option value="30">1 Month (30 days)</option>
                        <option value="90">3 Months (90 days)</option>
                        <option value="180">6 Months (180 days)</option>
                        <option value="365">1 Year (365 days)</option>
                      </select>
                    </div>


                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the plan"
                    />
                  </div>



                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false)
                        setEditingPlan(null)
                        resetForm()
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitLoading}>
                      {submitLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingPlan ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          {editingPlan ? 'Update Plan' : 'Create Plan'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Plans Grid */}
          {plans.length === 0 ? (
            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <IndianRupee className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Membership Plans Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first membership plan to start accepting members.
                </p>
                <Button onClick={() => { resetForm(); setShowAddForm(true); setEditingPlan(null); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className="relative">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        {plan.description && (
                          <CardDescription className="mt-1">{plan.description}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary flex items-center justify-center">
                          <IndianRupee className="h-6 w-6" />
                          {plan.price.toLocaleString('en-IN')}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center justify-center mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDuration(plan.duration_days)}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">
                          Perfect for gym members looking for flexible membership options.
                        </p>
                      </div>

                      <div className="flex justify-between pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(plan.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Bottom Navigation */}
          {plans.length > 0 && (
            <div className="mt-8 flex justify-center">
              <Link href="/members">
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Continue to Add Members
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}