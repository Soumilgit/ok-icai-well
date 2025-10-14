'use client'

import React, { useState } from 'react'
import { FileText, ChevronDown, Eye, ExternalLink } from 'lucide-react'

interface ArtifactsBoxProps {
  title: string
  preview: string
  fullContent: string
  type: string
  onOpenArtifact: () => void
}

const ArtifactsBox: React.FC<ArtifactsBoxProps> = ({
  title,
  preview,
  fullContent,
  type,
  onOpenArtifact
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const getIcon = () => {
    switch (type) {
      case 'document':
        return <FileText className="w-5 h-5 text-blue-600" />
      default:
        return <Eye className="w-5 h-5 text-blue-600" />
    }
  }

  const getTypeLabel = () => {
    switch (type) {
      case 'document':
        return 'Document'
      default:
        return 'Content'
    }
  }

  return (
    <div className="my-4">
      {/* Artifacts Box */}
      <div 
        className={`bg-gray-100 border border-gray-300 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
          isHovered ? 'shadow-md border-gray-400' : 'hover:shadow-sm'
        }`}
        onClick={onOpenArtifact}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              {getIcon()}
              {title}
            </h3>
            <p className="text-sm text-gray-600 mb-3">{getTypeLabel()}</p>
            
            {/* Preview Content */}
            <div className="bg-white rounded border border-gray-200 p-3 mb-3">
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {preview.replace('[Click the document below to view full detailed response...]', '').trim()}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ExternalLink className="w-4 h-4" />
              <span>Click to open full {getTypeLabel().toLowerCase()}</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArtifactsBox
