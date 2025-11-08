import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import MUIProvider from '@/components/providers/MUIProvider'
import { QueryProvider } from '@/components/QueryProvider'
import DevGuards from '@/components/DevGuards'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GymSync Pro - Gym Management System',
  description: 'Multi-tenant gym management SaaS application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {process.env.NODE_ENV === 'development' && <DevGuards />}
        <QueryProvider>
          <MUIProvider>
            <AuthProvider>
              <SidebarProvider>
                {children}
              </SidebarProvider>
            </AuthProvider>
          </MUIProvider>
        </QueryProvider>
      </body>
    </html>
  )
}