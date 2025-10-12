'use client';

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Copy, Share2, BookOpen, TrendingUp, FileText } from 'lucide-react';

interface NewsReference {
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

interface PerplexitySummary {
  summary: string;
  keyPoints: string[];
  caImplications: string[];
  references: NewsReference[];
  followUpQuestions: string[];
}

interface PerplexityNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsItem: {
    id: string;
    title: string;
    content?: string;
    summary?: string;
    source: string;
    publishedAt: string;
    category?: string;
    categories?: string[];
    url?: string;
  } | null;
}

export default function PerplexityNewsModal({ isOpen, onClose, newsItem }: PerplexityNewsModalProps) {
  const [summary, setSummary] = useState<PerplexitySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'linkedin' | 'twitter' | 'article'>('linkedin');
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  useEffect(() => {
    if (isOpen && newsItem) {
      generateSummary();
    }
  }, [isOpen, newsItem]);

  const generateSummary = async () => {
    if (!newsItem) return;
    
    setLoading(true);
    try {
      // Call Perplexity API for AI summary with specific news analysis
      const newsContent = newsItem.content || newsItem.summary || '';
      const fullContext = `${newsItem.title}\n\n${newsContent}`;
      
      const response = await fetch('/api/perplexity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `CRITICAL: Analyze this SPECIFIC news article for CA professionals in India. Do NOT provide generic information.

NEWS HEADLINE: "${newsItem.title}"
NEWS CONTENT: "${newsContent}"
SOURCE: ${newsItem.source}
CATEGORY: ${newsItem.category || 'Professional'}

REQUIRED ANALYSIS:
1. What are the SPECIFIC implications of this exact news for CA professionals?
2. What immediate actions should CAs take based on THIS news?
3. How does THIS specific development affect audit procedures, compliance, or practice management?
4. What are the regulatory/professional body references related to THIS news?
5. What client advisory opportunities does THIS specific news create?

Focus ONLY on this specific news article. Provide practical, actionable insights for chartered accountants based on the actual content above. Do not give generic CA advice.`,
          focus: 'ca',
          context: [fullContext, `Published by: ${newsItem.source}`, `Date: ${newsItem.publishedAt}`]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        throw new Error('Invalid response format from API');
      }
      
      if (result && result.success && result.data) {
        // Use Perplexity's analysis response directly
        const perplexityResponse = result.data.answer || result.data.response || result.data.summary || '';
        
        console.log('Perplexity API Response:', { result, answer: perplexityResponse });
        
        if (perplexityResponse && perplexityResponse.trim().length > 10) {
          const summaryData: PerplexitySummary = {
            summary: perplexityResponse,
            keyPoints: extractKeyPoints(perplexityResponse),
            caImplications: extractCAImplications(perplexityResponse),
            references: await generateReferences(newsItem),
            followUpQuestions: generateFollowUpQuestions(newsItem)
          };
          
          setSummary(summaryData);
          return; // Exit early if Perplexity response is valid
        } else {
          console.warn('Perplexity response empty or invalid, using fallback');
        }
      } else {
        console.warn('Perplexity API failed or returned invalid format:', result);
        // Generate contextual fallback based on actual news content
        const contextualSummary = generateContextualSummary(newsItem);
        setSummary({
          summary: contextualSummary,
          keyPoints: extractKeyPoints(newsItem.title + ' ' + (newsItem.content || newsItem.summary || '')),
          caImplications: extractCAImplications(newsItem.title),
          references: await generateReferences(newsItem),
          followUpQuestions: generateFollowUpQuestions(newsItem)
        });
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        newsTitle: newsItem.title
      });
      setSummary({
        summary: `Analysis of "${newsItem.title}" - This is an important development in the ${newsItem.category || 'finance'} sector that requires attention from CA professionals.`,
        keyPoints: ['Regulatory update', 'Professional implications', 'Action required'],
        caImplications: ['Review compliance', 'Update procedures', 'Client communication'],
        references: await generateReferences(newsItem),
        followUpQuestions: generateFollowUpQuestions(newsItem)
      });
    } finally {
      setLoading(false);
    }
  };

  const extractKeyPoints = (text: string): string[] => {
    if (!text || typeof text !== 'string') {
      return ['Key developments affecting CA profession', 'Professional standards and compliance updates'];
    }
    
    const lowerText = text.toLowerCase();
    const points: string[] = [];
    
    // Extract specific points based on content
    if (lowerText.includes('digital') || lowerText.includes('certification') || lowerText.includes('program')) {
      points.push('New digital certification requirements for CA professionals');
      points.push('Technology integration in audit and compliance procedures');
    }
    if (lowerText.includes('gst') || lowerText.includes('tax')) {
      points.push('Updated GST compliance framework and filing requirements');
      points.push('Enhanced tax advisory opportunities and client service areas');
    }
    if (lowerText.includes('audit') || lowerText.includes('icai')) {
      points.push('Revised audit standards and quality control procedures');
      points.push('Professional development requirements and continuing education');
    }
    if (lowerText.includes('bank') || lowerText.includes('rbi') || lowerText.includes('finance')) {
      points.push('Banking sector regulatory updates affecting audit procedures');
      points.push('Enhanced risk assessment requirements for financial clients');
    }
    if (lowerText.includes('regulation') || lowerText.includes('compliance')) {
      points.push('New regulatory frameworks impacting professional practice');
      points.push('Updated compliance monitoring and reporting requirements');
    }
    
    // If no specific matches, extract from actual content
    if (points.length === 0) {
      // Try to extract meaningful phrases from the text
      const sentences = text.split('.').filter(s => s.trim().length > 20);
      if (sentences.length >= 2) {
        points.push(sentences[0].trim().substring(0, 80) + '...');
        points.push(sentences[1].trim().substring(0, 80) + '...');
      } else {
        points.push('Professional practice implications require review and analysis');
        points.push('Client advisory services may need updates based on this development');
      }
    }
    
    return points.slice(0, 3); // Return max 3 points
  };

  const extractCAImplications = (text: string): string[] => {
    if (!text || typeof text !== 'string') {
      return ['Monitor regulatory developments and their impact on practice', 'Review current client service delivery models', 'Update compliance procedures and documentation'];
    }
    
    const lowerText = text.toLowerCase();
    const implications: string[] = [];
    
    // Generate specific implications based on content
    if (lowerText.includes('digital') || lowerText.includes('certification') || lowerText.includes('audit')) {
      implications.push('Evaluate team readiness for digital audit certification requirements');
      implications.push('Invest in technology training and audit software upgrades');
      implications.push('Review existing audit procedures for digital compliance standards');
    } else if (lowerText.includes('gst') || lowerText.includes('tax')) {
      implications.push('Update GST advisory procedures and client communication protocols');
      implications.push('Review all client tax compliance processes against new requirements');
      implications.push('Enhance technology solutions for automated GST filing and monitoring');
    } else if (lowerText.includes('bank') || lowerText.includes('rbi') || lowerText.includes('finance')) {
      implications.push('Strengthen audit procedures for banking and financial sector clients');
      implications.push('Update risk assessment frameworks for financial institution engagements');
      implications.push('Develop specialized expertise in RBI regulatory compliance');
    } else if (lowerText.includes('icai') || lowerText.includes('professional') || lowerText.includes('standard')) {
      implications.push('Align practice procedures with updated ICAI professional standards');
      implications.push('Plan for additional continuing education and certification requirements');
      implications.push('Enhance quality control systems to meet revised professional guidelines');
    } else {
      implications.push('Assess impact on current client portfolio and service delivery models');
      implications.push('Update advisory procedures to address new regulatory requirements');
      implications.push('Develop proactive client communication strategies for regulatory changes');
    }
    
    return implications.slice(0, 3); // Return max 3 implications
  };



  const generateContextualSummary = (newsItem: any): string => {
    const title = newsItem.title || '';
    const content = newsItem.content || newsItem.summary || '';
    const fullText = `${title} ${content}`.toLowerCase();
    
    // Analyze the ACTUAL news content to generate specific insights
    let specificAnalysis = '';
    let keyImplications = [];
    let actionItems = [];
    
    // Digital/Technology focus
    if (title.toLowerCase().includes('digital') || title.toLowerCase().includes('certification') || 
        title.toLowerCase().includes('audit') && title.toLowerCase().includes('digital')) {
      specificAnalysis = `The "${title}" represents a significant shift in professional development requirements for CA practitioners. This digital auditing certification program addresses the growing need for technology-enabled audit procedures in modern practice.`;
      keyImplications = [
        'New certification requirements may become mandatory for digital audit engagements',
        'Enhanced technology skills needed for competitive practice positioning',
        'Updated audit methodologies incorporating AI and data analytics tools'
      ];
      actionItems = [
        'Evaluate current team capabilities against new certification requirements',
        'Budget for training and certification costs in practice development plans',
        'Review existing audit technology stack for digital compliance readiness'
      ];
    }
    
    // GST/Tax specific analysis
    else if (fullText.includes('gst') || fullText.includes('tax') || fullText.includes('filing')) {
      specificAnalysis = `The "${title}" indicates important changes in tax compliance landscape. This development affects all CA practitioners involved in GST advisory and compliance services for their clients.`;
      keyImplications = [
        'Modified compliance procedures may require updated client advisory protocols',
        'Potential changes in filing deadlines or requirements affect practice workflow',
        'New opportunities for specialized tax advisory services and automation consulting'
      ];
      actionItems = [
        'Review all client GST compliance processes against new requirements',
        'Update standard operating procedures for tax advisory services',
        'Communicate changes to affected clients and adjust service delivery timelines'
      ];
    }
    
    // Banking/RBI focus
    else if (fullText.includes('bank') || fullText.includes('rbi') || fullText.includes('finance')) {
      specificAnalysis = `The "${title}" represents regulatory changes impacting financial sector clients and audit procedures. This development requires immediate attention from CAs serving banking and financial services clients.`;
      keyImplications = [
        'Updated audit procedures required for banking sector engagements',
        'Enhanced risk assessment protocols for financial institution clients',
        'New compliance monitoring requirements for RBI-regulated entities'
      ];
      actionItems = [
        'Review existing banking client audit procedures and documentation',
        'Schedule training sessions on updated financial sector regulations',
        'Assess impact on current audit engagements and adjust timelines accordingly'
      ];
    }
    
    // ICAI/Professional Standards
    else if (fullText.includes('icai') || fullText.includes('professional') || fullText.includes('standard')) {
      specificAnalysis = `The "${title}" represents changes in professional standards and practice requirements issued by ICAI. This directly impacts all practicing CAs and their compliance with professional regulations.`;
      keyImplications = [
        'Updated professional standards may require practice procedure modifications',
        'New continuing education or certification requirements may be introduced',
        'Quality control procedures may need enhancement to meet revised standards'
      ];
      actionItems = [
        'Review current practice procedures against new ICAI requirements',
        'Plan for any additional training or certification needs',
        'Update quality control documentation and monitoring systems'
      ];
    }
    
    // General business/regulatory news
    else {
      specificAnalysis = `The "${title}" represents a significant development affecting the business and regulatory environment. This change impacts CA professionals across various practice areas and client services.`;
      keyImplications = [
        'Business advisory services may need updates to address new regulatory landscape',
        'Client communication strategies should include guidance on this development',
        'Practice management systems may require adjustments for compliance tracking'
      ];
      actionItems = [
        'Assess client portfolio exposure to this regulatory change',
        'Prepare communication materials explaining implications to clients',
        'Review and update relevant practice procedures and checklists'
      ];
    }

    return `**Analysis of "${title}"**

${specificAnalysis}

**Specific Professional Implications:**
${keyImplications.map(point => `• ${point}`).join('\n')}

**Recommended Actions for CA Professionals:**
${actionItems.map(action => `• ${action}`).join('\n')}

**Strategic Considerations:**
This development provides opportunities for enhanced client advisory services and practice differentiation. CAs should proactively communicate with clients about potential impacts and position themselves as trusted advisors during this transition period.`;
  };

  const generateReferences = async (newsItem: any): Promise<NewsReference[]> => {
    // Generate references using web search
    try {
      const response = await fetch('/api/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: newsItem.title,
          categories: newsItem.categories || [newsItem.category],
          maxResults: 5
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.data.results.map((ref: any) => ({
            title: ref.title,
            url: ref.url,
            domain: new URL(ref.url).hostname,
            snippet: ref.snippet || ref.description || 'Official source for detailed information'
          }));
        }
      }
    } catch (error) {
      console.error('Failed to generate references:', error);
    }

    // Fallback references
    return [
      {
        title: 'Official Government Source',
        url: 'https://www.incometax.gov.in',
        domain: 'incometax.gov.in',
        snippet: 'Latest updates and official notifications'
      },
      {
        title: 'ICAI Guidelines',
        url: 'https://www.icai.org',
        domain: 'icai.org',
        snippet: 'Professional guidelines and announcements'
      }
    ];
  };

  const generateFollowUpQuestions = (newsItem: any): string[] => {
    const title = newsItem.title || '';
    const category = newsItem.category || '';
    
    if (title.toLowerCase().includes('bank') || category.toLowerCase().includes('banking')) {
      return [
        'How will banking sector changes affect corporate financing strategies?',
        'What are the implications for audit procedures in banking clients?',
        'Should businesses diversify their banking relationships?',
        'How might RBI policies impact loan accessibility for SMEs?'
      ];
    }
    
    if (title.toLowerCase().includes('gst') || title.toLowerCase().includes('tax')) {
      return [
        'What compliance deadlines should businesses prioritize?',
        'How do these tax changes affect different industry sectors?',
        'What documentation updates are required for GST compliance?',
        'Are there any transitional provisions for existing taxpayers?'
      ];
    }
    
    if (title.toLowerCase().includes('icai') || title.toLowerCase().includes('audit')) {
      return [
        'What new professional development requirements apply to CAs?',
        'How do updated audit standards affect current engagements?',
        'What technology investments should CA firms consider?',
        'Are there changes to continuing education requirements?'
      ];
    }
    
    // Default contextual questions
    return [
      `How does this development impact professional practice standards?`,
      `What client advisory opportunities does this create?`,
      `What compliance preparations should firms prioritize?`,
      `How might this affect industry-specific audit approaches?`
    ];
  };

  const handleCreatePost = async () => {
    setIsCreatingPost(true);
    try {
      console.log(`Generating ${postType} post for:`, newsItem?.title);
      
      const response = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsTitle: newsItem?.title || '',
          newsContent: newsItem?.content || newsItem?.summary || '',
          postType: postType,
          summary: summary?.summary,
          keyPoints: summary?.keyPoints || [],
          caImplications: summary?.caImplications || []
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.content) {
        setPostContent(result.content);
        console.log(`${postType} post generated successfully from ${result.source}`);
      } else {
        throw new Error('No content generated');
      }
      
    } catch (error) {
      console.error('Failed to create post:', error);
      
      // Enhanced fallback with platform-specific formatting
      const fallbackContent = generateFallbackPost(postType, newsItem, summary);
      setPostContent(fallbackContent);
    } finally {
      setIsCreatingPost(false);
    }
  };

  // Fallback post generation function  
  const generateFallbackPost = (type: 'linkedin' | 'twitter' | 'article', news: any, summaryData: any) => {
    // Analyze news context for specific content
    const title = news?.title?.toLowerCase() || '';
    const summary = summaryData?.summary?.toLowerCase() || '';
    
    let contextualPoints: string[];
    let category = 'General Update';
    let urgency = 'moderate';
    
    // Tax-related analysis
    if (title.includes('tax') || title.includes('gst') || title.includes('filing') || title.includes('deadline')) {
      category = 'Tax Update';
      urgency = title.includes('deadline') || title.includes('extended') ? 'high' : 'moderate';
      contextualPoints = [
        'Tax filing procedures and compliance deadlines updated',
        'Client portfolio review required for affected filings',
        'Advisory services expansion opportunities in tax planning'
      ];
    }
    // Banking analysis
    else if (title.includes('bank') || title.includes('rbi') || title.includes('lending')) {
      category = 'Banking Update';
      urgency = title.includes('crisis') || title.includes('fraud') ? 'high' : 'moderate';
      contextualPoints = [
        'Banking sector audit procedures require enhancement',
        'Financial risk assessment protocols need updating',
        'Client advisory services for banking relationships'
      ];
    }
    // ICAI/Professional
    else if (title.includes('icai') || title.includes('audit') || title.includes('chartered accountant')) {
      category = 'Professional Standards';
      urgency = title.includes('mandatory') ? 'high' : 'moderate';
      contextualPoints = [
        'Professional development requirements updated',
        'Audit methodology and quality standards enhanced',
        'Continuing education compliance obligations'
      ];
    }
    // Default contextual points
    else {
      contextualPoints = summaryData?.keyPoints?.slice(0, 3) || [
        'Professional practice standards require attention',
        'Client advisory protocols need enhancement', 
        'Strategic positioning opportunities identified'
      ];
    }

    const keyPoints = contextualPoints;

    switch (type) {
      case 'linkedin':
        const emoji = urgency === 'high' ? '🚨' : '📋';
        const actionText = urgency === 'high' ? 'requires immediate attention' : 'presents important implications';
        
        return `${emoji} ${category}: ${news?.title}

This development ${actionText} for CA professionals across India.

Specific implications for your practice:
• ${keyPoints[0]}
• ${keyPoints[1]}  
• ${keyPoints[2]}

${urgency === 'high' ? 
  `⏰ Immediate action recommended - review your current procedures and update client advisory protocols.` : 
  `Strategic consideration needed - assess impact on your client portfolio and service offerings.`}

How is your practice adapting to this ${category.toLowerCase()}?

#CharteredAccountant #${category.replace(/\s+/g, '')} #CANews #Compliance #ICAI #ProfessionalDevelopment`;

      case 'twitter':
        const tweetEmoji = urgency === 'high' ? '🚨' : '📢';
        const shortTitle = news?.title?.length > 80 ? news.title.substring(0, 77) + '...' : news?.title;
        
        return `1/4 ${tweetEmoji} ${category}: ${shortTitle}

${urgency === 'high' ? 'Immediate impact' : 'Important update'} for CA professionals.

2/4 📊 Key ${category.toLowerCase()} implications:
• ${keyPoints[0].substring(0, 50)}...
• ${keyPoints[1].substring(0, 50)}...

3/4 ✅ ${urgency === 'high' ? 'Urgent action' : 'Next steps'}:
${urgency === 'high' ? 'Review procedures immediately' : 'Assess client impact and update protocols'}

4/4 💬 How are you handling this ${category.toLowerCase()}?

#${category.replace(/\s+/g, '')} #CANews #CharteredAccountant`;

      case 'article':
        return `# ${news?.title}: ${category} Analysis for CA Professionals

## Executive Summary
${summaryData?.summary?.substring(0, 200) || `This ${category.toLowerCase()} development ${urgency === 'high' ? 'requires immediate attention' : 'warrants careful consideration'} from CA professionals across India.`}...

## ${category} Impact Assessment

### Professional Practice Implications
${keyPoints.map((point: string, index: number) => `#### ${index + 1}. ${point}\n${urgency === 'high' ? 'Immediate review and implementation required.' : 'Strategic planning and gradual implementation recommended.'}`).join('\n\n')}

## Action Plan for CA Professionals

### ${urgency === 'high' ? 'Immediate Actions (Next 7 Days)' : 'Strategic Actions (Next 30 Days)'}
1. **Assessment**: Evaluate current ${category.toLowerCase()} procedures
2. **Client Review**: Identify affected client portfolios  
3. **Compliance**: ${urgency === 'high' ? 'Immediately update' : 'Plan updates to'} relevant frameworks

### Professional Recommendations
${urgency === 'high' ? 
  'Given the urgent nature of this update, CA professionals should prioritize immediate compliance review and client communication.' : 
  'This development presents opportunities for enhanced client advisory services and practice differentiation.'}

## Conclusion
${urgency === 'high' ? 
  `Immediate adaptation to this ${category.toLowerCase()} change is critical for maintaining compliance and client service excellence.` :
  `Strategic positioning around this ${category.toLowerCase()} development will benefit forward-thinking CA practices.`}

---
*This ${category.toLowerCase()} analysis should be supplemented with specific regulatory research based on individual practice requirements.*`;

      default:
        return `Professional update: ${news?.title}. Key implications for CA professionals require attention.`;
    }
  };

  // Handle sharing the news summary
  const handleShareNews = async () => {
    if (!newsItem) {
      alert('No news item selected.');
      return;
    }
    
    if (!summary || loading) {
      alert('Please wait for the AI summary to load before sharing.');
      return;
    }
    
    const shareText = `📰 ${newsItem.title}

🤖 AI Summary:
${summary.summary}

📌 Key Points:
${summary.keyPoints.map(point => `• ${point}`).join('\n')}

⚖️ CA Implications:
${summary.caImplications.map(implication => `• ${implication}`).join('\n')}

🔗 Source: ${newsItem.source}
📅 Published: ${new Date(newsItem.publishedAt).toLocaleDateString()}

#CANews #CharteredAccountant #ProfessionalUpdate`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `CA News Analysis: ${newsItem.title}`,
          text: shareText,
          url: newsItem.url || window.location.href
        });
        console.log('News shared successfully via Web Share API');
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareText);
        
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div class="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity">
            ✅ News summary copied to clipboard!
          </div>
        `;
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
      }
    } catch (error) {
      console.error('Error sharing news:', error);
      
      // Final fallback: Copy to clipboard with simpler notification
      try {
        await navigator.clipboard.writeText(shareText);
        alert('📋 News summary copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        
        // Ultimate fallback: Show the text for manual copying
        const textWindow = window.open('', '_blank', 'width=600,height=400');
        if (textWindow) {
          textWindow.document.write(`
            <html>
              <head><title>Share News Summary</title></head>
              <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h3>Copy this content to share:</h3>
                <textarea style="width: 100%; height: 300px; font-size: 12px;" readonly>${shareText}</textarea>
                <p><small>Select all text and copy (Ctrl+A, then Ctrl+C)</small></p>
              </body>
            </html>
          `);
        } else {
          alert('Unable to share automatically. Please check your browser settings.');
        }
      }
    }
  };

  if (!isOpen || !newsItem) return null;

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Perplexity-style Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Discover</h2>
              <p className="text-gray-400 text-xs">{newsItem.source}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleShareNews}
              disabled={!summary || loading}
              className={`p-2 rounded-lg transition-colors ${
                summary && !loading 
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                  : 'text-gray-600 cursor-not-allowed'
              }`}
              title={summary ? "Share news summary" : "Loading summary..."}
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Main Content - Single Column like Perplexity */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6">
            {/* News Title */}
            <h1 className="text-3xl font-bold text-white mb-6 leading-tight">
              {newsItem.title}
            </h1>

            {loading ? (
              <div className="space-y-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-800 rounded w-full"></div>
                  <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-800 rounded w-2/3"></div>
                </div>
              </div>
            ) : summary && (
              <div className="space-y-8">
                {/* AI-Generated Summary */}
                <div className="prose prose-invert max-w-none">
                  <div className="text-gray-300 leading-relaxed text-lg space-y-4">
                    {summary.summary.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4">{paragraph}</p>
                    ))}
                  </div>
                </div>

                {/* Sources Section - Perplexity Style */}
                <div className="border-t border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Sources</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {summary.references.map((ref, index) => (
                      <a
                        key={index}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start space-x-3 p-3 bg-gray-900/50 hover:bg-gray-800/50 rounded-lg transition-colors border border-gray-800 hover:border-gray-700"
                      >
                        <div className="w-6 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-medium mt-0.5">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white mb-1 truncate">{ref.title}</div>
                          <div className="text-xs text-blue-400 mb-1">{ref.domain}</div>
                          <div className="text-xs text-gray-400 line-clamp-2">{ref.snippet}</div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Follow-up Questions */}
                <div className="border-t border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Related</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {summary.followUpQuestions.map((question, index) => (
                      <button
                        key={index}
                        className="text-left p-3 bg-gray-900/50 hover:bg-gray-800/50 rounded-lg transition-colors border border-gray-800 hover:border-gray-700"
                      >
                        <div className="text-sm text-gray-300">{question}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Create Post Section - At Bottom */}
                <div className="border-t border-gray-800 pt-6">
                  <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-400" />
                      Create Professional Post
                    </h3>
                    
                    {/* Post Type Selector */}
                    <div className="mb-6">
                      <p className="text-gray-400 text-sm mb-3">Choose platform:</p>
                      <div className="flex space-x-3">
                        {(['linkedin', 'twitter', 'article'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setPostType(type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                              postType === type
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                            }`}
                          >
                            {type === 'linkedin' && '💼'} 
                            {type === 'twitter' && '🐦'} 
                            {type === 'article' && '📝'} 
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Generate Post Button */}
                    <button
                      onClick={handleCreatePost}
                      disabled={isCreatingPost}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isCreatingPost ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <span>✨ Generate {postType.charAt(0).toUpperCase() + postType.slice(1)} Post</span>
                        </>
                      )}
                    </button>

                    {/* Generated Post Content */}
                    {postContent && (
                      <div className="mt-6 space-y-4">
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-white">Generated {postType.charAt(0).toUpperCase() + postType.slice(1)} Content</h4>
                              <div className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-600/30">
                                ✨ AI Generated
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(postContent);
                                  // Could add a toast notification here
                                }}
                                className="p-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors flex items-center space-x-1"
                                title="Copy to clipboard"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </button>
                              {postType === 'twitter' && (
                                <button
                                  onClick={() => {
                                    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postContent)}`;
                                    window.open(twitterUrl, '_blank');
                                  }}
                                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors flex items-center space-x-1"
                                  title="Share on Twitter"
                                >
                                  🐦 <span>Tweet</span>
                                </button>
                              )}
                              {postType === 'linkedin' && (
                                <button
                                  onClick={() => {
                                    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
                                    window.open(linkedinUrl, '_blank');
                                  }}
                                  className="p-2 bg-blue-700 hover:bg-blue-800 text-white text-xs rounded transition-colors flex items-center space-x-1"
                                  title="Share on LinkedIn"
                                >
                                  💼 <span>LinkedIn</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (navigator.share) {
                                    navigator.share({ 
                                      title: `${postType.charAt(0).toUpperCase() + postType.slice(1)} Post`,
                                      text: postContent 
                                    });
                                  }
                                }}
                                className="p-2 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors flex items-center space-x-1"
                                title="Share via device"
                              >
                                <Share2 className="w-3 h-3" />
                                <span>Share</span>
                              </button>
                            </div>
                          </div>
                          
                          {/* Content Statistics */}
                          <div className="flex items-center space-x-4 mb-3 text-xs text-gray-400">
                            <span>Words: {postContent.split(' ').length}</span>
                            <span>Characters: {postContent.length}</span>
                            {postType === 'twitter' && (
                              <span className={`${postContent.length > 280 ? 'text-red-400' : 'text-green-400'}`}>
                                Twitter: {280 - postContent.length} remaining
                              </span>
                            )}
                            {postType === 'linkedin' && (
                              <span className={`${postContent.length > 3000 ? 'text-red-400' : 'text-green-400'}`}>
                                LinkedIn: {3000 - postContent.length} remaining  
                              </span>
                            )}
                          </div>
                          
                          <textarea
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            className={`w-full bg-gray-900 text-gray-300 rounded-lg p-3 text-sm resize-none border border-gray-600 focus:border-blue-500 focus:outline-none ${
                              postType === 'article' ? 'h-80' : postType === 'linkedin' ? 'h-48' : 'h-40'
                            }`}
                            placeholder="Generated post content will appear here..."
                            style={{ 
                              fontFamily: postType === 'article' ? 'serif' : 'inherit',
                              lineHeight: '1.6'
                            }}
                          />
                          
                          {/* Action Buttons */}
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
                            <button
                              onClick={handleCreatePost}
                              disabled={isCreatingPost}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm rounded-lg transition-colors flex items-center space-x-2"
                            >
                              {isCreatingPost ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Regenerating...</span>
                                </>
                              ) : (
                                <>
                                  <span>🔄 Regenerate</span>
                                </>
                              )}
                            </button>
                            
                            <div className="text-xs text-gray-400">
                              ✨ Powered by Perplexity AI
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}