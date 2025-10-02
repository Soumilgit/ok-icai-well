'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, MessageCircle, Sparkles, FileText, TrendingUp } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  citations?: string[]
  relatedQuestions?: string[]
}

interface ChatInterfaceProps {
  mode: 'general' | 'ca-assistant' | 'seo-content' | 'marketing-strategy'
  onModeChange?: (mode: string) => void
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode, onModeChange }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getModeConfig = () => {
    switch (mode) {
      case 'ca-assistant':
        return {
          title: '🧮 CA Assistant',
          placeholder: 'Ask about Indian tax laws, GST, compliance, audit procedures...',
          icon: <FileText className="w-5 h-5" />,
          color: 'from-blue-500 to-indigo-600'
        }
      case 'seo-content':
        return {
          title: '📝 SEO Content Generator',
          placeholder: 'Generate SEO-optimized content, blogs, meta tags...',
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'from-green-500 to-emerald-600'
        }
      case 'marketing-strategy':
        return {
          title: '📈 Marketing Strategy',
          placeholder: 'Create marketing plans, customer acquisition strategies...',
          icon: <Sparkles className="w-5 h-5" />,
          color: 'from-purple-500 to-pink-600'
        }
      default:
        return {
          title: '🤖 AI Chat',
          placeholder: 'Ask me anything...',
          icon: <MessageCircle className="w-5 h-5" />,
          color: 'from-gray-500 to-gray-600'
        }
    }
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
      let response
      
      switch (mode) {
        case 'ca-assistant':
          response = await fetch('/api/chat/ca-assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: userMessage.content,
              context: messages.length > 0 ? messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n') : ''
            })
          })
          break

        case 'seo-content':
          // Parse input for SEO parameters
          const seoMatch = userMessage.content.match(/topic:\s*([^,]+)(?:,\s*keywords:\s*([^,]+))?(?:,\s*type:\s*([^,]+))?/)
          if (seoMatch) {
            const [, topic, keywordsStr, contentType] = seoMatch
            const keywords = keywordsStr ? keywordsStr.split(/[,;]/).map(k => k.trim()) : []
            
            response = await fetch('/api/marketing/seo-content', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                topic: topic.trim(),
                keywords,
                contentType: contentType?.trim() || 'blog'
              })
            })
          } else {
            // Fallback to general content generation
            response = await fetch('/api/marketing/seo-content', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                topic: userMessage.content,
                keywords: [],
                contentType: 'blog'
              })
            })
          }
          break

        case 'marketing-strategy':
          // Parse input for marketing parameters
          const marketingMatch = userMessage.content.match(/business:\s*([^,]+)(?:,\s*target:\s*([^,]+))?(?:,\s*budget:\s*([^,]+))?/)
          if (marketingMatch) {
            const [, businessType, targetMarket, budget] = marketingMatch
            
            response = await fetch('/api/marketing/strategy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                businessType: businessType.trim(),
                targetMarket: targetMarket?.trim() || 'General market',
                budget: budget?.trim()
              })
            })
          } else {
            // Fallback to general business consultation
            response = await fetch('/api/marketing/strategy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                businessType: 'General business',
                targetMarket: userMessage.content
              })
            })
          }
          break

        default:
          response = await fetch('/api/chat/perplexity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: 'You are a helpful AI assistant. Provide accurate, helpful, and detailed responses.'
                },
                ...messages.slice(-5).map(m => ({
                  role: m.role,
                  content: m.content
                })),
                {
                  role: 'user',
                  content: userMessage.content
                }
              ]
            })
          })
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error')
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.data.choices[0].message.content,
        timestamp: new Date(),
        citations: data.data.citations || [],
        relatedQuestions: data.data.related_questions || []
      }

      setMessages(prev => [...prev, assistantMessage])

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

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  const config = getModeConfig()

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.color} text-white p-4 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {config.icon}
            <h2 className="text-lg font-semibold">{config.title}</h2>
          </div>
          <div className="flex items-center space-x-2">
            {onModeChange && (
              <select
                value={mode}
                onChange={(e) => onModeChange(e.target.value)}
                className="bg-white/20 border border-white/30 rounded px-2 py-1 text-sm"
              >
                <option value="general">General Chat</option>
                <option value="ca-assistant">CA Assistant</option>
                <option value="seo-content">SEO Content</option>
                <option value="marketing-strategy">Marketing</option>
              </select>
            )}
            <button
              onClick={clearChat}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${config.color} rounded-full flex items-center justify-center text-white`}>
              {config.icon}
            </div>
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm">{config.placeholder}</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              <div className="flex items-center space-x-2 mb-1">
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
                <span className="text-xs opacity-75">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              
              {/* Citations */}
              {message.citations && message.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <p className="text-xs font-medium mb-1">Sources:</p>
                  {message.citations.slice(0, 3).map((citation, idx) => (
                    <p key={idx} className="text-xs opacity-75 truncate">
                      {idx + 1}. {citation}
                    </p>
                  ))}
                </div>
              )}
              
              {/* Related Questions */}
              {message.relatedQuestions && message.relatedQuestions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <p className="text-xs font-medium mb-1">Related:</p>
                  {message.relatedQuestions.slice(0, 2).map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(question)}
                      className="block text-xs opacity-75 hover:opacity-100 text-left mb-1 hover:underline"
                    >
                      • {question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        {error && (
          <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={config.placeholder}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 bg-white placeholder-gray-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Templates */}
        {mode === 'seo-content' && (
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              onClick={() => setInput('topic: Digital Marketing for Small Business, keywords: digital marketing, small business, online marketing')}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
            >
              SEO Blog Template
            </button>
            <button
              onClick={() => setInput('topic: Product Landing Page, type: landing-page')}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
            >
              Landing Page
            </button>
          </div>
        )}

        {mode === 'marketing-strategy' && (
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              onClick={() => setInput('business: SaaS startup, target: B2B companies, budget: $10k/month')}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
            >
              SaaS Marketing
            </button>
            <button
              onClick={() => setInput('business: E-commerce store, target: millennials, budget: $5k/month')}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
            >
              E-commerce Strategy
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatInterface