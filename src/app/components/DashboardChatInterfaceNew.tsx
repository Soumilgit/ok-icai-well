'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, MessageCircle, Sparkles, FileText, TrendingUp, RefreshCw, Shield, PenTool, Users, Linkedin, Twitter, Copy, X, Maximize2, Settings, Share2, Wand2 } from 'lucide-react'
import SocialAutomationSidebar from './SocialAutomationSidebar'
import FloatingSharePanel from './FloatingSharePanel'
import DocumentBox from './DocumentBox'
import DocumentSidePanel from './DocumentSidePanel'
import ContentPreviewBox from './ContentPreviewBox'
import ContentSidePanel from './ContentSidePanel'
import ArtifactsBox from './ArtifactsBox'
import ArtifactsSidePanel from './ArtifactsSidePanel'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  citations?: string[]
  relatedQuestions?: string[]
  documentData?: {
    title: string
    subtitle: string
    content: string
  }
  previewData?: {
    title: string
    preview: string
    fullContent: string
  }
  artifacts?: {
    title: string
    subtitle?: string
    preview: string
    fullContent: string
    type: string
    metadata?: {
      author?: string
      date?: string
      version?: string
      generatedAt?: string
    }
    downloadUrl?: string | null
  }
}

interface DashboardChatInterfaceProps {
  mode?: 'general' | 'ca-assistant' | 'seo-content' | 'marketing-strategy'
  onModeChange?: (mode: string) => void
}

const DashboardChatInterfaceNew: React.FC<DashboardChatInterfaceProps> = ({ mode = 'general', onModeChange }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Floating panel state
  const [showFloatingPanel, setShowFloatingPanel] = useState(false)
  const [selectedMessageForShare, setSelectedMessageForShare] = useState<Message | null>(null)
  const [initialPlatform, setInitialPlatform] = useState<'linkedin' | 'twitter'>('linkedin')
  
  // Document side panel state
  const [showDocumentPanel, setShowDocumentPanel] = useState(false)
  const [documentData, setDocumentData] = useState<{title: string, content: string} | null>(null)
  
  // Content preview side panel state
  const [showContentPanel, setShowContentPanel] = useState(false)
  const [contentData, setContentData] = useState<{title: string, content: string} | null>(null)
  
  // Artifacts side panel state
  const [showArtifactsPanel, setShowArtifactsPanel] = useState(false)
  const [artifactsData, setArtifactsData] = useState<Message['artifacts'] | null>(null)

  // Helper function to extract shareable content
  const extractShareableContent = (content: string): string => {
    // Remove markdown formatting
    let cleanContent = content
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/#{1,6}\s*/g, '')
      .replace(/```[\s\S]*?```/g, '[Code Block]')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/\n+/g, ' ')
      .trim()
    
    // Limit to 280 characters for Twitter
    if (cleanContent.length > 280) {
      cleanContent = cleanContent.substring(0, 277) + '...'
    }
    
    return cleanContent
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Open document side panel
  const openDocumentPanel = (documentData: {title: string, subtitle: string, content: string}) => {
    setDocumentData({
      title: documentData.title,
      content: documentData.content
    })
    setShowDocumentPanel(true)
  }
  
  // Open content preview side panel
  const openContentPanel = (previewData: {title: string, preview: string, fullContent: string}) => {
    setContentData({
      title: previewData.title,
      content: previewData.fullContent
    })
    setShowContentPanel(true)
  }
  
  // Open artifacts side panel
  const openArtifactsPanel = (artifacts: Message['artifacts']) => {
    setArtifactsData(artifacts)
    setShowArtifactsPanel(true)
  }

  const config = {
    title: 'AI Assistant',
    subtitle: 'AI-powered assistance',
    placeholder: 'Ask me anything...',
    icon: MessageCircle,
    color: 'blue'
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      let response: Response
      const endpoint = `/api/chat/${mode}-gemini`

      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          mode: mode
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const responseMessage = data.data.choices[0].message

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseMessage.content,
        timestamp: new Date(),
        citations: data.data.citations || [],
        relatedQuestions: data.data.related_questions || [],
        documentData: responseMessage.documentData,
        previewData: responseMessage.previewData,
        artifacts: responseMessage.artifacts
      }

      setMessages(prev => [...prev, assistantMessage])

      // Store the assistant message for artifact generation
      try {
        await fetch(`/api/messages/${assistantMessage.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: assistantMessage.content,
            role: assistantMessage.role,
            mode: mode
          })
        })
      } catch (storeError) {
        console.log('Failed to store message:', storeError)
      }

    } catch (error: any) {
      console.error('Chat error:', error)
      setError(error.message || 'Failed to send message')
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleShare = (platform: 'linkedin' | 'twitter', message: Message) => {
    setSelectedMessageForShare(message)
    setInitialPlatform(platform)
    setShowFloatingPanel(true)
  }

  return (
    <>
      <div className="flex flex-col h-full bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{config.title}</h2>
              <p className="text-sm text-gray-400">{config.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-400">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">Welcome to {config.title}</h3>
              <p className="text-gray-500">Start a conversation to get assistance.</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100'} rounded-lg p-4`}>
                <div className="flex items-center space-x-2 mb-2">
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                  <span className="text-sm opacity-75">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                {/* Show artifacts box if present */}
                {message.artifacts && (
                  <div className="mb-4">
                    <ArtifactsBox
                      title={message.artifacts.title}
                      subtitle={message.artifacts.subtitle}
                      preview={message.artifacts.preview}
                      fullContent={message.artifacts.fullContent}
                      type={message.artifacts.type}
                      onOpenArtifact={() => openArtifactsPanel(message.artifacts!)}
                      metadata={message.artifacts.metadata}
                      downloadUrl={message.artifacts.downloadUrl}
                    />
                  </div>
                )}
                
                {/* Show regular content (shortened if artifact exists) */}
                {message.artifacts ? (
                  <div className={`${message.role === 'user' ? 'text-sm' : 'text-base'} whitespace-pre-wrap ${message.role === 'assistant' ? 'leading-relaxed' : 'leading-relaxed'} ${
                    message.role === 'user' ? 'text-white' : 'text-gray-100'
                  }`}>
                    <p className="mb-4 text-gray-400 italic">
                      💡 Full response available in the artifact box above. Key points:
                    </p>
                    <p className="mb-4">
                      {message.content.length > 300 
                        ? message.content.substring(0, 300) + '...' 
                        : message.content
                      }
                    </p>
                    {message.content.length > 300 && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 mb-2">
                          📖 <strong>Complete Document Available:</strong>
                        </p>
                        <a
                          href={`/artifact/${message.artifacts.metadata?.id || `doc_${message.id}`}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          📄 Open Full Document in New Tab
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`${message.role === 'user' ? 'text-sm' : 'text-base'} whitespace-pre-wrap ${message.role === 'assistant' ? 'leading-relaxed' : 'leading-relaxed'} ${
                    message.role === 'user' ? 'text-white' : 'text-gray-100'
                  }`}>
                    {/* Show artifact link for long responses */}
                    {message.role === 'assistant' && message.content.length > 1000 && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 mb-2">
                          📄 <strong>Long Response Detected:</strong>
                        </p>
                        <a
                          href={`/artifact/doc_${message.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          📖 View Full Response in New Tab
                        </a>
                      </div>
                    )}
                    
                    {message.content.split('\n\n').map((paragraph, index) => {
                      return <p key={index} className={`${message.role === 'assistant' ? 'mb-8 text-justify' : 'mb-4'}`}>{paragraph}</p>
                    })}
                  </div>
                )}

                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Sources:</h4>
                    <ul className="space-y-1">
                      {message.citations.map((citation, index) => (
                        <li key={index} className="text-sm text-gray-400">
                          {citation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Related Questions */}
                {message.relatedQuestions && message.relatedQuestions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Related Questions:</h4>
                    <div className="space-y-2">
                      {message.relatedQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => setInput(question)}
                          className="block w-full text-left text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share buttons for assistant messages */}
                {message.role === 'assistant' && (
                  <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-600">
                    <button
                      onClick={() => handleShare('linkedin', message)}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                    <button
                      onClick={() => handleShare('twitter', message)}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      <Twitter className="w-4 h-4" />
                      <span>Tweet</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(message.content).then(() => {
                          // You could add a toast notification here
                        })
                      }}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-100 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={config.placeholder}
              className="flex-1 px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Share Panel */}
      {showFloatingPanel && selectedMessageForShare && (
        <FloatingSharePanel
          isOpen={showFloatingPanel}
          onClose={() => setShowFloatingPanel(false)}
          message={selectedMessageForShare}
          initialPlatform={initialPlatform}
        />
      )}
      
      {/* Document Side Panel */}
      {documentData && (
        <DocumentSidePanel
          isOpen={showDocumentPanel}
          onClose={() => setShowDocumentPanel(false)}
          title={documentData.title}
          content={documentData.content}
        />
      )}
      
      {/* Content Preview Side Panel */}
      {contentData && (
        <ContentSidePanel
          isOpen={showContentPanel}
          onClose={() => setShowContentPanel(false)}
          title={contentData.title}
          content={contentData.content}
        />
      )}
      
      {/* Artifacts Side Panel */}
      {artifactsData && (
        <ArtifactsSidePanel
          isOpen={showArtifactsPanel}
          onClose={() => setShowArtifactsPanel(false)}
          title={artifactsData.title}
          content={artifactsData.fullContent}
          type={artifactsData.type}
        />
      )}
      
    </>
  )
}

export default DashboardChatInterfaceNew
