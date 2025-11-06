'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X, Calendar, CreditCard, Gift, UserPlus, AlertCircle, Clock, Send, Wrench, ShieldAlert, XCircle, Dumbbell } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getNotifications, getNotificationCount, type Notification } from '@/lib/notifications'
import { useGymContext } from '@/hooks/useGymContext'
import { generateBirthdayWish, generateRenewalReminder, generateFeeDueNotification } from '@/lib/whatsapp-templates'
import { supabase } from '@/lib/supabaseClient'

export default function NotificationPanel() {
  const router = useRouter()
  const { gymId } = useGymContext()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [sendingWhatsApp, setSendingWhatsApp] = useState<string | null>(null)

  const count = getNotificationCount(notifications)

  // Load notifications
  const loadNotifications = async () => {
    if (!gymId) return
    setLoading(true)
    try {
      const data = await getNotifications(gymId)
      setNotifications(data)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    
    // Refresh notifications every 5 minutes
    const interval = setInterval(loadNotifications, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [gymId])

  // Send WhatsApp reminder
  const sendWhatsAppReminder = async (notification: Notification) => {
    if (!notification.metadata?.phone) {
      alert('No phone number available for this notification')
      return
    }

    setSendingWhatsApp(notification.id)

    try {
      let message = ''
      
      // Get gym name
      const { data: gym } = await supabase
        .from('gyms')
        .select('name')
        .eq('id', gymId!)
        .single()

      const gymName = gym?.name || 'Our Gym'

      // ===== MEMBER NOTIFICATIONS =====
      if (notification.type === 'birthday') {
        message = generateBirthdayWish({
          memberName: notification.memberName || 'Member',
          gymName: gymName
        })
      } else if (notification.type === 'expiry_soon' || notification.type === 'expired') {
        const { data: member } = await supabase
          .from('members')
          .select('*, membership_plans(name)')
          .eq('id', notification.memberId)
          .single()

        if (member) {
          message = generateRenewalReminder({
            memberName: notification.memberName || 'Member',
            gymName: gymName,
            membershipPlan: member.membership_plans?.name || 'Your Plan',
            expiryDate: new Date(member.end_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            daysRemaining: notification.metadata.daysRemaining || 0
          })
        }
      } else if (notification.type === 'installment_due') {
        message = generateFeeDueNotification({
          memberName: notification.memberName || 'Member',
          gymName: gymName,
          dueAmount: notification.metadata.amount,
          currency: '₹',
          dueDate: new Date(notification.metadata.dueDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        })
      }
      
      // ===== STAFF NOTIFICATIONS =====
      else if (notification.type === 'staff_birthday') {
        const { generateStaffWelcomeMessage } = await import('@/lib/whatsapp-templates')
        message = generateBirthdayWish({
          memberName: notification.staffName || 'Team Member',
          gymName: gymName
        })
      } else if (notification.type === 'staff_anniversary') {
        message = `Dear ${notification.staffName || 'Team Member'},

🎉 Congratulations on completing ${notification.metadata?.yearsOfService} year${notification.metadata?.yearsOfService > 1 ? 's' : ''} with ${gymName}!

Thank you for your dedication and hard work. We appreciate having you as part of our team.

Here's to many more successful years together! 🎊

Best regards,
${gymName} Management`
      }

      if (!message) {
        alert('Could not generate message for this notification')
        return
      }

      // Send WhatsApp message
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to: notification.metadata.phone,
          message,
          messageType: notification.type,
          metadata: {
            notification_id: notification.id,
            member_id: notification.memberId,
          },
        }),
      })

      if (response.ok) {
        alert('✅ WhatsApp reminder sent successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to send WhatsApp: ${error.error}`)
      }
    } catch (error: any) {
      console.error('Error sending WhatsApp:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setSendingWhatsApp(null)
    }
  }

  // Get icon for notification type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      // Member notifications
      case 'birthday':
        return <Gift className="h-5 w-5 text-pink-500" />
      case 'expiry_soon':
      case 'renewal_reminder':
        return <Clock className="h-5 w-5 text-orange-500" />
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'installment_due':
      case 'payment_due':
        return <CreditCard className="h-5 w-5 text-blue-500" />
      case 'new_member':
        return <UserPlus className="h-5 w-5 text-green-500" />
      
      // Staff notifications
      case 'staff_birthday':
        return <Gift className="h-5 w-5 text-purple-500" />
      case 'staff_anniversary':
        return <Calendar className="h-5 w-5 text-blue-500" />
      case 'salary_due':
        return <CreditCard className="h-5 w-5 text-yellow-500" />
      case 'new_staff':
        return <UserPlus className="h-5 w-5 text-indigo-500" />
      
      // Equipment notifications
      case 'equipment_maintenance_due':
        return <Wrench className="h-5 w-5 text-orange-500" />
      case 'equipment_warranty_expiring':
        return <ShieldAlert className="h-5 w-5 text-amber-600" />
      case 'equipment_out_of_service':
        return <XCircle className="h-5 w-5 text-red-600" />
      
      // Expense notifications
      case 'expense_reminder':
        return <CreditCard className="h-5 w-5 text-red-500" />
      case 'recurring_expense_due':
        return <Calendar className="h-5 w-5 text-orange-500" />
      case 'budget_exceeded':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) loadNotifications()
        }}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {count.total > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {count.total > 9 ? '9+' : count.total}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-white" />
                <h3 className="font-semibold text-white">Notifications</h3>
                {count.high > 0 && (
                  <Badge className="bg-red-500 text-white">
                    {count.high} urgent
                  </Badge>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">All caught up!</p>
                  <p className="text-gray-400 text-sm mt-1">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        notification.priority === 'high' ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <p className="font-medium text-sm text-gray-900">
                              {notification.title}
                            </p>
                            {notification.priority === 'high' && (
                              <Badge className="bg-red-500 text-white text-xs ml-2">
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          {/* Action Buttons */}
                          {notification.actionRequired && (
                            <div className="flex space-x-2 mt-2">
                              {/* WhatsApp button for member/staff notifications */}
                              {notification.metadata?.phone && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => sendWhatsAppReminder(notification)}
                                  disabled={sendingWhatsApp === notification.id}
                                  className="text-xs"
                                >
                                  {sendingWhatsApp === notification.id ? (
                                    <div className="flex items-center">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-2"></div>
                                      Sending...
                                    </div>
                                  ) : (
                                    <>
                                      <Send className="h-3 w-3 mr-1" />
                                      Send WhatsApp
                                    </>
                                  )}
                                </Button>
                              )}
                              
                              {/* View Equipment button for equipment notifications */}
                              {(notification.type === 'equipment_maintenance_due' || 
                                notification.type === 'equipment_warranty_expiring' ||
                                notification.type === 'equipment_out_of_service') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setIsOpen(false)
                                    router.push('/equipment')
                                  }}
                                  className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                                >
                                  <Dumbbell className="h-3 w-3 mr-1" />
                                  View Equipment
                                </Button>
                              )}
                            </div>
                          )}

                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.timestamp).toLocaleString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: 'numeric',
                              month: 'short'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={loadNotifications}
                  className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Refresh Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
