'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Save, 
  DollarSign, 
  Calendar, 
  IndianRupee,
  TrendingUp,
  Loader2,
  FileText,
  CheckCircle
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

interface SalaryUpdateModalProps {
  staff: Staff | null
  isOpen: boolean
  onClose: () => void
  onSalaryUpdated: () => void
}

export default function SalaryUpdateModal({ 
  staff, 
  isOpen, 
  onClose, 
  onSalaryUpdated 
}: SalaryUpdateModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    new_salary: '',
    effective_date: new Date().toISOString().split('T')[0],
    reason: '',
    notes: ''
  })

  useEffect(() => {
    if (staff && isOpen) {
      setFormData(prev => ({
        ...prev,
        new_salary: staff.salary ? staff.salary.toString() : '',
        effective_date: new Date().toISOString().split('T')[0],
        reason: '',
        notes: ''
      }))
    }
  }, [staff, isOpen])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const calculateIncrease = () => {
    if (!staff?.salary || !formData.new_salary) return { amount: 0, percentage: 0 }
    
    const currentSalary = staff.salary
    const newSalary = parseFloat(formData.new_salary)
    const amount = newSalary - currentSalary
    const percentage = (amount / currentSalary) * 100
    
    return { amount, percentage }
  }

  const handleSave = async () => {
    if (!staff || !formData.new_salary) return

    setLoading(true)
    try {
      // Update salary in staff_details table
      const { error: staffError } = await supabase
        .from('staff_details')
        .update({
          salary: parseFloat(formData.new_salary)
        })
        .eq('user_id', staff.user_id)

      if (staffError) {
        console.error('Error updating salary:', staffError)
        alert('Failed to update salary. Please try again.')
        return
      }

      // Log salary change (you could create a salary_history table for this)
      const { error: logError } = await supabase
        .from('salary_history')
        .insert({
          staff_id: staff.user_id,
          old_salary: staff.salary,
          new_salary: parseFloat(formData.new_salary),
          effective_date: formData.effective_date,
          reason: formData.reason || null,
          notes: formData.notes || null,
          changed_by: 'current_user', // You can get this from auth context
          gym_id: staff.gym_id
        })

      // Even if logging fails, we still show success since main update worked
      if (logError) {
        console.warn('Salary updated but logging failed:', logError)
      }

      // Send WhatsApp notification if phone number is available
      if (staff.phone && /^\d{10}$/.test(staff.phone.replace(/\D/g, ''))) {
        try {
          console.log('📱 Sending WhatsApp salary update notification...')
          
          // Get gym name
          const { data: gym } = await supabase
            .from('gyms')
            .select('name')
            .eq('id', staff.gym_id)
            .single()

          const gymName = gym?.name || 'Our Gym'

          // Import template function
          const { generateSalaryUpdateNotification } = await import('@/lib/whatsapp-templates')

          // Generate salary update message
          const message = generateSalaryUpdateNotification({
            staffName: staff.full_name || 'Team Member',
            gymName: gymName,
            oldSalary: staff.salary || 0,
            newSalary: parseFloat(formData.new_salary),
            effectiveDate: new Date(formData.effective_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            reason: formData.reason || undefined
          })

          // Get session token
          const { data: { session } } = await supabase.auth.getSession()
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          }
          
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`
          }

          // Send WhatsApp message
          const response = await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              to: staff.phone.replace(/\D/g, ''),
              message,
              messageType: 'staff_salary_update',
              metadata: {
                staff_id: staff.user_id,
                old_salary: staff.salary,
                new_salary: parseFloat(formData.new_salary),
                effective_date: formData.effective_date
              },
            }),
          })

          if (response.ok) {
            console.log('✅ WhatsApp salary update notification sent successfully!')
          } else {
            const error = await response.json()
            console.error('❌ Failed to send WhatsApp:', error)
          }
        } catch (whatsappError) {
          console.error('❌ WhatsApp notification error (non-critical):', whatsappError)
          // Don't block the salary update process if WhatsApp fails
        }
      }

      alert('Salary updated successfully! 💰✨')
      onSalaryUpdated()
      onClose()
      
      // Reset form
      setFormData({
        new_salary: '',
        effective_date: new Date().toISOString().split('T')[0],
        reason: '',
        notes: ''
      })
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !staff) return null

  const { amount, percentage } = calculateIncrease()
  const isIncrease = amount > 0
  const isDecrease = amount < 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Update Salary</h2>
                <p className="text-green-100">
                  For {staff.full_name || 'Staff Member'}
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

        <div className="p-6 space-y-6">
          {/* Current Salary Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Staff Name:</span>
                  <p className="font-semibold">{staff.full_name || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Role:</span>
                  <p className="font-semibold">{staff.role || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Current Salary:</span>
                  <p className="font-semibold text-green-600">
                    ₹{staff.salary ? staff.salary.toLocaleString('en-IN') : '0'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge className={
                    staff.status === 'Active' ? 'bg-green-100 text-green-800' :
                    staff.status === 'Inactive' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {staff.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary Update Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <IndianRupee className="h-5 w-5 mr-2 text-green-600" />
                New Salary Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_salary">New Salary (₹) *</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="new_salary"
                      type="number"
                      value={formData.new_salary}
                      onChange={(e) => handleInputChange('new_salary', e.target.value)}
                      placeholder="Enter new salary"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="effective_date">Effective Date *</Label>
                  <Input
                    id="effective_date"
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => handleInputChange('effective_date', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Reason for Change</Label>
                <select
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select reason</option>
                  <option value="annual_increment">Annual Increment</option>
                  <option value="promotion">Promotion</option>
                  <option value="performance_bonus">Performance Bonus</option>
                  <option value="market_adjustment">Market Adjustment</option>
                  <option value="cost_of_living">Cost of Living Increase</option>
                  <option value="retention">Retention Increase</option>
                  <option value="correction">Salary Correction</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any additional notes"
                />
              </div>
            </CardContent>
          </Card>

          {/* Salary Change Preview */}
          {formData.new_salary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Salary Change Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Current Salary</p>
                    <p className="text-lg font-bold">₹{staff.salary?.toLocaleString('en-IN') || '0'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">New Salary</p>
                    <p className="text-lg font-bold text-green-600">
                      ₹{parseFloat(formData.new_salary).toLocaleString('en-IN')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Change</p>
                    <div className="flex flex-col items-center">
                      <p className={`text-lg font-bold ${
                        isIncrease ? 'text-green-600' : isDecrease ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {isIncrease ? '+' : ''}₹{Math.abs(amount).toLocaleString('en-IN')}
                      </p>
                      <p className={`text-sm ${
                        isIncrease ? 'text-green-600' : isDecrease ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {isIncrease ? '+' : ''}{percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {(isIncrease || isDecrease) && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    isIncrease ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {isIncrease ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />
                      )}
                      <p className={`font-medium ${
                        isIncrease ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {isIncrease 
                          ? `Salary increase of ₹${Math.abs(amount).toLocaleString('en-IN')} (${percentage.toFixed(1)}%)` 
                          : `Salary decrease of ₹${Math.abs(amount).toLocaleString('en-IN')} (${Math.abs(percentage).toFixed(1)}%)`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !formData.new_salary}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Update Salary
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}