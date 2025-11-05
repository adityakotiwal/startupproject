'use client'

import Link from 'next/link'
import { Mail, CheckCircle, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function VerifyEmailPage() {
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
        </div>

        {/* Verification Message */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription className="text-base">
              We&apos;ve sent you a verification link to complete your registration
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-900">
                      Verification email sent!
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Please check your inbox and click the verification link to activate your account.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p>Didn&apos;t receive the email?</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure you entered the correct email address</li>
                  <li>• The email may take a few minutes to arrive</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-col space-y-3">
                <Link href="/auth/login" className="w-full">
                  <Button className="w-full">
                    Back to Login
                  </Button>
                </Link>
                <Link href="/auth/signup" className="w-full">
                  <Button variant="outline" className="w-full">
                    Try Again
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© 2024 GymSync Pro. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}