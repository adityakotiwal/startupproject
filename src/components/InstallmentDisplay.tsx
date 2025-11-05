'use client'

import { CheckCircle, Clock, AlertTriangle, IndianRupee, TrendingUp, Calendar, Award } from 'lucide-react'

interface Installment {
  number: number
  amount: number
  due_date: string
  paid: boolean
  paid_date: string | null
  payment_id: string | null
  paid_amount?: number // Actual amount paid (may differ from planned amount)
}

interface InstallmentPlan {
  enabled: boolean
  total_amount: number
  num_installments: number
  down_payment?: number
  installments: Installment[]
}

interface InstallmentDisplayProps {
  installmentPlan: InstallmentPlan | null
}

export default function InstallmentDisplay({ installmentPlan }: InstallmentDisplayProps) {
  if (!installmentPlan || !installmentPlan.enabled) {
    return null
  }

  const { installments, total_amount, down_payment } = installmentPlan
  
  // Calculate stats
  const paidInstallments = installments.filter(i => i.paid)
  const pendingInstallments = installments.filter(i => !i.paid)
  // Use paid_amount if available, otherwise use planned amount
  const paidAmount = paidInstallments.reduce((sum, i) => sum + (i.paid_amount || i.amount), 0)
  const remainingAmount = total_amount - paidAmount
  const progressPercentage = (paidInstallments.length / installments.length) * 100
  
  // Find next due
  const today = new Date()
  const nextDue = pendingInstallments
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]
  
  // Find overdue
  const overdueInstallments = pendingInstallments.filter(
    i => new Date(i.due_date) < today
  )

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr)
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const allPaid = paidInstallments.length === installments.length

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Premium Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-md">
            <IndianRupee className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Installment Plan</h3>
            <p className="text-xs text-gray-500 mt-0.5">Flexible payment schedule</p>
          </div>
        </div>
        {down_payment && down_payment > 0 && (
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-amber-200">
            💰 Down Payment
          </div>
        )}
      </div>

      {/* Enhanced Progress Bar */}
      <div className="mb-4 bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">
            Progress: {paidInstallments.length}/{installments.length} Installments
          </span>
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Premium Amount Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-600 font-semibold mb-1">Total</p>
          <p className="text-base font-bold text-gray-900">
            ₹{total_amount.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-xl border border-green-300 shadow-sm">
          <p className="text-xs text-green-700 font-semibold mb-1">Paid</p>
          <p className="text-base font-bold text-green-700">
            ₹{paidAmount.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-3 rounded-xl border border-orange-300 shadow-sm">
          <p className="text-xs text-orange-700 font-semibold mb-1">Remaining</p>
          <p className="text-base font-bold text-orange-700">
            ₹{remainingAmount.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Next Due / Overdue Alert */}
      {!allPaid && (
        <>
          {overdueInstallments.length > 0 ? (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-3 mb-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-red-900 text-sm">
                    ⚠️ {overdueInstallments.length} Overdue Payment{overdueInstallments.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-red-700 mt-1 font-medium">
                    Installment #{overdueInstallments[0].number}: ₹{overdueInstallments[0].amount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {Math.abs(getDaysUntil(overdueInstallments[0].due_date))} days overdue
                  </p>
                </div>
              </div>
            </div>
          ) : nextDue && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-3 mb-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-blue-900 text-sm">📅 Next Payment Due</p>
                  <p className="text-sm text-blue-700 mt-1 font-medium">
                    Installment #{nextDue.number}: ₹{nextDue.amount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    {getDaysUntil(nextDue.due_date)} days remaining
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* All Paid Celebration */}
      {allPaid && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-3 mb-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-green-900 text-sm">
                🎉 All Installments Paid!
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                Payment plan completed successfully
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Premium Installment Schedule */}
      <div className="space-y-3">
        {installments.map((inst, index) => {
          const daysUntil = getDaysUntil(inst.due_date)
          const isOverdue = !inst.paid && daysUntil < 0
          const isDownPayment = down_payment && down_payment > 0 && index === 0
          
          return (
            <div 
              key={inst.number} 
              className={`rounded-xl border-2 p-3 transition-all hover:shadow-md ${
                inst.paid
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                  : isOverdue
                  ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
                  : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
              }`}
            >
              {/* Installment Header */}
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-lg ${
                    inst.paid
                      ? 'bg-green-100'
                      : isOverdue
                      ? 'bg-red-100'
                      : 'bg-orange-100'
                  }`}>
                    {inst.paid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : isOverdue ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {isDownPayment && '💰 '}Installment #{inst.number}
                  </span>
                </div>
                {inst.paid ? (
                  <span className="px-3 py-1 bg-green-200 text-green-800 text-xs font-bold rounded-full shadow-sm">
                    ✓ PAID
                  </span>
                ) : isOverdue ? (
                  <span className="px-3 py-1 bg-red-200 text-red-800 text-xs font-bold rounded-full shadow-sm">
                    ⚠ OVERDUE
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-orange-200 text-orange-800 text-xs font-bold rounded-full shadow-sm">
                    ⏰ PENDING
                  </span>
                )}
              </div>
              
              {/* Grid Layout - Label: Value */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-gray-600 font-medium">Amount</div>
                <div className="font-bold text-gray-900 text-right">
                  ₹{(inst.paid ? (inst.paid_amount || inst.amount) : inst.amount).toLocaleString('en-IN')}
                </div>
                
                <div className="text-gray-600 font-medium">
                  {inst.paid ? 'Paid On' : 'Due Date'}
                </div>
                <div className={`font-semibold text-right ${
                  inst.paid ? 'text-green-700' : isOverdue ? 'text-red-700' : 'text-gray-900'
                }`}>
                  {inst.paid
                    ? formatDate(inst.paid_date!)
                    : formatDate(inst.due_date)
                  }
                </div>
                
                {isOverdue && !inst.paid && (
                  <>
                    <div className="text-gray-600 font-medium">Overdue By</div>
                    <div className="font-bold text-red-700 text-right">
                      {Math.abs(daysUntil)} days
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
