'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '@clerk/nextjs';
import { RefreshCw, Shield, PenTool, Users, Linkedin, Twitter, X, Maximize2, Minimize2, Copy } from 'lucide-react';
import ArtifactsBox from '@/components/ArtifactsBox';
import ArtifactsSidePanel from '@/components/ArtifactsSidePanel';

interface GeminiContentGeneratorProps {
  onLinkedInPost?: (content: string) => void;
  onTwitterPost?: (content: string) => void;
  className?: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  artifacts?: any;
}

export default function GeminiContentGenerator({ onLinkedInPost, onTwitterPost, className = '' }: GeminiContentGeneratorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI content assistant. I can help you create engaging LinkedIn posts, Twitter content, and other professional materials. What would you like to create today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isFullView, setIsFullView] = useState(false);
  const [showArtifactsPanel, setShowArtifactsPanel] = useState(false);
  const [artifactsData, setArtifactsData] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const openArtifactsPanel = (artifacts: any) => {
    setArtifactsData(artifacts);
    setShowArtifactsPanel(true);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const generateContent = async (prompt: string) => {
    setIsGenerating(true);
    setIsTyping(true);
    setIsFullView(true); // Expand to full view when generating

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      console.log('📄 API Response:', data);
      
      // Simulate typing effect
      const aiResponse = data.content || 'I apologize, but I encountered an error generating content. Please try again.';
      console.log('🤖 AI Response:', aiResponse);
      
      // Create assistant message first
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '',
        timestamp: new Date()
      };

      // Add the assistant message to start typing effect
      setMessages(prev => {
        console.log('📝 Adding assistant message:', assistantMessage);
        return [...prev, assistantMessage];
      });

      // Simulate typing effect
      let displayContent = '';
      for (let i = 0; i < aiResponse.length; i++) {
        displayContent += aiResponse[i];
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.id === assistantMessage.id) {
            newMessages[newMessages.length - 1] = { ...lastMessage, content: displayContent };
          }
          return newMessages;
        });
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // Update final message with full content and artifacts
      let finalMessage = { ...assistantMessage, content: aiResponse };

      // If response is long, create artifacts
      if (aiResponse.length > 500) {
        const artifactId = `doc_${finalMessage.id}`;
        const artifacts = {
          id: artifactId,
          title: `Generated Content - ${new Date().toLocaleDateString()}`,
          subtitle: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
          preview: aiResponse.substring(0, 200) + '...',
          fullContent: aiResponse,
          type: 'content',
          metadata: {
            wordCount: aiResponse.split(' ').length,
            characterCount: aiResponse.length,
            generatedAt: new Date().toISOString(),
            prompt: prompt
          },
          downloadUrl: `/api/artifacts/download/${artifactId}`
        };

        finalMessage.artifacts = artifacts;

        // Store message for artifact viewer
        try {
          await fetch(`/api/messages/${finalMessage.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: aiResponse,
              role: 'assistant',
              mode: 'content-generation'
            })
          });
        } catch (error) {
          console.error('Failed to store message:', error);
        }
      }

      // Update the final message with artifacts
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessageIndex = newMessages.length - 1;
        if (newMessages[lastMessageIndex] && newMessages[lastMessageIndex].id === assistantMessage.id) {
          newMessages[lastMessageIndex] = finalMessage;
        }
        return newMessages;
      });

    } catch (error) {
      console.error('Error generating content:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error generating content. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isGenerating) return;
    
    const prompt = inputMessage.trim();
    setInputMessage('');
    generateContent(prompt);
  };

  const handleLinkedInShare = (content: string) => {
    const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(content)}`;
      window.open(linkedinUrl, '_blank');
  };

  const handleTwitterShare = (content: string) => {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}&url=${encodeURIComponent(window.location.href)}`;
      window.open(twitterUrl, '_blank');
  };

  // Render full view as portal
  const fullViewContent = isFullView && isMounted && (
    <>
      {/* Full screen overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={() => setIsFullView(false)}
      />
      
       {/* Chat interface */}
       <div className="fixed inset-x-4 top-4 bottom-24 z-50 bg-gray-900 rounded-xl shadow-lg border border-gray-700">
        {/* Full view overlay and dismiss button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setIsFullView(false)}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-600"
            title="Exit full view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-600">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">Gemini Content Assistant</h3>
              <p className="text-sm text-gray-400">AI-powered content creation</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-400">Online</span>
          </div>
        </div>

         {/* Messages */}
         <div className="h-[calc(100vh-300px)] overflow-y-auto p-4 space-y-4 bg-white">
           {messages.map((message) => (
             <div
               key={message.id}
               className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-center'}`}
             >
               <div
                 className={`max-w-4xl px-6 py-4 rounded-lg ${
                   message.type === 'user'
                     ? 'bg-gray-400 text-black border border-gray-600 ml-auto'
                     : 'bg-gray-300 text-gray-900 border border-gray-600 w-full'
                 }`}
               >
                {/* Show artifacts box if present */}
                {message.artifacts && message.type === 'assistant' && (
                  <div className="mb-4">
                    <ArtifactsBox
                      title={message.artifacts.title}
                      subtitle={message.artifacts.subtitle}
                      preview={message.artifacts.preview}
                      fullContent={message.artifacts.fullContent}
                      type={message.artifacts.type}
                      onOpenArtifact={() => openArtifactsPanel(message.artifacts!)}
                      onViewArtifact={(artifactId) => {
                        window.open(`/artifact/${artifactId}`, '_blank');
                      }}
                      metadata={message.artifacts.metadata}
                      downloadUrl={message.artifacts.downloadUrl}
                      artifactId={message.artifacts.id}
                    />
                  </div>
                )}

                <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-3 text-right ${
                  message.type === 'user' ? 'text-gray-900' : 'text-gray-900'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>

                {/* Share buttons for assistant messages */}
                {message.type === 'assistant' && message.content.length > 50 && (
                  <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-400">
                    <button
                      onClick={() => {
                        const content = message.artifacts 
                          ? `📄 ${message.artifacts.title} - ${message.artifacts.preview}`
                          : message.content.length > 200 
                            ? message.content.substring(0, 197) + '...' 
                            : message.content;
                        
                        handleLinkedInShare(content);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center gap-1 text-xs font-medium"
                    >
                      <Linkedin className="w-3 h-3" />
                      Share
                    </button>
                    
                    <button
                      onClick={() => {
                        const content = message.artifacts 
                          ? `📄 ${message.artifacts.title} - ${message.artifacts.preview}`
                          : message.content.length > 150 
                            ? message.content.substring(0, 147) + '...' 
                            : message.content;
                        
                        handleTwitterShare(content);
                      }}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center gap-1 text-xs font-medium"
                    >
                      <Twitter className="w-3 h-3" />
                      Tweet
                    </button>
                    
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(message.content);
                      }}
                      className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center gap-1 text-xs font-medium"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-center">
              <div className="bg-gray-800 text-gray-100 px-4 py-2 rounded-lg border border-gray-600">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-700 p-4 bg-gray-800">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me to create content for LinkedIn, Twitter, or any platform..."
              className="flex-1 px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-500 bg-gray-200 text-black placeholder-gray-400"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={isGenerating || !inputMessage.trim()}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-12 h-10 border border-gray-600"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-2 mt-4 pt-4 border-t border-gray-700">
            <button
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
              title="Regenerate"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <button
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
              title="ICAI Compliance Check"
            >
              <Shield className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => {
                const userMessages = messages.filter(msg => msg.type === 'user');
                if (userMessages.length > 0) {
                  const lastUserMessageIndex = messages.findLastIndex(msg => msg.type === 'user');
                  const latestAssistantMessage = messages.slice(lastUserMessageIndex + 1).find(msg => msg.type === 'assistant');
                  const content = latestAssistantMessage ? latestAssistantMessage.content : 'Check out this AI-powered content creation tool for CAs!';
                  handleLinkedInShare(content);
                } else {
                  handleLinkedInShare('Check out this AI-powered content creation tool for CAs!');
                }
              }}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              title="Post on LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => {
                const userMessages = messages.filter(msg => msg.type === 'user');
                if (userMessages.length > 0) {
                  const lastUserMessageIndex = messages.findLastIndex(msg => msg.type === 'user');
                  const latestAssistantMessage = messages.slice(lastUserMessageIndex + 1).find(msg => msg.type === 'assistant');
                  const content = latestAssistantMessage ? latestAssistantMessage.content : 'Check out this AI-powered content creation tool for CAs!';
                  handleTwitterShare(content);
                } else {
                  handleTwitterShare('Check out this AI-powered content creation tool for CAs!');
                }
              }}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
              title="Post on X"
            >
              <Twitter className="w-5 h-5" />
            </button>
            
            <button
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
              title="Change Writing Voice"
            >
              <PenTool className="w-5 h-5" />
            </button>
            
            <button
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
              title="Change Target Audience"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Artifacts Side Panel */}
        {showArtifactsPanel && artifactsData && (
          <ArtifactsSidePanel
            artifacts={artifactsData}
            onClose={() => setShowArtifactsPanel(false)}
          />
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Regular chat interface (embedded) */}
    <div className={`bg-gray-900 rounded-xl shadow-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-600">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Gemini Content Assistant</h3>
            <p className="text-sm text-gray-400">AI-powered content creation</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-gray-400 text-black border border-gray-600'
                  : 'bg-gray-300 text-gray-900 border border-gray-600'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-gray-900' : 'text-gray-900'
              }`}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-100 px-4 py-2 rounded-lg border border-gray-600">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me to create content for LinkedIn, Twitter, or any platform..."
            className="flex-1 px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-500 bg-gray-200 text-black placeholder-gray-400"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={isGenerating || !inputMessage.trim()}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-12 h-10 border border-gray-600"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-2 mt-4 pt-4 border-t border-gray-700">
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
            title="Regenerate"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
            title="ICAI Compliance Check"
          >
            <Shield className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              const userMessages = messages.filter(msg => msg.type === 'user');
              if (userMessages.length > 0) {
                const lastUserMessageIndex = messages.findLastIndex(msg => msg.type === 'user');
                const latestAssistantMessage = messages.slice(lastUserMessageIndex + 1).find(msg => msg.type === 'assistant');
                const content = latestAssistantMessage ? latestAssistantMessage.content : 'Check out this AI-powered content creation tool for CAs!';
                  handleLinkedInShare(content);
              } else {
                  handleLinkedInShare('Check out this AI-powered content creation tool for CAs!');
              }
            }}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Post on LinkedIn"
          >
            <Linkedin className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              const userMessages = messages.filter(msg => msg.type === 'user');
              if (userMessages.length > 0) {
                const lastUserMessageIndex = messages.findLastIndex(msg => msg.type === 'user');
                const latestAssistantMessage = messages.slice(lastUserMessageIndex + 1).find(msg => msg.type === 'assistant');
                const content = latestAssistantMessage ? latestAssistantMessage.content : 'Check out this AI-powered content creation tool for CAs!';
                  handleTwitterShare(content);
              } else {
                  handleTwitterShare('Check out this AI-powered content creation tool for CAs!');
              }
            }}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
            title="Post on X"
          >
            <Twitter className="w-5 h-5" />
          </button>
          
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
            title="Change Writing Voice"
          >
            <PenTool className="w-5 h-5" />
          </button>
          
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
            title="Change Target Audience"
          >
            <Users className="w-5 h-5" />
          </button>
          </div>
        </div>
      </div>

      {/* Portal for full view */}
      {isMounted && fullViewContent && createPortal(fullViewContent, document.body)}
    </>
  );
}
