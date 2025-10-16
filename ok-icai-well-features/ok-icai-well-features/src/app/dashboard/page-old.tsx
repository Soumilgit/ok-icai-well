'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth, SignOutButton } from '@clerk/nextjs';
import Image from 'next/image';

interface DashboardData {
  overview: {
    today: {
      newsArticles: number;
      generatedContent: number;
      notifications: number;
    };
    weekly: {
      newsArticles: number;
      generatedContent: number;
    };
    total: {
      newsArticles: number;
      generatedContent: number;
      notifications: number;
    };
  };
  recent: {
    news: Array<{
      _id: string;
      title: string;
      source: string;
      publishedAt: string;
      category: string;
      impact: string;
      tags: string[];
    }>;
    content: Array<{
      _id: string;
      title: string;
      type: string;
      createdAt: string;
      status: string;
      metadata: {
        wordCount: number;
        readingTime: number;
        seoScore?: number;
      };
    }>;
  };
  statistics: {
    contentByType: Array<{
      _id: string;
      count: number;
      latest: string;
    }>;
    newsBySource: Array<{
      _id: string;
      count: number;
      latest: string;
    }>;
    topCategories: Array<{
      _id: string;
      count: number;
    }>;
    contentPerformance: Array<{
      _id: string;
      avgSEOScore: number;
      avgWordCount: number;
      count: number;
    }>;
  };
  automation: any;
  notifications: any;
  lastUpdated: string;
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'content' | 'automation'>('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const runAutomation = async (task: string, topic?: string, difficulty?: string) => {
    try {
      const response = await fetch('/api/automation/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task, topic, difficulty }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(result.message);
        fetchDashboardData(); // Refresh data
      } else {
        alert(result.error || 'Failed to run automation');
      }
    } catch (err) {
      alert('Failed to run automation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button 
            onClick={fetchDashboardData}
            className="bg-white text-black px-6 py-3 rounded-full hover:bg-gray-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">CA Law Portal Dashboard</h1>
            <p className="text-gray-400">
              Automated news collection, AI content generation, and compliance monitoring
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {new Date(dashboardData.lastUpdated).toLocaleString()}
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 border-b border-gray-800">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'news', label: 'News Articles' },
              { id: 'content', label: 'Generated Content' },
              { id: 'automation', label: 'Automation' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-white text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-900 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Today's News</h3>
                  <p className="text-3xl font-bold text-white">{dashboardData.overview.today.newsArticles}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {dashboardData.overview.weekly.newsArticles} this week
                  </p>
                </div>
                
                <div className="bg-gray-900 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Generated Content</h3>
                  <p className="text-3xl font-bold text-white">{dashboardData.overview.today.generatedContent}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {dashboardData.overview.weekly.generatedContent} this week
                  </p>
                </div>
                
                <div className="bg-gray-900 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Notifications Sent</h3>
                  <p className="text-3xl font-bold text-white">{dashboardData.overview.today.notifications}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {dashboardData.overview.total.notifications} total
                  </p>
                </div>
                
                <div className="bg-gray-900 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Total Articles</h3>
                  <p className="text-3xl font-bold text-white">{dashboardData.overview.total.newsArticles}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {dashboardData.overview.total.generatedContent} pieces of content
                  </p>
                </div>
              </div>

              {/* Top Categories */}
              <div className="bg-gray-900 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {dashboardData.statistics.topCategories.map((category) => (
                    <div key={category._id} className="text-center">
                      <p className="text-2xl font-bold text-white">{category.count}</p>
                      <p className="text-sm text-gray-400 capitalize">{category._id}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Performance */}
              <div className="bg-gray-900 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Content Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Count</th>
                        <th className="text-left py-2">Avg SEO Score</th>
                        <th className="text-left py-2">Avg Word Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.statistics.contentPerformance.map((perf) => (
                        <tr key={perf._id} className="border-b border-gray-800">
                          <td className="py-2 capitalize">{perf._id.replace('_', ' ')}</td>
                          <td className="py-2">{perf.count}</td>
                          <td className="py-2">
                            {perf.avgSEOScore ? Math.round(perf.avgSEOScore) : 'N/A'}
                          </td>
                          <td className="py-2">{Math.round(perf.avgWordCount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* News Tab */}
          {activeTab === 'news' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Recent News Articles</h2>
                <button
                  onClick={() => runAutomation('news_collection')}
                  className="bg-white text-black px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  Collect News
                </button>
              </div>
              
              <div className="space-y-4">
                {dashboardData.recent.news.map((article) => (
                  <div key={article._id} className="bg-gray-900 p-6 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{article.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        article.impact === 'high' ? 'bg-red-600' :
                        article.impact === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                      }`}>
                        {article.impact}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                      <span>Source: {article.source}</span>
                      <span>Category: {article.category}</span>
                      <span>Published: {new Date(article.publishedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag) => (
                        <span key={tag} className="bg-gray-800 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Generated Content</h2>
                <button
                  onClick={() => runAutomation('content_generation')}
                  className="bg-white text-black px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  Generate Content
                </button>
              </div>
              
              <div className="space-y-4">
                {dashboardData.recent.content.map((content) => (
                  <div key={content._id} className="bg-gray-900 p-6 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{content.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        content.status === 'published' ? 'bg-green-600' :
                        content.status === 'reviewed' ? 'bg-blue-600' : 'bg-yellow-600'
                      }`}>
                        {content.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                      <span>Type: {content.type.replace('_', ' ')}</span>
                      <span>Words: {content.metadata.wordCount}</span>
                      <span>Reading Time: {content.metadata.readingTime} min</span>
                      {content.metadata.seoScore && (
                        <span>SEO Score: {Math.round(content.metadata.seoScore)}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      Created: {new Date(content.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Automation Tab */}
          {activeTab === 'automation' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Automation Controls</h2>
              
              {/* Automation Status */}
              <div className="bg-gray-900 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Current Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                      {dashboardData.automation.newsCollection.articlesToday}
                    </p>
                    <p className="text-sm text-gray-400">Articles Today</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                      {dashboardData.automation.contentGeneration.contentToday}
                    </p>
                    <p className="text-sm text-gray-400">Content Generated Today</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                      {dashboardData.automation.notifications.sent}
                    </p>
                    <p className="text-sm text-gray-400">Notifications Sent</p>
                  </div>
                </div>
              </div>

              {/* Manual Controls */}
              <div className="bg-gray-900 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Manual Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => runAutomation('news_collection')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Collect News
                  </button>
                  <button
                    onClick={() => runAutomation('content_generation')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Generate Content
                  </button>
                  <button
                    onClick={() => runAutomation('notifications')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Send Notifications
                  </button>
                  <button
                    onClick={() => runAutomation('full_pipeline')}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Run Full Pipeline
                  </button>
                </div>
              </div>

              {/* Exam Generation */}
              <div className="bg-gray-900 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Exam Generation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['tax-reform', 'gst', 'compliance'].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => runAutomation('exam_generation', topic, 'intermediate')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors capitalize"
                    >
                      Generate {topic} Exam
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
