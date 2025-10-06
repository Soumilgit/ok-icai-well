'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import WritingVoiceQuestionnaire from '@/components/WritingVoiceQuestionnaire';
import ImageGenerator from '@/components/ImageGenerator';
import WebLinksComponent from '@/components/WebLinksComponent';

interface EnhancedContentHubProps {}

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: string;
  url: string;
  caImpact: 'high' | 'medium' | 'low';
}

interface ResearchResult {
  summary: string;
  keyPoints: string[];
  caImplications: string[];
  actionableItems: string[];
  sources: string[];
  postSuggestions: {
    angles: string[];
    hooks: string[];
    callToActions: string[];
  };
}

export default function EnhancedContentHub({}: EnhancedContentHubProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'discover' | 'creator' | 'voice-setup' | 'image-gen' | 'compliance'>('discover');
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [voiceType, setVoiceType] = useState<string>('Storyteller');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [complianceResult, setComplianceResult] = useState<any>(null);
  const [isPosting, setIsPosting] = useState(false);

  // Mock 2025 news data
  const MOCK_NEWS_2025: NewsArticle[] = [
    {
      id: '1',
      title: 'ICAI Introduces New AI-Assisted Audit Standards for 2025',
      summary: 'The Institute of Chartered Accountants of India has released comprehensive guidelines for AI-assisted auditing, digital asset verification, and automated compliance checking...',
      source: 'ICAI Official',
      publishedAt: '2025-01-28T10:30:00Z',
      category: 'auditing',
      url: '#',
      caImpact: 'high'
    },
    {
      id: '2',
      title: 'GST Council Announces Digital Token Integration for Q2 2025',
      summary: 'The GST Council has approved blockchain-based invoice verification and digital token rewards for compliant businesses, revolutionizing tax compliance...',
      source: 'GST Council',
      publishedAt: '2025-01-25T14:15:00Z',
      category: 'taxation',
      url: '#',
      caImpact: 'high'
    },
    {
      id: '3',
      title: 'New ESG Reporting Standards: Mandatory for Listed Companies from April 2025',
      summary: 'SEBI mandates enhanced Environmental, Social, and Governance reporting with AI-powered sustainability metrics verification...',
      source: 'SEBI',
      publishedAt: '2025-01-22T09:45:00Z',
      category: 'compliance',
      url: '#',
      caImpact: 'high'
    },
    {
      id: '4',
      title: 'Cryptocurrency Tax Guidelines 2025: New Clarity for CAs',
      summary: 'The Finance Ministry has issued detailed guidelines for cryptocurrency taxation, including DeFi protocols and NFT transactions...',
      source: 'Finance Ministry',
      publishedAt: '2025-01-20T16:20:00Z',
      category: 'taxation',
      url: '#',
      caImpact: 'medium'
    },
    {
      id: '5',
      title: 'RBI Launches CA-Verified Digital Banking Audit Framework',
      summary: 'Reserve Bank introduces mandatory CA verification for digital banking services, creating new revenue streams for audit firms...',
      source: 'RBI',
      publishedAt: '2025-01-18T11:30:00Z',
      category: 'auditing',
      url: '#',
      caImpact: 'high'
    }
  ];

  useEffect(() => {
    setNewsArticles(MOCK_NEWS_2025);
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/twitter/post-automation?userId=${user.id}`);
      const result = await response.json();
      if (result.success) {
        setUserProfile(result.data.profile);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const handleResearchNews = async (article: NewsArticle) => {
    setSelectedArticle(article);
    setIsResearching(true);
    
    try {
      const response = await fetch('/api/news/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsTitle: article.title,
          newsContent: article.summary,
          userId: user?.id,
          focus: 'ca-implications'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setResearchResult(result.data.research);
        setActiveTab('creator');
      }
    } catch (error) {
      console.error('Research failed:', error);
    } finally {
      setIsResearching(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !user) return;
    
    setIsPosting(true);
    try {
      const response = await fetch('/api/twitter/post-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: postContent,
          userId: user.id,
          topic: selectedArticle?.title || 'Professional post',
          voiceType,
          newsArticleId: selectedArticle?.id,
          researchContext: researchResult
        })
      });
      
      const result = await response.json();
      if (result.success) {
        // Show success message
        alert('Post created successfully!');
        setPostContent('');
      } else {
        alert(`Failed to create post: ${result.error}`);
      }
    } catch (error) {
      console.error('Post creation failed:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleComplianceCheck = async () => {
    if (!postContent.trim()) return;
    
    try {
      const response = await fetch('/api/icai/compliance-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: postContent,
          documentType: 'post',
          userId: user?.id || 'anonymous'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setComplianceResult(result.data);
      }
    } catch (error) {
      console.error('Compliance check failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'discover', label: '🔍 Discover', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
          { id: 'creator', label: '✍️ Creator Hub', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
          { id: 'voice-setup', label: '🎯 Voice Setup', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
          { id: 'image-gen', label: '🎨 Image Gen', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { id: 'compliance', label: '✅ ICAI Check', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Sections */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-4">📰 Latest CA News 2025</h3>
            <p className="text-gray-300 mb-6">Discover the latest developments in the CA profession and create engaging posts</p>
            
            <div className="grid gap-4">
              {newsArticles.map(article => (
                <div key={article.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-2">{article.title}</h4>
                      <p className="text-gray-300 text-sm mb-3">{article.summary}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>📅 {new Date(article.publishedAt).toLocaleDateString()}</span>
                        <span>📰 {article.source}</span>
                        <span className={`px-2 py-1 rounded-full ${
                          article.caImpact === 'high' ? 'bg-red-900/50 text-red-300' :
                          article.caImpact === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                          'bg-green-900/50 text-green-300'
                        }`}>
                          {article.caImpact.toUpperCase()} Impact
                        </span>
                      </div>
                      
                      {/* Web Links Component */}
                      <WebLinksComponent 
                        headline={article.title}
                        categories={[article.category]}
                        maxLinks={2}
                        className="mt-3"
                      />
                    </div>
                    
                    <button
                      onClick={() => handleResearchNews(article)}
                      disabled={isResearching}
                      className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isResearching ? '🔍 Researching...' : '📝 Create Post'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'creator' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-900/50 to-blue-900/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-4">✍️ AI-Powered Post Creator</h3>
            
            {selectedArticle && (
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-600">
                <h4 className="text-lg font-semibold text-white mb-2">📰 Based on: {selectedArticle.title}</h4>
                {researchResult && (
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-green-400 mb-2">🎯 Key Insights:</h5>
                      <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                        {researchResult.keyPoints.slice(0, 3).map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-blue-400 mb-2">🏛️ CA Implications:</h5>
                      <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                        {researchResult.caImplications.map((implication, index) => (
                          <li key={index}>{implication}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Writing Voice</label>
                  <select
                    value={voiceType}
                    onChange={(e) => setVoiceType(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Storyteller">📖 Storyteller - Personal narratives</option>
                    <option value="Opinionator">💭 Opinionator - Strong viewpoints</option>
                    <option value="Fact Presenter">📊 Fact Presenter - Data-driven</option>
                    <option value="Frameworker">🗂️ Frameworker - Step-by-step guides</option>
                    <option value="F-Bomber">⚡ F-Bomber - Urgent, direct tone</option>
                  </select>
                </div>
                
                {userProfile && (
                  <div className="w-48">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Profile Voice</label>
                    <div className="bg-gray-700 rounded-lg px-3 py-2 text-green-400 text-sm">
                      ✅ {userProfile.voiceType} (Preferred)
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Post Content</label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Write your professional insights... (AI will enhance based on research and your voice)"
                  rows={6}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-sm ${postContent.length > 280 ? 'text-red-400' : 'text-gray-400'}`}>
                    {postContent.length}/280 characters
                  </span>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={handleComplianceCheck}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                    >
                      ✅ Check ICAI
                    </button>
                    <button
                      onClick={handleCreatePost}
                      disabled={isPosting || !postContent.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
                    >
                      {isPosting ? '⏳ Creating...' : '🚀 Create Post'}
                    </button>
                  </div>
                </div>
              </div>
              
              {complianceResult && (
                <div className={`rounded-lg p-4 border ${
                  complianceResult.report.summary.riskLevel === 'high' ? 'bg-red-900/20 border-red-600' :
                  complianceResult.report.summary.riskLevel === 'medium' ? 'bg-yellow-900/20 border-yellow-600' :
                  'bg-green-900/20 border-green-600'
                }`}>
                  <h5 className="font-medium text-white mb-2">
                    ICAI Compliance Check - Grade: {complianceResult.report.summary.overallGrade}
                  </h5>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>Compliance Score: {complianceResult.compliance.score}/100</p>
                    <p>Originality Score: {complianceResult.plagiarism.originalityScore}/100</p>
                    {complianceResult.recommendations.length > 0 && (
                      <div>
                        <p className="font-medium text-white mt-2">Recommendations:</p>
                        <ul className="list-disc list-inside">
                          {complianceResult.recommendations.slice(0, 3).map((rec: string, index: number) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'voice-setup' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-4">🎯 Writing Voice Setup</h3>
            <p className="text-gray-300 mb-6">Complete the 10-question quiz to personalize your content generation</p>
            <WritingVoiceQuestionnaire />
          </div>
        </div>
      )}

      {activeTab === 'image-gen' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-pink-900/50 to-purple-900/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-4">🎨 AI Image Generation</h3>
            <p className="text-gray-300 mb-6">Generate professional images for your posts and presentations</p>
            <ImageGenerator />
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-red-900/50 to-orange-900/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-4">✅ ICAI Compliance Center</h3>
            <p className="text-gray-300 mb-6">Check compliance and plagiarism for your content and pitch decks</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Document Type</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mb-4">
                  <option value="post">Social Media Post</option>
                  <option value="pitch-deck">Pitch Deck</option>
                  <option value="presentation">Presentation</option>
                  <option value="report">Professional Report</option>
                  <option value="article">Article/Blog</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content to Check</label>
                <textarea
                  placeholder="Paste your content here for ICAI compliance and plagiarism checking..."
                  rows={8}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                />
              </div>
              
              <div className="flex space-x-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                  🔍 Check Compliance
                </button>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium">
                  📄 Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}