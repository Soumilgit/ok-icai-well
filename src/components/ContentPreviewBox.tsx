'use client'

import React, { useState } from 'react'
import { FileText, ChevronDown, Eye } from 'lucide-react'

interface ContentPreviewBoxProps {
  title: string
  preview: string
  fullContent: string
  onOpenSidePanel: () => void
}

const ContentPreviewBox: React.FC<ContentPreviewBoxProps> = ({
  title,
  preview,
  fullContent,
  onOpenSidePanel
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="my-4">
      {/* Content Preview Box */}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              {title}
            </h3>
            <div className="bg-white rounded border border-gray-200 p-3 mb-3">
              <div className="text-sm text-gray-700 leading-relaxed">
                {preview}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              <span>Click to view full detailed response</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContentPreviewBox
