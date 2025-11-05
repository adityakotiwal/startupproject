'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, IndianRupee, Check, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Installment {
  number: number
  amount: number
  due_date: string
  paid: boolean
  paid_date: string | null
  payment_id: string | null
}

interface InstallmentPlan {
  enabled: boolean
  total_amount: number
  num_installments: number
  down_payment: number
  installments: Installment[]
}

interface InstallmentSetupModalProps {
  isOpen: boolean
  onClose: () => void
  totalAmount: number
  startDate: string
  onSave: (plan: InstallmentPlan) => void
}

export default function InstallmentSetupModal({
  isOpen,
  onClose,
  totalAmount,
  startDate,
  onSave
}: InstallmentSetupModalProps) {
  const [numInstallments, setNumInstallments] = useState(3)
  const [hasDownPayment, setHasDownPayment] = useState(false)
  const [downPaymentAmount, setDownPaymentAmount] = useState('')
  const [installments, setInstallments] = useState<Installment[]>([])

  // Auto-calculate installments
  useEffect(() => {
    if (!isOpen) return
    
    const start = new Date(startDate)
    const newInstallments: Installment[] = []
    
    if (hasDownPayment && downPaymentAmount) {
      const downPayment = parseFloat(downPaymentAmount)
      const remaining = totalAmount - downPayment
      const remainingInstallments = numInstallments - 1
      
      if (downPayment > 0 && downPayment < totalAmount && remainingInstallments > 0) {
        // First installment is down payment
        newInstallments.push({
          number: 1,
          amount: downPayment,
          due_date: start.toISOString().split('T')[0],
          paid: false,
          paid_date: null,
          payment_id: null
        })
        
        // Remaining installments split equally
        const baseAmount = Math.floor(remaining / remainingInstallments)
        const remainder = remaining - (baseAmount * remainingInstallments)
        
        for (let i = 0; i < remainingInstallments; i++) {
          const dueDate = new Date(start)
          dueDate.setMonth(start.getMonth() + (i + 1))
          
          newInstallments.push({
            number: i + 2,
            amount: i === remainingInstallments - 1 ? baseAmount + remainder : baseAmount,
            due_date: dueDate.toISOString().split('T')[0],
            paid: false,
            paid_date: null,
            payment_id: null
          })
        }
      } else {
        setHasDownPayment(false)
        setDownPaymentAmount('')
      }
    }
    
    if (!hasDownPayment || newInstallments.length === 0) {
      // Equal split
      const baseAmount = Math.floor(totalAmount / numInstallments)
      const remainder = totalAmount - (baseAmount * numInstallments)
      
      for (let i = 0; i < numInstallments; i++) {
        const dueDate = new Date(start)
        dueDate.setMonth(start.getMonth() + i)
        
        newInstallments.push({
          number: i + 1,
          amount: i === numInstallments - 1 ? baseAmount + remainder : baseAmount,
          due_date: dueDate.toISOString().split('T')[0],
          paid: false,
          paid_date: null,
          payment_id: null
        })
      }
    }
    
    setInstallments(newInstallments)
  }, [numInstallments, totalAmount, startDate, isOpen, hasDownPayment, downPaymentAmount])

  const handleAmountChange = (index: number, value: string) => {
    const newInstallments = [...installments]
    newInstallments[index].amount = parseFloat(value) || 0
    setInstallments(newInstallments)
  }

  const handleDateChange = (index: number, value: string) => {
    const newInstallments = [...installments]
    newInstallments[index].due_date = value
    setInstallments(newInstallments)
  }

  const getTotalOfInstallments = () => {
    return installments.reduce((sum, inst) => sum + inst.amount, 0)
  }

  const isValid = () => {
    return Math.abs(getTotalOfInstallments() - totalAmount) < 1
  }

  const handleSave = () => {
    if (!isValid()) {
      alert('Total of installments must equal the membership amount!')
      return
    }

    const plan: InstallmentPlan = {
      enabled: true,
      total_amount: totalAmount,
      num_installments: numInstallments,
      down_payment: hasDownPayment ? parseFloat(downPaymentAmount) : 0,
      installments: installments
    }

    onSave(plan)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header with Gradient */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Setup Installment Plan</h2>
                <p className="text-blue-100 mt-1">Make payments easy and flexible for your members</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Total Amount Display */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-2xl border-2 border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <IndianRupee className="h-6 w-6 text-green-600" />
                <span className="text-gray-700 font-semibold text-lg">Total Membership Amount</span>
              </div>
              <span className="text-3xl font-bold text-green-700">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Number of Installments */}
          <div>
            <Label className="text-base font-semibold mb-3 block text-gray-800">
              Choose Number of Installments
            </Label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[2, 3, 4, 6, 12].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNumInstallments(num)}
                  className={`p-4 rounded-xl border-2 font-bold text-lg transition-all transform hover:scale-105 ${
                    numInstallments === num
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  {num}
                </button>
              ))}
              <input
                type="number"
                min="2"
                max="24"
                value={numInstallments}
                onChange={(e) => setNumInstallments(parseInt(e.target.value) || 2)}
                className="p-4 rounded-xl border-2 border-gray-200 focus:border-blue-600 focus:outline-none text-center font-bold text-lg hover:border-blue-300"
                placeholder="Custom"
              />
            </div>
          </div>

          {/* Down Payment Option */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-2xl border-2 border-amber-300 shadow-sm">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="hasDownPayment"
                checked={hasDownPayment}
                onChange={(e) => {
                  setHasDownPayment(e.target.checked)
                  if (!e.target.checked) {
                    setDownPaymentAmount('')
                  }
                }}
                className="mt-1 w-5 h-5 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex-1">
                <label htmlFor="hasDownPayment" className="font-bold text-gray-800 cursor-pointer flex items-center text-lg">
                  💰 Enable Down Payment
                  <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full">Recommended</span>
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Collect a larger initial payment to ensure member commitment
                </p>
                
                {hasDownPayment && (
                  <div className="mt-4 space-y-3">
                    <Label className="text-sm font-semibold">Down Payment Amount (₹)</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                      <Input
                        type="number"
                        value={downPaymentAmount}
                        onChange={(e) => setDownPaymentAmount(e.target.value)}
                        placeholder={`Suggested: ₹${Math.floor(totalAmount * 0.4).toLocaleString('en-IN')}`}
                        max={totalAmount - 1}
                        min={1}
                        className="pl-12 py-6 text-lg font-semibold bg-white border-2 border-amber-200 focus:border-amber-400"
                      />
                    </div>
                    {downPaymentAmount && parseFloat(downPaymentAmount) > 0 && (
                      <div className="bg-white rounded-xl p-4 border-2 border-amber-200">
                        <p className="text-sm font-semibold text-amber-800">
                          💡 Remaining ₹{(totalAmount - parseFloat(downPaymentAmount)).toLocaleString('en-IN')} will be split over {numInstallments - 1} installments
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Each: ₹{Math.floor((totalAmount - parseFloat(downPaymentAmount)) / (numInstallments - 1)).toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Installment Schedule */}
          <div>
            <Label className="text-base font-semibold mb-3 block text-gray-800">
              Installment Schedule
            </Label>
            <div className="space-y-3">
              {installments.map((inst, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-xl border-2 transition-all ${
                    hasDownPayment && index === 0
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 shadow-md'
                      : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div>
                    <Label className="text-xs text-gray-600 mb-2 block font-semibold">
                      {hasDownPayment && index === 0 ? (
                        <span className="flex items-center text-amber-700">
                          💰 Down Payment (#{inst.number})
                        </span>
                      ) : (
                        `Installment #${inst.number}`
                      )}
                    </Label>
                    <div className="flex items-center space-x-2">
                      <IndianRupee className="h-5 w-5 text-gray-400" />
                      <Input
                        type="number"
                        value={inst.amount}
                        onChange={(e) => handleAmountChange(index, e.target.value)}
                        className="flex-1 font-semibold text-lg"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-gray-600 mb-2 block font-semibold">
                      Due Date
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <Input
                        type="date"
                        value={inst.due_date}
                        onChange={(e) => handleDateChange(index, e.target.value)}
                        className="flex-1 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Summary */}
          <div className={`p-5 rounded-2xl border-2 ${
            isValid()
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-800 text-lg">
                  Total of Installments: ₹{getTotalOfInstallments().toLocaleString('en-IN')}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {isValid() ? (
                    <span className="text-green-700 flex items-center font-semibold">
                      <Check className="h-4 w-4 mr-1" />
                      Perfect! Matches membership amount
                    </span>
                  ) : (
                    <span className="text-red-700 flex items-center font-semibold">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Must equal ₹{totalAmount.toLocaleString('en-IN')}
                    </span>
                  )}
                </p>
              </div>
              {isValid() && (
                <Check className="h-10 w-10 text-green-600" />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-3xl border-t flex justify-end space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-8 py-6 text-base font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid()}
            className="px-8 py-6 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            <Check className="h-5 w-5 mr-2" />
            Setup Installments
          </Button>
        </div>
      </div>
    </div>
  )
}
