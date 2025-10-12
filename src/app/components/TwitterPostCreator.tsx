'use client';

import React, { useState } from 'react';
import { ICAIComplianceChecker, ComplianceResult } from '@/lib/icai-guidelines';
import { TwitterService } from '@/lib/twitter-service';

interface TwitterPostCreatorProps {}

export default function TwitterPostCreator({}: TwitterPostCreatorProps) {
  const [postContent, setPostContent] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [complianceCheck, setComplianceCheck] = useState<ComplianceResult | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postResult, setPostResult] = useState<any>(null);
  const [threadMode, setThreadMode] = useState(false);
  const [threadPreview, setThreadPreview] = useState<string[]>([]);

  const checkCompliance = () => {
    if (!postContent.trim()) return;
    const result = ICAIComplianceChecker.checkContent(postContent);
    setComplianceCheck(result);
  };

  const generateThread = () => {
    if (!postContent.trim()) return;
    const thread = TwitterService.createThread(postContent);
    setThreadPreview(thread);
    setThreadMode(true);
  };

  const handlePost = async () => {
    if (!postContent.trim()) return;
    
    setIsPosting(true);
    try {
      const scheduledFor = isScheduled ? `${scheduledDate}T${scheduledTime}` : undefined;
      
      const response = await fetch('/api/twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: postContent,
          scheduledFor,
          userId: 'current-user',
          topic: 'Twitter post',
          platform: 'twitter'
        }),
      });

      const result = await response.json();
      setPostResult(result);
      
      if (result.success) {
        setPostContent('');
        setComplianceCheck(null);
        setThreadPreview([]);
        setThreadMode(false);
      }
    } catch (error) {
      console.error('Posting error:', error);
      setPostResult({
        success: false,
        error: 'Failed to post. Please try again.'
      });
    } finally {
      setIsPosting(false);
    }
  };

  const getCharacterCount = () => {
    return postContent.length;
  };

  const getCharacterColor = () => {
    const count = getCharacterCount();
    if (count > 280) return 'text-red-500';
    if (count > 250) return 'text-yellow-500';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Post Content */}
      <div>
        <label className="block text-sm font-medium mb-2 text-white">Tweet Content</label>
        <textarea
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          placeholder="What's happening in the CA world? Share your professional insights..."
          rows={4}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white resize-none"
        />
        <div className="flex justify-between items-center mt-2">
          <div className="flex space-x-4">
            <button
              onClick={checkCompliance}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
            >
              ⚖️ Check ICAI Compliance
            </button>
            <button
              onClick={generateThread}
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center"
            >
              🧵 Generate Thread
            </button>
          </div>
          <span className={`text-sm font-medium ${getCharacterColor()}`}>
            {getCharacterCount()}/280
          </span>
        </div>
      </div>

      {/* Compliance Results */}
      {complianceCheck && (
        <div className={`rounded-lg p-4 border ${
          complianceCheck.isCompliant 
            ? 'bg-green-900/30 border-green-700' 
            : 'bg-red-900/30 border-red-700'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white">ICAI Compliance Check</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              complianceCheck.isCompliant ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {complianceCheck.isCompliant ? '✅ Compliant' : '⚠️ Issues'}
            </span>
          </div>
          <div className="text-sm text-gray-300">
            Score: {complianceCheck.score}/100
          </div>
          {complianceCheck.violations.length > 0 && (
            <div className="mt-3">
              <h4 className="font-medium text-red-300 mb-2">Issues:</h4>
              <ul className="text-sm space-y-1">
                {complianceCheck.violations.map((violation, index) => (
                  <li key={index} className="text-red-200">
                    • {violation.suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Thread Preview */}
      {threadMode && threadPreview.length > 0 && (
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
          <h3 className="font-semibold text-white mb-3">🧵 Thread Preview ({threadPreview.length} tweets)</h3>
          <div className="space-y-3">
            {threadPreview.map((tweet, index) => (
              <div key={index} className="bg-gray-800 rounded p-3 border-l-4 border-blue-500">
                <div className="text-sm text-blue-400 mb-1">Tweet {index + 1}</div>
                <div className="text-white">{tweet}</div>
                <div className="text-xs text-gray-400 mt-1">{tweet.length} characters</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={() => setPostContent(threadPreview[0])}
              className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded transition-colors"
            >
              Use First Tweet
            </button>
            <button
              onClick={() => setThreadMode(false)}
              className="text-sm bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Scheduling */}
      <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
        <div className="flex items-center space-x-3 mb-4">
          <input
            type="checkbox"
            id="schedule-post"
            checked={isScheduled}
            onChange={(e) => setIsScheduled(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
          />
          <label htmlFor="schedule-post" className="text-white font-medium">
            Schedule for later
          </label>
        </div>
        
        {isScheduled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Post Button */}
      <div className="flex space-x-4">
        <button
          onClick={handlePost}
          disabled={isPosting || !postContent.trim() || getCharacterCount() > 280 || (complianceCheck && !complianceCheck.isCompliant)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition-colors font-semibold text-white flex items-center justify-center"
        >
          {isPosting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              {isScheduled ? 'Scheduling...' : 'Posting...'}
            </>
          ) : (
            <>
              {isScheduled ? '⏰ Schedule Tweet' : '🚀 Post Now'}
            </>
          )}
        </button>
      </div>

      {/* Post Result */}
      {postResult && (
        <div className={`rounded-lg p-4 border ${
          postResult.success 
            ? 'bg-green-900/30 border-green-700' 
            : 'bg-red-900/30 border-red-700'
        }`}>
          <div className="flex items-center">
            <span className="text-2xl mr-3">
              {postResult.success ? '✅' : '❌'}
            </span>
            <div>
              <h3 className="font-semibold text-lg text-white">
                {postResult.success ? 'Success!' : 'Failed'}
              </h3>
              <p className={postResult.success ? 'text-green-300' : 'text-red-300'}>
                {postResult.success 
                  ? `Tweet ${isScheduled ? 'scheduled' : 'posted'} successfully`
                  : postResult.error || 'Unknown error occurred'
                }
              </p>
              {postResult.postId && (
                <p className="text-sm text-gray-400 mt-1">
                  Post ID: {postResult.postId}
                </p>
              )}
            </div>
          </div>
          
          {postResult.suggestions && postResult.suggestions.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-yellow-300 mb-2">Suggestions:</h4>
              <ul className="text-sm space-y-1">
                {postResult.suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="text-yellow-200">
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <h3 className="font-semibold text-blue-300 mb-2">💡 Twitter Best Practices for CAs</h3>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• Keep it under 280 characters for better engagement</li>
          <li>• Use relevant hashtags: #CharterAccountant #ICAI #Taxation</li>
          <li>• Share insights, not solicitations</li>
          <li>• Always fact-check before posting</li>
          <li>• Engage professionally with followers</li>
        </ul>
      </div>
    </div>
  );
}