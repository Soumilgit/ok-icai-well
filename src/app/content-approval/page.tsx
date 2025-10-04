'use client';

import React, { useState, useEffect } from 'react';

interface TrendData {
  title: string;
  category: string;
  relevanceScore: number;
  trendScore: number;
  keywords: string[];
  summary:   const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600 text-yellow-100';
      case 'approved': return 'bg-green-600 text-green-100';
      case 'rejected': return 'bg-red-600 text-red-100';
      case 'published': return 'bg-gray-600 text-gray-100';
      default: return 'bg-gray-700 text-gray-300';
    }
  };}

interface PostForApproval {
  id: string;
  content: string;
  hashtags: string[];
  trendData: TrendData;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  createdAt: string;
  approvedAt?: string;
  publishedAt?: string;
  scheduledFor?: string;
  rejectionReason?: string;
  scheduling?: {
    id: string;
    scheduledFor: string;
    status: string;
    attempts: number;
    error?: string;
  };
  engagementPrediction?: {
    expectedLikes: number;
    expectedComments: number;
    expectedShares: number;
    confidenceScore: number;
  };
}

interface ApprovalStats {
  total: number;
  statusCounts: {
    pending?: number;
    approved?: number;
    rejected?: number;
    published?: number;
  };
  categories: string[];
}

export default function ContentApprovalPage() {
  const [posts, setPosts] = useState<PostForApproval[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [currentStatus, setCurrentStatus] = useState('pending');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedHashtags, setEditedHashtags] = useState<string[]>([]);

  // Load posts on component mount and when filters change
  useEffect(() => {
    loadPosts();
  }, [currentStatus, currentCategory]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: currentStatus,
        category: currentCategory,
        limit: '20'
      });
      
      const response = await fetch(`/api/content-approval?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.data.posts);
        setStats(data.data.stats);
      } else {
        console.error('Failed to load posts:', data.error);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostAction = async (action: string, postIds: string[], additionalData?: any) => {
    try {
      const response = await fetch('/api/content-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          postIds,
          ...additionalData
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Reload posts to reflect changes
        await loadPosts();
        setSelectedPosts(new Set());
        
        // Show success message
        const successCount = data.data.successful;
        const totalCount = data.data.processed;
        alert(`Successfully ${action}ed ${successCount}/${totalCount} posts`);
      } else {
        alert(`Failed to ${action} posts: ${data.error}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing posts:`, error);
      alert(`Error ${action}ing posts`);
    }
  };

  const handleBulkApprove = () => {
    if (selectedPosts.size === 0) {
      alert('Please select posts to approve');
      return;
    }
    
    const scheduledFor = prompt('Schedule for (YYYY-MM-DD HH:MM, leave empty for immediate):');
    handlePostAction('approve', Array.from(selectedPosts), 
      scheduledFor ? { scheduledFor } : {}
    );
  };

  const handleBulkReject = () => {
    if (selectedPosts.size === 0) {
      alert('Please select posts to reject');
      return;
    }
    
    const rejectionReason = prompt('Reason for rejection (optional):');
    handlePostAction('reject', Array.from(selectedPosts), { rejectionReason });
  };

  const handleEditPost = async (postId: string) => {
    try {
      const response = await fetch('/api/content-approval', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          content: editedContent,
          hashtags: editedHashtags
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setEditingPost(null);
        await loadPosts();
        alert('Post updated successfully');
      } else {
        alert(`Failed to update post: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Error updating post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/content-approval?postId=${postId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await loadPosts();
        alert('Post deleted successfully');
      } else {
        alert(`Failed to delete post: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post');
    }
  };

  const togglePostSelection = (postId: string) => {
    const newSelection = new Set(selectedPosts);
    if (newSelection.has(postId)) {
      newSelection.delete(postId);
    } else {
      newSelection.add(postId);
    }
    setSelectedPosts(newSelection);
  };

  const selectAllPosts = () => {
    if (selectedPosts.size === posts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(posts.map(post => post.id)));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const startEditing = (post: PostForApproval) => {
    setEditingPost(post.id);
    setEditedContent(post.content);
    setEditedHashtags([...post.hashtags]);
  };

  const cancelEditing = () => {
    setEditingPost(null);
    setEditedContent('');
    setEditedHashtags([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading content for approval...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Content Approval Dashboard</h1>
          <p className="text-gray-300 mt-2">Review and approve AI-generated LinkedIn content</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-600">
              <div className="text-2xl font-bold text-yellow-400">{stats.statusCounts.pending || 0}</div>
              <div className="text-sm text-gray-300">Pending Approval</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-600">
              <div className="text-2xl font-bold text-green-400">{stats.statusCounts.approved || 0}</div>
              <div className="text-sm text-gray-300">Approved</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-600">
              <div className="text-2xl font-bold text-red-400">{stats.statusCounts.rejected || 0}</div>
              <div className="text-sm text-gray-300">Rejected</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-600">
              <div className="text-2xl font-bold text-blue-400">{stats.statusCounts.published || 0}</div>
              <div className="text-sm text-gray-300">Published</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-gray-800 p-4 rounded-lg shadow mb-6 border border-gray-600">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Filters */}
            <div className="flex gap-4">
              <select
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)}
                className="border border-gray-600 rounded-md px-3 py-2 bg-gray-700 text-white"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="published">Published</option>
                <option value="all">All Status</option>
              </select>

              <select
                value={currentCategory}
                onChange={(e) => setCurrentCategory(e.target.value)}
                className="border border-gray-600 rounded-md px-3 py-2 bg-gray-700 text-white"
              >
                <option value="all">All Categories</option>
                {stats?.categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedPosts.size > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleBulkApprove}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Approve Selected ({selectedPosts.size})
                </button>
                <button
                  onClick={handleBulkReject}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Reject Selected ({selectedPosts.size})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-gray-800 p-8 rounded-lg shadow text-center border border-gray-600">
              <p className="text-gray-300">No posts found for the selected criteria.</p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="bg-gray-800 p-3 rounded-lg shadow flex items-center border border-gray-600">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedPosts.size === posts.length && posts.length > 0}
                    onChange={selectAllPosts}
                    className="mr-2"
                  />
                  Select All ({posts.length} posts)
                </label>
              </div>

              {/* Posts */}
              {posts.map((post) => (
                <div key={post.id} className="bg-gray-800 p-6 rounded-lg shadow border border-gray-600">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedPosts.has(post.id)}
                        onChange={() => togglePostSelection(post.id)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        {/* Post Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
                              {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                            </span>
                            <span className="text-sm text-gray-300">{post.trendData.category}</span>
                            <span className="text-sm text-gray-400">Score: {Math.round(post.trendData.relevanceScore * 100)}%</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(post.createdAt)}
                          </div>
                        </div>

                        {/* Trend Information */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-md">
                          <h4 className="font-medium text-white mb-1">{post.trendData.title}</h4>
                          <p className="text-sm text-gray-300 mb-2">{post.trendData.summary}</p>
                          <div className="flex flex-wrap gap-1">
                            {post.trendData.keywords.map((keyword, index) => (
                              <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Post Content */}
                        {editingPost === post.id ? (
                          <div className="space-y-3 mb-4">
                            <textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-md resize-none"
                              rows={6}
                              placeholder="Post content..."
                            />
                            <input
                              type="text"
                              value={editedHashtags.join(' ')}
                              onChange={(e) => setEditedHashtags(e.target.value.split(' ').filter(tag => tag.trim()))}
                              className="w-full p-2 border border-gray-300 rounded-md"
                              placeholder="Hashtags (space separated)"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditPost(post.id)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-4">
                            <div className="bg-blue-50 p-4 rounded-md mb-3">
                              <pre className="whitespace-pre-wrap text-sm text-white">{post.content}</pre>
                            </div>
                            {post.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {post.hashtags.map((hashtag, index) => (
                                  <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                    {hashtag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Scheduling Info */}
                        {post.scheduling && (
                          <div className="mb-4 p-3 bg-yellow-50 rounded-md">
                            <div className="text-sm">
                              <strong>Scheduled:</strong> {formatDate(post.scheduling.scheduledFor)} 
                              <span className={`ml-2 px-2 py-1 text-xs rounded ${getStatusColor(post.scheduling.status)}`}>
                                {post.scheduling.status}
                              </span>
                            </div>
                            {post.scheduling.error && (
                              <div className="text-sm text-red-600 mt-1">
                                <strong>Error:</strong> {post.scheduling.error}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Engagement Prediction */}
                        {post.engagementPrediction && (
                          <div className="mb-4 p-3 bg-green-50 rounded-md">
                            <div className="text-sm text-gray-300">
                              <strong>Engagement Prediction:</strong> {post.engagementPrediction.expectedLikes} likes, 
                              {' '}{post.engagementPrediction.expectedComments} comments, 
                              {' '}{post.engagementPrediction.expectedShares} shares
                              <span className="ml-2 text-green-600">
                                ({Math.round(post.engagementPrediction.confidenceScore * 100)}% confidence)
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {post.status === 'rejected' && post.rejectionReason && (
                          <div className="mb-4 p-3 bg-red-50 rounded-md">
                            <div className="text-sm text-red-700">
                              <strong>Rejection Reason:</strong> {post.rejectionReason}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex flex-col gap-2">
                      {post.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handlePostAction('approve', [post.id])}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handlePostAction('reject', [post.id], 
                              { rejectionReason: prompt('Reason for rejection:') })}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      
                      {(post.status === 'pending' || post.status === 'rejected') && (
                        <button
                          onClick={() => startEditing(post)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      )}
                      
                      {post.status !== 'published' && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Load More Button */}
        {posts.length >= 20 && (
          <div className="text-center mt-6">
            <button
              onClick={loadPosts}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
            >
              Load More Posts
            </button>
          </div>
        )}
      </div>
    </div>
  );
}