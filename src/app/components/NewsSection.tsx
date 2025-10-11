'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: string;
  url: string;
}

interface NewsSectionProps {
  onWritePost: (newsItem: NewsItem) => void;
  onSeeMore: (newsItem: NewsItem) => void;
}

export default function NewsSection({ onWritePost, onSeeMore }: NewsSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSignedIn } = useUser();

  // Mock news data - in production, fetch from API
  const mockNews: NewsItem[] = [
    {
      id: '1',
      title: 'GST Rate Changes Effective January 2025',
      summary: 'New GST rates announced for various services affecting CA practices',
      source: 'Economic Times',
      publishedAt: '2025-01-15',
      category: 'Taxation',
      url: '#'
    },
    {
      id: '2',
      title: 'ICAI Updates Professional Standards',
      summary: 'Latest updates to auditing standards and compliance requirements',
      source: 'ICAI',
      publishedAt: '2025-01-14',
      category: 'Compliance',
      url: '#'
    },
    {
      id: '3',
      title: 'Digital Filing Mandatory from April 2025',
      summary: 'All tax returns must be filed digitally starting April 1st',
      source: 'Income Tax Dept',
      publishedAt: '2025-01-13',
      category: 'Technology',
      url: '#'
    },
    {
      id: '4',
      title: 'RBI Guidelines for Banking Compliance',
      summary: 'New guidelines for banks affecting CA audit procedures',
      source: 'RBI',
      publishedAt: '2025-01-12',
      category: 'Banking',
      url: '#'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setNewsItems(mockNews);
      setLoading(false);
    }, 1000);
  }, []);

  const handleMouseEnter = (itemId: string) => {
    setHoveredItem(itemId);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  if (!isSignedIn) {
    return null; // Don't show news section for non-authenticated users
  }

  return (
    <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-900 border-r border-gray-700 transition-all duration-300 z-40 ${
      isCollapsed ? 'w-12' : 'w-80'
    } ${isPinned ? 'shadow-2xl' : ''}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!isCollapsed && (
          <h3 className="text-white font-semibold text-lg">News Section</h3>
        )}
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePin}
            className={`p-2 rounded-lg transition-colors ${
              isPinned 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <svg className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* News Items */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {newsItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-800 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-gray-750 relative"
                  onMouseEnter={() => handleMouseEnter(item.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Hover Actions */}
                  {hoveredItem === item.id && (
                    <div className="absolute top-2 right-2 flex space-x-2 bg-gray-900 rounded-lg p-2 shadow-lg border border-gray-600">
                      <button
                        onClick={() => onWritePost(item)}
                        className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        title="Write Post"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <span>Write Post</span>
                      </button>
                      <button
                        onClick={() => onSeeMore(item)}
                        className="flex items-center space-x-1 bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        title="See More"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        <span>See More</span>
                      </button>
                    </div>
                  )}

                  {/* News Content */}
                  <div className="pr-20">
                    <h4 className="text-white font-medium text-sm mb-2 line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                      {item.summary}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="bg-gray-700 px-2 py-1 rounded">
                        {item.category}
                      </span>
                      <span>{item.source}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* See More Button */}
              <div className="text-center pt-4">
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                  See more →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed State Icons */}
      {isCollapsed && (
        <div className="p-4 space-y-4">
          <div className="text-center">
            <svg className="w-6 h-6 text-gray-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-center">
            <svg className="w-6 h-6 text-gray-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
