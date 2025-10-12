'use client';

import React, { useState, useEffect } from 'react';
import { LinkedInAutomationService } from '@/lib/linkedin-automation';

interface NetworkConnection {
  id: string;
  name: string;
  headline: string;
  company?: string;
  location?: string;
  connectionDegree: '1st' | '2nd' | '3rd';
  lastInteraction?: Date;
  engagementScore: number;
  industry?: string;
  mutualConnections?: number;
}

interface NetworkOpportunity {
  type: 'reconnect' | 'engage' | 'new_connection' | 'collaboration';
  priority: 'high' | 'medium' | 'low';
  connection: NetworkConnection;
  reason: string;
  suggestedAction: string;
  potentialValue: number;
}

interface NetworkInsights {
  totalConnections: number;
  activeConnections: number;
  industryBreakdown: { [industry: string]: number };
  locationBreakdown: { [location: string]: number };
  engagementTrends: Array<{ date: string; interactions: number }>;
  growthRate: number;
  qualityScore: number;
}

const LinkedInNetworkAnalyzer: React.FC = () => {
  const [insights, setInsights] = useState<NetworkInsights | null>(null);
  const [opportunities, setOpportunities] = useState<NetworkOpportunity[]>([]);
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'connections' | 'growth'>('overview');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const linkedinService = new LinkedInAutomationService();

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration - in real app, this would come from LinkedIn API
      const mockInsights: NetworkInsights = {
        totalConnections: 847,
        activeConnections: 234,
        industryBreakdown: {
          'Accounting': 156,
          'Financial Services': 98,
          'Consulting': 87,
          'Technology': 76,
          'Banking': 65,
          'Insurance': 54,
          'Real Estate': 43,
          'Manufacturing': 38,
          'Healthcare': 32,
          'Education': 28,
          'Other': 170
        },
        locationBreakdown: {
          'Mumbai': 145,
          'Delhi': 98,
          'Bangalore': 87,
          'Chennai': 76,
          'Pune': 65,
          'Hyderabad': 54,
          'Kolkata': 43,
          'Ahmedabad': 32,
          'Other India': 156,
          'International': 91
        },
        engagementTrends: [
          { date: '2024-01', interactions: 45 },
          { date: '2024-02', interactions: 52 },
          { date: '2024-03', interactions: 38 },
          { date: '2024-04', interactions: 67 },
          { date: '2024-05', interactions: 71 },
          { date: '2024-06', interactions: 84 }
        ],
        growthRate: 12.5,
        qualityScore: 78
      };

      const mockOpportunities: NetworkOpportunity[] = [
        {
          type: 'reconnect',
          priority: 'high',
          connection: {
            id: '1',
            name: 'Priya Sharma',
            headline: 'Senior Manager at KPMG',
            company: 'KPMG',
            location: 'Mumbai',
            connectionDegree: '1st',
            lastInteraction: new Date('2024-01-15'),
            engagementScore: 85,
            industry: 'Accounting',
            mutualConnections: 23
          },
          reason: 'High-value connection with no recent interaction (5 months)',
          suggestedAction: 'Share relevant tax update or comment on their recent post',
          potentialValue: 92
        },
        {
          type: 'engage',
          priority: 'high',
          connection: {
            id: '2',
            name: 'Rajesh Gupta',
            headline: 'CFO at TechCorp India',
            company: 'TechCorp India',
            location: 'Bangalore',
            connectionDegree: '1st',
            lastInteraction: new Date('2024-05-20'),
            engagementScore: 78,
            industry: 'Technology',
            mutualConnections: 15
          },
          reason: 'Posted about quarterly financial planning - opportunity to engage',
          suggestedAction: 'Comment with insights on Q2 financial planning best practices',
          potentialValue: 87
        },
        {
          type: 'new_connection',
          priority: 'medium',
          connection: {
            id: '3',
            name: 'Anita Desai',
            headline: 'Tax Partner at Deloitte',
            company: 'Deloitte',
            location: 'Delhi',
            connectionDegree: '2nd',
            engagementScore: 0,
            industry: 'Accounting',
            mutualConnections: 8
          },
          reason: 'Tax expertise alignment with 8 mutual connections',
          suggestedAction: 'Send connection request mentioning mutual interest in GST compliance',
          potentialValue: 73
        },
        {
          type: 'collaboration',
          priority: 'high',
          connection: {
            id: '4',
            name: 'Vikram Singh',
            headline: 'Partner at Singh & Associates',
            company: 'Singh & Associates',
            location: 'Mumbai',
            connectionDegree: '1st',
            lastInteraction: new Date('2024-04-10'),
            engagementScore: 91,
            industry: 'Accounting',
            mutualConnections: 31
          },
          reason: 'Similar client base and complementary services',
          suggestedAction: 'Propose joint webinar on new accounting standards',
          potentialValue: 95
        }
      ];

      const mockConnections: NetworkConnection[] = [
        {
          id: '1',
          name: 'Priya Sharma',
          headline: 'Senior Manager at KPMG',
          company: 'KPMG',
          location: 'Mumbai',
          connectionDegree: '1st',
          lastInteraction: new Date('2024-01-15'),
          engagementScore: 85,
          industry: 'Accounting',
          mutualConnections: 23
        },
        {
          id: '2',
          name: 'Rajesh Gupta',
          headline: 'CFO at TechCorp India',
          company: 'TechCorp India',
          location: 'Bangalore',
          connectionDegree: '1st',
          lastInteraction: new Date('2024-05-20'),
          engagementScore: 78,
          industry: 'Technology',
          mutualConnections: 15
        },
        // Add more mock connections as needed
      ];

      setInsights(mockInsights);
      setOpportunities(mockOpportunities);
      setConnections(mockConnections);
    } catch (error) {
      console.error('Error fetching network data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEngagementColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'reconnect': return '🔄';
      case 'engage': return '💬';
      case 'new_connection': return '🤝';
      case 'collaboration': return '🤝';
      default: return '📊';
    }
  };

  const filteredOpportunities = opportunities.filter(opp => {
    const industryMatch = selectedIndustry === 'all' || opp.connection.industry === selectedIndustry;
    const priorityMatch = selectedPriority === 'all' || opp.priority === selectedPriority;
    return industryMatch && priorityMatch;
  });

  const filteredConnections = connections.filter(conn => {
    return selectedIndustry === 'all' || conn.industry === selectedIndustry;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Analyzing your LinkedIn network...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">LinkedIn Network Analyzer</h1>
        <p className="text-gray-600">Discover networking opportunities and optimize your professional connections</p>
      </div>

      {/* Network Overview Cards */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-blue-600">{insights.totalConnections}</div>
            <div className="text-sm text-gray-600">Total Connections</div>
            <div className="text-xs text-green-600 mt-1">+{insights.growthRate}% this month</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-green-600">{insights.activeConnections}</div>
            <div className="text-sm text-gray-600">Active Connections</div>
            <div className="text-xs text-gray-500 mt-1">{Math.round((insights.activeConnections / insights.totalConnections) * 100)}% engagement rate</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-purple-600">{insights.qualityScore}/100</div>
            <div className="text-sm text-gray-600">Network Quality</div>
            <div className="text-xs text-purple-600 mt-1">Professional score</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-orange-600">{opportunities.length}</div>
            <div className="text-sm text-gray-600">Opportunities</div>
            <div className="text-xs text-orange-600 mt-1">{opportunities.filter(o => o.priority === 'high').length} high priority</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'opportunities', label: 'Opportunities', icon: '🎯' },
              { id: 'connections', label: 'Connections', icon: '👥' },
              { id: 'growth', label: 'Growth', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
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

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && insights && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Industry Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Industry Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(insights.industryBreakdown)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 8)
                      .map(([industry, count]) => (
                        <div key={industry} className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">{industry}</span>
                          <div className="flex items-center">
                            <div 
                              className="bg-blue-500 h-2 rounded mr-2" 
                              style={{ width: `${(count / insights.totalConnections) * 100}px` }}
                            ></div>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Location Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Location Distribution</h3>
                  <div className="space-y-2">
                    {Object.entries(insights.locationBreakdown)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 8)
                      .map(([location, count]) => (
                        <div key={location} className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">{location}</span>
                          <div className="flex items-center">
                            <div 
                              className="bg-green-500 h-2 rounded mr-2" 
                              style={{ width: `${(count / insights.totalConnections) * 100}px` }}
                            ></div>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Engagement Trends */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Engagement Trends</h3>
                <div className="flex space-x-4 items-end h-32">
                  {insights.engagementTrends.map((trend, index) => (
                    <div key={trend.date} className="flex flex-col items-center">
                      <div 
                        className="bg-blue-500 rounded-t w-8"
                        style={{ height: `${(trend.interactions / 100) * 100}px` }}
                      ></div>
                      <span className="text-xs text-gray-600 mt-2">{trend.date.split('-')[1]}</span>
                      <span className="text-xs font-medium">{trend.interactions}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Opportunities Tab */}
          {activeTab === 'opportunities' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex space-x-4">
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Industries</option>
                  <option value="Accounting">Accounting</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Technology">Technology</option>
                </select>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              {/* Opportunities List */}
              <div className="space-y-4">
                {filteredOpportunities.map((opportunity) => (
                  <div key={opportunity.connection.id} className={`border-l-4 rounded-lg p-4 ${getPriorityColor(opportunity.priority)}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-lg mr-2">{getTypeIcon(opportunity.type)}</span>
                          <h4 className="text-lg font-semibold">{opportunity.connection.name}</h4>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            opportunity.priority === 'high' ? 'bg-red-100 text-red-800' :
                            opportunity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {opportunity.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{opportunity.connection.headline}</p>
                        <p className="text-sm text-gray-500 mb-3">
                          {opportunity.connection.company} • {opportunity.connection.location} • 
                          {opportunity.connection.mutualConnections} mutual connections
                        </p>
                        <div className="bg-white rounded p-3 mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Why this matters:</p>
                          <p className="text-sm text-gray-600 mb-2">{opportunity.reason}</p>
                          <p className="text-sm font-medium text-gray-700 mb-1">Suggested action:</p>
                          <p className="text-sm text-blue-600">{opportunity.suggestedAction}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-blue-600">{opportunity.potentialValue}%</div>
                        <div className="text-xs text-gray-500">Potential Value</div>
                        <div className={`text-sm font-medium ${getEngagementColor(opportunity.connection.engagementScore)}`}>
                          Engagement: {opportunity.connection.engagementScore}/100
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-3">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                        Take Action
                      </button>
                      <button className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                        View Profile
                      </button>
                      <button className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connections Tab */}
          {activeTab === 'connections' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex space-x-4">
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Industries</option>
                  <option value="Accounting">Accounting</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Technology">Technology</option>
                </select>
              </div>

              {/* Connections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredConnections.map((connection) => (
                  <div key={connection.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{connection.name}</h4>
                        <p className="text-sm text-gray-600 mb-1">{connection.headline}</p>
                        <p className="text-xs text-gray-500">
                          {connection.company} • {connection.location}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        connection.connectionDegree === '1st' ? 'bg-green-100 text-green-800' :
                        connection.connectionDegree === '2nd' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {connection.connectionDegree}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Engagement:</span>
                        <span className={`font-medium ${getEngagementColor(connection.engagementScore)}`}>
                          {connection.engagementScore}/100
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Mutual:</span>
                        <span className="font-medium text-gray-900">{connection.mutualConnections}</span>
                      </div>
                      {connection.lastInteraction && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Last contact:</span>
                          <span className="font-medium text-gray-900">
                            {connection.lastInteraction.toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <button className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                        Message
                      </button>
                      <button className="flex-1 border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-50">
                        Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Growth Tab */}
          {activeTab === 'growth' && insights && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Growth Metrics */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Growth Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Monthly Growth Rate</span>
                      <span className="text-lg font-bold text-green-600">+{insights.growthRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Quality Score</span>
                      <span className="text-lg font-bold text-blue-600">{insights.qualityScore}/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Engagement Rate</span>
                      <span className="text-lg font-bold text-purple-600">
                        {Math.round((insights.activeConnections / insights.totalConnections) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Growth Recommendations */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Growth Recommendations</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm text-gray-700">Connect with 5-10 professionals weekly</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-yellow-500 mr-2">⚡</span>
                      <span className="text-sm text-gray-700">Engage with posts in your industry daily</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-500 mr-2">📝</span>
                      <span className="text-sm text-gray-700">Share valuable content 2-3 times per week</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-purple-500 mr-2">🎯</span>
                      <span className="text-sm text-gray-700">Focus on quality over quantity connections</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Plan */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">30-Day Action Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-blue-600 mb-2">Week 1-10 Days</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Reconnect with 10 dormant connections</li>
                      <li>• Share 3 industry insights</li>
                      <li>• Comment on 15 relevant posts</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-blue-600 mb-2">Week 2-20 Days</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Connect with 15 new professionals</li>
                      <li>• Publish 2 thought leadership posts</li>
                      <li>• Engage with industry leaders</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-blue-600 mb-2">Week 3-30 Days</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Organize virtual networking event</li>
                      <li>• Create valuable resource content</li>
                      <li>• Analyze and optimize strategy</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LinkedInNetworkAnalyzer;