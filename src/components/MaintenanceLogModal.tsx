'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Wrench, 
  Calendar, 
  IndianRupee,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface Equipment {
  id: string
  gym_id: string
  name: string
  category: string
  purchase_date: string
  cost: number
  status: 'Active' | 'Maintenance' | 'Retired' | 'Broken'
  maintenance_due: string
  description: string
  serial_number: string
  warranty_expires: string
  created_at: string
}

interface MaintenanceRecord {
  id: string
  equipment_id: string
  maintenance_type: 'routine' | 'repair' | 'inspection' | 'replacement'
  description: string
  cost: number
  maintenance_date: string
  performed_by: string
  next_due_date: string
  status: 'completed' | 'in_progress' | 'scheduled'
  created_at: string
}

interface MaintenanceLogModalProps {
  equipment: Equipment | null
  isOpen: boolean
  onClose: () => void
}

export default function MaintenanceLogModal({ 
  equipment, 
  isOpen, 
  onClose 
}: MaintenanceLogModalProps) {
  const [loading, setLoading] = useState(false)
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRecord, setNewRecord] = useState({
    maintenance_type: 'routine' as const,
    description: '',
    cost: '',
    maintenance_date: new Date().toISOString().split('T')[0],
    performed_by: '',
    next_due_date: '',
    status: 'completed' as const
  })

  useEffect(() => {
    if (equipment?.id) {
      fetchMaintenanceRecords()
    }
  }, [equipment?.id])

  const fetchMaintenanceRecords = async () => {
    try {
      setLoading(true)
      
      // For demo purposes, we'll create some mock data since we don't have a maintenance_records table
      // In a real app, you would fetch from the database
      const mockRecords: MaintenanceRecord[] = [
        {
          id: '1',
          equipment_id: equipment?.id || '',
          maintenance_type: 'routine',
          description: 'Regular cleaning and lubrication',
          cost: 500,
          maintenance_date: '2024-10-01',
          performed_by: 'John Maintenance Tech',
          next_due_date: '2025-01-01',
          status: 'completed',
          created_at: '2024-10-01T10:00:00Z'
        },
        {
          id: '2',
          equipment_id: equipment?.id || '',
          maintenance_type: 'repair',
          description: 'Fixed belt tension issue',
          cost: 1200,
          maintenance_date: '2024-09-15',
          performed_by: 'Mike Repair Specialist',
          next_due_date: '',
          status: 'completed',
          created_at: '2024-09-15T14:30:00Z'
        }
      ]

      setMaintenanceRecords(mockRecords)
    } catch (error) {
      console.error('Error fetching maintenance records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // In a real app, you would save to the database
      const newMaintenanceRecord: MaintenanceRecord = {
        id: Date.now().toString(),
        equipment_id: equipment?.id || '',
        maintenance_type: newRecord.maintenance_type,
        description: newRecord.description,
        cost: parseFloat(newRecord.cost) || 0,
        maintenance_date: newRecord.maintenance_date,
        performed_by: newRecord.performed_by,
        next_due_date: newRecord.next_due_date,
        status: newRecord.status,
        created_at: new Date().toISOString()
      }

      setMaintenanceRecords(prev => [newMaintenanceRecord, ...prev])
      setShowAddForm(false)
      setNewRecord({
        maintenance_type: 'routine',
        description: '',
        cost: '',
        maintenance_date: new Date().toISOString().split('T')[0],
        performed_by: '',
        next_due_date: '',
        status: 'completed'
      })

      alert('Maintenance record added successfully!')
    } catch (error) {
      console.error('Error adding maintenance record:', error)
      alert('Error adding maintenance record. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getMaintenanceTypeBadge = (type: string) => {
    const styles = {
      'routine': 'bg-blue-100 text-blue-800',
      'repair': 'bg-red-100 text-red-800',
      'inspection': 'bg-yellow-100 text-yellow-800',
      'replacement': 'bg-purple-100 text-purple-800'
    }
    return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      'completed': 'bg-green-100 text-green-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'scheduled': 'bg-blue-100 text-blue-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  if (!isOpen || !equipment) return null

  const totalMaintenanceCost = maintenanceRecords.reduce((sum, record) => sum + record.cost, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Wrench className="h-6 w-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Maintenance Log</h2>
              <p className="text-sm text-gray-500">{equipment.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900">{maintenanceRecords.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Cost</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{totalMaintenanceCost.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <IndianRupee className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Service</p>
                    <p className="text-sm font-bold text-gray-900">
                      {maintenanceRecords.length > 0 
                        ? new Date(maintenanceRecords[0].maintenance_date).toLocaleDateString('en-IN')
                        : 'Never'
                      }
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Record Button */}
          <div className="mb-6">
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Maintenance Record
            </Button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Add New Maintenance Record</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddRecord} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maintenance Type
                      </label>
                      <select
                        value={newRecord.maintenance_type}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, maintenance_type: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="routine">Routine Maintenance</option>
                        <option value="repair">Repair</option>
                        <option value="inspection">Inspection</option>
                        <option value="replacement">Part Replacement</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cost (₹)
                      </label>
                      <Input
                        type="number"
                        value={newRecord.cost}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, cost: e.target.value }))}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maintenance Date
                      </label>
                      <Input
                        type="date"
                        value={newRecord.maintenance_date}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, maintenance_date: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Next Due Date
                      </label>
                      <Input
                        type="date"
                        value={newRecord.next_due_date}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, next_due_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Performed By
                    </label>
                    <Input
                      value={newRecord.performed_by}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, performed_by: e.target.value }))}
                      placeholder="Enter technician name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newRecord.description}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter maintenance description..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {loading ? 'Adding...' : 'Add Record'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Maintenance Records List */}
          <div className="space-y-4">
            {loading && maintenanceRecords.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading maintenance records...</p>
              </div>
            ) : maintenanceRecords.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No maintenance records found</p>
              </div>
            ) : (
              maintenanceRecords.map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getMaintenanceTypeBadge(record.maintenance_type)}>
                            {record.maintenance_type.charAt(0).toUpperCase() + record.maintenance_type.slice(1)}
                          </Badge>
                          <Badge className={getStatusBadge(record.status)}>
                            {record.status.replace('_', ' ').charAt(0).toUpperCase() + record.status.replace('_', ' ').slice(1)}
                          </Badge>
                        </div>
                        <p className="font-medium text-gray-900 mb-1">{record.description}</p>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Performed by: {record.performed_by}</p>
                          <p>Date: {new Date(record.maintenance_date).toLocaleDateString('en-IN')}</p>
                          {record.next_due_date && (
                            <p>Next due: {new Date(record.next_due_date).toLocaleDateString('en-IN')}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₹{record.cost.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(record.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}