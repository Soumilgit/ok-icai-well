'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Twitter, Edit3, Copy, Share2, MessageCircle, RotateCcw, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function TwitterPostGenerator() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `🐦 Welcome to your Twitter content assistant! I specialize in creating engaging tweets for CA professionals and accounting businesses.

I can help you create:
• Quick updates about tax deadlines and compliance
• Professional insights about accounting trends  
• Thread-worthy content about ICAI developments
• Engaging posts about business advisory services

What would you like to tweet about today?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [currentPost, setCurrentPost] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generatePost = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsTitle: prompt,
          postType: 'twitter',
          newsContent: `User prompt: ${prompt}`,
          summary: `Twitter content request: ${prompt}`,
          keyPoints: ['Concise format', 'Engaging hashtags', 'Professional tone'],
          caImplications: ['Professional standards', 'Client engagement', 'Industry expertise']
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📨 API Response:', { source: result.source, success: result.success, error: result.error, apiUsed: result.metadata?.apiUsed });
        if (result.success && result.content) {
          const apiService = result.source === 'perplexity' ? 'Perplexity AI' : 
                           result.source === 'gemini' ? 'Gemini AI' : 'Fallback';
          console.log(`✅ Content generated via ${apiService}`);
          if (result.source.includes('fallback')) {
            console.warn('⚠️ Using fallback content instead of AI:', result.error || 'Unknown reason');
          }
          return result.content;
        }
      } else {
        console.error('❌ API response error:', response.status, response.statusText);
      }
      
      // Enhanced fallback response
      return `1/4 🔍 ${prompt.length > 80 ? prompt.substring(0, 77) + '...' : prompt}

This is a significant development for CA professionals! Key considerations ahead:

2/4 📊 Impact areas:
• Updated compliance requirements need immediate attention
• Strategic planning opportunities emerging for forward-thinking CAs

3/4 ✅ Action required:
CAs should review current practices and consider implementation strategies for optimal client service.

4/4 💬 What's your take on this development? Share your insights below! 👇

#CharteredAccountant #CANews #Compliance #BusinessAdvisory #ProfessionalDevelopment #ICAI`;
    } catch (error) {
      console.error('Error generating post:', error);
      return `I encountered a technical error while generating your Twitter post. This could be due to connectivity issues or API limitations.

Please try:
• Being more specific in your request
• Checking your internet connection  
• Trying again in a few moments

If issues persist, our fallback system ensures you still get professional Twitter content optimized for the CA community.`;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const prompt = inputValue;
    setInputValue('');

    const generatedPost = await generatePost(prompt);
    setCurrentPost(generatedPost);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: generatedPost,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleEdit = (messageContent: string) => {
    setEditingPost(messageContent);
    setCurrentPost(messageContent);
  };

  const saveEdit = () => {
    if (!editingPost) return;
    
    setMessages(prev => prev.map(msg => 
      msg.content === editingPost ? { ...msg, content: currentPost } : msg
    ));
    setEditingPost(null);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('📋 Content copied to clipboard!');
  };

  const shareToTwitter = (content: string) => {
    // Try Web Share API first (mobile-friendly with preview)
    if (navigator.share && navigator.canShare && navigator.canShare({ text: content })) {
      navigator.share({
        title: 'CA Professional Tweet',
        text: content
        // Note: Don't include URL for cleaner sharing of content-only
      }).then(() => {
        console.log('Content shared successfully via Web Share API');
      }).catch((error) => {
        console.log('Web Share API error, falling back to Twitter URL');
        openTwitterDialog(content);
      });
    } else {
      openTwitterDialog(content);
    }
  };

  const openTwitterDialog = (content: string) => {
    // Direct redirect to X/Twitter with generated content pre-filled
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
    window.open(twitterUrl, '_blank');
  };



  const regeneratePost = async () => {
    if (!messages.length) return;
    
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    if (lastUserMessage) {
      const newPost = await generatePost(lastUserMessage.content);
      setCurrentPost(newPost);
      
      const updatedMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: newPost,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, updatedMessage]);
    }
  };

  const getCharacterCount = (text: string) => {
    return text.length;
  };

  const getCharacterCountColor = (count: number) => {
    if (count <= 240) return 'text-green-400';
    if (count <= 270) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center mb-4">
          <Twitter className="w-10 h-10 mr-4" />
          <div>
            <h1 className="text-4xl font-bold">Twitter Post Generator</h1>
            <p className="text-xl text-sky-100 mt-2">
              AI-powered Twitter content creation for CA professionals
            </p>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-600 overflow-hidden">
        {/* Messages Area */}
        <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-900">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-sky-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                {editingPost === message.content ? (
                  <div className="space-y-3">
                    <textarea
                      value={currentPost}
                      onChange={(e) => setCurrentPost(e.target.value)}
                      className="w-full h-32 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white resize-none"
                      placeholder="Edit your Twitter post..."
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEdit}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPost(null)}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className={`text-sm font-mono ${getCharacterCountColor(getCharacterCount(currentPost))}`}>
                        {getCharacterCount(currentPost)}/280
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.role === 'assistant' && message.content.length > 50 && (
                      <div className="mt-4 pt-3 border-t border-gray-600">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`text-sm font-mono ${getCharacterCountColor(getCharacterCount(message.content))}`}>
                            {getCharacterCount(message.content)}/280 characters
                          </div>
                          {getCharacterCount(message.content) > 280 && (
                            <div className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded">
                              ⚠️ Exceeds Twitter limit
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(message.content)}
                              className="flex items-center space-x-1 px-3 py-1 bg-sky-600 text-white text-sm rounded hover:bg-sky-700"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => copyToClipboard(message.content)}
                              className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </button>
                            <button
                              onClick={regeneratePost}
                              className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Regenerate</span>
                            </button>
                          </div>
                          <button
                            onClick={() => openTwitterDialog(message.content)}
                            className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors border border-gray-600"
                          >
                            <X className="w-4 h-4" />
                            <span>Post on X</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-gray-700 rounded-2xl p-4 text-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500"></div>
                  <span>Generating your Twitter post...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-6 bg-gray-800 border-t border-gray-600">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe the Twitter post you'd like to create..."
              className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isGenerating}
              className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Generate</span>
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            💡 Try: "Tweet about upcoming tax deadlines", "Create a thread on audit automation", or "Share GST compliance tips"
          </div>
        </form>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setInputValue("Create a Twitter thread about upcoming income tax deadlines and key compliance reminders for businesses")}
          className="p-4 bg-gray-800 border border-gray-600 rounded-lg text-left text-white hover:bg-gray-700 transition-colors"
        >
          <h3 className="font-semibold mb-2">⏰ Tax Deadlines</h3>
          <p className="text-sm text-gray-400">Generate tweets about important tax dates and compliance</p>
        </button>
        
        <button
          onClick={() => setInputValue("Write an engaging Twitter thread about how AI and automation are transforming audit practices for chartered accountants")}
          className="p-4 bg-gray-800 border border-gray-600 rounded-lg text-left text-white hover:bg-gray-700 transition-colors"
        >
          <h3 className="font-semibold mb-2">🤖 AI in Auditing</h3>
          <p className="text-sm text-gray-400">Create content about technology trends in accounting</p>
        </button>
        
        <button
          onClick={() => setInputValue("Create an informative Twitter post about quick GST compliance tips that every business owner should know")}
          className="p-4 bg-gray-800 border border-gray-600 rounded-lg text-left text-white hover:bg-gray-700 transition-colors"
        >
          <h3 className="font-semibold mb-2">📊 GST Tips</h3>
          <p className="text-sm text-gray-400">Share practical GST compliance advice</p>
        </button>
      </div>
    </div>
  );
}