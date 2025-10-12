'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import NewsSection from '@/app/components/NewsSection';
import WritingAssistant from '@/app/components/WritingAssistant';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: string;
  url: string;
}

export default function ContentWriterPage() {
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
  const [showWritingAssistant, setShowWritingAssistant] = useState(false);
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const handleWritePost = (newsItem: NewsItem) => {
    setSelectedNewsItem(newsItem);
    setShowWritingAssistant(true);
  };

  const handleSeeMore = (newsItem: NewsItem) => {
    // Open full news article in new tab
    window.open(newsItem.url, '_blank');
  };

  const handleCloseWritingAssistant = () => {
    setShowWritingAssistant(false);
    setSelectedNewsItem(null);
  };

  // Redirect to sign-in if not authenticated
  if (isLoaded && !isSignedIn) {
    router.push('/sign-in');
    return null;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* News Section - Left Sidebar */}
      <NewsSection 
        onWritePost={handleWritePost}
        onSeeMore={handleSeeMore}
      />
      
      {/* Main Content Area - Writing Assistant */}
      <div className={`transition-all duration-300 ${showWritingAssistant ? 'ml-80' : 'ml-80'}`}>
        <WritingAssistant 
          selectedNewsItem={selectedNewsItem}
          onClose={handleCloseWritingAssistant}
        />
      </div>
    </div>
  );
}
