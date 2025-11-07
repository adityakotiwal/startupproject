'use client'

import { useState } from 'react'
import { X, Wrench, ShieldCheck, CheckCircle, Calendar, FileText, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabaseClient'

interface Equipment {
  id: string
  name: string
  category: string
  maintenance_due: string
  warranty_expires: string
  status: string
}

interface EquipmentActionModalProps {
  equipment: Equipment
  onClose: () => void
  onSuccess: () => void
  actionType: 'maintenance' | 'warranty'
}

export default function EquipmentActionModal({ 
  equipment, 
  onClose, 
  onSuccess,
  actionType 
}: EquipmentActionModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    action: actionType === 'maintenance' ? 'completed' : 'extend',
    nextMaintenanceDate: '',
    maintenanceDays: '30',
    warrantyExtendDate: '',
    notes: '',
    cost: '',
    performedBy: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (actionType === 'maintenance') {
        await handleMaintenanceAction()
      } else {
        await handleWarrantyAction()
      }
      
      alert('✅ Action completed successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      alert('Failed to complete action: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMaintenanceAction = async () => {
    if (formData.action === 'completed') {
      // Mark maintenance as completed and schedule next one
      const nextDate = formData.nextMaintenanceDate || 
        new Date(Date.now() + parseInt(formData.maintenanceDays) * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0]

      const { error } = await supabase
        .from('equipment')
        .update({
          maintenance_due: nextDate,
          status: 'Active',
          notes: formData.notes || `Maintenance completed on ${new Date().toLocaleDateString('en-IN')}. Next due: ${new Date(nextDate).toLocaleDateString('en-IN')}`
        })
        .eq('id', equipment.id)

      if (error) throw error

      // Log maintenance record (if you have a maintenance_logs table)
      // Optional: You can create this table later
      
    } else if (formData.action === 'reschedule') {
      if (!formData.nextMaintenanceDate) {
        throw new Error('Please select a date')
      }

      const { error } = await supabase
        .from('equipment')
        .update({
          maintenance_due: formData.nextMaintenanceDate,
          status: 'Active'
        })
        .eq('id', equipment.id)

      if (error) throw error
    } else if (formData.action === 'skip') {
      // Skip this maintenance and schedule next one
      const nextDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]

      const { error } = await supabase
        .from('equipment')
        .update({
          maintenance_due: nextDate,
          status: 'Active',
          notes: `Maintenance skipped on ${new Date().toLocaleDateString('en-IN')}. ${formData.notes}`
        })
        .eq('id', equipment.id)

      if (error) throw error
    }
  }

  const handleWarrantyAction = async () => {
    if (formData.action === 'extend') {
      if (!formData.warrantyExtendDate) {
        throw new Error('Please select warranty extension date')
      }

      const { error } = await supabase
        .from('equipment')
        .update({
          warranty_expires: formData.warrantyExtendDate,
          notes: `Warranty extended to ${new Date(formData.warrantyExtendDate).toLocaleDateString('en-IN')}. ${formData.notes}`
        })
        .eq('id', equipment.id)

      if (error) throw error
      
    } else if (formData.action === 'claim') {
      // Mark as warranty claimed
      const { error } = await supabase
        .from('equipment')
        .update({
          status: 'Maintenance',
          notes: `Warranty claim filed on ${new Date().toLocaleDateString('en-IN')}. ${formData.notes}`
        })
        .eq('id', equipment.id)

      if (error) throw error
      
    } else if (formData.action === 'acknowledge') {
      // Just acknowledge - no changes needed, just add note
      const { error } = await supabase
        .from('equipment')
        .update({
          notes: `Warranty expiry acknowledged on ${new Date().toLocaleDateString('en-IN')}. ${formData.notes}`
        })
        .eq('id', equipment.id)

      if (error) throw error
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header - Gradient like Salary Modal */}
        <div className={`text-white p-6 rounded-t-lg ${
          actionType === 'maintenance' 
            ? 'bg-gradient-to-r from-orange-600 to-orange-700' 
            : 'bg-gradient-to-r from-blue-600 to-blue-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {actionType === 'maintenance' ? (
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">
                  {actionType === 'maintenance' ? 'Maintenance Action' : 'Warranty Action'}
                </h2>
                <p className={actionType === 'maintenance' ? 'text-orange-100' : 'text-blue-100'}>
                  For {equipment.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            {/* Current Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Current Status</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Equipment:</span>
                  <p className="font-medium">{equipment.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Category:</span>
                  <p className="font-medium">{equipment.category}</p>
                </div>
                {actionType === 'maintenance' && (
                  <div>
                    <span className="text-gray-600">Maintenance Due:</span>
                    <p className="font-medium text-orange-600">
                      {new Date(equipment.maintenance_due).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                )}
                {actionType === 'warranty' && (
                  <div>
                    <span className="text-gray-600">Warranty Expires:</span>
                    <p className="font-medium text-blue-600">
                      {new Date(equipment.warranty_expires).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Action</Label>
              
              {actionType === 'maintenance' ? (
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:border-green-400 transition-colors bg-white">
                    <input
                      type="radio"
                      name="action"
                      value="completed"
                      checked={formData.action === 'completed'}
                      onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                      className="w-4 h-4 text-green-600"
                    />
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Mark as Completed</p>
                      <p className="text-sm text-gray-500">Maintenance done, schedule next one</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-white">
                    <input
                      type="radio"
                      name="action"
                      value="reschedule"
                      checked={formData.action === 'reschedule'}
                      onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Reschedule</p>
                      <p className="text-sm text-gray-500">Pick a different date</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:border-yellow-400 transition-colors bg-white">
                    <input
                      type="radio"
                      name="action"
                      value="skip"
                      checked={formData.action === 'skip'}
                      onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                      className="w-4 h-4 text-yellow-600"
                    />
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Skip This Time</p>
                      <p className="text-sm text-gray-500">Postpone to next cycle (60 days)</p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:border-green-400 transition-colors bg-white">
                    <input
                      type="radio"
                      name="action"
                      value="extend"
                      checked={formData.action === 'extend'}
                      onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                      className="w-4 h-4 text-green-600"
                    />
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Extend Warranty</p>
                      <p className="text-sm text-gray-500">Update with new warranty date</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-white">
                    <input
                      type="radio"
                      name="action"
                      value="claim"
                      checked={formData.action === 'claim'}
                      onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">File Warranty Claim</p>
                      <p className="text-sm text-gray-500">Equipment needs warranty service</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:border-gray-400 transition-colors bg-white">
                    <input
                      type="radio"
                      name="action"
                      value="acknowledge"
                      checked={formData.action === 'acknowledge'}
                      onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                      className="w-4 h-4 text-gray-600"
                    />
                    <CheckCircle className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Acknowledge Expiry</p>
                      <p className="text-sm text-gray-500">No action needed, just note it</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Conditional Fields Based on Action */}
            {actionType === 'maintenance' && formData.action === 'completed' && (
              <div className="space-y-4 p-4 bg-white border-2 border-green-200 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="maintenanceDays">Schedule Next Maintenance (Days)</Label>
                  <Input
                    id="maintenanceDays"
                    type="number"
                    value={formData.maintenanceDays}
                    onChange={(e) => setFormData({ ...formData, maintenanceDays: e.target.value })}
                    placeholder="30"
                    min="1"
                  />
                  <p className="text-xs text-gray-600">
                    Next due: {new Date(Date.now() + parseInt(formData.maintenanceDays || '30') * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            )}

            {actionType === 'maintenance' && formData.action === 'reschedule' && (
              <div className="space-y-4 p-4 bg-white border-2 border-blue-200 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="nextMaintenanceDate">New Maintenance Date</Label>
                  <Input
                    id="nextMaintenanceDate"
                    type="date"
                    value={formData.nextMaintenanceDate}
                    onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}

            {actionType === 'warranty' && formData.action === 'extend' && (
              <div className="space-y-4 p-4 bg-white border-2 border-green-200 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="warrantyExtendDate">New Warranty Expiry Date</Label>
                  <Input
                    id="warrantyExtendDate"
                    type="date"
                    value={formData.warrantyExtendDate}
                    onChange={(e) => setFormData({ ...formData, warrantyExtendDate: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add any additional details..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className={`${
                  actionType === 'maintenance'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                } text-white`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Action
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
