'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, MessageCircle, Sparkles, FileText, TrendingUp, RefreshCw, Shield, PenTool, Users, Linkedin, Twitter, Copy, X, Maximize2, Settings } from 'lucide-react'
import SocialAutomationSidebar from './SocialAutomationSidebar'

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
  variant?: 'homepage' | 'dashboard'
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode, onModeChange, variant = 'homepage' }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [writingVoice, setWritingVoice] = useState('fact-presenter')
  const [showVoiceSelector, setShowVoiceSelector] = useState(false)
  const [showSocialAutomation, setShowSocialAutomation] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const writingVoices = [
    { id: 'storyteller', name: 'Storyteller', icon: '📖' },
    { id: 'opinionator', name: 'Opinionator', icon: '💬' },
    { id: 'fact-presenter', name: 'Fact Presenter', icon: '📊' },
    { id: 'frameworker', name: 'Frameworker', icon: '🔧' },
    { id: 'f-bomber', name: 'F-Bomber', icon: '⚡' }
  ]

  // Helper function to extract shareable content
  const extractShareableContent = (content: string): string => {
    // Remove markdown formatting
    let cleanContent = content
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/#{1,6}\s*/g, '') // Remove headers
      .replace(/^\s*[-*+]\s*/gm, '• ') // Convert list items to bullets
      .replace(/\n{2,}/g, '\n') // Reduce multiple newlines
      .trim()

    // If content is too long, try to extract the most important parts
    if (cleanContent.length > 280) {
      // Look for key sections or the first few sentences
      const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 10)
      if (sentences.length > 0) {
        // Take first 2-3 sentences that fit within limit
        let result = ''
        for (let i = 0; i < Math.min(3, sentences.length); i++) {
          const candidate = result + (result ? '. ' : '') + sentences[i].trim() + '.'
          if (candidate.length <= 280) {
            result = candidate
          } else {
            break
          }
        }
        return result || cleanContent.substring(0, 277) + '...'
      }
    }

    return cleanContent
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle ESC key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFocused) {
        setIsFocused(false)
      }
    }

    if (isFocused) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFocused])

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
    setIsFocused(true) // Enter focus mode when sending message

    try {
      let response
      
      switch (mode) {
        case 'ca-assistant':
          response = await fetch('/api/chat/ca-assistant-gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: userMessage.content,
              context: messages.length > 0 ? messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n') : '',
              writingVoice: writingVoice
            })
          })
          break

        case 'seo-content':
          // Parse input for SEO parameters
          const seoMatch = userMessage.content.match(/topic:\s*([^,]+)(?:,\s*keywords:\s*([^,]+))?(?:,\s*type:\s*([^,]+))?/)
          if (seoMatch) {
            const [, topic, keywordsStr, contentType] = seoMatch
            const keywords = keywordsStr ? keywordsStr.split(/[,;]/).map(k => k.trim()) : []
            
            response = await fetch('/api/marketing/seo-content-gemini', {
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
            response = await fetch('/api/marketing/seo-content-gemini', {
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
            
            response = await fetch('/api/marketing/strategy-gemini', {
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
            response = await fetch('/api/marketing/strategy-gemini', {
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
          response = await fetch('/api/chat/general-gemini', {
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
              ],
              writingVoice: writingVoice
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

  // Helper function for button styling based on variant
  const getButtonStyle = (baseStyle: string = 'p-2 text-white rounded-lg transition-colors border border-gray-600') => {
    return variant === 'dashboard' 
      ? `p-3 text-white rounded-lg transition-colors border border-gray-600 bg-gray-800 hover:bg-gray-700 shadow-lg` 
      : `${baseStyle} bg-gray-700 hover:bg-gray-600`
  }

  return (
    <>
      {/* Blur background when focused */}
      {isFocused && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setIsFocused(false)}
        />
      )}
      
      <div className={`flex flex-col h-full rounded-lg transition-all duration-300 ${
        variant === 'dashboard' 
          ? `relative border border-gray-200 shadow-xl ${isFocused ? 'fixed inset-4 z-50 bg-white shadow-2xl' : 'bg-white'}` 
          : `border border-gray-700 shadow-sm ${isFocused ? 'fixed inset-4 z-50 bg-gray-100 shadow-2xl' : 'bg-gray-100'}`
      }`}>
      {/* Header */}
      <div className={`p-4 rounded-t-lg border-b ${
        variant === 'dashboard' 
          ? 'bg-white text-black border-gray-200' 
          : 'bg-gray-900 text-white border-gray-700'
      }`}>
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
                className={`rounded px-2 py-1 text-sm ${
                  variant === 'dashboard' 
                    ? 'bg-gray-100 border border-gray-300 text-black' 
                    : 'bg-gray-800 border border-gray-600 text-white'
                }`}
              >
                <option value="general">General Chat</option>
                <option value="ca-assistant">CA Assistant</option>
                <option value="seo-content">SEO Content</option>
                <option value="marketing-strategy">Marketing</option>
              </select>
            )}
            {/* Writing Voice Selector */}
            <div className="relative">
              <button
                onClick={() => setShowVoiceSelector(!showVoiceSelector)}
                className={`flex items-center space-x-2 px-3 py-1 rounded text-sm transition-colors ${
                  variant === 'dashboard' 
                    ? 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-black' 
                    : 'bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:block">Voice</span>
              </button>
              
              {showVoiceSelector && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {writingVoices.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => {
                        setWritingVoice(voice.id)
                        setShowVoiceSelector(false)
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                        writingVoice === voice.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      <span className="mr-2">{voice.icon}</span>
                      {voice.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Social Automation Button */}
            <button
              onClick={() => setShowSocialAutomation(true)}
              className={`flex items-center space-x-2 px-3 py-1 rounded text-sm transition-colors ${
                variant === 'dashboard' 
                  ? 'bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-700' 
                  : 'bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:block">Social</span>
            </button>

            <button
              onClick={clearChat}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                variant === 'dashboard' 
                  ? 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-black' 
                  : 'bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white'
              }`}
            >
              Clear
            </button>
            {isFocused && (
              <button
                onClick={() => setIsFocused(false)}
                className="bg-red-500 hover:bg-red-600 p-2 rounded-lg transition-colors text-white"
                title="Exit Focus Mode"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {!isFocused && (
              <button
                onClick={() => setIsFocused(true)}
                className={`p-2 rounded-lg transition-colors ${
                  variant === 'dashboard' 
                    ? 'bg-gray-100 hover:bg-gray-200 text-black' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title="Enter Focus Mode"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white" style={{
        maxHeight: isFocused ? 'calc(100vh - 200px)' : '24rem',
        scrollbarWidth: 'thin',
        scrollbarColor: '#000000 #f3f4f6'
      }}>
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 8px;
          }
          div::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 4px;
          }
          div::-webkit-scrollbar-thumb {
            background: #000000;
            border-radius: 4px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #333333;
          }
        `}</style>
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 border border-gray-300">
              {config.icon}
            </div>
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm">{config.placeholder}</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              variant === 'dashboard' 
                ? message.role === 'user' 
                  ? 'bg-gray-200 text-black border border-gray-300' 
                  : 'bg-gray-200 text-black border border-gray-300'
                : message.role === 'user' 
                  ? 'bg-gray-900 text-white border border-gray-600' 
                  : 'bg-gray-50 text-gray-900 border border-gray-200'
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
            <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 border-t ${
        variant === 'dashboard' 
          ? 'border-gray-200 bg-white' 
          : 'border-gray-700 bg-gray-900'
      }`}>
        {error && (
          <div className="mb-2 p-2 bg-red-900 border border-red-700 rounded text-red-300 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={config.placeholder}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-0 focus:border-gray-500 resize-none text-gray-900 bg-white placeholder-gray-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-lg transition-colors ${
              variant === 'dashboard' 
                ? 'bg-gray-800 hover:bg-gray-700 disabled:bg-gray-400 text-white border border-gray-600' 
                : 'bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white border border-gray-600'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className={variant === 'dashboard' 
          ? `fixed bottom-4 left-4 flex items-center space-x-2 z-10`
          : `flex items-center space-x-2 mt-4 pt-4 border-t justify-start border-gray-700`
        }>
          <button
            className={getButtonStyle()}
            title="Regenerate"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            className={getButtonStyle()}
            title="ICAI Compliance Check"
          >
            <Shield className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              // Get the latest assistant message that comes after a user message (skip initial welcome message)
              const userMessages = messages.filter(msg => msg.role === 'user');
              if (userMessages.length > 0) {
                const lastUserMessageIndex = messages.findLastIndex(msg => msg.role === 'user');
                const latestAssistantMessage = messages.slice(lastUserMessageIndex + 1).find(msg => msg.role === 'assistant');
                const rawContent = latestAssistantMessage ? latestAssistantMessage.content : 'Check out this AI-powered content creation tool for CAs!';
                const content = extractShareableContent(rawContent);
                
                // LinkedIn sharing with proper URL format
                const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(content)}`;
                window.open(linkedinUrl, '_blank');
              } else {
                // Fallback if no user messages yet
                const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent('Check out this AI-powered content creation tool for CAs!')}`;
                window.open(linkedinUrl, '_blank');
              }
            }}
            className={variant === 'dashboard' 
              ? "p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg border border-gray-600" 
              : "p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            }
            title="Post on LinkedIn"
          >
            <Linkedin className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              // Get the latest assistant message that comes after a user message (skip initial welcome message)
              const userMessages = messages.filter(msg => msg.role === 'user');
              if (userMessages.length > 0) {
                const lastUserMessageIndex = messages.findLastIndex(msg => msg.role === 'user');
                const latestAssistantMessage = messages.slice(lastUserMessageIndex + 1).find(msg => msg.role === 'assistant');
                const rawContent = latestAssistantMessage ? latestAssistantMessage.content : 'Check out this AI-powered content creation tool for CAs!';
                const content = extractShareableContent(rawContent);
                
                // Twitter sharing with proper URL format
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
                window.open(twitterUrl, '_blank');
              } else {
                // Fallback if no user messages yet
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out this AI-powered content creation tool for CAs!')}`;
                window.open(twitterUrl, '_blank');
              }
            }}
            className={getButtonStyle()}
            title="Post on X"
          >
            <Twitter className="w-5 h-5" />
          </button>
          
          <button
            className={getButtonStyle()}
            title="Change Writing Voice"
          >
            <PenTool className="w-5 h-5" />
          </button>
          
          <button
            className={getButtonStyle()}
            title="Change Target Audience"
          >
            <Users className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              // Get the latest assistant message and copy to clipboard
              const userMessages = messages.filter(msg => msg.role === 'user');
              if (userMessages.length > 0) {
                const lastUserMessageIndex = messages.findLastIndex(msg => msg.role === 'user');
                const latestAssistantMessage = messages.slice(lastUserMessageIndex + 1).find(msg => msg.role === 'assistant');
                const content = latestAssistantMessage ? latestAssistantMessage.content : 'Check out this AI-powered content creation tool for CAs!';
                
                navigator.clipboard.writeText(content).then(() => {
                  // Show a brief success indicator
                  const button = event.target as HTMLElement;
                  const originalTitle = button.title;
                  button.title = 'Copied!';
                  setTimeout(() => {
                    button.title = originalTitle;
                  }, 2000);
                }).catch(err => {
                  console.error('Failed to copy content:', err);
                });
              }
            }}
            className={variant === 'dashboard' 
              ? "p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-lg border border-gray-600" 
              : "p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            }
            title="Copy to Clipboard"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Templates */}
        {mode === 'seo-content' && (
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              onClick={() => setInput('topic: Digital Marketing for Small Business, keywords: digital marketing, small business, online marketing')}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                variant === 'dashboard' 
                  ? 'bg-gray-100 hover:bg-gray-200 text-black border border-gray-300' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
              }`}
            >
              SEO Blog Template
            </button>
            <button
              onClick={() => setInput('topic: Product Landing Page, type: landing-page')}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                variant === 'dashboard' 
                  ? 'bg-gray-100 hover:bg-gray-200 text-black border border-gray-300' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
              }`}
            >
              Landing Page
            </button>
          </div>
        )}

        {mode === 'marketing-strategy' && (
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              onClick={() => setInput('business: SaaS startup, target: B2B companies, budget: $10k/month')}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                variant === 'dashboard' 
                  ? 'bg-gray-100 hover:bg-gray-200 text-black border border-gray-300' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
              }`}
            >
              SaaS Marketing
            </button>
            <button
              onClick={() => setInput('business: E-commerce store, target: millennials, budget: $5k/month')}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                variant === 'dashboard' 
                  ? 'bg-gray-100 hover:bg-gray-200 text-black border border-gray-300' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
              }`}
            >
              E-commerce Strategy
            </button>
          </div>
        )}
      </div>
      </div>
      
      {/* Social Automation Sidebar */}
      <SocialAutomationSidebar 
        isOpen={showSocialAutomation} 
        onClose={() => setShowSocialAutomation(false)} 
      />
    </>
  )
}

export default ChatInterface