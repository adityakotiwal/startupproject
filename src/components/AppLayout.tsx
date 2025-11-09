'use client'

import AppSidebar from '@/components/AppSidebar'
import AppHeader from '@/components/AppHeader'
import { useSidebar } from '@/contexts/SidebarContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar()

  // Calculate the margin based on sidebar state
  const shouldShowExpanded = state === 'expanded'
  const marginClass = shouldShowExpanded ? 'ml-64' : 'ml-16'

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <AppSidebar />
      <main className={`${marginClass} pt-16 transition-all duration-300 ease-in-out`}>
        {children}
      </main>
    </div>
  )
}
