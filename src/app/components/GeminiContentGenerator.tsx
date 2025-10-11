'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

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
      const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(content)}`;
      window.open(linkedinUrl, '_blank');
    }
  };

  const handleTwitterPost = (content: string) => {
    if (onTwitterPost) {
      onTwitterPost(content);
    } else {
      // Default Twitter posting behavior
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Gemini Content Assistant</h3>
            <p className="text-sm text-gray-500">AI-powered content creation</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-500">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
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
            <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
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
      <div className="border-t border-gray-200 p-4 bg-gray-100">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me to create content for LinkedIn, Twitter, or any platform..."
            className="flex-1 px-3 py-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-0 focus:border-blue-600 bg-white text-black"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={isGenerating || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-12 h-10"
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
      </div>

      {/* Action Buttons for Latest Assistant Message */}
      {messages.length > 1 && messages[messages.length - 1].type === 'assistant' && !isTyping && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <button
              onClick={() => handleLinkedInPost(messages[messages.length - 1].content)}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span>Post on LinkedIn</span>
            </button>
            <button
              onClick={() => handleTwitterPost(messages[messages.length - 1].content)}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>Post on X</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
