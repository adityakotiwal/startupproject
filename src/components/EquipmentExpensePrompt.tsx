'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  CheckCircle, 
  X, 
  ArrowRight, 
  Receipt,
  Sparkles,
  TrendingDown,
  Calendar,
  Tag,
  FileText,
  IndianRupee
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'

interface EquipmentData {
  id: string
  name: string
  cost: number
  purchase_date: string
  category: string
  serial_number?: string
  description?: string
}

interface EquipmentExpensePromptProps {
  equipment: EquipmentData
  gymId: string
  isOpen: boolean
  onClose: () => void
  onEquipmentInvalidate?: () => void
}

export default function EquipmentExpensePrompt({ 
  equipment, 
  gymId, 
  isOpen, 
  onClose,
  onEquipmentInvalidate
}: EquipmentExpensePromptProps) {
  const router = useRouter()
  const [isCreatingExpense, setIsCreatingExpense] = useState(false)
  const [expenseCreated, setExpenseCreated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateExpense = async () => {
    setIsCreatingExpense(true)
    setError(null)

    try {
      // Create expense with equipment purchase details
      const expenseData = {
        gym_id: gymId,
        category: 'Equipment Purchase',
        description: `${equipment.name}${equipment.serial_number ? ` (SN: ${equipment.serial_number})` : ''}${equipment.description ? ` - ${equipment.description}` : ''}`,
        amount: equipment.cost,
        expense_date: equipment.purchase_date || new Date().toISOString().split('T')[0]
      }

      const { error: expenseError } = await supabase
        .from('expenses')
        .insert([expenseData])

      if (expenseError) {
        console.error('Error creating expense:', expenseError)
        setError('Failed to create expense. Please try again.')
        return
      }

      setExpenseCreated(true)
      
      // Auto close and redirect after 2 seconds
      setTimeout(() => {
        onClose()
        setTimeout(() => {
          router.push('/expenses')
        }, 100)
      }, 2000)

    } catch (error) {
      console.error('Unexpected error:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsCreatingExpense(false)
    }
  }

  const handleSkip = () => {
    // Invalidate equipment cache so it refreshes when navigating back
    if (onEquipmentInvalidate) {
      onEquipmentInvalidate()
    }
    onClose()
    router.push('/equipment')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl"
        >
          <Card className="border-2 border-green-200 shadow-2xl overflow-hidden bg-white">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="bg-white bg-opacity-20 p-3 rounded-full"
                  >
                    <CheckCircle className="h-8 w-8 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Equipment Added!</h2>
                    <p className="text-green-100">Would you like to record this as an expense?</p>
                  </div>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                  disabled={isCreatingExpense}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <CardContent className="p-6">
              {expenseCreated ? (
                // Success State
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Expense Created!</h3>
                  <p className="text-gray-600">Redirecting to expenses page...</p>
                </motion.div>
              ) : (
                <>
                  {/* Smart Suggestion Box */}
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-lg p-5 mb-6 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-600 p-2.5 rounded-lg shadow-md flex-shrink-0">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-purple-900 mb-2 text-base">💡 Smart Suggestion</h3>
                        <p className="text-sm text-purple-800 leading-relaxed font-medium">
                          Save time! We've automatically filled the expense details from your equipment. 
                          Just click <strong className="text-purple-900">"Record Expense"</strong> to track this purchase in your books.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Equipment Details Preview */}
                  <div className="space-y-4 mb-6">
                    <h3 className="font-bold text-gray-900 flex items-center text-base">
                      <Receipt className="h-5 w-5 mr-2 text-blue-600" />
                      Expense Preview
                    </h3>
                    
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm">
                      <div className="flex items-start justify-between py-2 border-b border-gray-200 last:border-0">
                        <div className="flex items-center space-x-2 text-gray-800">
                          <Tag className="h-5 w-5 text-orange-600 flex-shrink-0" />
                          <span className="text-sm font-bold">Category:</span>
                        </div>
                        <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">Equipment Purchase</span>
                      </div>

                      <div className="flex items-start justify-between py-2 border-b border-gray-200 last:border-0">
                        <div className="flex items-center space-x-2 text-gray-800">
                          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          <span className="text-sm font-bold">Description:</span>
                        </div>
                        <span className="text-sm text-right text-gray-900 max-w-xs font-medium">
                          {equipment.name}
                          {equipment.serial_number && (
                            <span className="block text-xs text-gray-600 font-normal mt-1">SN: {equipment.serial_number}</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-start justify-between py-2 border-b border-gray-200 last:border-0">
                        <div className="flex items-center space-x-2 text-gray-800">
                          <IndianRupee className="h-5 w-5 text-green-600 flex-shrink-0" />
                          <span className="text-sm font-bold">Amount:</span>
                        </div>
                        <span className="text-lg font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                          ₹{equipment.cost.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-start justify-between py-2">
                        <div className="flex items-center space-x-2 text-gray-800">
                          <Calendar className="h-5 w-5 text-purple-600 flex-shrink-0" />
                          <span className="text-sm font-bold">Date:</span>
                        </div>
                        <span className="text-sm text-gray-900 font-semibold bg-purple-50 px-3 py-1 rounded-full">
                          {equipment.purchase_date 
                            ? new Date(equipment.purchase_date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : 'Today'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleSkip}
                      variant="outline"
                      className="flex-1 border-2 border-gray-300 hover:bg-gray-100 font-semibold"
                      disabled={isCreatingExpense}
                    >
                      Skip for Now
                    </Button>
                    <Button
                      onClick={handleCreateExpense}
                      disabled={isCreatingExpense}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
                    >
                      {isCreatingExpense ? (
                        <div className="flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="mr-2"
                          >
                            <TrendingDown className="h-4 w-4" />
                          </motion.div>
                          Recording...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Receipt className="h-4 w-4 mr-2" />
                          Record Expense
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </div>
                      )}
                    </Button>
                  </div>

                  {/* Helper Text */}
                  <p className="text-xs text-center text-gray-600 mt-4 bg-blue-50 py-2 px-3 rounded-lg border border-blue-100 font-medium">
                    💡 You can always add this manually later from the Expenses page
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
