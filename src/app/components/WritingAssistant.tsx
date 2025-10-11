'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface WritingAssistantProps {
  selectedNewsItem?: {
    id: string;
    title: string;
    summary: string;
    source: string;
    url: string;
  } | null;
  onClose?: () => void;
}

interface GeneratedPost {
  content: string;
  hashtags: string[];
  callToAction: string;
  visualSuggestion: {
    type: 'personal-photo' | 'carousel' | 'infographic' | 'chart' | 'quote-card';
    description: string;
    reasoning: string;
  };
}

export default function WritingAssistant({ selectedNewsItem, onClose }: WritingAssistantProps) {
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [writingVoice, setWritingVoice] = useState('Professional');
  const [targetAudience, setTargetAudience] = useState('Clients');
  const [showVisualSuggestions, setShowVisualSuggestions] = useState(false);
  const [regenerateCount, setRegenerateCount] = useState(0);
  const { user } = useUser();

  const writingVoices = [
    'Professional',
    'Conversational', 
    'Expert',
    'Storyteller',
    'Technical'
  ];

  const targetAudiences = [
    'Clients',
    'Colleagues',
    'General Public',
    'Students',
    'Industry Leaders'
  ];

  const visualTypes = {
    'personal-photo': { icon: '📸', label: 'Personal Photo', color: 'bg-blue-500' },
    'carousel': { icon: '🎠', label: 'Carousel', color: 'bg-green-500' },
    'infographic': { icon: '📊', label: 'Infographic', color: 'bg-purple-500' },
    'chart': { icon: '📈', label: 'Chart', color: 'bg-orange-500' },
    'quote-card': { icon: '💬', label: 'Quote Card', color: 'bg-pink-500' }
  };

  const generatePost = async () => {
    if (!selectedNewsItem) return;

    setIsGenerating(true);
    setShowVisualSuggestions(false);

    try {
      // Simulate API call for post generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockGeneratedPost: GeneratedPost = {
        content: `🚨 IMPORTANT UPDATE: ${selectedNewsItem.title}

${selectedNewsItem.summary}

As a CA, here's what this means for your practice:

✅ Key compliance requirements
✅ Action items for your clients  
✅ Timeline considerations
✅ Risk mitigation strategies

This update requires immediate attention from all CA professionals. Early preparation will help you serve your clients better and stay compliant.

What's your take on these changes? Share your insights below! 👇

#CAUpdates #ProfessionalCompliance #${selectedNewsItem.source.replace(/\s+/g, '')} #TaxUpdates2025`,
        hashtags: ['#CAUpdates', '#ProfessionalCompliance', '#TaxUpdates2025', '#CACommunity'],
        callToAction: 'What\'s your take on these changes? Share your insights below! 👇',
        visualSuggestion: {
          type: 'infographic',
          description: 'Create an infographic showing the key timeline and requirements',
          reasoning: 'Infographics work well for compliance updates as they help break down complex information visually'
        }
      };

      setGeneratedPost(mockGeneratedPost);
      setShowVisualSuggestions(true);
    } catch (error) {
      console.error('Error generating post:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const regeneratePost = () => {
    setRegenerateCount(prev => prev + 1);
    generatePost();
  };

  const copyToClipboard = () => {
    if (generatedPost) {
      navigator.clipboard.writeText(generatedPost.content);
      // You could add a toast notification here
    }
  };

  const shareToLinkedIn = () => {
    if (generatedPost) {
      const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(generatedPost.content)}`;
      window.open(linkedinUrl, '_blank');
    }
  };

  const shareToTwitter = () => {
    if (generatedPost) {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(generatedPost.content)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  // Auto-generate when news item is selected
  useEffect(() => {
    if (selectedNewsItem && !generatedPost) {
      generatePost();
    }
  }, [selectedNewsItem]);

  if (!selectedNewsItem) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">✍️</div>
          <h2 className="text-2xl font-bold mb-2">Writing Assistant</h2>
          <p className="text-gray-400">Select a news item to start creating content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Writing Assistant</h1>
            <p className="text-gray-400">Creating content for: {selectedNewsItem.title}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6">
        {isGenerating ? (
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Generating Your Post</h3>
            <p className="text-gray-400">AI is crafting the perfect content for your audience...</p>
          </div>
        ) : generatedPost ? (
          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Generated Post</h3>
              <button
                onClick={copyToClipboard}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Copy to Clipboard
              </button>
            </div>
            <div className="bg-black rounded-lg p-4 mb-4 whitespace-pre-wrap">
              {generatedPost.content}
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <button
              onClick={generatePost}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Generate Post
            </button>
          </div>
        )}

        {/* Visual Suggestions */}
        {showVisualSuggestions && generatedPost && (
          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">📸 Visual Suggestions</h3>
            <p className="text-gray-400 mb-4">
              After the post is generated, an option should come to suggest what kind of visual should be uploaded with the post.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(visualTypes).map(([type, config]) => (
                <div
                  key={type}
                  className={`${config.color} rounded-lg p-4 text-white cursor-pointer transition-transform hover:scale-105 ${
                    generatedPost.visualSuggestion.type === type ? 'ring-2 ring-white' : ''
                  }`}
                >
                  <div className="text-2xl mb-2">{config.icon}</div>
                  <h4 className="font-semibold">{config.label}</h4>
                  <p className="text-sm opacity-90 mt-1">
                    {type === generatedPost.visualSuggestion.type 
                      ? generatedPost.visualSuggestion.description
                      : 'Click to select this visual type'
                    }
                  </p>
                </div>
              ))}
            </div>

            {generatedPost.visualSuggestion.reasoning && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">💡 Why this visual works:</h4>
                <p className="text-gray-300 text-sm">{generatedPost.visualSuggestion.reasoning}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center space-x-4">
            <button
              onClick={regeneratePost}
              className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Regenerate</span>
            </button>
            
            <div className="flex items-center space-x-2 bg-gray-700 rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">ICAI Compliance Check</span>
            </div>
          </div>

          {/* Middle */}
          <div className="flex items-center space-x-4">
            <button
              onClick={shareToLinkedIn}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <span className="text-sm font-bold">in</span>
              <span>LinkedIn</span>
            </button>
            
            <button
              onClick={shareToTwitter}
              className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>X</span>
            </button>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <select
                value={writingVoice}
                onChange={(e) => setWritingVoice(e.target.value)}
                className="bg-gray-700 text-white px-3 py-1 rounded text-sm border-none focus:ring-2 focus:ring-blue-500"
              >
                {writingVoices.map(voice => (
                  <option key={voice} value={voice}>{voice}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="bg-gray-700 text-white px-3 py-1 rounded text-sm border-none focus:ring-2 focus:ring-blue-500"
              >
                {targetAudiences.map(audience => (
                  <option key={audience} value={audience}>{audience}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
