'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Activity, 
  Calendar, 
  DollarSign,
  User,
  Edit,
  Clock,
  TrendingUp,
  IndianRupee,
  CheckCircle,
  Briefcase,
  Loader2,
  Award
} from 'lucide-react'

interface Staff {
  id: string
  user_id: string
  gym_id: string
  status: 'Active' | 'Inactive' | 'Terminated'
  full_name?: string
  phone?: string
  email?: string
  address?: string
  role?: string
  join_date?: string
  salary?: number
  emergency_contact_name?: string
  emergency_contact_phone?: string
}

interface SalaryHistory {
  id: string
  old_salary: number
  new_salary: number
  effective_date: string
  reason: string
  notes?: string
  created_at: string
}

interface ActivityLog {
  id: string
  activity_type: 'salary_change' | 'profile_update' | 'status_change' | 'role_change'
  description: string
  created_at: string
  amount?: number
  old_value?: string
  new_value?: string
}

interface StaffActivityModalProps {
  staff: Staff | null
  isOpen: boolean
  onClose: () => void
}

export default function StaffActivityModal({ 
  staff, 
  isOpen, 
  onClose 
}: StaffActivityModalProps) {
  const [loading, setLoading] = useState(false)
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [totalSalaryIncreases, setTotalSalaryIncreases] = useState(0)
  const [averageTenure, setAverageTenure] = useState('')

  useEffect(() => {
    if (staff && isOpen) {
      fetchStaffActivity()
    }
  }, [staff, isOpen])

  const fetchStaffActivity = async () => {
    if (!staff) return
    
    setLoading(true)
    try {
      // Fetch salary history (if table exists)
      const { data: salaryData, error: salaryError } = await supabase
        .from('salary_history')
        .select('*')
        .eq('staff_id', staff.id)
        .order('effective_date', { ascending: false })

      if (!salaryError && salaryData) {
        setSalaryHistory(salaryData || [])
        
        // Calculate total increases
        const increases = salaryData.filter(record => 
          record.new_salary > record.old_salary
        )
        const totalIncrease = increases.reduce((sum, record) => 
          sum + (record.new_salary - record.old_salary), 0
        )
        setTotalSalaryIncreases(totalIncrease)
      }

      // Create activity timeline from available data
      const staffActivities: ActivityLog[] = []

      // Add staff creation
      if (staff.join_date) {
        staffActivities.push({
          id: 'joined',
          activity_type: 'profile_update',
          description: `Joined as ${staff.role || 'Staff Member'}`,
          created_at: staff.join_date
        })
      }

      // Add salary changes as activities
      if (salaryData) {
        salaryData.forEach(salary => {
          const isIncrease = salary.new_salary > salary.old_salary
          staffActivities.push({
            id: salary.id,
            activity_type: 'salary_change',
            description: `Salary ${isIncrease ? 'increased' : 'changed'} - ${salary.reason || 'No reason specified'}`,
            created_at: salary.effective_date,
            amount: salary.new_salary - salary.old_salary,
            old_value: salary.old_salary.toString(),
            new_value: salary.new_salary.toString()
          })
        })
      }

      // Sort activities by date (newest first)
      staffActivities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setActivities(staffActivities)
      calculateTenure()
    } catch (error) {
      console.error('Unexpected error fetching staff activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTenure = () => {
    if (!staff?.join_date) {
      setAverageTenure('Unknown')
      return
    }

    const joinDate = new Date(staff.join_date)
    const today = new Date()
    const monthsDiff = (today.getFullYear() - joinDate.getFullYear()) * 12 + 
                       (today.getMonth() - joinDate.getMonth())
    
    if (monthsDiff < 1) {
      setAverageTenure('Less than 1 month')
    } else if (monthsDiff < 12) {
      setAverageTenure(`${monthsDiff} month${monthsDiff > 1 ? 's' : ''}`)
    } else {
      const years = Math.floor(monthsDiff / 12)
      const remainingMonths = monthsDiff % 12
      
      if (remainingMonths === 0) {
        setAverageTenure(`${years} year${years > 1 ? 's' : ''}`)
      } else {
        setAverageTenure(`${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'salary_change':
        return <DollarSign className="h-4 w-4 text-green-600" />
      case 'role_change':
        return <Briefcase className="h-4 w-4 text-blue-600" />
      case 'status_change':
        return <Award className="h-4 w-4 text-yellow-600" />
      case 'profile_update':
        return <User className="h-4 w-4 text-purple-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  if (!isOpen || !staff) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Activity className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Staff Activity</h2>
                <p className="text-purple-100">
                  {staff.full_name || 'Staff Member'}&apos;s complete employment history
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading activity...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Activity Stats */}
              <div className="lg:col-span-1 space-y-4">
                {/* Employment Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Employment Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tenure</span>
                      <span className="font-bold text-lg">{averageTenure}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Salary</span>
                      <span className="font-bold text-lg text-green-600">
                        ₹{staff.salary ? staff.salary.toLocaleString('en-IN') : '0'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Salary Increases</span>
                      <span className="font-bold text-lg">{salaryHistory.filter(h => h.new_salary > h.old_salary).length}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Increase</span>
                      <span className="font-bold text-lg text-green-600">
                        ₹{totalSalaryIncreases.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Employment</span>
                        <Badge className={
                          staff.status === 'Active' ? 'bg-green-100 text-green-800' :
                          staff.status === 'Inactive' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {staff.status}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Role</span>
                        <span className="font-medium">{staff.role || 'Not specified'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Join Date</span>
                        <span className="font-medium">
                          {staff.join_date ? new Date(staff.join_date).toLocaleDateString('en-IN') : 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Latest Salary Change */}
                {salaryHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                        Latest Salary Change
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Amount</span>
                          <span className="font-bold text-green-600">
                            ₹{salaryHistory[0].new_salary.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Reason</span>
                          <span className="capitalize text-sm">{salaryHistory[0].reason}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Date</span>
                          <span>{new Date(salaryHistory[0].effective_date).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Activity Timeline */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-purple-600" />
                      Activity Timeline
                    </CardTitle>
                    <CardDescription>
                      Complete history of employment activities and changes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activities.length === 0 ? (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No activity recorded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activities.map((activity, index) => (
                          <div key={activity.id} className="flex space-x-4">
                            {/* Timeline line */}
                            <div className="flex flex-col items-center">
                              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                                {getActivityIcon(activity.activity_type)}
                              </div>
                              {index < activities.length - 1 && (
                                <div className="w-px h-12 bg-gray-200 mt-2"></div>
                              )}
                            </div>
                            
                            {/* Activity content */}
                            <div className="flex-1 pb-6">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {activity.description}
                                    {activity.amount && activity.amount > 0 && (
                                      <span className="ml-2 text-green-600 font-bold">
                                        +₹{activity.amount}
                                      </span>
                                    )}
                                    {activity.amount && activity.amount < 0 && (
                                      <span className="ml-2 text-red-600 font-bold">
                                        ₹{activity.amount}
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(activity.created_at)}
                                  </p>
                                  {activity.old_value && activity.new_value && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      ₹{parseFloat(activity.old_value).toLocaleString('en-IN')} → ₹{parseFloat(activity.new_value).toLocaleString('en-IN')}
                                    </p>
                                  )}
                                </div>
                                {activity.activity_type === 'salary_change' && (
                                  <Badge className={
                                    activity.amount && activity.amount > 0 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {activity.amount && activity.amount > 0 ? 'Increase' : 'Updated'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}