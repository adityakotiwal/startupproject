'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/hooks/useGymContext'
import { Settings, LogOut, ChevronDown, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import NotificationPanel from './NotificationPanel'

export default function AppHeader() {
  const { user, signOut } = useAuth()
  const { currentGym } = useGymContext()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <header className="fixed top-0 right-0 left-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Logo and Name */}
        <div className="flex items-center space-x-3">
          <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                GymSync Pro
              </h1>
              {currentGym?.name && (
                <p className="text-xs text-gray-500 font-medium">
                  {currentGym.name}
                </p>
              )}
            </div>
          </Link>
          
          {/* Gym Name Badge - Alternative display on larger screens */}
          {currentGym?.name && (
            <div className="hidden lg:flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <span className="text-xs font-semibold text-blue-700">
                🏋️ {currentGym.name}
              </span>
            </div>
          )}
        </div>

        {/* Right: Notifications and Profile */}
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <NotificationPanel />

          {/* Profile Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
            >
              {/* Profile Circle */}
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {(user?.name || user?.full_name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* User Name and Email - Hidden on small screens */}
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                  {user?.name || user?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-[150px]">
                  {user?.email}
                </p>
              </div>

              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />

                {/* Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2">
                  {/* User Info - Visible on mobile */}
                  <div className="md:hidden px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.name || user?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>

                  {/* Settings */}
                  <Link
                    href="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="text-sm font-medium">Settings</span>
                  </Link>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-2" />

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      handleSignOut()
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors text-red-600 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
