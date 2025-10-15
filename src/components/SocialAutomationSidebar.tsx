'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Linkedin, Twitter, Bot, Settings, Sparkles, Send, Copy, RefreshCw } from 'lucide-react';
import { WritingVoicePromptService } from '../lib/writing-voice-prompts';

interface SocialAutomationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GeneratedContent {
  linkedin?: {
    content: string;
    hashtags: string[];
    metadata: any;
  };
  twitter?: {
    content: string;
    hashtags: string[];
    characterCount: number;
    metadata: any;
  };
}

const writingVoices = [
  { id: 'storyteller', name: 'Storyteller', description: 'Personal narratives with emotional connection' },
  { id: 'opinionator', name: 'Opinionator', description: 'Strong viewpoints and thought leadership' },
  { id: 'fact-presenter', name: 'Fact Presenter', description: 'Objective information with clear explanations' },
  { id: 'frameworker', name: 'Frameworker', description: 'Structured guidance with actionable frameworks' },
  { id: 'f-bomber', name: 'F-Bomber', description: 'Urgent, direct communication with strong warnings' }
];

export default function SocialAutomationSidebar({ isOpen, onClose }: SocialAutomationSidebarProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('storyteller');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({});
  const [activeTab, setActiveTab] = useState<'linkedin' | 'twitter'>('linkedin');
  const [copySuccess, setCopySuccess] = useState<string>('');
  const { user } = useUser();

  const writingVoiceService = new WritingVoicePromptService();

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  const generateContent = async (platform: 'linkedin' | 'twitter' | 'both' = 'both') => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    const newContent: GeneratedContent = {};

    try {
      if (platform === 'linkedin' || platform === 'both') {
        const linkedinResponse = await fetch('/api/social/linkedin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt,
            writingVoice: selectedVoice,
            contentType: 'linkedin',
            wordCount: '150-250'
          })
        });

        if (linkedinResponse.ok) {
          const linkedinData = await linkedinResponse.json();
          if (linkedinData.success) {
            newContent.linkedin = {
              content: linkedinData.content,
              hashtags: linkedinData.hashtags || [],
              metadata: linkedinData.metadata
            };
          }
        }
      }

      if (platform === 'twitter' || platform === 'both') {
        const twitterResponse = await fetch('/api/social/twitter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt,
            writingVoice: selectedVoice,
            contentType: 'twitter',
            wordCount: '50-100'
          })
        });

        if (twitterResponse.ok) {
          const twitterData = await twitterResponse.json();
          if (twitterData.success) {
            newContent.twitter = {
              content: twitterData.content,
              hashtags: twitterData.hashtags || [],
              characterCount: twitterData.characterCount,
              metadata: twitterData.metadata
            };
          }
        }
      }

      setGeneratedContent(newContent);
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (content: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(`${platform} content copied!`);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const postToLinkedIn = (content: string) => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent('CA Professional Content')}&summary=${encodeURIComponent(content)}`;
    window.open(linkedinUrl, '_blank');
  };

  const postToTwitter = (content: string) => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
    window.open(twitterUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      {/* Sidebar */}
      <div className="relative ml-auto w-full max-w-2xl bg-white shadow-2xl overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bot className="w-8 h-8" />
                <div>
                  <h2 className="text-xl font-bold">Social Media Automation</h2>
                  <p className="text-blue-100 text-sm">AI-powered LinkedIn & Twitter content</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Writing Voice Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Sparkles className="w-4 h-4 inline mr-2" />
                Writing Voice
              </label>
              <div className="grid gap-2">
                {writingVoices.map((voice) => (
                  <label key={voice.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="writingVoice"
                      value={voice.id}
                      checked={selectedVoice === voice.id}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{voice.name}</div>
                      <div className="text-sm text-gray-500">{voice.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Content Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Content Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the content you want to create... e.g., 'Write about the new GST compliance requirements for small businesses'"
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Generate Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => generateContent('linkedin')}
                disabled={isGenerating || !prompt.trim()}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </button>
              <button
                onClick={() => generateContent('twitter')}
                disabled={isGenerating || !prompt.trim()}
                className="flex items-center justify-center space-x-2 bg-sky-500 text-white px-4 py-3 rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Twitter className="w-4 h-4" />
                <span>Twitter</span>
              </button>
              <button
                onClick={() => generateContent('both')}
                disabled={isGenerating || !prompt.trim()}
                className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
                <span>Both</span>
              </button>
            </div>

            {/* Generated Content Display */}
            {(generatedContent.linkedin || generatedContent.twitter) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Generated Content</h3>
                
                {/* Platform Tabs */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  {generatedContent.linkedin && (
                    <button
                      onClick={() => setActiveTab('linkedin')}
                      className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                        activeTab === 'linkedin' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Linkedin className="w-4 h-4" />
                      <span>LinkedIn</span>
                    </button>
                  )}
                  {generatedContent.twitter && (
                    <button
                      onClick={() => setActiveTab('twitter')}
                      className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                        activeTab === 'twitter' ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Twitter className="w-4 h-4" />
                      <span>Twitter</span>
                    </button>
                  )}
                </div>

                {/* Content Display */}
                {activeTab === 'linkedin' && generatedContent.linkedin && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className="bg-white rounded-lg p-4 border">
                      <p className="text-gray-900 whitespace-pre-wrap">{generatedContent.linkedin.content}</p>
                      {generatedContent.linkedin.hashtags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {generatedContent.linkedin.hashtags.map((hashtag, index) => (
                            <span key={index} className="text-blue-600 text-sm">
                              {hashtag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => copyToClipboard(generatedContent.linkedin!.content, 'LinkedIn')}
                        className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => postToLinkedIn(generatedContent.linkedin!.content)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        <span>Post to LinkedIn</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'twitter' && generatedContent.twitter && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className="bg-white rounded-lg p-4 border">
                      <p className="text-gray-900 whitespace-pre-wrap">{generatedContent.twitter.content}</p>
                      <div className="mt-3 flex justify-between items-center text-sm text-gray-500">
                        <span>Characters: {generatedContent.twitter.characterCount}/280</span>
                        {generatedContent.twitter.hashtags.length > 0 && (
                          <div className="flex space-x-2">
                            {generatedContent.twitter.hashtags.map((hashtag, index) => (
                              <span key={index} className="text-sky-600">
                                {hashtag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => copyToClipboard(generatedContent.twitter!.content, 'Twitter')}
                        className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => postToTwitter(generatedContent.twitter!.content)}
                        className="flex items-center space-x-2 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        <span>Post to Twitter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Success Message */}
            {copySuccess && (
              <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                {copySuccess}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}