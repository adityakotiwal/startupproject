'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{error?: Error, resetError?: () => void}>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error Boundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback
        return <Fallback error={this.state.error} resetError={this.resetError} />
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
              <p className="text-gray-600 mb-6">
                The application encountered an unexpected error. This usually happens due to:
              </p>
              <ul className="text-left text-sm text-gray-600 mb-6 space-y-1">
                <li>• Network connectivity issues</li>
                <li>• Database timeout or loading problems</li>
                <li>• Temporary server issues</li>
              </ul>
              <div className="space-y-3">
                <Button 
                  onClick={this.resetError}
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Refresh Page
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer">Technical details</summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorHandler() {
  const handleError = (error: Error) => {
    console.error('🚨 Handled error:', error)
    // You could also send to error reporting service here
  }

  return { handleError }
}