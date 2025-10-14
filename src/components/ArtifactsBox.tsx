'use client'

import React, { useState } from 'react'
import { FileText, ChevronDown, Eye, ExternalLink, Download, Copy, Share2, Calendar, User } from 'lucide-react'

interface ArtifactsBoxProps {
  title: string
  subtitle?: string
  preview: string
  fullContent: string
  type: string
  onOpenArtifact: () => void
  metadata?: {
    author?: string
    date?: string
    version?: string
    generatedAt?: string
  }
  downloadUrl?: string | null
}

const ArtifactsBox: React.FC<ArtifactsBoxProps> = ({
  title,
  subtitle,
  preview,
  fullContent,
  type,
  onOpenArtifact,
  metadata,
  downloadUrl
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const getIcon = () => {
    switch (type.toLowerCase()) {
      case 'report':
        return <FileText className="w-5 h-5 text-blue-600" />
      case 'proposal':
        return <FileText className="w-5 h-5 text-green-600" />
      case 'analysis':
        return <FileText className="w-5 h-5 text-purple-600" />
      case 'summary':
        return <FileText className="w-5 h-5 text-orange-600" />
      case 'plan':
        return <FileText className="w-5 h-5 text-indigo-600" />
      case 'audit':
        return <FileText className="w-5 h-5 text-red-600" />
      case 'document':
        return <FileText className="w-5 h-5 text-blue-600" />
      default:
        return <Eye className="w-5 h-5 text-gray-600" />
    }
  }

  const getTypeLabel = () => {
    switch (type.toLowerCase()) {
      case 'report':
        return 'Business Report'
      case 'proposal':
        return 'Proposal'
      case 'analysis':
        return 'Analysis'
      case 'summary':
        return 'Summary'
      case 'plan':
        return 'Plan'
      case 'audit':
        return 'Audit Report'
      case 'document':
        return 'Document'
      default:
        return 'Content'
    }
  }

  const getTypeColor = () => {
    switch (type.toLowerCase()) {
      case 'report':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'proposal':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'analysis':
        return 'bg-purple-50 border-purple-200 text-purple-800'
      case 'summary':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'plan':
        return 'bg-indigo-50 border-indigo-200 text-indigo-800'
      case 'audit':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(fullContent).then(() => {
      // Show success feedback
    })
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="my-6">
      {/* Enhanced Artifacts Box */}
      <div 
        className={`bg-white border-2 border-gray-200 rounded-xl shadow-sm transition-all duration-300 ${
          isHovered ? 'shadow-lg border-gray-300' : 'hover:shadow-md'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {getIcon()}
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor()}`}>
                  {getTypeLabel()}
                </span>
              </div>
              {subtitle && (
                <p className="text-gray-600 text-sm mb-3">{subtitle}</p>
              )}
              
              {/* Metadata */}
              {metadata && (
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {metadata.author && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{metadata.author}</span>
                    </div>
                  )}
                  {metadata.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{metadata.date}</span>
                    </div>
                  )}
                  {metadata.version && (
                    <span>v{metadata.version}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Preview Content */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
            <div className="text-sm text-gray-700 leading-relaxed">
              {isExpanded ? fullContent : preview}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleExpanded}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                {isExpanded ? 'Show Less' : 'Show More'}
              </button>
              
              <button
                onClick={onOpenArtifact}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Open Full View
              </button>
            </div>

            <div className="flex items-center gap-2">
              {downloadUrl && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors text-sm font-medium"
                  title="Download Document"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                title="Copy Content"
              >
                <Copy className="w-4 h-4" />
              </button>
              
              <button
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArtifactsBox
