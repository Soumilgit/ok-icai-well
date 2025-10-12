'use client';

import React, { useState, useEffect } from 'react';
import { LinkedInAutomationService, LinkedInPost, AutomationSettings, LinkedInProfile } from '../lib/linkedin-automation';
import { ContentGenerator, ContentRequest } from '../lib/content-generator';
import { UserPreferences } from '../lib/writing-voice-service';

interface LinkedInAutomationProps {
  userPreferences: UserPreferences;
}

export default function LinkedInAutomation({ userPreferences }: LinkedInAutomationProps) {
  const [activeTab, setActiveTab] = useState<'compose' | 'schedule' | 'analytics' | 'network'>('compose');
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>({
    enabled: false,
    scheduleOptions: {
      frequency: 'daily',
      times: ['09:00'],
      days: [1, 2, 3, 4, 5], // Monday to Friday
      timezone: 'Asia/Kolkata'
    },
    contentTypes: ['linkedin-post'],
    topics: ['accounting', 'tax updates', 'business advice'],
    autoHashtags: true,
    autoEngagement: false,
    complianceCheck: true
  });
  const [networkOpportunities, setNetworkOpportunities] = useState<LinkedInProfile[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [configurationError, setConfigurationError] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const linkedinService = new LinkedInAutomationService();
  const contentGenerator = new ContentGenerator();

  useEffect(() => {
    loadPosts();
    loadAutomationSettings();
    checkLinkedInConnection();
  }, []);

  const loadPosts = async () => {
    const userPosts = await linkedinService.getPosts();
    setPosts(userPosts);
  };

  const loadAutomationSettings = () => {
    const stored = localStorage.getItem('linkedin_automation_settings');
    if (stored) {
      setAutomationSettings(JSON.parse(stored));
    }
  };

  const checkLinkedInConnection = () => {
    // Check if user has completed OAuth flow (stored in localStorage or session)
    const storedToken = localStorage.getItem('linkedin_access_token');
    setIsConnected(!!storedToken);
  };

  const handleConnect = async () => {
    try {
      setConfigurationError(null);
      const authUrl = await linkedinService.initiateOAuth();
      window.open(authUrl, '_blank');
    } catch (error) {
      console.error('Error connecting to LinkedIn:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setConfigurationError(errorMessage);
      setShowSetupGuide(true);
    }
  };

  const renderComposeTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Create New Post</h3>
        <PostComposer 
          userPreferences={userPreferences}
          onPostCreated={loadPosts}
        />
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Posts</h3>
        <PostList posts={posts} onRefresh={loadPosts} />
      </div>
    </div>
  );

  const renderScheduleTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Automation Settings</h3>
        <AutomationSettingsForm 
          settings={automationSettings}
          onChange={setAutomationSettings}
        />
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Scheduled Posts</h3>
        <ScheduledPosts posts={posts.filter(p => p.status === 'scheduled')} />
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Post Analytics</h3>
        <PostAnalytics posts={posts.filter(p => p.status === 'published')} />
      </div>
    </div>
  );

  const renderNetworkTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Network Opportunities</h3>
        <NetworkAnalysis opportunities={networkOpportunities} />
      </div>
    </div>
  );

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your LinkedIn</h3>
            <p className="text-white mb-6">
              Connect your LinkedIn account to start creating, scheduling, and analyzing your posts.
            </p>
            <button
              onClick={handleConnect}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Connect LinkedIn Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'compose', label: 'Compose', icon: '✍️' },
            { id: 'schedule', label: 'Automation', icon: '🕐' },
            { id: 'analytics', label: 'Analytics', icon: '📊' },
            { id: 'network', label: 'Network', icon: '🤝' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {showSetupGuide ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">LinkedIn Integration Setup Required</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p className="mb-3">{configurationError}</p>
                <div className="space-y-2">
                  <p className="font-medium">To set up LinkedIn integration:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Go to <a href="https://developer.linkedin.com/" target="_blank" className="text-blue-600 underline">LinkedIn Developer Portal</a></li>
                    <li>Create a new app or use an existing one</li>
                    <li>Copy your Client ID and Client Secret</li>
                    <li>Add these to your environment variables:</li>
                  </ol>
                  <div className="bg-gray-800 text-green-400 p-3 rounded-md text-xs mt-3 font-mono">
                    <div>LINKEDIN_CLIENT_ID=your_client_id_here</div>
                    <div>LINKEDIN_CLIENT_SECRET=your_client_secret_here</div>
                    <div>LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback</div>
                  </div>
                  <p className="mt-3 text-sm">After updating your environment variables, restart the application.</p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setShowSetupGuide(false)}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm hover:bg-yellow-700"
                >
                  Got it, I'll set this up later
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'compose' && renderComposeTab()}
          {activeTab === 'schedule' && renderScheduleTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
          {activeTab === 'network' && renderNetworkTab()}
        </>
      )}
    </div>
  );
}

// Sub-components
interface PostComposerProps {
  userPreferences: UserPreferences;
  onPostCreated: () => void;
}

function PostComposer({ userPreferences, onPostCreated }: PostComposerProps) {
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState<'linkedin-post'>('linkedin-post');
  const [targetAudience, setTargetAudience] = useState<string[]>(['Fellow CAs']);
  const [keyPoints, setKeyPoints] = useState<string[]>(['']);
  const [tone, setTone] = useState<'professional' | 'casual' | 'urgent' | 'educational'>('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeCallToAction, setIncludeCallToAction] = useState(true);

  const contentGenerator = new ContentGenerator();
  const linkedinService = new LinkedInAutomationService();

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const request: ContentRequest = {
        topic,
        contentType,
        targetAudience,
        keyPoints: keyPoints.filter(p => p.trim()),
        tone,
        length: 'medium',
        includeHashtags,
        includeCallToAction
      };

      const result = await contentGenerator.generateContent(request, userPreferences);
      setGeneratedContent(result.content);
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePost = async () => {
    if (!generatedContent.trim()) return;

    try {
      await linkedinService.createPost(generatedContent, []);
      onPostCreated();
      setGeneratedContent('');
      setTopic('');
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What would you like to write about?"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="urgent">Urgent</option>
            <option value="educational">Educational</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
          <select
            multiple
            value={targetAudience}
            onChange={(e) => setTargetAudience(Array.from(e.target.selectedOptions, option => option.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="Fellow CAs">Fellow CAs</option>
            <option value="Business owners">Business owners</option>
            <option value="Corporate executives">Corporate executives</option>
            <option value="Students">Students</option>
            <option value="General public">General public</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Key Points</label>
        {keyPoints.map((point, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={point}
              onChange={(e) => {
                const newPoints = [...keyPoints];
                newPoints[index] = e.target.value;
                setKeyPoints(newPoints);
              }}
              placeholder={`Key point ${index + 1}`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            {index === keyPoints.length - 1 && (
              <button
                onClick={() => setKeyPoints([...keyPoints, ''])}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
              >
                +
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={includeHashtags}
            onChange={(e) => setIncludeHashtags(e.target.checked)}
            className="mr-2"
          />
          Include hashtags
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={includeCallToAction}
            onChange={(e) => setIncludeCallToAction(e.target.checked)}
            className="mr-2"
          />
          Include call-to-action
        </label>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!topic.trim() || isGenerating}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? 'Generating...' : 'Generate Content'}
      </button>

      {generatedContent && (
        <div className="mt-6 p-4 border border-gray-300 rounded-md">
          <h4 className="font-medium mb-2">Generated Content:</h4>
          <div className="whitespace-pre-wrap text-gray-700 mb-4">{generatedContent}</div>
          <div className="flex gap-2">
            <button
              onClick={handleSavePost}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save as Draft
            </button>
            <button
              onClick={() => setGeneratedContent('')}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PostList({ posts, onRefresh }: { posts: LinkedInPost[], onRefresh: () => void }) {
  const linkedinService = new LinkedInAutomationService();

  const handlePublish = async (postId: string) => {
    await linkedinService.publishPost(postId);
    onRefresh();
  };

  const handleSchedule = async (postId: string, scheduledFor: Date) => {
    await linkedinService.schedulePost(postId, scheduledFor);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No posts yet. Create your first post above!</p>
      ) : (
        posts.map(post => (
          <div key={post.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                post.status === 'published' ? 'bg-green-100 text-green-800' :
                post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                post.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {post.status}
              </span>
              <span className="text-sm text-gray-500">
                {post.createdAt.toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700 mb-4 whitespace-pre-wrap line-clamp-3">
              {post.content}
            </p>
            <div className="flex gap-2">
              {post.status === 'draft' && (
                <>
                  <button
                    onClick={() => handlePublish(post.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Publish Now
                  </button>
                  <button
                    onClick={() => {
                      const scheduledFor = new Date();
                      scheduledFor.setHours(scheduledFor.getHours() + 1);
                      handleSchedule(post.id, scheduledFor);
                    }}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Schedule
                  </button>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function AutomationSettingsForm({ settings, onChange }: { 
  settings: AutomationSettings;
  onChange: (settings: AutomationSettings) => void;
}) {
  const handleSettingsUpdate = (updates: Partial<AutomationSettings>) => {
    onChange({ ...settings, ...updates });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium">Enable Automation</h4>
        <button
          onClick={() => handleSettingsUpdate({ enabled: !settings.enabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            settings.enabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              settings.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {settings.enabled && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
            <select
              value={settings.scheduleOptions.frequency}
              onChange={(e) => handleSettingsUpdate({
                scheduleOptions: {
                  ...settings.scheduleOptions,
                  frequency: e.target.value as any
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Posting Times</label>
            <div className="flex gap-2">
              {settings.scheduleOptions.times.map((time, index) => (
                <input
                  key={index}
                  type="time"
                  value={time}
                  onChange={(e) => {
                    const newTimes = [...settings.scheduleOptions.times];
                    newTimes[index] = e.target.value;
                    handleSettingsUpdate({
                      scheduleOptions: {
                        ...settings.scheduleOptions,
                        times: newTimes
                      }
                    });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Topics</label>
            <div className="flex flex-wrap gap-2">
              {settings.topics.map((topic, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ScheduledPosts({ posts }: { posts: LinkedInPost[] }) {
  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No scheduled posts</p>
      ) : (
        posts.map(post => (
          <div key={post.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-blue-600">
                Scheduled for: {post.scheduledFor?.toLocaleString()}
              </span>
            </div>
            <p className="text-gray-700 line-clamp-2">{post.content}</p>
          </div>
        ))
      )}
    </div>
  );
}

function PostAnalytics({ posts }: { posts: LinkedInPost[] }) {
  const totalEngagement = posts.reduce((sum, post) => 
    sum + (post.engagement?.likes || 0) + (post.engagement?.comments || 0) + (post.engagement?.shares || 0), 0
  );

  const avgEngagement = posts.length > 0 ? totalEngagement / posts.length : 0;

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{posts.length}</div>
          <div className="text-sm text-gray-600">Published Posts</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{totalEngagement}</div>
          <div className="text-sm text-gray-600">Total Engagement</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{avgEngagement.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Avg. Engagement</div>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="border border-gray-200 rounded-lg p-4">
            <p className="text-gray-700 mb-2 line-clamp-2">{post.content}</p>
            <div className="flex gap-4 text-sm text-gray-500">
              <span>👍 {post.engagement?.likes || 0}</span>
              <span>💬 {post.engagement?.comments || 0}</span>
              <span>🔄 {post.engagement?.shares || 0}</span>
              <span>👁️ {post.engagement?.views || 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NetworkAnalysis({ opportunities }: { opportunities: LinkedInProfile[] }) {
  return (
    <div className="space-y-4">
      {opportunities.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No network opportunities found</p>
      ) : (
        opportunities.map(profile => (
          <div key={profile.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{profile.name}</h4>
                <p className="text-sm text-gray-600">{profile.headline}</p>
                <p className="text-xs text-gray-500">{profile.location} • {profile.industry}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">{profile.interactionScore.toFixed(1)}</div>
                <div className="text-xs text-gray-500">Interaction Score</div>
              </div>
            </div>
            <div className="mt-2 flex gap-4 text-sm text-gray-500">
              <span>{profile.connections} connections</span>
              <span>{profile.mutualConnections} mutual</span>
              <span>{profile.engagementRate}% engagement</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}