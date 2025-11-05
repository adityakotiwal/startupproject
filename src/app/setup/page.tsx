'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, AlertCircle, Loader2, IndianRupee, Users } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useClientOnly } from '@/hooks/useClientOnly'

interface SetupStep {
  id: string
  title: string
  description: string
  completed: boolean
  error?: string
}

export default function SetupPage() {
  const { user } = useAuth()
  const isClient = useClientOnly()
  const [loading, setLoading] = useState(false)
  const [gymName, setGymName] = useState('')
  const [planName, setPlanName] = useState('Monthly Membership')
  const [planPrice, setPlanPrice] = useState('2000')
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'profile',
      title: 'User Profile',
      description: 'Ensure your profile is set up correctly',
      completed: false
    },
    {
      id: 'gym',
      title: 'Create Gym',
      description: 'Set up your gym details',
      completed: false
    },
    {
      id: 'plan',
      title: 'Create Membership Plan',
      description: 'Add at least one membership plan',
      completed: false
    }
  ])

  const checkSetupStatus = useCallback(async () => {
    try {
      // Check profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      // Check gym
      const { data: gym } = await supabase
        .from('gyms')
        .select('*')
        .eq('owner_id', user?.id)
        .single()

      // Check membership plans
      const { data: plans } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('gym_id', gym?.id)

      setSteps(prev => prev.map(step => {
        switch (step.id) {
          case 'profile':
            return { ...step, completed: !!profile }
          case 'gym':
            return { ...step, completed: !!gym }
          case 'plan':
            return { ...step, completed: !!(plans && plans.length > 0) }
          default:
            return step
        }
      }))

      if (gym) {
        setGymName(gym.name)
      }
    } catch (error) {
      console.error('Error checking setup status:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      checkSetupStatus()
    }
  }, [user, checkSetupStatus])

  const runSetup = async () => {
    setLoading(true)
    
    try {
      // Step 1: Ensure profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: user?.id,
            full_name: user?.name || user?.email?.split('@')[0] || 'Gym Owner',
            role: 'gym_owner'
          }])
        
        if (profileError) {
          throw new Error(`Profile creation failed: ${profileError.message}`)
        }
      }

      // Step 2: Create or update gym
      const { data: existingGym } = await supabase
        .from('gyms')
        .select('*')
        .eq('owner_id', user?.id)
        .single()

      let gymId = existingGym?.id

      if (!existingGym) {
        const { data: newGym, error: gymError } = await supabase
          .from('gyms')
          .insert([{
            name: gymName.trim() || 'My Gym',
            owner_id: user?.id
          }])
          .select()
          .single()

        if (gymError) {
          throw new Error(`Gym creation failed: ${gymError.message}`)
        }
        
        gymId = newGym.id
      }

      // Step 3: Create default membership plan
      const { data: existingPlans } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('gym_id', gymId)

      if (!existingPlans || existingPlans.length === 0) {
        const { error: planError } = await supabase
          .from('membership_plans')
          .insert([{
            gym_id: gymId,
            name: planName.trim() || 'Monthly Membership',
            duration_days: 30,
            price: parseFloat(planPrice) || 2000,
            description: 'Standard monthly membership plan'
          }])

        if (planError) {
          throw new Error(`Membership plan creation failed: ${planError.message}`)
        }
      }

      // Recheck status
      await checkSetupStatus()
      
    } catch (error) {
      console.error('Setup error:', error)
      alert(`Setup failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isClient) {
    return <div>Loading...</div>
  }

  const allCompleted = steps.every(step => step.completed)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">GymSync Pro Setup</h1>
            <p className="text-gray-600">
              Complete these steps to set up your gym management system
            </p>
          </div>

          {/* Setup Status */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Setup Progress</CardTitle>
              <CardDescription>
                Current setup status for your gym management system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {step.completed ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                          <span className="text-sm text-gray-500">{index + 1}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${step.completed ? 'text-green-700' : 'text-gray-900'}`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                      {step.error && (
                        <p className="text-sm text-red-600 mt-1">{step.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Setup Form */}
          {!allCompleted && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Quick Setup</CardTitle>
                <CardDescription>
                  Provide basic information to automatically set up your gym
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="gymName">Gym Name</Label>
                  <Input
                    id="gymName"
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    placeholder="Enter your gym name"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="planName">Default Membership Plan</Label>
                    <Input
                      id="planName"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      placeholder="Monthly Membership"
                    />
                  </div>
                  <div>
                    <Label htmlFor="planPrice">Price (₹)</Label>
                    <Input
                      id="planPrice"
                      type="number"
                      value={planPrice}
                      onChange={(e) => setPlanPrice(e.target.value)}
                      placeholder="2000"
                    />
                  </div>
                </div>

                <Button 
                  onClick={runSetup} 
                  disabled={loading || !gymName.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {allCompleted && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">
                      Setup Complete! 🎉
                    </h3>
                    <p className="text-green-700">
                      Your gym management system is ready. You can now add members and manage your gym.
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 space-x-4">
                  <Button onClick={() => window.location.href = '/members/add'}>
                    Add Your First Member
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                    Go to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Management Tools</CardTitle>
              <CardDescription>
                Manage your gym settings and configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/setup/membership-plans'}
                  className="h-auto p-4 justify-start"
                >
                  <div className="flex items-center space-x-3">
                    <IndianRupee className="h-6 w-6 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium">Membership Plans</div>
                      <div className="text-sm text-gray-600">Create and manage membership plans</div>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/members'}
                  className="h-auto p-4 justify-start"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-green-600" />
                    <div className="text-left">
                      <div className="font-medium">Manage Members</div>
                      <div className="text-sm text-gray-600">Add, edit, and view gym members</div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}