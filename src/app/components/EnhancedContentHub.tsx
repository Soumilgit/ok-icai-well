'use client';

import React, { useState } from 'react';

interface EnhancedContentHubProps {}

export default function EnhancedContentHub({}: EnhancedContentHubProps) {
  const [activeTab, setActiveTab] = useState<'discover' | 'creator' | 'voice-setup' | 'image-gen' | 'compliance'>('discover');

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Enhanced Content Hub
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Your centralized content creation workspace
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {[
            { key: 'discover', label: 'Discover', icon: '🔍' },
            { key: 'creator', label: 'Content Creator', icon: '✍️' },
            { key: 'voice-setup', label: 'Voice Setup', icon: '🎤' },
            { key: 'image-gen', label: 'Image Generator', icon: '🎨' },
            { key: 'compliance', label: 'Compliance', icon: '✅' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 rounded-lg border transition-all font-medium ${
                activeTab === tab.key
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-600">
          {activeTab === 'discover' && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold text-white mb-4">Discover Content</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Find trending topics, news articles, and content ideas tailored for CA professionals.
              </p>
              <div className="bg-gray-700 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-gray-300">
                  This feature has been moved to the <strong>Discover Feed</strong> section in the main dashboard.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'creator' && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">✍️</div>
              <h3 className="text-2xl font-semibold text-white mb-4">Content Creator</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Create professional LinkedIn posts, articles, and marketing content with AI assistance.
              </p>
              <div className="bg-gray-700 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-gray-300">
                  This feature has been moved to the <strong>Discover Feed</strong> section in the main dashboard.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'voice-setup' && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎤</div>
              <h3 className="text-2xl font-semibold text-white mb-4">Writing Voice Setup</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Configure your unique writing style and voice preferences for AI-generated content.
              </p>
              <div className="bg-gray-700 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-gray-300">
                  This feature is available in the main dashboard under <strong>Writing Voice</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'image-gen' && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-2xl font-semibold text-white mb-4">AI Image Generator</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Generate professional images, infographics, and visual content for your posts.
              </p>
              <div className="bg-gray-700 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-gray-300">
                  This feature is available in the main dashboard under <strong>Image Generator</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-semibold text-white mb-4">ICAI Compliance Checker</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Ensure your content meets ICAI guidelines and professional standards.
              </p>
              <div className="bg-gray-700 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-gray-300">
                  This feature is available in the main dashboard under <strong>Compliance Center</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            All content creation features have been reorganized for better accessibility. 
            Use the main dashboard navigation to access specific tools.
          </p>
        </div>
      </div>
    </div>
  );
}