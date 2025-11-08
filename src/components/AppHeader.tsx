'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/hooks/useGymContext'
import { Button } from '@/components/ui/button'
import { 
  Dumbbell, 
  LogOut, 
  Activity, 
  LayoutDashboard,
  Users,
  UserCheck,
  CreditCard,
  ClipboardList,
  TrendingUp,
  Wrench,
  Receipt
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationPanel from '@/components/NotificationPanel'

interface AppHeaderProps {
  onRefresh?: () => void
  isRefreshing?: boolean
}

export default function AppHeader({ onRefresh, isRefreshing = false }: AppHeaderProps) {
  const { user, signOut } = useAuth()
  const { gymId } = useGymContext()
  const pathname = usePathname()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  // Reorganized navigation with icons for better UX
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/members', label: 'Members', icon: Users },
    { href: '/membership-plans', label: 'Plans', icon: ClipboardList },
    { href: '/workout-plans', label: 'Workouts', icon: Dumbbell },
    { href: '/staff', label: 'Staff', icon: UserCheck },
    { href: '/payments', label: 'Payments', icon: CreditCard },
    { href: '/expenses', label: 'Expenses', icon: Receipt },
    { href: '/equipment', label: 'Equipment', icon: Wrench },
    { href: '/analytics', label: 'Analytics', icon: TrendingUp },
  ]

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  GymSync Pro
                </h1>
                <p className="text-xs text-gray-500">Gym Management Suite</p>
              </div>
            </Link>
            
            {/* Enhanced Navigation Menu with Icons */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive(item.href) ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {onRefresh && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 hover:bg-blue-100 transition-colors"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <Activity className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <NotificationPanel />
            <Link href="/settings" className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {(user?.name || user?.full_name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-700 font-medium hidden lg:block">
                {user?.name || user?.full_name}
              </span>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="border-gray-300 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="grid grid-cols-5 gap-1 px-2 py-2">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive(item.href) ? 'text-white' : 'text-gray-500'}`} />
                  <span className={`text-xs mt-1 font-medium ${isActive(item.href) ? 'text-white' : 'text-gray-600'}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
          {/* Secondary Mobile Nav */}
          <div className="grid grid-cols-4 gap-1 px-2 pb-2">
            {navItems.slice(5).map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive(item.href) ? 'text-white' : 'text-gray-500'}`} />
                  <span className={`text-xs mt-1 font-medium ${isActive(item.href) ? 'text-white' : 'text-gray-600'}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
