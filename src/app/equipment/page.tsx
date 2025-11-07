'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/hooks/useGymContext'
import { useEquipment, useInvalidateQueries } from '@/hooks/useOptimizedData'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Filter, Download, Wrench, IndianRupee, Calendar, Settings, Eye, Dumbbell, TrendingUp, AlertTriangle, CheckCircle, Edit, Trash2, Clock, RotateCcw, ShieldAlert, ShieldCheck } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppHeader from '@/components/AppHeader'
import { useClientOnly } from '@/hooks/useClientOnly'
import Link from 'next/link'
import { exportEquipmentWithAnalytics } from '@/lib/equipmentCsvExport'
import EquipmentDetailsModal from '@/components/EquipmentDetailsModal'
import EditEquipmentModal from '@/components/EditEquipmentModal'
import EquipmentAdvancedFiltersModal from '@/components/EquipmentAdvancedFiltersModal'
import EquipmentActionModal from '@/components/EquipmentActionModal'

// Equipment interface - using the table structure we created
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

// Advanced filter options interface
interface EquipmentFilterOptions {
  status: string[]
  category: string[]
  costFrom: string
  costTo: string
  purchaseDateFrom: string
  purchaseDateTo: string
  maintenanceDueFrom: string
  maintenanceDueTo: string
  warrantyStatus: string[]
  maintenanceStatus: string[]
  ageFrom: string
  ageTo: string
}

export default function EquipmentPage() {
  // Hooks
  const router = useRouter()
  
  // State management  
  const { user } = useAuth()
  const { currentGym, gymId, loading: gymLoading } = useGymContext()
  const isClient = useClientOnly()
  
  // React Query optimized data fetching
  // Use isPending instead of isLoading - only true when NO data exists (not during background refetch)
  const { data: equipment = [], isPending: isLoading, refetch } = useEquipment(gymId)
  const { invalidateEquipment } = useInvalidateQueries()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [showEquipmentDetails, setShowEquipmentDetails] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'maintenance' | 'warranty'>('maintenance')
  const [exportingCSV, setExportingCSV] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<EquipmentFilterOptions>({
    status: [],
    category: [],
    costFrom: '',
    costTo: '',
    purchaseDateFrom: '',
    purchaseDateTo: '',
    maintenanceDueFrom: '',
    maintenanceDueTo: '',
    warrantyStatus: [],
    maintenanceStatus: [],
    ageFrom: '',
    ageTo: ''
  })
  
  // Refresh callback for modals
  const refreshEquipment = () => {
    refetch()
    invalidateEquipment()
  }
  
  const loading = isLoading || gymLoading

  // Helper function to calculate equipment age
  const calculateEquipmentAge = (purchaseDate: string) => {
    if (!purchaseDate) return 0
    const today = new Date()
    const purchase = new Date(purchaseDate)
    const ageInDays = Math.floor((today.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24))
    return ageInDays / 365 // Return age in years
  }

  // Helper function to get warranty status
  const getWarrantyStatus = (warrantyExpires: string) => {
    if (!warrantyExpires) return 'No Warranty'
    const today = new Date()
    const expiry = new Date(warrantyExpires)
    const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft < 0) return 'Expired'
    if (daysLeft <= 30) return 'Expiring Soon'
    return 'Active'
  }

  // Helper function to get maintenance status
  const getMaintenanceStatus = (maintenanceDue: string) => {
    if (!maintenanceDue) return 'Not Scheduled'
    const today = new Date()
    const dueDate = new Date(maintenanceDue)
    const daysLeft = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft < 0) return 'Overdue'
    if (daysLeft <= 7) return 'Due Soon'
    return 'Up to Date'
  }

  // Advanced filter equipment based on all criteria
  const filteredEquipment = useMemo(() => {
    return equipment.filter(item => {
      // Basic search filter
      const matchesSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Basic category and status filters
      const matchesCategory = categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase()
      const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase()
      
      // Advanced filters
      const matchesAdvancedStatus = advancedFilters.status.length === 0 || 
        advancedFilters.status.some(status => status.toLowerCase() === item.status.toLowerCase())
      
      const matchesAdvancedCategory = advancedFilters.category.length === 0 || 
        advancedFilters.category.some(cat => cat.toLowerCase() === item.category.toLowerCase())
      
      // Cost filters
      const matchesCostFrom = !advancedFilters.costFrom || !item.cost ||
        item.cost >= parseInt(advancedFilters.costFrom)
      
      const matchesCostTo = !advancedFilters.costTo || !item.cost ||
        item.cost <= parseInt(advancedFilters.costTo)
      
      // Date filters
      const matchesPurchaseDateFrom = !advancedFilters.purchaseDateFrom || !item.purchase_date ||
        new Date(item.purchase_date) >= new Date(advancedFilters.purchaseDateFrom)
      
      const matchesPurchaseDateTo = !advancedFilters.purchaseDateTo || !item.purchase_date ||
        new Date(item.purchase_date) <= new Date(advancedFilters.purchaseDateTo)
      
      const matchesMaintenanceDueFrom = !advancedFilters.maintenanceDueFrom || !item.maintenance_due ||
        new Date(item.maintenance_due) >= new Date(advancedFilters.maintenanceDueFrom)
      
      const matchesMaintenanceDueTo = !advancedFilters.maintenanceDueTo || !item.maintenance_due ||
        new Date(item.maintenance_due) <= new Date(advancedFilters.maintenanceDueTo)
      
      // Age filters
      let matchesAge = true
      if (item.purchase_date && (advancedFilters.ageFrom || advancedFilters.ageTo)) {
        const age = calculateEquipmentAge(item.purchase_date)
        if (advancedFilters.ageFrom && age < parseFloat(advancedFilters.ageFrom)) {
          matchesAge = false
        }
        if (advancedFilters.ageTo && age > parseFloat(advancedFilters.ageTo)) {
          matchesAge = false
        }
      }
      
      // Warranty status filter
      const warrantyStatus = getWarrantyStatus(item.warranty_expires)
      const matchesWarrantyStatus = advancedFilters.warrantyStatus.length === 0 || 
        advancedFilters.warrantyStatus.includes(warrantyStatus)
      
      // Maintenance status filter
      const maintenanceStatus = getMaintenanceStatus(item.maintenance_due)
      const matchesMaintenanceStatus = advancedFilters.maintenanceStatus.length === 0 || 
        advancedFilters.maintenanceStatus.includes(maintenanceStatus)
      
      return matchesSearch && matchesCategory && matchesStatus &&
             matchesAdvancedStatus && matchesAdvancedCategory &&
             matchesCostFrom && matchesCostTo &&
             matchesPurchaseDateFrom && matchesPurchaseDateTo &&
             matchesMaintenanceDueFrom && matchesMaintenanceDueTo &&
             matchesAge && matchesWarrantyStatus && matchesMaintenanceStatus
    })
  }, [equipment, searchTerm, categoryFilter, statusFilter, advancedFilters])

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800 border-green-200',
      'maintenance': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'retired': 'bg-gray-100 text-gray-800 border-gray-200',
      'broken': 'bg-red-100 text-red-800 border-red-200'
    }
    
    const colorClass = colors[status.toLowerCase()] || colors['active']
    return <Badge className={colorClass}>{status}</Badge>
  }

  // Get category badge color
  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      'cardio': 'bg-blue-100 text-blue-800 border-blue-200',
      'strength': 'bg-purple-100 text-purple-800 border-purple-200',
      'free weights': 'bg-orange-100 text-orange-800 border-orange-200',
      'accessories': 'bg-pink-100 text-pink-800 border-pink-200',
      'other': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    
    const colorClass = colors[category.toLowerCase()] || colors['other']
    return <Badge className={colorClass}>{category}</Badge>
  }

  // Format amount
  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  // Calculate totals
  const totalValue = equipment.reduce((sum, item) => sum + item.cost, 0)
  const activeEquipment = equipment.filter(item => item.status === 'Active').length
  const maintenanceDue = equipment.filter(item => {
    if (!item.maintenance_due) return false
    const dueDate = new Date(item.maintenance_due)
    const today = new Date()
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
    return daysDiff <= 7 && daysDiff >= 0
  }).length
  
  const warrantyExpiringSoon = equipment.filter(item => {
    if (!item.warranty_expires) return false
    const expiryDate = new Date(item.warranty_expires)
    const today = new Date()
    const daysDiff = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
    return daysDiff <= 30 && daysDiff >= 0
  }).length

  // Event handlers
  const handleViewEquipment = (equipmentItem: Equipment) => {
    setSelectedEquipment(equipmentItem)
    setShowEquipmentDetails(true)
  }

  const handleExportCSV = async () => {
    try {
      setExportingCSV(true)
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for animation
      exportEquipmentWithAnalytics(filteredEquipment, `gym-equipment-${currentGym?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`)
    } finally {
      setExportingCSV(false)
    }
  }

  const handleApplyAdvancedFilters = (filters: EquipmentFilterOptions) => {
    setAdvancedFilters(filters)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <AppHeader 
          onRefresh={refreshEquipment}
          isRefreshing={loading}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Header with Gradient */}
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <Dumbbell className="h-8 w-8 text-white" />
                  <h1 className="text-3xl font-bold text-white">Equipment Management</h1>
                </div>
                <p className="text-orange-100 text-lg">Track, analyze, and optimize your gym equipment with powerful insights</p>
                <div className="flex items-center space-x-6 mt-4 text-sm text-orange-100">
                  <div className="flex items-center space-x-2">
                    <Wrench className="h-4 w-4" />
                    <span>Maintenance Tracking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Asset Optimization</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                  <Wrench className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Settings className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error Loading Equipment</h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards with Orange/Amber Theme */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Total Equipment</p>
                    <p className="text-3xl font-bold text-white mb-1">
                      {equipment.length}
                    </p>
                    <p className="text-orange-100 text-xs">Avg: {formatAmount(totalValue / Math.max(equipment.length, 1))}</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <Dumbbell className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">This Month</p>
                    <p className="text-3xl font-bold text-white mb-1">
                      {formatAmount(totalValue)}
                    </p>
                    <p className="text-amber-100 text-xs">{(activeEquipment / Math.max(equipment.length, 1) * 100).toFixed(0)}% active</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">Total Records</p>
                    <p className="text-3xl font-bold text-white mb-1">
                      {equipment.length}
                    </p>
                    <p className="text-yellow-100 text-xs">Latest: {equipment[0]?.created_at ? new Date(equipment[0].created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Active Equipment</p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {activeEquipment}
                    </p>
                    <p className="text-gray-500 text-xs">{maintenanceDue > 0 ? `${maintenanceDue} need maintenance` : 'All up to date'}</p>
                  </div>
                  <div className="bg-orange-100 rounded-lg p-3">
                    {maintenanceDue > 0 ? (
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    ) : (
                      <CheckCircle className="h-6 w-6 text-orange-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button 
              onClick={() => router.push('/equipment/add')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200"
            >
              <Plus size={20} />
              Add Equipment
            </button>

            {/* Urgent Items Quick Filter */}
            {(maintenanceDue > 0 || warrantyExpiringSoon > 0) && (
              <button 
                onClick={() => {
                  setAdvancedFilters({
                    ...advancedFilters,
                    maintenanceStatus: ['Overdue', 'Due Soon'],
                    warrantyStatus: ['Expired', 'Expiring Soon']
                  })
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transform hover:scale-105 transition-all duration-200 animate-pulse"
              >
                <AlertTriangle size={20} />
                Urgent Items ({maintenanceDue + warrantyExpiringSoon})
              </button>
            )}

            <button 
              onClick={handleExportCSV}
              disabled={exportingCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} className={exportingCSV ? 'animate-spin' : ''} />
              {exportingCSV ? 'Exporting...' : `Export CSV (${filteredEquipment.length})`}
            </button>
            <button 
              onClick={() => setShowAdvancedFilters(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transform hover:scale-105 transition-all duration-200 ${
                Object.values(advancedFilters).some(val => Array.isArray(val) ? val.length > 0 : val !== '')
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <Filter size={20} />
              More Filters
              {Object.values(advancedFilters).some(val => Array.isArray(val) ? val.length > 0 : val !== '') && (
                <span className="bg-purple-800 px-2 py-1 rounded-full text-xs">
                  Active
                </span>
              )}
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search equipment by name, category, or serial number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="cardio">Cardio</option>
                <option value="strength">Strength</option>
                <option value="free weights">Free Weights</option>
                <option value="accessories">Accessories</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
                <option value="broken">Broken</option>
              </select>
            </div>
          </div>

          {/* Equipment List */}
          {filteredEquipment.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Settings className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment found</h3>
                <p className="text-gray-500 text-center mb-6">
                  {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                    ? 'No equipment matches your search criteria.' 
                    : 'Get started by adding your first piece of equipment.'}
                </p>
                <Link href="/equipment/add">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Equipment
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredEquipment.map((item) => (
                <Card 
                  key={item.id} 
                  className="relative hover:shadow-2xl hover:scale-105 hover:border-blue-300 transition-all duration-300 cursor-pointer group overflow-hidden"
                  onClick={() => handleViewEquipment(item)}
                >
                  {/* Colored background overlay on hover */}
                  <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />

                  <CardContent className="p-6 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Settings className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {item.name}
                              </h3>
                              <div className="flex space-x-2">
                                {getCategoryBadge(item.category)}
                                {getStatusBadge(item.status)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">
                              {formatAmount(item.cost)}
                            </p>
                            {item.serial_number && (
                              <p className="text-sm text-gray-500">
                                S/N: {item.serial_number}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {item.purchase_date && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Purchased:</span> {new Date(item.purchase_date).toLocaleDateString('en-IN')}
                            </div>
                          )}
                          {item.maintenance_due && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Next Maintenance:</span> {new Date(item.maintenance_due).toLocaleDateString('en-IN')}
                            </div>
                          )}
                          {item.warranty_expires && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Warranty Expires:</span> {new Date(item.warranty_expires).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Added: {new Date(item.created_at).toLocaleDateString('en-IN')}
                          </div>
                          
                          {/* Quick Actions */}
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {/* Maintenance Action Button */}
                            {item.maintenance_due && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedEquipment(item)
                                  setActionType('maintenance')
                                  setShowActionModal(true)
                                }}
                                className={`group ${
                                  new Date(item.maintenance_due) < new Date()
                                    ? 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100'
                                    : 'hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300'
                                } transition-all duration-200 overflow-hidden`}
                                title={`Maintenance due: ${new Date(item.maintenance_due).toLocaleDateString('en-IN')}`}
                              >
                                <Wrench className="h-4 w-4 flex-shrink-0" />
                                <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                  {new Date(item.maintenance_due) < new Date() ? 'Overdue' : 'Maintenance'}
                                </span>
                              </Button>
                            )}

                            {/* Warranty Action Button */}
                            {item.warranty_expires && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedEquipment(item)
                                  setActionType('warranty')
                                  setShowActionModal(true)
                                }}
                                className={`group ${
                                  new Date(item.warranty_expires) < new Date()
                                    ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                                    : new Date(item.warranty_expires).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000
                                    ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                                    : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300'
                                } transition-all duration-200 overflow-hidden`}
                                title={`Warranty expires: ${new Date(item.warranty_expires).toLocaleDateString('en-IN')}`}
                              >
                                <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                                <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                  {new Date(item.warranty_expires) < new Date() ? 'Expired' : 'Warranty'}
                                </span>
                              </Button>
                            )}

                            {/* Edit Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEquipment(item)
                                setShowEditModal(true)
                              }}
                              className="group hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 overflow-hidden"
                            >
                              <Edit className="h-4 w-4 flex-shrink-0" />
                              <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                Edit
                              </span>
                            </Button>

                            {/* Delete Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                                  try {
                                    const { error } = await supabase
                                      .from('equipment')
                                      .delete()
                                      .eq('id', item.id)
                                    
                                    if (error) throw error
                                    refreshEquipment()
                                  } catch (error) {
                                    console.error('Error deleting equipment:', error)
                                    alert('Failed to delete equipment')
                                  }
                                }
                              }}
                              className="group hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-200 overflow-hidden"
                            >
                              <Trash2 className="h-4 w-4 flex-shrink-0" />
                              <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                Delete
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedEquipment && (
        <EquipmentDetailsModal
          equipment={selectedEquipment}
          isOpen={showEquipmentDetails}
          onClose={() => {
            setShowEquipmentDetails(false)
            setSelectedEquipment(null)
          }}
          onEquipmentUpdated={() => {
            // Refresh equipment list
            refreshEquipment()
          }}
        />
      )}

      {selectedEquipment && (
        <EditEquipmentModal
          equipment={selectedEquipment}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedEquipment(null)
          }}
          onEquipmentUpdated={() => {
            setShowEditModal(false)
            setSelectedEquipment(null)
            refreshEquipment()
          }}
        />
      )}

      {/* Equipment Action Modal */}
      {showActionModal && selectedEquipment && (
        <EquipmentActionModal
          equipment={selectedEquipment}
          actionType={actionType}
          onClose={() => {
            setShowActionModal(false)
            setSelectedEquipment(null)
          }}
          onSuccess={() => {
            refreshEquipment()
          }}
        />
      )}

      <EquipmentAdvancedFiltersModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={handleApplyAdvancedFilters}
      />
    </ProtectedRoute>
  )
}