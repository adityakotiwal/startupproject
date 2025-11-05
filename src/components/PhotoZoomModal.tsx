'use client'

import { X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PhotoZoomModalProps {
  isOpen: boolean
  onClose: () => void
  photoUrl: string | null
  memberName: string
}

export default function PhotoZoomModal({ 
  isOpen, 
  onClose, 
  photoUrl, 
  memberName 
}: PhotoZoomModalProps) {
  if (!isOpen || !photoUrl) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[100]"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:bg-white hover:bg-opacity-20"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Photo Container */}
        <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
          <div className="relative">
            <img
              src={photoUrl}
              alt={memberName}
              className="w-full h-auto max-h-[70vh] object-contain bg-gray-100"
            />
          </div>
          
          {/* Member Name Footer */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
            <div className="flex items-center justify-center space-x-2">
              <User className="h-5 w-5" />
              <h3 className="text-xl font-bold">{memberName}</h3>
            </div>
          </div>
        </div>

        {/* Click outside hint */}
        <p className="text-white text-center mt-4 text-sm opacity-75">
          Click anywhere outside to close
        </p>
      </div>
    </div>
  )
}
