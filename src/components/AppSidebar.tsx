'use client'

import { useSidebar } from '@/contexts/SidebarContext'
import {
  Dumbbell,
  Home,
  Users,
  UserCog,
  Wrench,
  CreditCard,
  Target,
  DollarSign,
  Wallet,
  BarChart3,
  Settings,
  Menu,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export default function AppSidebar() {
  const pathname = usePathname()
  const { state, setState } = useSidebar()
  const [isHovered, setIsHovered] = useState(false)
  const [showControlMenu, setShowControlMenu] = useState(false)

  const isActive = (path: string) => {
    return pathname === path
  }

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/members', label: 'Members', icon: Users },
    { href: '/staff', label: 'Staff', icon: UserCog },
    { href: '/equipment', label: 'Equipment', icon: Wrench },
    { href: '/membership-plans', label: 'Plans', icon: CreditCard },
    { href: '/workout-plans', label: 'Workouts', icon: Target },
    { href: '/expenses', label: 'Expenses', icon: DollarSign },
    { href: '/payments', label: 'Payments', icon: Wallet },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  // Calculate if sidebar should be visually expanded
  const shouldShowExpanded = state === 'expanded' || (state === 'hover' && isHovered)
  const sidebarWidth = shouldShowExpanded ? 'w-64' : 'w-16'

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white transition-all duration-300 ease-in-out z-40 ${sidebarWidth} flex flex-col shadow-xl border-r border-gray-200`}
        onMouseEnter={() => {
          if (state === 'hover') {
            setIsHovered(true)
          }
        }}
        onMouseLeave={() => {
          if (state === 'hover') {
            setIsHovered(false)
          }
          setShowControlMenu(false)
        }}
      >
        {/* Header Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg flex-shrink-0">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              {shouldShowExpanded && (
                <div className="overflow-hidden">
                  <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">
                    GymSync Pro
                  </h1>
                  <p className="text-xs text-gray-500 whitespace-nowrap">Gym Management</p>
                </div>
              )}
            </Link>
          </div>
        </div>

        {/* Sidebar Control Button */}
        <div className="px-4 py-3 border-b border-gray-200 relative">
          <button
            onClick={() => setShowControlMenu(!showControlMenu)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group ${shouldShowExpanded ? '' : 'justify-center'}`}
          >
            <Menu className="h-5 w-5 text-gray-700 flex-shrink-0" />
            {shouldShowExpanded && (
              <span className="text-sm text-gray-700 whitespace-nowrap">Sidebar control</span>
            )}
            {/* Tooltip for collapsed state */}
            {!shouldShowExpanded && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Sidebar control
              </div>
            )}
          </button>

          {/* Control Menu Dropdown */}
          {showControlMenu && (
            <div className={`absolute ${shouldShowExpanded ? 'left-4' : 'left-20'} top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl py-2 w-48 z-50`}>
              <button
                onClick={() => {
                  setState('expanded')
                  setShowControlMenu(false)
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors flex items-center space-x-2 ${
                  state === 'expanded' ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-current" />
                <span>Expanded</span>
              </button>
              <button
                onClick={() => {
                  setState('collapsed')
                  setShowControlMenu(false)
                  setIsHovered(false)
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors flex items-center space-x-2 ${
                  state === 'collapsed' ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-current" />
                <span>Collapsed</span>
              </button>
              <button
                onClick={() => {
                  setState('hover')
                  setShowControlMenu(false)
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors flex items-center space-x-2 ${
                  state === 'hover' ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-current" />
                <span>Expand on hover</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all group relative ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'}`} />
                {shouldShowExpanded && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                )}
                {/* Tooltip for collapsed state */}
                {!shouldShowExpanded && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

      </aside>
    </>
  )
}
