'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Dumbbell, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)

    const { error, requiresVerification } = await signUp(email, password, name)
    
    if (error) {
      setError(error)
    } else if (requiresVerification) {
      // Show success message for email verification
      router.push('/auth/verify-email')
    } else {
      // User signed up and is logged in
      router.push('/dashboard')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-gray-900">GymSync Pro</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your gym account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start managing your gym with our comprehensive platform
          </p>
        </div>

        {/* Sign Up Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create your account to get started with GymSync Pro
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center space-x-2">
                  <Check className={`h-3 w-3 ${password.length >= 6 ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>At least 6 characters</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className={`h-3 w-3 ${password === confirmPassword && password.length > 0 ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>Passwords match</span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
              
              <div className="text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <Link 
                  href="/auth/login" 
                  className="font-medium text-primary hover:text-primary/90"
                >
                  Sign in here
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Features List */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What you&apos;ll get:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Complete member management system</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Staff management and payroll tracking</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Financial reporting and analytics</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Automated payment tracking</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© 2024 GymSync Pro. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}