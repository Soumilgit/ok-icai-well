'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Linkedin, Edit3, Copy, Share2, MessageCircle, RotateCcw } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function LinkedInPostGenerator() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 Hi! I'm your LinkedIn content assistant. I can help you create professional posts for CA professionals and businesses.

Try asking me something like:
• "Create a LinkedIn post about the latest GST updates"
• "Write a professional update about digital audit trends"
• "Generate content about ICAI's new certification programs"
• "Create a post about tax compliance deadlines"

What would you like to post about today?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [currentPost, setCurrentPost] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  useEffect(() => {
    // Only scroll if user has interacted
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages]);

  const generatePost = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsTitle: prompt,
          postType: 'linkedin',
          newsContent: `User prompt: ${prompt}`,
          summary: `Professional LinkedIn content request: ${prompt}`,
          keyPoints: ['Professional content', 'CA compliance', 'Engaging format'],
          caImplications: ['Professional standards', 'Client communication', 'Industry expertise']
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
      
      // Fallback response with more context
      return `📊 Professional Update: ${prompt}

This development has significant implications for CA professionals and businesses. As industry experts, we must stay informed about emerging trends and regulatory changes.

Key considerations for Chartered Accountants:
• Professional standards require careful review and implementation of new requirements
• Client communication strategies should address these changes proactively and transparently
• Practice management systems may need updates to ensure optimal compliance and efficiency

For CA professionals, this represents both challenges and opportunities in our evolving practice landscape. The regulatory environment continues to advance, and our adaptability as professionals determines our success in serving clients effectively.

What's your experience with similar professional developments? How are you adapting your practice to meet these evolving requirements? Share your insights in the comments.

#CharteredAccountant #ProfessionalDevelopment #CANews #Compliance #BusinessAdvisory #ICAI #AccountingProfessionals`;
    } catch (error) {
      console.error('Error generating post:', error);
      return `I encountered a technical error while generating your LinkedIn post. This could be due to connectivity issues or API limitations. 

Please try:
• Rephrasing your request with more specific details
• Checking your internet connection
• Trying again in a few moments

If the issue persists, the generated content will use our fallback system to ensure you still get professional LinkedIn content.`;
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

  const shareToLinkedIn = (content: string) => {
    // Direct LinkedIn redirect - copy content and open LinkedIn with post intent
    navigator.clipboard.writeText(content).then(() => {
      // Open LinkedIn with intent to create a post (this opens the compose dialog)
      window.open('https://www.linkedin.com/feed/?shareActive=true', '_blank');
      // Show brief confirmation
      alert('📋 Content copied! LinkedIn post composer opened - paste (Ctrl+V) your content');
    }).catch(() => {
      // Fallback if clipboard fails
      window.open('https://www.linkedin.com/feed/?shareActive=true', '_blank');
      alert('LinkedIn opened! Please copy and paste your content manually.');
    });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex items-center mb-2 sm:mb-3">
          <Linkedin className="w-6 h-6 sm:w-8 sm:h-8 mr-3 sm:mr-4" />
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">LinkedIn Post Generator</h1>
            <p className="text-sm sm:text-base lg:text-lg text-blue-100 mt-1">
              AI-powered LinkedIn content creation for CA professionals
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                {editingPost === message.content ? (
                  <div className="space-y-3">
                    <textarea
                      value={currentPost}
                      onChange={(e) => setCurrentPost(e.target.value)}
                      className="w-full h-40 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white resize-none"
                      placeholder="Edit your LinkedIn post..."
                    />
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
                  </div>
                ) : (
                  <div>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.role === 'assistant' && message.content.length > 100 && (
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-600">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(message.content)}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
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
                          onClick={() => shareToLinkedIn(message.content)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Linkedin className="w-4 h-4" />
                          <span>Post to LinkedIn</span>
                        </button>
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span>Generating your LinkedIn post...</span>
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
              placeholder="Describe the LinkedIn post you'd like to create..."
              className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isGenerating}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Generate</span>
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            💡 Try: "Create a post about GST updates", "Write about digital audit trends", or "Share insights on CA compliance"
          </div>
        </form>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setInputValue("Create a LinkedIn post about the latest GST compliance updates and their impact on businesses")}
          className="p-4 bg-gray-800 border border-gray-600 rounded-lg text-left text-white hover:bg-gray-700 transition-colors"
        >
          <h3 className="font-semibold mb-2">📊 GST Updates</h3>
          <p className="text-sm text-gray-400">Generate content about GST compliance and regulations</p>
        </button>
        
        <button
          onClick={() => setInputValue("Write a professional LinkedIn post about digital transformation in audit and accounting practices")}
          className="p-4 bg-gray-800 border border-gray-600 rounded-lg text-left text-white hover:bg-gray-700 transition-colors"
        >
          <h3 className="font-semibold mb-2">💻 Digital Transformation</h3>
          <p className="text-sm text-gray-400">Create posts about technology in accounting</p>
        </button>
        
        <button
          onClick={() => setInputValue("Create a LinkedIn post about professional development opportunities for chartered accountants and their career growth")}
          className="p-4 bg-gray-800 border border-gray-600 rounded-lg text-left text-white hover:bg-gray-700 transition-colors"
        >
          <h3 className="font-semibold mb-2">🎓 Professional Development</h3>
          <p className="text-sm text-gray-400">Share insights on CA career advancement</p>
        </button>
      </div>
    </div>
  );
}