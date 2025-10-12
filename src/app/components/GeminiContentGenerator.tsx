'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { RefreshCw, Shield, PenTool, Users, Linkedin, Twitter } from 'lucide-react';

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
}

export default function GeminiContentGenerator({ 
  onLinkedInPost, 
  onTwitterPost, 
  className = '' 
}: GeminiContentGeneratorProps) {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateContent = async (prompt: string) => {
    setIsGenerating(true);
    setIsTyping(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate AI response based on prompt
      let aiResponse = '';
      
      if (prompt.toLowerCase().includes('linkedin') || prompt.toLowerCase().includes('post')) {
        aiResponse = `Here's a professional LinkedIn post for you:

🚀 **CA Industry Update: Digital Transformation**

The accounting profession is evolving rapidly, and CAs who adapt to digital tools are seeing 40% more efficiency in their practice.

Key takeaways:
✅ Automation reduces manual errors by 85%
✅ Cloud-based solutions improve client collaboration
✅ AI-powered insights help in better decision making

The question isn't whether to embrace technology, but how quickly you can integrate it into your practice.

What's your experience with digital transformation in your CA practice? Share your insights below!

#CA #DigitalTransformation #AccountingTech #ProfessionalGrowth #CACommunity`;
      } else if (prompt.toLowerCase().includes('twitter') || prompt.toLowerCase().includes('x')) {
        aiResponse = `Here's a concise Twitter post:

💡 CA Tip: Use cloud accounting software to reduce client meeting time by 60% and improve accuracy.

Real-time collaboration = Better client relationships.

#CA #Accounting #CloudSoftware #Efficiency`;
      } else {
        aiResponse = `I'd be happy to help you create content! Here's what I can assist with:

📝 **LinkedIn Posts**: Professional articles, industry insights, thought leadership content
🐦 **Twitter/X Posts**: Quick updates, tips, and engaging short-form content  
📊 **Client Communications**: Newsletters, updates, and educational materials
🎯 **Marketing Content**: Social media campaigns and promotional materials

What specific type of content would you like to create? Just let me know your topic, target audience, and preferred platform!`;
      }

      // Add typing effect
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Simulate typing effect
      for (let i = 0; i <= aiResponse.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 20));
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: aiResponse.slice(0, i) }
              : msg
          )
        );
      }

    } catch (error) {
      console.error('Error generating content:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while generating content. Please try again.',
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
    if (inputMessage.trim() && !isGenerating) {
      generateContent(inputMessage.trim());
    }
  };

  const handleLinkedInPost = (content: string) => {
    if (onLinkedInPost) {
      onLinkedInPost(content);
    } else {
      // Default LinkedIn posting behavior
      const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent('AI-Generated Content')}&summary=${encodeURIComponent(content)}`;
      window.open(linkedinUrl, '_blank');
    }
  };

  const handleTwitterPost = (content: string) => {
    if (onTwitterPost) {
      onTwitterPost(content);
    } else {
      // Default Twitter posting behavior
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}&url=${encodeURIComponent(window.location.href)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  return (
    <div className={`bg-gray-900 rounded-xl shadow-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center border border-gray-600">
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
      <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-900">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-black text-white border border-gray-600'
                  : 'bg-gray-800 text-gray-100 border border-gray-600'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-gray-300' : 'text-gray-400'
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
            className="flex-1 px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-500 bg-gray-700 text-white placeholder-gray-400"
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
              // Get the latest assistant message that comes after a user message (skip initial welcome message)
              const userMessages = messages.filter(msg => msg.type === 'user');
              if (userMessages.length > 0) {
                const lastUserMessageIndex = messages.findLastIndex(msg => msg.type === 'user');
                const latestAssistantMessage = messages.slice(lastUserMessageIndex + 1).find(msg => msg.type === 'assistant');
                const content = latestAssistantMessage ? latestAssistantMessage.content : 'Check out this AI-powered content creation tool for CAs!';
                
                // LinkedIn sharing with working URL format
                const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(content)}`;
                window.open(linkedinUrl, '_blank');
              } else {
                // Fallback if no user messages yet
                const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent('Check out this AI-powered content creation tool for CAs!')}`;
                window.open(linkedinUrl, '_blank');
              }
            }}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Post on LinkedIn"
          >
            <Linkedin className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              // Get the latest assistant message that comes after a user message (skip initial welcome message)
              const userMessages = messages.filter(msg => msg.type === 'user');
              if (userMessages.length > 0) {
                const lastUserMessageIndex = messages.findLastIndex(msg => msg.type === 'user');
                const latestAssistantMessage = messages.slice(lastUserMessageIndex + 1).find(msg => msg.type === 'assistant');
                const content = latestAssistantMessage ? latestAssistantMessage.content : 'Check out this AI-powered content creation tool for CAs!';
                
                // Twitter sharing with generated content
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
                window.open(twitterUrl, '_blank');
              } else {
                // Fallback if no user messages yet
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out this AI-powered content creation tool for CAs!')}`;
                window.open(twitterUrl, '_blank');
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
  );
}
