'use client';

import { useState } from 'react';
import { RefreshCw, Shield, PenTool, Users, Linkedin, Twitter } from 'lucide-react';

export default function SimpleChatBox() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      text: 'Hello! I\'m your AI content assistant. What would you like to create today?'
    }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage = {
        id: messages.length + 1,
        type: 'user',
        text: inputText
      };
      setMessages([...messages, newMessage]);
      setInputText('');
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          type: 'assistant',
          text: 'I can help you create LinkedIn posts, Twitter content, and more! What specific content do you need?'
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-t-xl">
        <h3 className="text-lg font-semibold">🤖 CA Assistant</h3>
        <p className="text-sm opacity-90">AI-powered content creation</p>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-lg ${
              message.type === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-900'
            }`}>
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-gray-100">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about Indian tax laws, GST, compliance, audit procedures..."
            className="flex-1 px-3 py-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-0 focus:border-blue-600 bg-white text-black"
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center w-12 h-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-2 mt-4 pt-4 border-t border-gray-200">
          <button
            className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            title="Regenerate"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
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
                const content = latestAssistantMessage ? latestAssistantMessage.text : 'Check out this AI-powered content creation tool for CAs!';
                
                // LinkedIn sharing with content as text
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
                const content = latestAssistantMessage ? latestAssistantMessage.text : 'Check out this AI-powered content creation tool for CAs!';
                
                // Twitter sharing with generated content
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
                window.open(twitterUrl, '_blank');
              } else {
                // Fallback if no user messages yet
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out this AI-powered content creation tool for CAs!')}`;
                window.open(twitterUrl, '_blank');
              }
            }}
            className="p-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors"
            title="Post on X"
          >
            <Twitter className="w-5 h-5" />
          </button>
          
          <button
            className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            title="Change Writing Voice"
          >
            <PenTool className="w-5 h-5" />
          </button>
          
          <button
            className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            title="Change Target Audience"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
