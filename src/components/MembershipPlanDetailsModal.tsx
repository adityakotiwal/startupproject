'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Crown,
  IndianRupee,
  Calendar,
  Users,
  Star,
  Edit,
  Trash2,
  BarChart3,
  TrendingUp,
  Target,
  Settings,
  CheckCircle,
  XCircle,
  Activity,
  Award,
  Zap
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface MembershipPlan {
  id: string
  gym_id: string
  name: string
  price: number
  duration_months: number
  duration_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime'
  features: string[]
  description: string
  status: 'Active' | 'Inactive' | 'Discontinued'
  is_popular: boolean
  max_members: number
  color_theme: string
  created_at: string
}

interface MembershipPlanDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  plan: MembershipPlan
  onPlanUpdated: () => void
}

export default function MembershipPlanDetailsModal({ 
  isOpen, 
  onClose, 
  plan,
  onPlanUpdated 
}: MembershipPlanDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [memberCount, setMemberCount] = useState(0)

  useEffect(() => {
    if (isOpen && plan) {
      fetchMemberCount()
    }
  }, [isOpen, plan])

  if (!isOpen || !plan) return null

  const fetchMemberCount = async () => {
    // Simulate member count - replace with actual query
    setMemberCount(Math.floor(Math.random() * 50) + 10)
  }

  // 🔥 CALCULATE COMPREHENSIVE ANALYTICS 🔥
  const calculateAnalytics = () => {
    // Monthly price standardization
    let monthlyPrice = plan.price
    switch (plan.duration_type) {
      case 'daily':
        monthlyPrice = plan.price * 30
        break
      case 'weekly':
        monthlyPrice = plan.price * 4.33
        break
      case 'monthly':
        monthlyPrice = plan.price
        break
      case 'yearly':
        monthlyPrice = plan.price / 12
        break
      case 'lifetime':
        monthlyPrice = plan.price / 60 // 5-year assumption
        break
    }

    const utilizationRate = plan.max_members > 0 ? (memberCount / plan.max_members * 100) : 0
    const valueScore = (plan.features.length / monthlyPrice) * 1000
    const ageInMonths = Math.floor((new Date().getTime() - new Date(plan.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))

    return {
      monthlyPrice: Math.round(monthlyPrice),
      yearlyRevenue: Math.round(monthlyPrice * 12),
      utilizationRate: Math.round(utilizationRate),
      valueScore: Math.round(valueScore * 100) / 100,
      ageInMonths,
      monthlyRevenue: Math.round(monthlyPrice * memberCount)
    }
  }

  const analytics = calculateAnalytics()

  const handleStatusToggle = async () => {
    setLoading(true)
    const newStatus = plan.status === 'Active' ? 'Inactive' : 'Active'
    
    try {
      const { error } = await supabase
        .from('membership_plans')
        .update({ status: newStatus })
        .eq('id', plan.id)

      if (error) {
        console.error('Error updating plan status:', error)
        alert('Error updating plan status')
      } else {
        onPlanUpdated()
        alert(`Plan ${newStatus.toLowerCase()} successfully!`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error updating plan status')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlan = async () => {
    if (!confirm('Are you sure you want to delete this membership plan? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('membership_plans')
        .delete()
        .eq('id', plan.id)

      if (error) {
        console.error('Error deleting plan:', error)
        alert('Error deleting plan')
      } else {
        onPlanUpdated()
        onClose()
        alert('Plan deleted successfully!')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error deleting plan')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (months: number, type: string) => {
    if (type === 'lifetime') return 'Lifetime'
    const unit = type === 'daily' ? 'day' : 
                 type === 'weekly' ? 'week' :
                 type === 'monthly' ? 'month' : 'year'
    return `${months} ${unit}${months > 1 ? 's' : ''}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Discontinued':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* 🎨 HERO HEADER */}
        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Crown className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">{plan.name}</h1>
                  <p className="text-purple-100">{plan.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 mt-3">
                <Badge className={`${getStatusBadge(plan.status)} border`}>
                  {plan.status === 'Active' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                  {plan.status}
                </Badge>
                {plan.is_popular && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold">₹{plan.price.toLocaleString('en-IN')}</div>
              <div className="text-purple-200">
                {formatDuration(plan.duration_months, plan.duration_type)}
              </div>
            </div>
          </div>
        </div>

        {/* 📊 ANALYTICS CARDS */}
        <div className="p-6 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Plan Analytics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Monthly Revenue</p>
                    <p className="text-xl font-bold">₹{analytics.monthlyRevenue.toLocaleString('en-IN')}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Utilization</p>
                    <p className="text-xl font-bold">{analytics.utilizationRate}%</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Value Score</p>
                    <p className="text-xl font-bold">{analytics.valueScore}</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Plan Age</p>
                    <p className="text-xl font-bold">{analytics.ageInMonths}mo</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 📋 PLAN INFORMATION */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plan Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Plan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Plan ID</label>
                  <p className="text-gray-900 font-mono text-sm">{plan.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Duration</label>
                  <p className="text-gray-900">{formatDuration(plan.duration_months, plan.duration_type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Monthly Price Equivalent</label>
                  <p className="text-gray-900 font-semibold">₹{analytics.monthlyPrice.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Yearly Revenue Potential</label>
                  <p className="text-gray-900 font-semibold">₹{analytics.yearlyRevenue.toLocaleString('en-IN')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Color Theme</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: plan.color_theme || '#3B82F6' }}
                    />
                    <span className="text-gray-900">{plan.color_theme || 'Default'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Member Limit</label>
                  <p className="text-gray-900">
                    {plan.max_members > 0 ? plan.max_members.toLocaleString('en-IN') : 'Unlimited'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Members</label>
                  <p className="text-gray-900 font-semibold">{memberCount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created Date</label>
                  <p className="text-gray-900">{new Date(plan.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 🎯 FEATURES SHOWCASE */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Plan Features ({plan.features.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-900">{feature}</span>
                  </div>
                ))}
              </div>
              {plan.features.length === 0 && (
                <p className="text-gray-500 text-center py-8">No features specified for this plan</p>
              )}
            </CardContent>
          </Card>

          {/* 🚀 ACTION BUTTONS */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.location.href = `/membership-plans/edit/${plan.id}`}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Plan
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleStatusToggle}
              disabled={loading}
              className={
                plan.status === 'Active'
                  ? 'flex-1 text-orange-600 hover:text-orange-700 border-orange-300 hover:bg-orange-50'
                  : 'flex-1 text-green-600 hover:text-green-700 border-green-300 hover:bg-green-50'
              }
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              ) : (
                plan.status === 'Active' ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {plan.status === 'Active' ? 'Deactivate' : 'Activate'} Plan
            </Button>

            <Button 
              variant="outline"
              onClick={() => {/* TODO: Analytics page */}}
              className="flex-1 text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleDeletePlan}
              disabled={loading}
              className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}