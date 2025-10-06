'use client';

import React, { useState, useEffect } from 'react';

interface WebLink {
  url: string;
  title: string;
  source: string;
}

interface WebLinksComponentProps {
  headline: string;
  categories?: string[];
  maxLinks?: number;
  showAllButton?: boolean;
  className?: string;
}

export default function WebLinksComponent({ 
  headline, 
  categories = [], 
  maxLinks = 2, 
  showAllButton = true, 
  className = "" 
}: WebLinksComponentProps) {
  const [links, setLinks] = useState<WebLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchWebLinks();
  }, [headline, categories]);

  const fetchWebLinks = async () => {
    if (!headline.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: headline,
          categories: categories,
          maxResults: 5
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.results) {
          setLinks(result.data.results);
        }
      } else {
        // Fallback to static links
        setLinks(generateFallbackLinks(headline, categories));
      }
    } catch (error) {
      console.log('Using fallback links');
      setLinks(generateFallbackLinks(headline, categories));
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackLinks = (title: string, categories: string[]): WebLink[] => {
    const fallbackLinks: WebLink[] = [];
    const titleLower = title.toLowerCase();

    // RBI related links
    if (titleLower.includes('rbi') || categories.includes('Banking')) {
      fallbackLinks.push({
        url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx',
        title: 'RBI Latest Notifications',
        source: 'Reserve Bank of India'
      });
    }

    // GST related links
    if (titleLower.includes('gst') || categories.includes('GST')) {
      fallbackLinks.push({
        url: 'https://www.gst.gov.in/newsandupdates',
        title: 'GST Portal Updates',
        source: 'GST Official Portal'
      });
    }

    // ICAI related links
    if (titleLower.includes('icai') || categories.includes('ICAI')) {
      fallbackLinks.push({
        url: 'https://www.icai.org/new_category.html?c_id=302',
        title: 'ICAI Latest Updates',
        source: 'ICAI Official'
      });
    }

    // Income Tax related links
    if (titleLower.includes('tax') || categories.includes('Taxation')) {
      fallbackLinks.push({
        url: 'https://www.incometax.gov.in/iec/foportal/news-and-updates',
        title: 'Income Tax Updates',
        source: 'Income Tax Department'
      });
    }

    // Corporate related links
    if (titleLower.includes('corporate') || categories.includes('Corporate')) {
      fallbackLinks.push({
        url: 'https://www.mca.gov.in/content/mca/global/en/mca/master-data/md-news.html',
        title: 'MCA Latest News',
        source: 'Ministry of Corporate Affairs'
      });
    }

    // SEBI related links
    if (titleLower.includes('sebi') || categories.includes('Securities')) {
      fallbackLinks.push({
        url: 'https://www.sebi.gov.in/legal/circulars',
        title: 'SEBI Circulars',
        source: 'SEBI Official'
      });
    }

    // Default professional sources
    if (fallbackLinks.length === 0) {
      fallbackLinks.push({
        url: 'https://economictimes.indiatimes.com/topic/chartered-accountant',
        title: 'Economic Times - CA News',
        source: 'Economic Times'
      });
    }

    return fallbackLinks.slice(0, 5);
  };

  const displayedLinks = showAll ? links : links.slice(0, maxLinks);
  const hasMoreLinks = links.length > maxLinks;

  if (loading) {
    return (
      <div className={`border-t border-white/10 pt-2 ${className}`}>
        <p className="text-xs text-gray-400 mb-1">Loading links...</p>
        <div className="flex gap-1">
          <div className="w-16 h-6 bg-gray-600 rounded-full animate-pulse"></div>
          <div className="w-20 h-6 bg-gray-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (links.length === 0) return null;

  return (
    <div className={`border-t border-white/10 pt-2 ${className}`}>
      <p className="text-xs text-gray-400 mb-1">Related Links:</p>
      <div className="flex flex-wrap gap-1">
        {displayedLinks.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-2 py-1 text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-full transition-colors"
            title={`${link.source} - ${link.title}`}
          >
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
            {link.title.length > 15 ? link.title.substring(0, 15) + '...' : link.title}
          </a>
        ))}
        
        {hasMoreLinks && showAllButton && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-full bg-blue-600/10 hover:bg-blue-600/20 transition-colors"
          >
            +{links.length - maxLinks} more
          </button>
        )}
        
        {showAll && hasMoreLinks && (
          <button
            onClick={() => setShowAll(false)}
            className="text-xs text-gray-400 hover:text-gray-300 px-2 py-1 rounded-full bg-gray-600/10 hover:bg-gray-600/20 transition-colors"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
}