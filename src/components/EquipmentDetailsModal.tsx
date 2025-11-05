'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Wrench, 
  Calendar, 
  IndianRupee,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Activity,
  Award,
  Building,
  Hash,
  FileText,
  Shield,
  TrendingUp
} from 'lucide-react'
// import EditEquipmentModal from './EditEquipmentModal'
// import MaintenanceLogModal from './MaintenanceLogModal'
// import EquipmentActivityModal from './EquipmentActivityModal'

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

interface EquipmentDetailsModalProps {
  equipment: Equipment | null
  isOpen: boolean
  onClose: () => void
  onEquipmentUpdated: () => void
}

export default function EquipmentDetailsModal({ 
  equipment, 
  isOpen, 
  onClose, 
  onEquipmentUpdated 
}: EquipmentDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  
  // Modal states for action buttons
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMaintenanceLog, setShowMaintenanceLog] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)

  if (!isOpen || !equipment) return null

  // Calculate equipment analytics
  const calculateAnalytics = () => {
    const purchaseDate = new Date(equipment.purchase_date)
    const today = new Date()
    const ageInDays = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
    const ageInMonths = Math.floor(ageInDays / 30)
    const ageInYears = Math.floor(ageInDays / 365)

    // Warranty status
    const warrantyExpires = new Date(equipment.warranty_expires)
    const warrantyDaysLeft = Math.floor((warrantyExpires.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const warrantyStatus = warrantyDaysLeft > 0 ? 'Active' : 'Expired'

    // Maintenance status
    const maintenanceDue = new Date(equipment.maintenance_due)
    const maintenanceDaysLeft = Math.floor((maintenanceDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const maintenanceStatus = maintenanceDaysLeft <= 0 ? 'Overdue' : maintenanceDaysLeft <= 7 ? 'Due Soon' : 'Up to Date'

    return {
      ageInDays,
      ageInMonths,
      ageInYears,
      ageDisplay: ageInYears > 0 ? `${ageInYears} year(s), ${ageInMonths % 12} month(s)` : `${ageInMonths} month(s)`,
      warrantyStatus,
      warrantyDaysLeft,
      maintenanceStatus,
      maintenanceDaysLeft,
      costPerYear: ageInYears > 0 ? (equipment.cost / ageInYears).toFixed(2) : equipment.cost.toFixed(2)
    }
  }

  const analytics = calculateAnalytics()

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const styles = {
      'Active': 'bg-green-100 text-green-800',
      'Maintenance': 'bg-yellow-100 text-yellow-800',
      'Broken': 'bg-red-100 text-red-800',
      'Retired': 'bg-gray-100 text-gray-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  // Maintenance status styling
  const getMaintenanceStatusBadge = (status: string) => {
    const styles = {
      'Up to Date': 'bg-green-100 text-green-800',
      'Due Soon': 'bg-yellow-100 text-yellow-800',
      'Overdue': 'bg-red-100 text-red-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  // Warranty status styling
  const getWarrantyStatusBadge = (status: string) => {
    const styles = {
      'Active': 'bg-green-100 text-green-800',
      'Expired': 'bg-red-100 text-red-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  // Handle equipment deletion
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this equipment? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', equipment.id)

      if (error) throw error

      onEquipmentUpdated()
      onClose()
      alert('Equipment deleted successfully!')
    } catch (error) {
      console.error('Error deleting equipment:', error)
      alert('Error deleting equipment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <Wrench className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{equipment.name}</h2>
                <p className="text-sm text-gray-500">Equipment Details</p>
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
            {/* Status and Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <Badge className={`mt-1 ${getStatusBadge(equipment.status)}`}>
                        {equipment.status}
                      </Badge>
                    </div>
                    <Settings className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Cost</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{equipment.cost?.toLocaleString('en-IN') || '0'}
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
                      <p className="text-sm font-medium text-gray-600">Age</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.ageDisplay}</p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Maintenance and Warranty Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Wrench className="h-5 w-5 text-orange-600" />
                      <span className="font-medium text-gray-900">Maintenance Status</span>
                    </div>
                    <Badge className={getMaintenanceStatusBadge(analytics.maintenanceStatus)}>
                      {analytics.maintenanceStatus}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      Due: {equipment.maintenance_due ? new Date(equipment.maintenance_due).toLocaleDateString('en-IN') : 'Not set'}
                    </p>
                    {analytics.maintenanceDaysLeft > 0 && (
                      <p className="text-sm text-gray-600">
                        In {analytics.maintenanceDaysLeft} days
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-900">Warranty Status</span>
                    </div>
                    <Badge className={getWarrantyStatusBadge(analytics.warrantyStatus)}>
                      {analytics.warrantyStatus}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      Expires: {equipment.warranty_expires ? new Date(equipment.warranty_expires).toLocaleDateString('en-IN') : 'Not set'}
                    </p>
                    {analytics.warrantyDaysLeft > 0 && (
                      <p className="text-sm text-gray-600">
                        {analytics.warrantyDaysLeft} days remaining
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Equipment Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Equipment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <p className="text-gray-900 capitalize">{equipment.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Serial Number</label>
                    <p className="text-gray-900">{equipment.serial_number || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Purchase Date</label>
                    <p className="text-gray-900">
                      {equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString('en-IN') : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cost per Year</label>
                    <p className="text-gray-900">₹{analytics.costPerYear}</p>
                  </div>
                </div>
                {equipment.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900 mt-1">{equipment.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => alert('Edit Equipment feature coming soon!')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Equipment
              </Button>
              
              <Button
                onClick={() => alert('Maintenance Log feature coming soon!')}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Maintenance Log
              </Button>

              <Button
                onClick={() => alert('Equipment Activity feature coming soon!')}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Activity className="h-4 w-4 mr-2" />
                View Activity
              </Button>

              <Button
                onClick={handleDelete}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {loading ? 'Deleting...' : 'Delete Equipment'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modals - Coming Soon */}
      {/* 
      {equipment && (
        <>
          <EditEquipmentModal
            equipment={equipment}
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onEquipmentUpdated={() => {
              setShowEditModal(false)
              onEquipmentUpdated()
            }}
          />

          <MaintenanceLogModal
            equipment={equipment}
            isOpen={showMaintenanceLog}
            onClose={() => setShowMaintenanceLog(false)}
          />

          <EquipmentActivityModal
            equipment={equipment}
            isOpen={showActivityModal}
            onClose={() => setShowActivityModal(false)}
          />
        </>
      )}
      */}
    </>
  )
}