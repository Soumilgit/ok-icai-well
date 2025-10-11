'use client';

import { useState } from 'react';

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
        <h3 className="text-lg font-semibold">🤖 Gemini Content Assistant</h3>
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
            placeholder="Ask me to create content for LinkedIn, Twitter, or any platform..."
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
      </div>
    </div>
  );
}
