'use client';

import React, { useState } from 'react';
import { ContentGenerator } from '../lib/content-generator';
import { UserPreferences } from '../lib/writing-voice-service';

interface ContentRepurposingProps {
  userPreferences: UserPreferences;
}

interface RepurposingOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  formats: string[];
}

export default function ContentRepurposing({ userPreferences }: ContentRepurposingProps) {
  const [originalContent, setOriginalContent] = useState('');
  const [originalFormat, setOriginalFormat] = useState('linkedin-post');
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [repurposedContent, setRepurposedContent] = useState<{ [format: string]: string }>({});
  const [isRepurposing, setIsRepurposing] = useState(false);

  const contentGenerator = new ContentGenerator();

  const repurposingOptions: RepurposingOption[] = [
    {
      id: 'social-media-pack',
      name: 'Social Media Pack',
      description: 'Convert to LinkedIn, Twitter, Instagram formats',
      icon: '📱',
      formats: ['linkedin-post', 'twitter-thread', 'instagram-caption']
    },
    {
      id: 'email-marketing',
      name: 'Email Marketing',
      description: 'Create newsletter and email campaign content',
      icon: '📧',
      formats: ['newsletter', 'email-sequence']
    },
    {
      id: 'blog-content',
      name: 'Blog Content',
      description: 'Expand into detailed blog posts and articles',
      icon: '📝',
      formats: ['blog-post', 'article', 'long-form-content']
    },
    {
      id: 'presentation',
      name: 'Presentation Materials',
      description: 'Create slides, talking points, and presentations',
      icon: '📊',
      formats: ['presentation-slides', 'talking-points', 'executive-summary']
    },
    {
      id: 'video-content',
      name: 'Video Scripts',
      description: 'Generate video scripts and captions',
      icon: '🎥',
      formats: ['video-script', 'youtube-description', 'video-captions']
    },
    {
      id: 'case-study',
      name: 'Case Study',
      description: 'Transform into detailed case studies',
      icon: '📋',
      formats: ['case-study', 'success-story', 'client-testimonial']
    }
  ];

  const formatDisplayNames: { [key: string]: string } = {
    'linkedin-post': 'LinkedIn Post',
    'twitter-thread': 'Twitter Thread',
    'instagram-caption': 'Instagram Caption',
    'newsletter': 'Newsletter Article',
    'email-sequence': 'Email Campaign',
    'blog-post': 'Blog Post',
    'article': 'Article',
    'long-form-content': 'Long-form Content',
    'presentation-slides': 'Presentation Slides',
    'talking-points': 'Talking Points',
    'executive-summary': 'Executive Summary',
    'video-script': 'Video Script',
    'youtube-description': 'YouTube Description',
    'video-captions': 'Video Captions',
    'case-study': 'Case Study',
    'success-story': 'Success Story',
    'client-testimonial': 'Client Testimonial'
  };

  const handleFormatToggle = (format: string) => {
    setSelectedFormats(prev => 
      prev.includes(format) 
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const handleRepurpose = async () => {
    if (!originalContent.trim() || selectedFormats.length === 0) return;

    setIsRepurposing(true);
    const results: { [format: string]: string } = {};

    try {
      for (const format of selectedFormats) {
        const repurposed = await contentGenerator.repurposeContent(
          originalContent,
          originalFormat,
          format,
          userPreferences
        );
        results[format] = repurposed;
      }
      
      setRepurposedContent(results);
    } catch (error) {
      console.error('Error repurposing content:', error);
    } finally {
      setIsRepurposing(false);
    }
  };

  const handleSaveContent = async (format: string, content: string) => {
    // Save to local storage or database
    const saved = JSON.parse(localStorage.getItem('repurposed_content') || '[]');
    saved.push({
      id: Date.now().toString(),
      format,
      content,
      originalFormat,
      createdAt: new Date().toISOString(),
      voice: userPreferences.writingVoice.name
    });
    localStorage.setItem('repurposed_content', JSON.stringify(saved));
    
    alert(`${formatDisplayNames[format]} saved successfully!`);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Original Content</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Original Format
            </label>
            <select
              value={originalFormat}
              onChange={(e) => setOriginalFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="linkedin-post">LinkedIn Post</option>
              <option value="blog-post">Blog Post</option>
              <option value="article">Article</option>
              <option value="newsletter">Newsletter</option>
              <option value="email">Email</option>
              <option value="case-study">Case Study</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content to Repurpose
            </label>
            <textarea
              value={originalContent}
              onChange={(e) => setOriginalContent(e.target.value)}
              placeholder="Paste your original content here..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Repurposing Options */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Choose Repurposing Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repurposingOptions.map(option => (
            <div key={option.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">{option.icon}</span>
                <h4 className="font-medium">{option.name}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">{option.description}</p>
              
              <div className="space-y-2">
                {option.formats.map(format => (
                  <label key={format} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFormats.includes(format)}
                      onChange={() => handleFormatToggle(format)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm">{formatDisplayNames[format]}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            onClick={handleRepurpose}
            disabled={!originalContent.trim() || selectedFormats.length === 0 || isRepurposing}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRepurposing ? 'Repurposing Content...' : `Repurpose into ${selectedFormats.length} Format${selectedFormats.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {Object.keys(repurposedContent).length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Repurposed Content</h3>
          
          <div className="space-y-6">
            {Object.entries(repurposedContent).map(([format, content]) => (
              <div key={format} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">
                    {formatDisplayNames[format]}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(content)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => handleSaveContent(format, content)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      Save
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-md p-3">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {content}
                  </pre>
                </div>

                {/* Format-specific enhancements */}
                {format === 'twitter-thread' && (
                  <div className="mt-2 text-xs text-gray-500">
                    💡 Tip: Each paragraph is designed to fit within Twitter's character limit
                  </div>
                )}
                
                {format === 'instagram-caption' && (
                  <div className="mt-2 text-xs text-gray-500">
                    💡 Tip: Optimized with line breaks and hashtags for Instagram
                  </div>
                )}
                
                {format === 'email-sequence' && (
                  <div className="mt-2 text-xs text-gray-500">
                    💡 Tip: Includes subject line and email-friendly formatting
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Templates Section */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Repurposing Templates</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickTemplate
            title="Long to Short"
            description="Convert long-form content into bite-sized social posts"
            formats={['linkedin-post', 'twitter-thread', 'instagram-caption']}
            originalContent={originalContent}
            onUse={(formats) => setSelectedFormats(formats)}
          />
          
          <QuickTemplate
            title="Short to Long"
            description="Expand short posts into detailed articles"
            formats={['blog-post', 'article', 'newsletter']}
            originalContent={originalContent}
            onUse={(formats) => setSelectedFormats(formats)}
          />
          
          <QuickTemplate
            title="Business Pack"
            description="Create professional business content package"
            formats={['executive-summary', 'presentation-slides', 'case-study']}
            originalContent={originalContent}
            onUse={(formats) => setSelectedFormats(formats)}
          />
          
          <QuickTemplate
            title="Social Media Suite"
            description="Complete social media content package"
            formats={['linkedin-post', 'twitter-thread', 'instagram-caption', 'video-script']}
            originalContent={originalContent}
            onUse={(formats) => setSelectedFormats(formats)}
          />
        </div>
      </div>
    </div>
  );
}

interface QuickTemplateProps {
  title: string;
  description: string;
  formats: string[];
  originalContent: string;
  onUse: (formats: string[]) => void;
}

function QuickTemplate({ title, description, formats, originalContent, onUse }: QuickTemplateProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium mb-2">{title}</h4>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <p className="text-xs text-gray-500 mb-3">
        Includes: {formats.join(', ')}
      </p>
      <button
        onClick={() => onUse(formats)}
        disabled={!originalContent.trim()}
        className="w-full bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
      >
        Use This Template
      </button>
    </div>
  );
}