'use client';

import React, { useState, useEffect } from 'react';
import WebLinksComponent from '@/components/WebLinksComponent';
import PerplexityNewsModal from '@/components/PerplexityNewsModal';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: 'taxation' | 'auditing' | 'compliance' | 'regulations' | 'technology' | 'industry';
  url: string;
  relevanceScore: number;
  caImpact: 'high' | 'medium' | 'low';
  tags: string[];
}

interface DiscoverFeedProps {}

const MOCK_NEWS_2025: NewsArticle[] = [
  {
    id: '1',
    title: 'ICAI Introduces New Audit Standards for Digital Assets in 2025',
    summary: 'The Institute of Chartered Accountants of India has released comprehensive guidelines for auditing cryptocurrency and digital asset transactions...',
    source: 'ICAI Official',
    publishedAt: '2025-01-20T10:30:00Z',
    category: 'auditing',
    url: '#',
    relevanceScore: 95,
    caImpact: 'high',
    tags: ['audit standards', 'digital assets', 'cryptocurrency', 'ICAI guidelines']
  },
  {
    id: '2',
    title: 'GST Council Approves New E-invoicing Thresholds for 2025-26',
    summary: 'The GST Council has reduced the e-invoicing threshold to ₹20 crores, affecting thousands of businesses across India...',
    source: 'GST Council',
    publishedAt: '2025-01-18T14:15:00Z',
    category: 'taxation',
    url: '#',
    relevanceScore: 92,
    caImpact: 'high',
    tags: ['GST', 'e-invoicing', 'compliance', 'business impact']
  },
  {
    id: '3',
    title: 'AI-Powered Tax Filing: New Requirements for CA Firms',
    summary: 'The Income Tax Department has announced new requirements for CA firms using AI tools for tax preparation and filing...',
    source: 'Income Tax Dept',
    publishedAt: '2025-01-15T09:45:00Z',
    category: 'technology',
    url: '#',
    relevanceScore: 88,
    caImpact: 'medium',
    tags: ['AI', 'tax filing', 'technology', 'CA firms']
  },
  {
    id: '4',
    title: 'Corporate Law Changes: New Compliance Requirements for FY 2025-26',
    summary: 'MCA introduces enhanced disclosure requirements for corporate governance and sustainability reporting...',
    source: 'MCA',
    publishedAt: '2025-01-12T16:20:00Z',
    category: 'compliance',
    url: '#',
    relevanceScore: 85,
    caImpact: 'high',
    tags: ['corporate law', 'compliance', 'governance', 'sustainability']
  },
  {
    id: '5',
    title: 'RBI Guidelines on Banking Audits: What CAs Need to Know',
    summary: 'Reserve Bank of India has updated guidelines for statutory audits of banks, focusing on digital banking risks...',
    source: 'RBI',
    publishedAt: '2025-01-10T11:30:00Z',
    category: 'auditing',
    url: '#',
    relevanceScore: 82,
    caImpact: 'medium',
    tags: ['RBI', 'banking audit', 'statutory audit', 'digital banking']
  },
  {
    id: '6',
    title: 'International Tax Reform: Impact on Indian CAs',
    summary: 'OECD Pillar Two implementation in India - implications for multinational corporations and their advisors...',
    source: 'OECD India',
    publishedAt: '2025-01-08T13:45:00Z',
    category: 'taxation',
    url: '#',
    relevanceScore: 78,
    caImpact: 'high',
    tags: ['international tax', 'OECD', 'multinational', 'tax reform']
  }
];

export default function DiscoverFeed({}: DiscoverFeedProps) {
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingPost, setCreatingPost] = useState<string | null>(null);
  const [researchingArticle, setResearchingArticle] = useState<string | null>(null);
  
  // Perplexity News Modal state
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [selectedNewsForModal, setSelectedNewsForModal] = useState<NewsArticle | null>(null);

  useEffect(() => {
    // Load news articles (in production, fetch from API)
    setNewsArticles(MOCK_NEWS_2025);
  }, []);

  const categories = [
    { key: 'all', label: 'All News', icon: '📰' },
    { key: 'taxation', label: 'Taxation', icon: '💰' },
    { key: 'auditing', label: 'Auditing', icon: '' },
    { key: 'compliance', label: 'Compliance', icon: '📋' },
    { key: 'regulations', label: 'Regulations', icon: '⚖️' },
    { key: 'technology', label: 'Technology', icon: '💻' },
    { key: 'industry', label: 'Industry', icon: '🏢' }
  ];

  const filteredArticles = newsArticles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const handleCreatePost = async (article: NewsArticle) => {
    setCreatingPost(article.id);
    try {
      // Research the article content using Perplexity-style AI
      setResearchingArticle(article.id);
      
      // Simulate AI research process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate post content based on article
      const postContent = await generatePostFromArticle(article);
      
      // Open unified content creator with pre-filled content
      // In production, this would integrate with the existing content creator
      const response = confirm(`Generated post content:\n\n${postContent}\n\nWould you like to proceed to the content creator?`);
      
      if (response) {
        // Navigate to unified content creator with pre-filled data
        window.dispatchEvent(new CustomEvent('openContentCreator', {
          detail: {
            topic: article.title,
            preGeneratedContent: postContent,
            sourceArticle: article
          }
        }));
      }
      
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post. Please try again.');
    } finally {
      setCreatingPost(null);
      setResearchingArticle(null);
    }
  };

  const generatePostFromArticle = async (article: NewsArticle): Promise<string> => {
    // Simulate AI research and content generation
    const voiceStyles = {
      'taxation': 'Fact Presenter',
      'auditing': 'Frameworker', 
      'compliance': 'F-Bomber',
      'regulations': 'Opinionator',
      'technology': 'Storyteller',
      'industry': 'Frameworker'
    };

    const voice = voiceStyles[article.category] || 'Fact Presenter';
    
    let content = '';
    
    switch (voice) {
      case 'Fact Presenter':
        content = `🚨 Key Update: ${article.title}

${article.summary}

What CAs need to know:
• Review current practices against new guidelines
• Update client advisory processes
• Ensure compliance documentation is current

Source: ${article.source}
Tags: ${article.tags.join(', ')}

#CharterAccountant #ICAI #${article.category.charAt(0).toUpperCase() + article.category.slice(1)}`;
        break;
        
      case 'Frameworker':
        content = `📋 New Framework Alert: ${article.title}

${article.summary}

My recommended action plan:
1️⃣ Assess current processes
2️⃣ Identify gaps with new requirements  
3️⃣ Update procedures and documentation
4️⃣ Train team on changes
5️⃣ Implement monitoring systems

This affects all CAs working in ${article.category}. Save this post for reference.

#CAFramework #${article.category.charAt(0).toUpperCase() + article.category.slice(1)} #ProfessionalDevelopment`;
        break;
        
      case 'F-Bomber':
        content = `⚠️ URGENT: ${article.title}

${article.summary}

CAs, you CANNOT ignore this update!

Action required NOW:
❌ Don't wait for "clarifications"
❌ Don't assume existing processes are sufficient
✅ Review ALL affected client files
✅ Update compliance checklists immediately

The impact is ${article.caImpact.toUpperCase()}. Act today!

#UrgentUpdate #CACompliance #${article.category.charAt(0).toUpperCase() + article.category.slice(1)}`;
        break;
        
      case 'Opinionator':
        content = `💭 My take on: ${article.title}

${article.summary}

Here's what most CAs are missing:

This isn't just another regulatory update. It's a fundamental shift in how we approach ${article.category}.

The profession needs to embrace these changes, not resist them. Those who adapt quickly will lead the market.

What's your perspective? Are we prepared for this shift?

#CAOpinion #IndustryInsight #${article.category.charAt(0).toUpperCase() + article.category.slice(1)}`;
        break;
        
      case 'Storyteller':
        content = `📖 Story time: ${article.title}

${article.summary}

This reminds me of when I first encountered similar changes in my practice. Initially overwhelming, but ultimately transformative.

The key lesson? Change is the only constant in our profession. Those who stay curious and adapt thrive.

How are you preparing for this shift? Share your experience below.

#CAJourney #ProfessionalGrowth #${article.category.charAt(0).toUpperCase() + article.category.slice(1)}`;
        break;
    }
    
    return content;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getImpactBadge = (impact: string) => {
    const badges = {
      'high': 'bg-red-600 text-red-100',
      'medium': 'bg-yellow-600 text-yellow-100', 
      'low': 'bg-green-600 text-green-100'
    };
    return badges[impact as keyof typeof badges] || badges.medium;
  };

  const handleNewsClick = (article: NewsArticle) => {
    setSelectedNewsForModal(article);
    setIsNewsModalOpen(true);
  };

  const closeNewsModal = () => {
    setIsNewsModalOpen(false);
    setSelectedNewsForModal(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">Discover Feed</h1>
          <p className="text-xl text-green-100">
            Latest 2025 news affecting CAs with instant AI-powered post creation
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-600 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search news articles..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                    selectedCategory === category.key
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* News Articles */}
        <div className="grid gap-6">
          {filteredArticles.map(article => (
            <div 
              key={article.id} 
              onClick={() => handleNewsClick(article)}
              className="bg-gray-800 rounded-2xl p-6 border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer hover:bg-gray-700"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactBadge(article.caImpact)}`}>
                      {article.caImpact.toUpperCase()} IMPACT
                    </span>
                    <span className="text-gray-400 text-sm">•</span>
                    <span className="text-gray-400 text-sm">{article.source}</span>
                    <span className="text-gray-400 text-sm">•</span>
                    <span className="text-gray-400 text-sm">{formatDate(article.publishedAt)}</span>
                  </div>
                  
                  <h2 className="text-xl font-bold text-white mb-2 hover:text-blue-400 transition-colors cursor-pointer">
                    {article.title}
                  </h2>
                  
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {article.summary}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.map(tag => (
                      <span key={tag} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Web Links Component for News Articles */}
                  <WebLinksComponent 
                    headline={article.title}
                    categories={[article.category]}
                    maxLinks={2}
                    className="mb-4"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Relevance: {article.relevanceScore}%</span>
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${article.relevanceScore}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNewsClick(article);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    🤖 AI Summary
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(article.url, '_blank');
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
                  >
                    📄 Read Full Article
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreatePost(article);
                    }}
                    disabled={creatingPost === article.id}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 rounded-lg transition-all font-medium flex items-center"
                  >
                    {creatingPost === article.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {researchingArticle === article.id ? 'Researching...' : 'Creating Post...'}
                      </>
                    ) : (
                      <>
                        ✨ Create Post
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No articles found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or category filter</p>
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-12 bg-gray-800 rounded-2xl p-6 border border-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">{newsArticles.length}</div>
              <div className="text-sm text-gray-400">Total Articles</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {newsArticles.filter(a => a.caImpact === 'high').length}
              </div>
              <div className="text-sm text-gray-400">High Impact News</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">2025</div>
              <div className="text-sm text-gray-400">Latest Year Coverage</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Perplexity News Modal */}
      <PerplexityNewsModal
        isOpen={isNewsModalOpen}
        onClose={closeNewsModal}
        newsItem={selectedNewsForModal}
      />
    </div>
  );
}