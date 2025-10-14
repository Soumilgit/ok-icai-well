'use client'

import React, { useState } from 'react'
import { FileText, ChevronDown, ExternalLink } from 'lucide-react'

interface DocumentBoxProps {
  title: string
  subtitle: string
  content: string
  onOpenSidePanel: () => void
}

const DocumentBox: React.FC<DocumentBoxProps> = ({
  title,
  subtitle,
  content,
  onOpenSidePanel
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="my-4">
      {/* Document-like Box */}
      <div 
        className={`bg-gray-100 border border-gray-300 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
          isHovered ? 'shadow-md border-gray-400' : 'hover:shadow-sm'
        }`}
        onClick={onOpenSidePanel}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {title}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {subtitle}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              <span>Click to view full document</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </div>
          </div>
          
          {/* Document Icon */}
          <div className="ml-4 p-3 bg-white rounded border border-gray-200 shadow-sm">
            <div className="w-12 h-16 bg-gray-50 border border-gray-200 rounded-sm relative overflow-hidden">
              <div className="absolute top-1 left-1 right-1 h-2 bg-gray-300 rounded-sm"></div>
              <div className="absolute top-4 left-1 right-1 space-y-1">
                <div className="h-1 bg-gray-300 rounded"></div>
                <div className="h-1 bg-gray-300 rounded"></div>
                <div className="h-1 bg-gray-300 rounded w-3/4"></div>
              </div>
              <div className="absolute top-8 left-1 right-1 space-y-1">
                <div className="h-1 bg-gray-300 rounded"></div>
                <div className="h-1 bg-gray-300 rounded w-2/3"></div>
              </div>
              <div className="absolute bottom-1 left-1 right-1 h-1 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
        
        {/* Preview Text */}
        <div className="mt-3 p-3 bg-white rounded border border-gray-200">
          <div className="text-xs text-gray-700 font-mono leading-relaxed">
            <div className="text-gray-900 font-semibold"># {title.split(':')[0]}</div>
            <div className="text-gray-600"># Track: Fintech</div>
            <div className="text-gray-600"># Custom Problem Statement</div>
            <div className="mt-2 text-gray-800">
              {content.substring(0, 120)}...
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentBox
