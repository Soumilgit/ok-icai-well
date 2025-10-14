'use client'

import React, { useState, useEffect } from 'react'
import { X, Linkedin, Twitter, Wand2, Send, Loader2, Check, AlertCircle, Share2 } from 'lucide-react'

interface RefinedVersion {
  id: string
  content: string
  timestamp: Date
  version: number
}

interface QueueItem {
  id: string
  content: string
  platform: 'linkedin' | 'twitter'
  priority: number
  timestamp: Date
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

interface FloatingSharePanelProps {
  isOpen: boolean
  onClose: () => void
  originalContent: string
  messageId: string
  initialPlatform?: 'linkedin' | 'twitter'
}

// Priority Queue implementation for rate limit management
class RequestQueue {
  private queue: QueueItem[] = []
  private processing = false
  private readonly RATE_LIMIT_DELAY = 2000 // 2 seconds between requests
  private lastRequestTime = 0

  enqueue(item: QueueItem) {
    this.queue.push(item)
    this.queue.sort((a, b) => b.priority - a.priority) // Higher priority first
    this.processQueue()
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    
    while (this.queue.length > 0) {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      
      // Rate limiting: wait if necessary
      if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
        await new Promise(resolve => 
          setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest)
        )
      }
      
      const item = this.queue.shift()!
      item.status = 'processing'
      
      try {
        // Process the item (will be handled by callback)
        this.lastRequestTime = Date.now()
        item.status = 'completed'
      } catch (error) {
        item.status = 'failed'
      }
    }
    
    this.processing = false
  }

  getQueueLength() {
    return this.queue.length
  }

  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      items: this.queue
    }
  }
}

const FloatingSharePanel: React.FC<FloatingSharePanelProps> = ({
  isOpen,
  onClose,
  originalContent,
  messageId,
  initialPlatform = 'linkedin'
}) => {
  const [refinedVersions, setRefinedVersions] = useState<RefinedVersion[]>([
    {
      id: 'original',
      content: originalContent,
      timestamp: new Date(),
      version: 0
    }
  ])
  const [selectedVersion, setSelectedVersion] = useState<RefinedVersion>(refinedVersions[0])
  const [isRefining, setIsRefining] = useState(false)
  const [generatedCaption, setGeneratedCaption] = useState('')
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false)
  const [sharePlatform, setSharePlatform] = useState<'linkedin' | 'twitter'>(initialPlatform)
  const [queue] = useState(() => new RequestQueue())
  const [queueStatus, setQueueStatus] = useState({ queueLength: 0, processing: false })

  // Update queue status every second
  useEffect(() => {
    const interval = setInterval(() => {
      const status = queue.getStatus()
      setQueueStatus({ queueLength: status.queueLength, processing: status.processing })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [queue])

  // Generate caption with queue management
  const generateCaption = async (content: string, platform: 'linkedin' | 'twitter') => {
    setIsGeneratingCaption(true)
    
    const queueItem: QueueItem = {
      id: `caption-${Date.now()}`,
      content,
      platform,
      priority: 1,
      timestamp: new Date(),
      status: 'pending'
    }
    
    queue.enqueue(queueItem)
    
    try {
      const maxLength = platform === 'twitter' ? 280 : 3000
      const response = await fetch('/api/chat/general-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate an AGGRESSIVE, ENGAGING ${platform} caption for this content. Make it BOLD, add hooks, include hashtags. Max ${maxLength} chars:\n\n${content}`
          }]
        })
      })
      
      const data = await response.json()
      if (data.success) {
        const caption = data.data.choices[0].message.content
        setGeneratedCaption(caption.substring(0, maxLength))
      }
    } catch (error) {
      console.error('Failed to generate caption:', error)
      setGeneratedCaption(content.substring(0, platform === 'twitter' ? 280 : 1000))
    } finally {
      setIsGeneratingCaption(false)
    }
  }

  // Refine content with queue management
  const handleRefineMore = async () => {
    setIsRefining(true)
    
    const queueItem: QueueItem = {
      id: `refine-${Date.now()}`,
      content: selectedVersion.content,
      platform: 'linkedin',
      priority: 2, // Higher priority than caption generation
      timestamp: new Date(),
      status: 'pending'
    }
    
    queue.enqueue(queueItem)
    
    try {
      const response = await fetch('/api/chat/general-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Make this MORE CREATIVE, SOPHISTICATED, and COMPELLING. Add better hooks, more engaging language, stronger emotional appeal:\n\n${selectedVersion.content}`
          }]
        })
      })
      
      const data = await response.json()
      if (data.success) {
        const refinedContent = data.data.choices[0].message.content
        
        const newVersion: RefinedVersion = {
          id: `refined-${Date.now()}`,
          content: refinedContent,
          timestamp: new Date(),
          version: refinedVersions.length
        }
        
        setRefinedVersions(prev => [...prev, newVersion])
        setSelectedVersion(newVersion)
      }
    } catch (error) {
      console.error('Failed to refine:', error)
    } finally {
      setIsRefining(false)
    }
  }

  // Handle share to platform
  const handleShare = () => {
    let content = generatedCaption || selectedVersion.content
    
    // Clean and truncate content for sharing
    const cleanContent = (text: string, maxLength: number) => {
      // Remove markdown formatting
      let cleaned = text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/#{1,6}\s*/g, '') // Remove headers
        .replace(/^\s*[-*+]\s*/gm, '• ') // Convert list items to bullets
        .replace(/\n{2,}/g, '\n') // Reduce multiple newlines
        .trim()
      
      // Truncate if too long
      if (cleaned.length > maxLength) {
        cleaned = cleaned.substring(0, maxLength - 3) + '...'
      }
      
      return cleaned
    }
    
    if (sharePlatform === 'linkedin') {
      // LinkedIn: Max 100 chars to avoid URL length issues
      const shareText = cleanContent(content, 100)
      window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`, '_blank')
    } else {
      // Twitter: Max 80 chars to avoid URL length issues  
      const shareText = cleanContent(content, 80)
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank')
    }
  }

  // Auto-generate caption when platform changes
  useEffect(() => {
    if (isOpen) {
      generateCaption(selectedVersion.content, sharePlatform)
    }
  }, [sharePlatform, isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Inline Panel - Opens within chat message */}
      <div className="w-full max-w-xl bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-300 flex flex-col">
        {/* Header - Clean like Claude */}
        <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center justify-between rounded-t-lg">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-600" />
              Share & Refine
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {queueStatus.queueLength > 0 && `Queue: ${queueStatus.queueLength} pending`}
              {queueStatus.processing && ' • Processing...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Platform Selector - Clean tabs like Claude */}
        <div className="px-2 py-2 bg-white border-b border-gray-200">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-md">
            <button
              onClick={() => setSharePlatform('linkedin')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded transition-all text-sm font-medium ${
                sharePlatform === 'linkedin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </button>
            <button
              onClick={() => setSharePlatform('twitter')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded transition-all text-sm font-medium ${
                sharePlatform === 'twitter'
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Twitter className="w-4 h-4" />
              X
            </button>
          </div>
        </div>

        {/* Content Area - Scrollable like Claude document */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white max-h-96">
           {/* Version Selector - Memory System - Clean like Claude */}
           {refinedVersions.length > 1 && (
             <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
               <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                 Refined Versions ({refinedVersions.length})
               </h4>
               <div className="space-y-1">
                 {refinedVersions.map((version) => (
                   <button
                     key={version.id}
                     onClick={() => {
                       setSelectedVersion(version)
                       generateCaption(version.content, sharePlatform)
                     }}
                     className={`w-full text-left p-2 rounded border transition-all ${
                       selectedVersion.id === version.id
                         ? 'border-blue-600 bg-white shadow-sm'
                         : 'border-gray-300 bg-white hover:border-blue-400'
                     }`}
                   >
                     <div className="flex items-center justify-between">
                       <span className="text-xs font-medium text-gray-900">
                         {version.version === 0 ? 'Original' : `v${version.version}`}
                       </span>
                       {selectedVersion.id === version.id && (
                         <Check className="w-3 h-3 text-blue-600" />
                       )}
                     </div>
                     <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                       {version.content.substring(0, 60)}...
                     </p>
                   </button>
                 ))}
               </div>
             </div>
           )}

           {/* AI-Generated Caption - Document style */}
           <div>
             <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
               AI-Generated Caption
             </h4>
             {isGeneratingCaption ? (
               <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 rounded border border-gray-200">
                 <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                 <span className="text-xs text-gray-600">Generating caption...</span>
               </div>
             ) : (
               <div className="space-y-2">
                 <textarea
                   value={generatedCaption}
                   onChange={(e) => setGeneratedCaption(e.target.value)}
                   className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white text-xs leading-relaxed"
                   rows={4}
                   placeholder="Edit caption before sharing..."
                 />
                 <div className="flex items-center justify-between text-xs text-gray-500">
                   <span>
                     {generatedCaption.length} / {sharePlatform === 'twitter' ? '80' : '100'} chars (for sharing)
                   </span>
                   <button
                     onClick={() => generateCaption(selectedVersion.content, sharePlatform)}
                     disabled={isGeneratingCaption}
                     className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline text-xs"
                   >
                     <Wand2 className="w-3 h-3" />
                     Regenerate
                   </button>
                 </div>
               </div>
             )}
           </div>

           {/* Content Preview - Document style */}
           <div>
             <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-gray-600 rounded-full"></span>
               Selected Content
             </h4>
             <div className="p-3 bg-gray-50 rounded border border-gray-200 max-h-32 overflow-y-auto">
               <div className="prose prose-sm max-w-none">
                 <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                   {selectedVersion.content}
                 </p>
               </div>
             </div>
           </div>
        </div>

        {/* Action Buttons Footer - Clean like Claude */}
        <div className="p-2 bg-white border-t border-gray-200 space-y-2 rounded-b-lg">
          {/* Refine More Button */}
          <button
            onClick={handleRefineMore}
            disabled={isRefining}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded transition-colors font-medium text-sm"
          >
            {isRefining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Refining...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Refine More
              </>
            )}
          </button>

          {/* Share Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors font-medium text-sm"
            >
              Close
            </button>
            <button
              onClick={handleShare}
              disabled={isGeneratingCaption}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors font-medium text-sm"
            >
              <Send className="w-4 h-4" />
              {sharePlatform === 'linkedin' ? 'Post' : 'Post'}
            </button>
          </div>

          {/* Queue Status Indicator */}
          {queueStatus.queueLength > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded">
              <AlertCircle className="w-3 h-3 text-yellow-600" />
              <span className="text-xs text-yellow-700">
                {queueStatus.queueLength} queued
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default FloatingSharePanel

