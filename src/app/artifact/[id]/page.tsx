'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Download, Share2, Copy, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ArtifactData {
  id: string
  title: string
  subtitle?: string
  summary: string
  content: string
  documentType: string
  sections?: Array<{
    heading: string
    content: string
  }>
  metadata?: {
    author?: string
    date?: string
    version?: string
    generatedAt?: string
  }
  downloadUrl?: string
}

export default function ArtifactViewer() {
  const params = useParams()
  const artifactId = params.id as string
  const [artifact, setArtifact] = useState<ArtifactData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!artifactId) return

    // Check if this is a document ID from a message (starts with 'doc_')
    if (artifactId.startsWith('doc_')) {
      // This is a message-based document, generate content from message ID
      const messageId = artifactId.replace('doc_', '')
      generateDocumentFromMessage(messageId)
    } else {
      // This is a regular artifact ID, generate mock content
      generateMockArtifact()
    }
  }, [artifactId])

  const formatMarkdownToHTML = (markdown: string) => {
    if (!markdown) return ''
    
    let html = markdown
      // First, clean up any remaining markdown artifacts
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>')
      
      // Split into paragraphs
      .replace(/\n\n+/g, '\n\n')
      .split('\n\n')
      .map(paragraph => {
        if (!paragraph.trim()) return ''
        
        const lines = paragraph.split('\n').filter(line => line.trim())
        
        // Handle Document Information section specifically
        if (lines[0] && lines[0].includes('Document Information')) {
          const infoItems = lines
            .filter(line => line.includes('•') || line.includes('-'))
            .map(line => {
              // Extract the key-value pairs
              const match = line.match(/[•\-]\s*(.+?):\s*(.+)/)
              if (match) {
                return `<div class="flex justify-between items-center py-1"><span class="font-medium text-gray-700">${match[1]}:</span><span class="text-gray-900">${match[2]}</span></div>`
              }
              return `<div class="py-1 text-gray-700">${line.replace(/^[•\-]\s*/, '')}</div>`
            })
          
          return `
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-3">Document Information</h3>
              <div class="space-y-1">${infoItems.join('')}</div>
            </div>
          `
        }
        
        // Handle headers (but only if they don't have markdown syntax)
        if (lines.length === 1 && !lines[0].includes('#')) {
          const line = lines[0].trim()
          if (line.length < 50 && !line.includes('•') && !line.includes('-')) {
            return `<h2 class="text-xl font-bold text-gray-900 mb-3 mt-5">${line}</h2>`
          }
        }
        
        // Convert horizontal rules
        if (paragraph.trim() === '---') {
          return '<hr class="border-gray-300 my-4">'
        }
        
        // Handle bullet points and lists
        const hasBulletPoints = lines.some(line => 
          line.includes('•') || line.match(/^[-\*]\s/) || line.match(/^\d+\.\s/)
        )
        
        if (hasBulletPoints) {
          // Process all lines that contain bullet points
          const listItems = lines
            .filter(line => line.trim())
            .map(line => {
              let cleanLine = line.trim()
              
              // Remove bullet point markers and convert to list item
              if (cleanLine.includes('•')) {
                cleanLine = cleanLine.replace(/^•\s*/, '')
              } else if (cleanLine.match(/^[-\*]\s/)) {
                cleanLine = cleanLine.replace(/^[-\*]\s*/, '')
              } else if (cleanLine.match(/^\d+\.\s/)) {
                cleanLine = cleanLine.replace(/^\d+\.\s*/, '')
              }
              
              // Apply bold formatting
              cleanLine = cleanLine.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
              
              return cleanLine
            })
            .filter(item => item.trim() && item.length > 10) // Only include meaningful sentences
            .map(item => `<li class="text-gray-700 mb-2 leading-relaxed">${item}</li>`)
            .join('')
          
          if (listItems) {
            return `<ul class="list-disc list-inside space-y-2 my-4 ml-4">${listItems}</ul>`
          }
        }
        
        // Regular paragraph
        let content = lines.join(' ')
          .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
          .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>')
        
        return `<p class="mb-4 text-gray-700 leading-relaxed">${content}</p>`
      })
      .filter(p => p.trim())
      .join('')
    
    return `<div class="document-content">${html}</div>`
  }

  const formatContentAsDocument = (content: string, message: any) => {
    // Format the AI response content into a professional document
    const timestamp = new Date(message.timestamp).toLocaleString()
    const mode = message.mode || 'General Chat'
    
    // Create a real summary from the actual content
    const realSummary = createRealSummary(content)
    const keyPoints = extractKeyPoints(content)
    const actionItems = extractActionItems(content)
    
    return `# AI Assistant Response Document

## Document Information
- **Chat Mode**: ${mode}
- **Response Date**: ${timestamp}
- **Document Type**: Complete AI Analysis
- **Message ID**: ${message.id}

## Executive Summary

${realSummary}

---

## Key Takeaways

${keyPoints}

---

## Action Items

${actionItems}

---

## Additional Notes

This document was automatically generated from your AI assistant conversation. All recommendations and insights are based on the latest available information and best practices.

---

*Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*
*Document ID: ${artifactId}*
*Source: AI Assistant Response*`
  }

  const createRealSummary = (content: string) => {
    // Create a real summary from the actual AI response content
    if (!content || content.trim().length === 0) {
      return 'This document contains a comprehensive analysis and actionable insights based on your AI assistant conversation.'
    }
    
    // Calculate target summary length (about 30-40% of original content)
    const targetLength = Math.min(content.length * 0.35, 400) // Cap at 400 characters
    
    // Extract meaningful sentences as summary
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15)
    
    if (sentences.length === 0) {
      return 'This document contains a comprehensive analysis and actionable insights based on your AI assistant conversation.'
    }
    
    // Take sentences until we reach about 35% of original length
    let summary = ''
    let currentLength = 0
    
    for (let i = 0; i < sentences.length && currentLength < targetLength; i++) {
      const sentence = sentences[i].trim()
      if (sentence.length > 20) {
        summary += sentence + '. '
        currentLength += sentence.length + 2
      }
    }
    
    // If summary is too short, add one more sentence if available
    if (currentLength < targetLength * 0.7 && sentences.length > 3) {
      const nextSentence = sentences[3].trim()
      if (nextSentence.length > 20) {
        summary += nextSentence + '. '
      }
    }
    
    return summary.trim() || 'This document contains a comprehensive analysis and actionable insights based on your AI assistant conversation.'
  }

  const extractKeyPoints = (content: string) => {
    // Extract key points from the actual content
    if (!content || content.trim().length === 0) {
      return '• Detailed analysis and recommendations provided above'
    }
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
    
    // Look for sentences that contain important keywords
    const importantKeywords = ['important', 'key', 'critical', 'essential', 'significant', 'major', 'primary', 'main', 'should', 'must', 'need to', 'recommend', 'consider', 'ensure']
    const keySentences = sentences.filter(sentence => 
      importantKeywords.some(keyword => 
        sentence.toLowerCase().includes(keyword)
      )
    )
    
    // If we found important sentences, use them; otherwise use the first few sentences
    const sentencesToUse = keySentences.length > 0 ? keySentences : sentences
    const keyPoints = sentencesToUse.slice(0, 5).map(sentence => {
      const cleanSentence = sentence.trim()
      return `• ${cleanSentence}`
    }).join('\n')
    
    return keyPoints || '• Detailed analysis and recommendations provided above'
  }

  const extractActionItems = (content: string) => {
    // Extract real action items from the actual content
    if (!content || content.trim().length === 0) {
      return '• Review the recommendations above\n• Implement suggested changes\n• Follow up as needed'
    }
    
    // Look for action items in the content
    const actionPatterns = [
      /(?:you should|you need to|it's recommended|consider|implement|ensure|make sure|try to|focus on|start with|begin by)/gi,
      /(?:first|second|third|next|then|finally|step \d+|action \d+)/gi,
      /(?:create|develop|build|establish|set up|configure)/gi
    ]
    
    const actionItems = []
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
    
    sentences.forEach(sentence => {
      if (actionPatterns.some(pattern => pattern.test(sentence))) {
        const cleanSentence = sentence.trim()
        if (cleanSentence.length > 20) {
          actionItems.push(`• ${cleanSentence}`)
        }
      }
    })
    
    // If we didn't find specific action patterns, look for numbered lists or bullet points
    if (actionItems.length === 0) {
      const numberedItems = content.match(/(?:\d+\.|•|\*)\s*[^.!?]*[.!?]/g)
      if (numberedItems && numberedItems.length > 0) {
        numberedItems.slice(0, 5).forEach(item => {
          const cleanItem = item.replace(/^\d+\.|^[•*]\s*/, '').trim()
          if (cleanItem.length > 20) {
            actionItems.push(`• ${cleanItem}`)
          }
        })
      }
    }
    
    return actionItems.slice(0, 5).join('\n') || '• Review the recommendations above\n• Implement suggested changes\n• Follow up as needed'
  }

  const generateDocumentFromMessage = async (messageId: string) => {
    try {
      // Fetch the actual message content
      const response = await fetch(`/api/messages/${messageId}`)
      const data = await response.json()
      
      if (data.success && data.message) {
        const message = data.message
        const content = message.content || 'No content available'
        
        // Create a comprehensive document from the actual AI response
        const artifact: ArtifactData = {
          id: artifactId,
          title: `AI Response: ${message.mode || 'General Chat'}`,
          subtitle: 'Complete Analysis & Recommendations',
          summary: content.length > 200 ? content.substring(0, 200) + '...' : content,
          content: formatContentAsDocument(content, message),
          documentType: 'report',
          sections: [
            {
              heading: 'Executive Summary',
              content: createRealSummary(content)
            },
            {
              heading: 'Key Takeaways',
              content: extractKeyPoints(content)
            },
            {
              heading: 'Action Items',
              content: extractActionItems(content)
            }
          ],
          metadata: {
            author: 'AI Assistant',
            date: new Date(message.timestamp).toISOString().split('T')[0],
            version: '1.0',
            generatedAt: new Date().toISOString()
          },
          downloadUrl: `/api/artifacts/download/${artifactId}`
        }

        setArtifact(artifact)
        setLoading(false)
      } else {
        // Fallback to mock content if message not found
        generateMockArtifact()
      }
    } catch (error) {
      console.error('Error fetching message:', error)
      // Fallback to mock content on error
      generateMockArtifact()
    }
  }

  const generateMockArtifact = () => {
    // Generate a mock artifact for regular artifact IDs
    const mockArtifact: ArtifactData = {
      id: artifactId,
      title: 'AI Generated Document',
      subtitle: 'Professional Analysis & Insights',
      summary: 'This document contains comprehensive analysis and recommendations based on your query.',
      content: `# ${artifactId}

This is a comprehensive document generated by our AI assistant. The content below represents a detailed analysis and actionable insights based on your specific request.

## Executive Summary

This document provides a thorough examination of the topics discussed in your conversation with our AI assistant. It includes key findings, recommendations, and actionable next steps.

## Detailed Analysis

The following sections contain detailed information, analysis, and recommendations:

### Key Findings
- Comprehensive analysis of the discussed topics
- Industry best practices and standards
- Regulatory compliance considerations
- Practical implementation guidelines

### Recommendations
1. **Immediate Actions**: Priority items that should be addressed first
2. **Short-term Goals**: Objectives for the next 30-90 days
3. **Long-term Strategy**: Vision for sustainable growth and improvement

### Implementation Roadmap
A step-by-step guide for implementing the recommendations, including:
- Timeline considerations
- Resource requirements
- Risk assessment
- Success metrics

## Conclusion

This document serves as a comprehensive guide based on your conversation with our AI assistant. All recommendations are tailored to your specific context and requirements.

---

*Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*
*Document ID: ${artifactId}*`,
      documentType: 'report',
      sections: [
        {
          heading: 'Executive Summary',
          content: 'Overview of key findings and recommendations'
        },
        {
          heading: 'Detailed Analysis',
          content: 'Comprehensive examination of the topics discussed'
        },
        {
          heading: 'Implementation Roadmap',
          content: 'Step-by-step guide for implementing recommendations'
        }
      ],
      metadata: {
        author: 'AI Assistant',
        date: new Date().toISOString().split('T')[0],
        version: '1.0',
        generatedAt: new Date().toISOString()
      },
      downloadUrl: `/api/artifacts/download/${artifactId}`
    }

    setArtifact(mockArtifact)
    setLoading(false)
  }

  const handleCopyContent = () => {
    if (artifact) {
      navigator.clipboard.writeText(artifact.content)
      // You could add a toast notification here
    }
  }

  const handleShare = () => {
    if (artifact) {
      const shareData = {
        title: artifact.title,
        text: artifact.summary,
        url: window.location.href
      }
      
      if (navigator.share) {
        navigator.share(shareData)
      } else {
        navigator.clipboard.writeText(window.location.href)
        // You could add a toast notification here
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    )
  }

  if (error || !artifact) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Document Not Found</h1>
          <p className="text-gray-600 mb-6">The requested document could not be found.</p>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{artifact.title}</h1>
                {artifact.subtitle && (
                  <p className="text-sm text-gray-600">{artifact.subtitle}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
              
              <button
                onClick={handleCopyContent}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </button>
              
              {artifact.downloadUrl && (
                <a
                  href={artifact.downloadUrl}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary */}
        <div id="executive-summary" className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">Executive Summary</h3>
          <div 
            className="text-blue-800"
            dangerouslySetInnerHTML={{ 
              __html: formatMarkdownToHTML(artifact.summary)
            }}
          />
        </div>

        {/* Metadata */}
        {artifact.metadata && (
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
            {artifact.metadata.author && (
              <span>Author: {artifact.metadata.author}</span>
            )}
            {artifact.metadata.date && (
              <span>Date: {new Date(artifact.metadata.date).toLocaleDateString()}</span>
            )}
            {artifact.metadata.version && (
              <span>Version: {artifact.metadata.version}</span>
            )}
            {artifact.metadata.generatedAt && (
              <span>Generated: {new Date(artifact.metadata.generatedAt).toLocaleString()}</span>
            )}
          </div>
        )}

        {/* Document Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="prose prose-gray max-w-none">
              <div 
                className="text-gray-900 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: formatMarkdownToHTML(artifact.content)
                }}
              />
            </div>
          </div>
        </div>

        {/* Key Takeaways Section */}
        {artifact.sections && artifact.sections.find(s => s.heading.toLowerCase().includes('key')) && (
          <div id="key-takeaways" className="bg-white rounded-lg border border-gray-200 shadow-sm mt-6">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Key Takeaways</h3>
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: formatMarkdownToHTML(artifact.sections.find(s => s.heading.toLowerCase().includes('key'))?.content || '')
                }}
              />
            </div>
          </div>
        )}

        {/* Action Items Section */}
        {artifact.sections && artifact.sections.find(s => s.heading.toLowerCase().includes('action')) && (
          <div id="action-items" className="bg-white rounded-lg border border-gray-200 shadow-sm mt-6">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Action Items</h3>
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: formatMarkdownToHTML(artifact.sections.find(s => s.heading.toLowerCase().includes('action'))?.content || '')
                }}
              />
            </div>
          </div>
        )}

        {/* Sections */}
        {artifact.sections && artifact.sections.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Sections</h2>
            <div className="grid gap-3">
              {artifact.sections.map((section, index) => {
                // Create section ID based on heading
                const sectionId = section.heading.toLowerCase()
                  .replace(/[^a-z0-9\s]/g, '')
                  .replace(/\s+/g, '-')
                  .replace(/^key-takeaways?/, 'key-takeaways')
                  .replace(/^action-items?/, 'action-items')
                  .replace(/^executive-summary/, 'executive-summary')
                
                const handleSectionClick = () => {
                  console.log('Clicking section:', section.heading, 'Looking for ID:', sectionId)
                  const element = document.getElementById(sectionId)
                  console.log('Found element:', element)
                  if (element) {
                    element.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start',
                      inline: 'nearest'
                    })
                  } else {
                    // Try alternative IDs if the first one doesn't work
                    const altIds = [
                      section.heading.toLowerCase().replace(/\s+/g, '-'),
                      section.heading.toLowerCase().replace(/[^a-z0-9]/g, ''),
                      `section-${index}`
                    ]
                    
                    for (const altId of altIds) {
                      const altElement = document.getElementById(altId)
                      if (altElement) {
                        console.log('Found element with alt ID:', altId)
                        altElement.scrollIntoView({ 
                          behavior: 'smooth',
                          block: 'start',
                          inline: 'nearest'
                        })
                        break
                      }
                    }
                  }
                }
                
                return (
                  <div 
                    key={index} 
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer group"
                    onClick={handleSectionClick}
                  >
                    <h3 className="font-medium text-gray-900 text-lg flex items-center justify-between">
                      {section.heading}
                      <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                    </h3>
                    <p className="text-gray-600 text-sm mt-1 group-hover:text-gray-700 transition-colors">Click to scroll to section above</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
