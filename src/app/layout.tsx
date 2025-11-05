import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import MUIProvider from '@/components/providers/MUIProvider'
import { QueryProvider } from '@/components/QueryProvider'

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
        <QueryProvider>
          <MUIProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </MUIProvider>
        </QueryProvider>
      </body>
    </html>
  )
}