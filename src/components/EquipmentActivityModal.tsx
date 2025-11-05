'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Activity, 
  Calendar, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  DollarSign,
  BarChart3
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

interface ActivityEvent {
  id: string
  type: 'status_change' | 'maintenance' | 'repair' | 'purchase' | 'update'
  description: string
  details: string
  date: string
  cost?: number
  performed_by?: string
}

interface EquipmentActivityModalProps {
  equipment: Equipment | null
  isOpen: boolean
  onClose: () => void
}

export default function EquipmentActivityModal({ 
  equipment, 
  isOpen, 
  onClose 
}: EquipmentActivityModalProps) {
  const [loading, setLoading] = useState(false)
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([])

  useEffect(() => {
    if (equipment?.id) {
      fetchActivityData()
    }
  }, [equipment?.id])

  const fetchActivityData = async () => {
    try {
      setLoading(true)
      
      // Mock activity data - in a real app, this would come from an activity log table
      const mockActivity: ActivityEvent[] = [
        {
          id: '1',
          type: 'purchase' as const,
          description: 'Equipment purchased',
          details: `Initial equipment purchase for ₹${equipment?.cost?.toLocaleString('en-IN')}`,
          date: equipment?.purchase_date || equipment?.created_at || '',
          cost: equipment?.cost,
          performed_by: 'System'
        },
        {
          id: '2',
          type: 'status_change' as const,
          description: 'Status changed to Active',
          details: 'Equipment activated and put into service',
          date: equipment?.created_at || '',
          performed_by: 'Gym Manager'
        },
        {
          id: '3',
          type: 'maintenance' as const,
          description: 'Routine maintenance performed',
          details: 'Regular cleaning, lubrication, and safety inspection completed',
          date: '2024-10-01',
          cost: 500,
          performed_by: 'John Maintenance Tech'
        },
        {
          id: '4',
          type: 'repair' as const,
          description: 'Belt tension adjustment',
          details: 'Fixed belt slipping issue and adjusted tension to manufacturer specifications',
          date: '2024-09-15',
          cost: 1200,
          performed_by: 'Mike Repair Specialist'
        },
        {
          id: '5',
          type: 'update' as const,
          description: 'Equipment information updated',
          details: 'Maintenance schedule and warranty information updated',
          date: '2024-08-20',
          performed_by: 'Gym Staff'
        }
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setActivityEvents(mockActivity)
    } catch (error) {
      console.error('Error fetching activity data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !equipment) return null

  const getEventIcon = (type: string) => {
    const icons = {
      'purchase': DollarSign,
      'status_change': CheckCircle,
      'maintenance': Wrench,
      'repair': AlertTriangle,
      'update': Activity
    }
    const IconComponent = icons[type as keyof typeof icons] || Activity
    return <IconComponent className="h-5 w-5" />
  }

  const getEventColor = (type: string) => {
    const colors = {
      'purchase': 'text-green-600 bg-green-100',
      'status_change': 'text-blue-600 bg-blue-100',
      'maintenance': 'text-orange-600 bg-orange-100',
      'repair': 'text-red-600 bg-red-100',
      'update': 'text-purple-600 bg-purple-100'
    }
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  // Calculate equipment analytics
  const calculateAnalytics = () => {
    const purchaseDate = new Date(equipment.purchase_date)
    const today = new Date()
    const ageInDays = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const maintenanceEvents = activityEvents.filter(e => e.type === 'maintenance' || e.type === 'repair')
    const totalMaintenanceCost = maintenanceEvents.reduce((sum, e) => sum + (e.cost || 0), 0)
    
    const warrantyExpires = new Date(equipment.warranty_expires)
    const warrantyDaysLeft = Math.floor((warrantyExpires.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      ageInDays,
      maintenanceEvents: maintenanceEvents.length,
      totalMaintenanceCost,
      warrantyDaysLeft,
      totalCost: (equipment.cost || 0) + totalMaintenanceCost,
      utilizationScore: Math.min(100, Math.max(0, 100 - (ageInDays / 365) * 10)) // Mock utilization score
    }
  }

  const analytics = calculateAnalytics()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Equipment Activity</h2>
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
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">{activityEvents.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Maintenance</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.maintenanceEvents}</p>
                  </div>
                  <Wrench className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Cost</p>
                    <p className="text-xl font-bold text-gray-900">
                      ₹{analytics.totalCost.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Utilization</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(analytics.utilizationScore)}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Equipment Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Equipment Performance Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Equipment Age</label>
                  <p className="text-gray-900">{analytics.ageInDays} days ({Math.floor(analytics.ageInDays / 365)} years)</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Status</label>
                  <Badge className={`mt-1 ${
                    equipment.status === 'Active' ? 'bg-green-100 text-green-800' :
                    equipment.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    equipment.status === 'Broken' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {equipment.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Maintenance Cost</label>
                  <p className="text-gray-900">₹{analytics.totalMaintenanceCost.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Warranty Status</label>
                  <p className="text-gray-900">
                    {analytics.warrantyDaysLeft > 0 
                      ? `${analytics.warrantyDaysLeft} days remaining` 
                      : 'Expired'
                    }
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Cost Efficiency</label>
                <p className="text-gray-900">
                  ₹{((equipment.cost || 0) / Math.max(1, Math.floor(analytics.ageInDays / 365))).toFixed(0)} per year
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Activity Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading activity data...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activityEvents.map((event, index) => (
                    <div key={event.id} className="relative">
                      {/* Timeline line */}
                      {index < activityEvents.length - 1 && (
                        <div className="absolute left-6 top-12 w-px h-16 bg-gray-200"></div>
                      )}
                      
                      <div className="flex items-start space-x-4">
                        {/* Event icon */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getEventColor(event.type)}`}>
                          {getEventIcon(event.type)}
                        </div>
                        
                        {/* Event content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">{event.description}</h4>
                            <div className="flex items-center space-x-2">
                              {event.cost && (
                                <span className="text-sm font-medium text-green-600">
                                  ₹{event.cost.toLocaleString('en-IN')}
                                </span>
                              )}
                              <span className="text-sm text-gray-500">
                                {new Date(event.date).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{event.details}</p>
                          {event.performed_by && (
                            <p className="text-xs text-gray-500 mt-1">by {event.performed_by}</p>
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
    </div>
  )
}