'use client';

import { useState, useEffect } from 'react';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import WritingVoiceQuestionnaire from '@/components/WritingVoiceQuestionnaire';
import LinkedInAutomation from '@/components/LinkedInAutomation';
import ContentRepurposing from '@/components/ContentRepurposing';
import CaseStudyGenerator from '@/components/CaseStudyGenerator';
import ICAIComplianceChecker from '@/components/ICAIComplianceChecker';
import LinkedInNetworkAnalyzer from '@/components/LinkedInNetworkAnalyzer';
import ImageGenerator from '@/components/ImageGenerator';
import UnifiedContentCreator from '@/app/components/UnifiedContentCreator';
import DiscoverFeed from '@/app/components/DiscoverFeed';
import ComplianceCenter from '@/app/components/ComplianceCenter';
import TwitterPostCreator from '@/app/components/TwitterPostCreator';
import EnhancedContentHub from '@/app/components/EnhancedContentHub';

import WebLinksComponent from '@/components/WebLinksComponent';
import PerplexityNewsModal from '@/components/PerplexityNewsModal';
import LinkedInPostGenerator from '@/app/components/LinkedInPostGenerator';
import TwitterPostGenerator from '@/app/components/TwitterPostGenerator';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'content' | 'automation' | 'exam-gen' | 'workflow' | 'chat' | 'marketing' | 'questionnaire' | 'linkedin' | 'repurposing' | 'case-studies' | 'compliance' | 'network' | 'images' | 'unified-creator' | 'discover' | 'twitter' | 'enhanced-hub'>('overview');
  
  // Domain-based access control (aminutemantechnologies.com only)
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || '';
  const aminuteDomainRegex = /^[a-zA-Z0-9._%+-]+@aminutemantechnologies\.com$/i;
  const hasWorkflowAccess = aminuteDomainRegex.test(userEmail);
  const [runningAutomation, setRunningAutomation] = useState(false);
  
  // Chat interface state
  const [examResults, setExamResults] = useState<any[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMode, setChatMode] = useState<'general' | 'ca-assistant' | 'seo-content' | 'marketing-strategy'>('general');
  
  // User preferences state
  const [userPreferences, setUserPreferences] = useState<any>(null);
  
  // Content viewing state
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  
  // Top news state
  const [topNews, setTopNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  
  // Perplexity News Modal state
  const [selectedNewsItem, setSelectedNewsItem] = useState<any>(null);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  
  // Automation notifications
  const [automationNotifications, setAutomationNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Sidebar state - auto-collapse for new users
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Check if user has previously set sidebar preference
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebarOpen');
      return savedState ? JSON.parse(savedState) : false; // Default collapsed for new users
    }
    return false;
  });
  const [mouseNearLeft, setMouseNearLeft] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  
  // Email testing state
  const [showEmailTesting, setShowEmailTesting] = useState(false);
  const [emailTestForm, setEmailTestForm] = useState({
    recipientEmail: '',
    recipientName: '',
    emailType: 'tax-update',
    testContent: ''
  });
  const [emailTestResult, setEmailTestResult] = useState<any>(null);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  // Google Sheets Workflow state
  const [showSheetsWorkflow, setShowSheetsWorkflow] = useState(false);
  const [sheetsWorkflowType, setSheetsWorkflowType] = useState<'drafting' | 'auditing' | 'analytics'>('drafting');
  const [workflowSpreadsheetId, setWorkflowSpreadsheetId] = useState(process.env.NEXT_PUBLIC_DEFAULT_CA_SPREADSHEET_ID || '');
  const [workflowAnalytics, setWorkflowAnalytics] = useState<any>(null);
  const [workflowTasks, setWorkflowTasks] = useState<any[]>([]);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [draftingForm, setDraftingForm] = useState({
    clientName: '',
    documentType: 'Tax Return',
    priority: 'Medium',
    content: '',
    dueDate: new Date().toISOString().split('T')[0]
  });
  const [auditingForm, setAuditingForm] = useState({
    clientName: '',
    auditType: 'Statutory Audit',
    riskLevel: 'Medium',
    findings: ''
  });

  useEffect(() => {
    if (isLoaded) {
      // If user is not authenticated, redirect to home page
      if (!user) {
        router.push('/');
        return;
      }
      
      fetchDashboardData();
      loadUserPreferences();
      fetchTopNews(); // Fetch top news on initial load
      
      // Check for URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const linkedinConnected = urlParams.get('linkedin_connected');
      const message = urlParams.get('message');
      
      if (error === 'domain_access_denied') {
        setError('Access Denied: Workflow builder is only available for @aminutemantechnologies.com email addresses.');
      } else if (error && error.includes('linkedin')) {
        setError(`LinkedIn Error: ${decodeURIComponent(message || error)}`);
      } else if (linkedinConnected === 'true') {
        // Show success message for LinkedIn connection
        alert('Successfully connected to LinkedIn! You can now use LinkedIn automation features.');
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [isLoaded]);

  // Mouse tracking for auto-open sidebar (throttled for performance)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isNearLeft = false;

    const handleMouseMove = (e: MouseEvent) => {
      // Throttle mouse move events for better performance
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const nearLeft = e.clientX <= 30;
        
        if (nearLeft && !isNearLeft) {
          isNearLeft = true;
          setMouseNearLeft(true);
          setSidebarOpen(true);
        } else if (!nearLeft && isNearLeft) {
          isNearLeft = false;
          setMouseNearLeft(false);
        }
      }, 50); // Throttle to 20fps
    };

    const handleMouseLeave = () => {
      isNearLeft = false;
      setMouseNearLeft(false);
    };

    // Add event listeners with passive option for better performance
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
    }
  }, [sidebarOpen]);

  const loadUserPreferences = () => {
    try {
      const saved = localStorage.getItem('writing_voice_preferences');
      if (saved) {
        setUserPreferences(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const handleQuestionnaireComplete = (preferences: any) => {
    setUserPreferences(preferences);
    setActiveTab('overview'); // Redirect to overview after completion
  };

  const handleLinkedInAutomation = async (action: string) => {
    setRunningAutomation(true);
    try {
      const response = await fetch('/api/linkedin-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: action })
      });
      
      const result = await response.json();
      
      if (result.success) {
        let message = '';
        switch (action) {
          case 'generate_content':
            message = `Generated ${result.data?.data?.postsGenerated || 0} new posts from latest trends!`;
            break;
          case 'schedule_posts':
            message = `Scheduled ${result.data?.data?.postsScheduled || 0} approved posts!`;
            break;
          case 'post_now':
            message = `Posted ${result.data?.data?.postsPublished || 0} approved posts immediately to LinkedIn!`;
            break;
          case 'full_pipeline':
            message = `Full pipeline completed! Check the content approval dashboard.`;
            break;
        }
        alert(message);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('LinkedIn automation error:', error);
      alert('Failed to trigger LinkedIn automation');
    } finally {
      setRunningAutomation(false);
    }
  };

  const handleLinkedInAuth = async () => {
    try {
      const response = await fetch('/api/linkedin-auth');
      if (response.ok) {
        const data = await response.json();
        // Open LinkedIn authorization in a popup
        const popup = window.open(data.data.authUrl, 'linkedin-auth', 'width=600,height=700,scrollbars=yes,resizable=yes');
        
        // Listen for messages from the popup
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'linkedin_auth_success') {
            window.removeEventListener('message', messageHandler);
            alert('LinkedIn connected successfully! You can now post to LinkedIn.');
            // Refresh to update the authentication status
            window.location.reload();
          } else if (event.data.type === 'linkedin_auth_error') {
            window.removeEventListener('message', messageHandler);
            alert(`LinkedIn authentication failed: ${event.data.error}`);
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Fallback: Monitor the popup for completion
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            // Small delay before refresh in case message didn't arrive
            setTimeout(() => {
              if (!document.hidden) { // Only reload if page is visible
                console.log('Popup closed, checking authentication status...');
                // Instead of full reload, just check if auth worked
                fetch('/api/linkedin-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check_auth' }) })
                  .then(res => res.json())
                  .then(result => {
                    if (result.success) {
                      alert('LinkedIn authentication completed!');
                      window.location.reload();
                    }
                  });
              }
            }, 2000);
          }
        }, 1000);
      } else {
        alert('Failed to initiate LinkedIn authentication');
      }
    } catch (error) {
      console.error('LinkedIn auth error:', error);
      alert('Error connecting to LinkedIn');
    }
  };

  const handleTestLinkedInPost = async () => {
    try {
      const response = await fetch('/api/linkedin-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `Test post from AccountantAI - LinkedIn integration is working! 🎉\n\nTimestamp: ${new Date().toLocaleString()}`
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Test post successful! Check your LinkedIn profile.');
      } else {
        const error = await response.json();
        alert(`Test post failed: ${error.error || 'Unknown error'}\n\nTip: Make sure you\'ve connected your LinkedIn account first!`);
      }
    } catch (error) {
      console.error('LinkedIn test post error:', error);
      alert('Error testing LinkedIn post');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      
      // Handle authentication errors
      if (response.status === 401) {
        router.push('/sign-in');
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
        setError(null); // Clear any previous errors
      } else {
        setError(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to connect to server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopNews = async () => {
    try {
      setNewsLoading(true);
      const response = await fetch('/api/news/enhanced?topNews=true&limit=3');
      const result = await response.json();
      
      if (result.success) {
        setTopNews(result.data.news);
      } else {
        console.error('Failed to fetch top news:', result.error);
      }
    } catch (err) {
      console.error('Error fetching top news:', err);
    } finally {
      setNewsLoading(false);
    }
  };

  const handleNewsClick = (newsItem: any) => {
    setSelectedNewsItem(newsItem);
    setIsNewsModalOpen(true);
  };

  const closeNewsModal = () => {
    setIsNewsModalOpen(false);
    setSelectedNewsItem(null);
  };

  const runDailyAutomation = async () => {
    try {
      setRunningAutomation(true);
      
      // Add notification that automation is starting
      const startNotification = {
        id: Date.now(),
        type: 'info',
        title: 'Automation Started',
        message: 'Daily automation pipeline is running...',
        timestamp: new Date()
      };
      setAutomationNotifications(prev => [startNotification, ...prev]);
      setShowNotifications(true);
      
      const response = await fetch('/api/automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'full_pipeline' }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Add success notification with details
        const successNotification = {
          id: Date.now() + 1,
          type: 'success',
          title: 'Automation Completed Successfully!',
          message: `Pipeline completed with ${result.steps?.length || 0} steps. Check Generated Content for new articles.`,
          timestamp: new Date(),
          details: result
        };
        setAutomationNotifications(prev => [successNotification, ...prev]);
        
        // Refresh dashboard data to show new content
        await fetchDashboardData();
        
        // Switch to content tab to show results
        setActiveTab('content');
      } else {
        // Add error notification
        const errorNotification = {
          id: Date.now() + 2,
          type: 'error',
          title: 'Automation Failed',
          message: result.error || 'Automation pipeline encountered errors',
          timestamp: new Date(),
          details: result
        };
        setAutomationNotifications(prev => [errorNotification, ...prev]);
      }
    } catch (err) {
      const errorNotification = {
        id: Date.now() + 3,
        type: 'error',
        title: 'Connection Error',
        message: 'Failed to connect to automation service',
        timestamp: new Date()
      };
      setAutomationNotifications(prev => [errorNotification, ...prev]);
    } finally {
      setRunningAutomation(false);
    }
  };

  const generateExamQuestions = async (topic: string) => {
    try {
      setIsGenerating(true);
      setCurrentTopic(topic);
      
      // Add user message to chat
      const userMessage = {
        type: 'user',
        content: `Generate ${topic} exam questions`,
        timestamp: new Date()
      };
      setExamResults(prev => [...prev, userMessage]);

      const response = await fetch('/api/content/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count: 10 }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Add AI response to chat
        const aiMessage = {
          type: 'ai',
          content: result.examContent?.content || 'Exam questions generated successfully!',
          timestamp: new Date(),
          title: result.examContent?.title || `${topic} Exam Questions`
        };
        setExamResults(prev => [...prev, aiMessage]);
      } else {
        // Add error message to chat
        const errorMessage = {
          type: 'error',
          content: result.error || 'Failed to generate questions',
          timestamp: new Date()
        };
        setExamResults(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      const errorMessage = {
        type: 'error',
        content: 'Failed to generate exam questions',
        timestamp: new Date()
      };
      setExamResults(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateContent = async (type: string) => {
    try {
      const topic = prompt(`Enter topic for ${type}:`);
      if (!topic) return;

      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, topic }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`${type} generated successfully!`);
        fetchDashboardData();
      } else {
        alert(result.error || 'Failed to generate content');
      }
    } catch (err) {
      alert('Failed to generate content');
    }
  };

  // Content filtering function to remove think tags and meta-commentary
  const filterDisplayContent = (content: string): string => {
    if (!content) return '';
    
    // Remove <think> tags and everything inside them (multiple patterns)
    let filtered = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
    filtered = filtered.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    filtered = filtered.replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, '');
    filtered = filtered.replace(/\*\*thinking\*\*[\s\S]*?\*\*\/thinking\*\*/gi, '');
    
    // Remove other common thinking patterns
    filtered = filtered.replace(/\*\*Thinking:\*\*[\s\S]*?(?=\n\n|\n\*\*|$)/gi, '');
    filtered = filtered.replace(/\*Thinking\*:[\s\S]*?(?=\n\n|\n\*|$)/gi, '');
    filtered = filtered.replace(/Let me think[\s\S]*?(?=\n\n|$)/gi, '');
    filtered = filtered.replace(/First, I need to[\s\S]*?(?=\n\n|$)/gi, '');
    filtered = filtered.replace(/I'll analyze[\s\S]*?(?=\n\n|$)/gi, '');
    filtered = filtered.replace(/Analysis:[\s\S]*?(?=\n\n|\n[A-Z#])/gi, '');
    
    // Remove meta-commentary phrases and introductory sentences
    filtered = filtered.replace(/^(Here is|Here's|Based on|I will|Let me|Okay,|I'll|Let's|Now,)[\s\S]*?(?=\n\n|\n[A-Z#])/gm, '');
    filtered = filtered.replace(/^(Here is a|Here's a|This is a|I've created a|I've prepared a)[\s\S]*?(?=\n\n|\n[A-Z#])/gm, '');
    
    // Remove process explanation sentences
    filtered = filtered.replace(/^(To create this|In creating this|For this|When writing this)[\s\S]*?(?=\n\n|\n[A-Z#])/gm, '');
    
    // Remove lines that are purely process-oriented
    filtered = filtered.replace(/^.*?(analyzing|considering|examining|reviewing|evaluating).*?$/gmi, '');
    
    // Clean up extra whitespace and empty lines
    filtered = filtered.replace(/\n\s*\n\s*\n/g, '\n\n');
    filtered = filtered.replace(/^\s*\n+/, ''); // Remove leading empty lines
    filtered = filtered.trim();
    
    return filtered;
  };

  // Content viewing functions
  const viewContent = (content: any) => {
    // Filter the content before displaying
    const filteredContent = {
      ...content,
      content: filterDisplayContent(content.content)
    };
    setSelectedContent(filteredContent);
    setShowContentModal(true);
  };

  const closeContentModal = () => {
    setSelectedContent(null);
    setShowContentModal(false);
    setIsEditingContent(false);
    setEditedContent('');
    setEditedTitle('');
  };

  // Edit content functions
  const startEditingContent = () => {
    if (selectedContent) {
      setIsEditingContent(true);
      setEditedContent(selectedContent.content);
      setEditedTitle(selectedContent.title);
    }
  };

  const cancelEditing = () => {
    setIsEditingContent(false);
    setEditedContent('');
    setEditedTitle('');
  };

  const saveEditedContent = async () => {
    try {
      console.log('Saving content:', {
        id: selectedContent._id,
        title: editedTitle,
        content: editedContent.substring(0, 100) + '...'
      });

      const response = await fetch('/api/content/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedContent._id,
          title: editedTitle,
          content: editedContent
        }),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        alert(`Server error (${response.status}): ${errorText}`);
        return;
      }
      
      const result = await response.json();
      console.log('Update result:', result);
      
      if (result.success) {
        // Update the selected content with new values
        setSelectedContent({
          ...selectedContent,
          title: editedTitle,
          content: editedContent,
          updatedAt: new Date()
        });
        setIsEditingContent(false);
        fetchDashboardData(); // Refresh the dashboard
        alert('Content updated successfully!');
      } else {
        console.error('Update failed:', result.error);
        alert(result.error || 'Failed to update content');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert(`Failed to update content: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Email testing function
  const sendTestEmail = async () => {
    try {
      setSendingTestEmail(true);
      setEmailTestResult(null);

      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailTestForm)
      });

      const result = await response.json();

      if (result.success) {
        setEmailTestResult(result);
        alert('Test email sent successfully! Check the preview below.');
      } else {
        alert(result.error || 'Failed to send test email');
      }
    } catch (err) {
      console.error('Email test error:', err);
      alert(`Failed to send test email: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSendingTestEmail(false);
    }
  };

  // Google Sheets Workflow Functions
  const createCAWorksheet = async () => {
    try {
      setLoadingWorkflow(true);
      
      const response = await fetch('/api/ca-workflow/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createWorksheet',
          caFirmName: 'Your CA Firm'
        })
      });

      const result = await response.json();

      if (result.success) {
        setWorkflowSpreadsheetId(result.spreadsheetId);
        alert(`CA Workflow spreadsheet created! Opening: ${result.spreadsheetUrl}`);
        window.open(result.spreadsheetUrl, '_blank');
      } else {
        alert(result.error || 'Failed to create worksheet');
      }
    } catch (err) {
      console.error('Worksheet creation error:', err);
      alert(`Failed to create worksheet: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoadingWorkflow(false);
    }
  };

  const addDraftingTask = async () => {
    if (!workflowSpreadsheetId) {
      alert('Please create or set a spreadsheet ID first');
      return;
    }

    try {
      setLoadingWorkflow(true);
      
      const response = await fetch('/api/ca-workflow/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addDraftingTask',
          spreadsheetId: workflowSpreadsheetId,
          ...draftingForm
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`Drafting task added successfully! Assigned to: ${result.assignedCA}`);
        // Reset form
        setDraftingForm({
          clientName: '',
          documentType: 'Tax Return',
          priority: 'Medium',
          content: '',
          dueDate: new Date().toISOString().split('T')[0]
        });
        // Refresh tasks
        loadWorkflowTasks();
      } else {
        alert(result.error || 'Failed to add drafting task');
      }
    } catch (err) {
      console.error('Add drafting task error:', err);
      alert(`Failed to add drafting task: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoadingWorkflow(false);
    }
  };

  const addAuditingTask = async () => {
    if (!workflowSpreadsheetId) {
      alert('Please create or set a spreadsheet ID first');
      return;
    }

    try {
      setLoadingWorkflow(true);
      
      const response = await fetch('/api/ca-workflow/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addAuditingTask',
          spreadsheetId: workflowSpreadsheetId,
          ...auditingForm
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`Auditing task added successfully! Assigned to: ${result.auditor}`);
        // Reset form
        setAuditingForm({
          clientName: '',
          auditType: 'Statutory Audit',
          riskLevel: 'Medium',
          findings: ''
        });
        // Refresh tasks
        loadWorkflowTasks();
      } else {
        alert(result.error || 'Failed to add auditing task');
      }
    } catch (err) {
      console.error('Add auditing task error:', err);
      alert(`Failed to add auditing task: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoadingWorkflow(false);
    }
  };

  const loadWorkflowAnalytics = async () => {
    if (!workflowSpreadsheetId) return;

    try {
      const response = await fetch(`/api/ca-workflow/sheets?spreadsheetId=${workflowSpreadsheetId}&action=analytics`);
      const result = await response.json();

      if (result.success) {
        setWorkflowAnalytics(result.analytics);
      }
    } catch (err) {
      console.error('Load analytics error:', err);
    }
  };

  const loadWorkflowTasks = async () => {
    if (!workflowSpreadsheetId) return;

    try {
      const sheetType = sheetsWorkflowType === 'drafting' ? 'drafting' : 'auditing';
      const response = await fetch(`/api/ca-workflow/sheets?spreadsheetId=${workflowSpreadsheetId}&action=${sheetType}`);
      const result = await response.json();

      if (result.success) {
        setWorkflowTasks(result.tasks);
      }
    } catch (err) {
      console.error('Load tasks error:', err);
    }
  };

  // Load workflow data when spreadsheet ID changes
  useEffect(() => {
    if (workflowSpreadsheetId && showSheetsWorkflow) {
      loadWorkflowAnalytics();
      loadWorkflowTasks();
    }
  }, [workflowSpreadsheetId, showSheetsWorkflow, sheetsWorkflowType]);

  // Removed auto-refresh for better performance - data will be fetched on demand only

  // Show loading state
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading CA Law Portal Dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if not authenticated (this prevents red error screen)
  if (isLoaded && !user) {
    router.push('/');
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-700 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-200 mb-4 text-xl">Error: {error}</p>
          <button 
            onClick={fetchDashboardData}
            className="bg-white text-red-800 px-6 py-3 rounded-full hover:bg-gray-200 transition-colors font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex relative">
      {/* Sidebar - Always Visible - Adjusted for global navigation */}
      <div className={`fixed inset-y-0 left-0 z-40 bg-gray-900/95 backdrop-blur-lg border-r border-gray-700 transition-all duration-300 ease-out ${sidebarOpen ? 'w-80' : 'w-16'} pt-16`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-700">
            <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
              {sidebarOpen ? (
                <>
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-walsheim)' }}>
                    CA Portal
                  </h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded"
                    title="Collapse sidebar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </>
              ) : (
                <div className="text-blue-400">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar Content */}
          <div className={`flex-1 overflow-y-auto ${sidebarOpen ? 'p-6' : 'p-2'}`} style={{ fontFamily: 'var(--font-walsheim)' }}>
            <div className={`${sidebarOpen ? 'space-y-6' : 'space-y-3'}`}>

              {/* Enhanced Content Hub */}
              <div className="relative group">
                <button 
                  onClick={() => setActiveTab('enhanced-hub')}
                  className={`w-full text-left transition-all duration-300 hover:bg-gray-800 rounded ${sidebarOpen ? 'p-3 text-sm text-gray-300 hover:text-white flex items-center' : 'p-2 flex justify-center'}`}
                  title={!sidebarOpen ? 'Enhanced Content Hub' : ''}
                >
                  <svg className={`text-gray-400 ${sidebarOpen ? 'w-5 h-5 mr-3' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {sidebarOpen && 'Enhanced Content Hub'}
                </button>
                
                {/* Hover Dropdown */}
                <div className="absolute top-full left-0 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 origin-top z-50">
                  <div className="p-3">
                    <h4 className="text-white font-semibold mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Enhanced Content Hub
                    </h4>
                    <div className="space-y-1">
                      <button 
                        onClick={() => setActiveTab('enhanced-hub')}
                        className="w-full text-left p-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                      >
                        Content Generator
                      </button>
                      <button 
                        onClick={() => setActiveTab('twitter')}
                        className="w-full text-left p-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                      >
                        Twitter Post Creator
                      </button>
                      <button 
                        onClick={() => setActiveTab('linkedin')}
                        className="w-full text-left p-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                      >
                        LinkedIn Post Creator
                      </button>
                      <button 
                        onClick={() => setActiveTab('unified-creator')}
                        className="w-full text-left p-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                      >
                        Unified Creator
                      </button>
                      <button 
                        onClick={() => setActiveTab('discover')}
                        className="w-full text-left p-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                      >
                        Discover Feed
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Case Study Generator */}
              <div className="relative group">
                <button 
                  onClick={() => setActiveTab('case-studies')}
                  className={`w-full text-left transition-all duration-300 hover:bg-gray-800 rounded ${sidebarOpen ? 'p-3 text-sm text-gray-300 hover:text-white flex items-center' : 'p-2 flex justify-center'}`}
                  title={!sidebarOpen ? 'Case Study Generator' : ''}
                >
                  <svg className={`text-gray-400 ${sidebarOpen ? 'w-5 h-5 mr-3' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd"/>
                  </svg>
                  {sidebarOpen && 'Case Study Generator'}
                </button>
                
                {/* Hover Dropdown */}
                <div className="absolute top-full left-0 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 origin-top z-50">
                  <div className="p-3">
                    <h4 className="text-white font-semibold mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd"/>
                      </svg>
                      Case Study Generator
                    </h4>
                    <div className="space-y-1">
                      <button 
                        onClick={() => setActiveTab('case-studies')}
                        className="w-full text-left p-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                      >
                        Create Case Study
                      </button>
                      <button 
                        onClick={() => setActiveTab('repurposing')}
                        className="w-full text-left p-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                      >
                        Content Repurposing
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Voice Setup */}
              <div className="relative group">
                <button 
                  onClick={() => setActiveTab('writing-voice')}
                  className={`w-full text-left transition-all duration-300 hover:bg-gray-800 rounded ${sidebarOpen ? 'p-3 text-sm text-gray-300 hover:text-white flex items-center' : 'p-2 flex justify-center'}`}
                  title={!sidebarOpen ? 'Voice Setup' : ''}
                >
                  <svg className={`text-gray-400 ${sidebarOpen ? 'w-5 h-5 mr-3' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
                  </svg>
                  {sidebarOpen && 'Voice Setup'}
                </button>
                
                {/* Hover Dropdown */}
                <div className="absolute top-full left-0 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 origin-top z-50">
                  <div className="p-3">
                    <h4 className="text-white font-semibold mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
                      </svg>
                      Voice Setup
                    </h4>
                    <div className="space-y-1">
                      <button 
                        onClick={() => setActiveTab('writing-voice')}
                        className="w-full text-left p-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                      >
                        Writing Voice Setup
                      </button>
                      <button 
                        onClick={() => setActiveTab('icai-center')}
                        className="w-full text-left p-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                      >
                        ICAI Compliance Link
                      </button>
                    </div>
                  </div>
                </div>
              </div>




              





            </div>
          </div>
        </div>
      </div>
      
      {/* Background Blur Glass Effect when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main Content - Adjusted for global navigation */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-16'} pt-16`}>
        {/* Dashboard Header - Below global navigation */}
        <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {/* Hamburger Menu Button */}
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-105"
                title="Open workflows sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button 
                onClick={() => setActiveTab('overview')}
                className="text-2xl font-bold hover:text-blue-400 transition-colors cursor-pointer"
                title="Return to Dashboard Home"
              >
                CA Law Portal
              </button>
              <span className="bg-green-500 text-xs px-2 py-1 rounded-full">Live</span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Global Search */}
              <button
                onClick={() => setActiveTab('search')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Global Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              {/* Notifications Bell */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {automationNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {automationNotifications.length}
                  </span>
                )}
              </button>
              
              <div className="text-sm">
                <p>Welcome, {user?.firstName || 'User'}</p>
                <p className="text-gray-300">{user?.emailAddresses[0]?.emailAddress}</p>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="Profile" className="w-8 h-8 rounded-full" />
                ) : (
                  <span className="text-sm font-bold">{user?.firstName?.[0] || 'U'}</span>
                )}
              </div>
              <SignOutButton>
                <button className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="absolute top-full right-6 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Automation Notifications</h3>
                <button
                  onClick={() => setAutomationNotifications([])}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {automationNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                automationNotifications.map((notification, index) => (
                  <div key={index} className="p-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <span className={`text-lg ${notification.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top News Section */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <span className="mr-2">📰</span>
                  Top CA & Finance News
                </h2>
                <button 
                  onClick={() => setActiveTab('news')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View All →
                </button>
              </div>
              
              {newsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse bg-white/10 rounded-lg p-4 h-32"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topNews.map((news, index) => (
                    <div 
                      key={news.id} 
                      onClick={() => handleNewsClick(news)}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:border-white/30 transition-all cursor-pointer group hover:bg-white/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-gray-400">{news.source}</span>
                      </div>
                      
                      <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                        {news.title}
                      </h3>
                      
                      <p className="text-xs text-gray-300 line-clamp-3 mb-3">
                        {news.content}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400">
                              {new Date(news.publishedAt).toLocaleTimeString('en-IN', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {news.relevanceScore > 0.7 && (
                              <span className="bg-orange-600/20 text-orange-400 px-2 py-0.5 rounded-full text-xs">
                                High Relevance
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            {news.categories?.slice(0, 2).map((cat) => (
                              <span key={cat} className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full text-xs">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {/* Relevant Web Links */}
                        {news.relevantLinks && news.relevantLinks.length > 0 && (
                          <div className="border-t border-white/10 pt-2">
                            <p className="text-xs text-gray-400 mb-1">Related Links:</p>
                            <div className="flex flex-wrap gap-1">
                              {news.relevantLinks.slice(0, 2).map((link, linkIndex) => (
                                <a
                                  key={linkIndex}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center px-2 py-1 text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-full transition-colors"
                                  title={link.source}
                                >
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                                  </svg>
                                  {link.title.length > 15 ? link.title.substring(0, 15) + '...' : link.title}
                                </a>
                              ))}
                              {news.relevantLinks.length > 2 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    alert(`All links:\n${news.relevantLinks.map(l => `• ${l.title}: ${l.url}`).join('\n')}`);
                                  }}
                                  className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-full bg-blue-600/10 hover:bg-blue-600/20 transition-colors"
                                >
                                  +{news.relevantLinks.length - 2} more
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Hover Actions */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-3 pt-3 border-t border-white/10">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab('enhanced-hub');
                                // You can add logic here to pre-fill the content generator with this news
                              }}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Generate Post</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab('news');
                              }}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-xs transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>See More</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300">Daily News</p>
                    <p className="text-2xl font-bold">{dashboardData?.overview?.today?.newsArticles || 47}</p>
                  </div>
                  <div className="text-2xl">📰</div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300">Generated Content</p>
                    <p className="text-2xl font-bold">{dashboardData?.overview?.today?.generatedContent || 23}</p>
                  </div>
                  <div className="text-2xl">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300">LinkedIn Posts</p>
                    <p className="text-2xl font-bold">{dashboardData?.overview?.today?.linkedinPosts || 8}</p>
                  </div>
                  <div className="text-2xl">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300">Repurposed Content</p>
                    <p className="text-2xl font-bold">{dashboardData?.overview?.today?.repurposedContent || 15}</p>
                  </div>
                  <div className="text-2xl">�</div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300">AI Images</p>
                    <p className="text-2xl font-bold">{dashboardData?.overview?.today?.aiImages || 12}</p>
                  </div>
                  <div className="text-2xl text-purple-400">●</div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300">Compliance Checks</p>
                    <p className="text-2xl font-bold">{dashboardData?.overview?.today?.complianceChecks || 6}</p>
                  </div>
                  <div className="text-2xl text-green-400">●</div>
                </div>
              </div>
            </div>

            {/* New Features Overview */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold mb-4">🆕 Enhanced AI-Powered Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('unified-creator')}
                  className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 rounded-lg transition-all hover:scale-105 text-left border border-gray-600"
                >
                  <div className="text-2xl mb-2 text-blue-400">●</div>
                  <div className="font-semibold">Unified Content Creator</div>
                  <div className="text-sm text-gray-300">Quiz + AI Research + Images in one place</div>
                </button>
                
                <button
                  onClick={() => setActiveTab('discover')}
                  className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 rounded-lg transition-all hover:scale-105 text-left border border-gray-600"
                >
                  <div className="text-2xl mb-2">�</div>
                  <div className="font-semibold">Discover Feed</div>
                  <div className="text-sm text-gray-300">Latest 2025 news with instant post creation</div>
                </button>

                <button
                  onClick={() => setActiveTab('twitter')}
                  className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 rounded-lg transition-all hover:scale-105 text-left border border-gray-600"
                >
                  <div className="text-2xl mb-2">𝕏</div>
                  <div className="font-semibold">X (Twitter) Automation</div>
                  <div className="text-sm text-gray-300">ICAI-compliant Twitter posting</div>
                </button>
                
                <button
                  onClick={() => setActiveTab('linkedin')}
                  className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 rounded-lg transition-all hover:scale-105 text-left"
                >
                  <div className="text-2xl mb-2">�</div>
                  <div className="font-semibold">LinkedIn Automation</div>
                  <div className="text-sm text-gray-300">Professional network posting</div>
                </button>
                
                <button
                  onClick={() => setActiveTab('compliance')}
                  className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 rounded-lg transition-all hover:scale-105 text-left border border-gray-600"
                >
                  <div className="text-2xl mb-2">⚖️</div>
                  <div className="font-semibold">ICAI Compliance Center</div>
                  <div className="text-sm text-gray-300">Guidelines check + plagiarism detection</div>
                </button>
                
                <button
                  onClick={() => setActiveTab('case-studies')}
                  className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 rounded-lg transition-all hover:scale-105 text-left"
                >
                  <div className="text-2xl mb-2 text-green-400">●</div>
                  <div className="font-semibold">Case Study Generator</div>
                  <div className="text-sm text-gray-300">Professional case studies</div>
                </button>
              </div>
            </div>



            {/* Platform Capabilities Overview */}
            <div className="bg-black rounded-xl p-6 border border-gray-600">
              <h2 className="text-xl font-bold mb-6 text-white">Complete AI-Powered CA Platform</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Content Creation & Personalization */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-600 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-lg font-semibold mb-3 text-white">Content Creation</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Personalized Writing Voices (5 types)</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>100+ Swipe File Templates</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Content Repurposing (6+ formats)</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Case Study Generator</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>AI Image Generation</li>
                  </ul>
                </div>

                {/* LinkedIn & Social Media */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-600 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-lg font-semibold mb-3 text-white">LinkedIn Automation</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Custom & Full Automation</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Direct Publishing</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Post Scheduling</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Network Analysis</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Engagement Tracking</li>
                  </ul>
                </div>

                {/* Compliance & News */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-600 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-lg font-semibold mb-3 text-white">Compliance & News</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>ICAI Compliance Checking</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Daily News Scraping (8 sources)</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Regulatory Updates</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Violation Detection</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Improvement Suggestions</li>
                  </ul>
                </div>

                {/* AI & Automation */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-600 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-lg font-semibold mb-3 text-white">AI & Automation</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Perplexity AI Integration</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Smart Content Analysis</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Automated Workflows</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Real-time Processing</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Intelligent Categorization</li>
                  </ul>
                </div>

                {/* Analytics & Insights */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-600 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-lg font-semibold mb-3 text-white">Analytics & Insights</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Network Growth Analysis</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Content Performance</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Engagement Metrics</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Opportunity Identification</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Professional Scoring</li>
                  </ul>
                </div>

                {/* Education & Learning */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-600 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-lg font-semibold mb-3 text-white">Education & Learning</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Exam Question Generation</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Topic-based Learning</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Knowledge Base Access</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>CA-specific Guidance</li>
                    <li className="flex items-center text-white"><span className="text-green-400 mr-2">✓</span>Professional Development</li>
                  </ul>
                </div>
              </div>

              {/* Getting Started Guide */}
              <div className="mt-6 bg-black rounded-lg p-6 border border-gray-600">
                <h3 className="text-lg font-semibold mb-4 text-white">Quick Start Guide</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-gray-700 to-gray-500 rounded-lg p-4 border border-gray-500">
                    <div className="font-semibold text-white mb-1">Setup Your Voice</div>
                    <div className="text-sm text-gray-300">Complete the writing voice questionnaire to personalize your content</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-700 to-gray-500 rounded-lg p-4 border border-gray-500">
                    <div className="font-semibold text-white mb-1">Connect LinkedIn</div>
                    <div className="text-sm text-gray-300">Authorize LinkedIn integration for automated posting and analytics</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-700 to-gray-500 rounded-lg p-4 border border-gray-500">
                    <div className="font-semibold text-white mb-1">Create Content</div>
                    <div className="text-sm text-gray-300">Generate personalized content and repurpose across platforms</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-700 to-gray-500 rounded-lg p-4 border border-gray-500">
                    <div className="font-semibold text-white mb-1">Monitor & Optimize</div>
                    <div className="text-sm text-gray-300">Track performance and optimize your professional network</div>
                  </div>
                </div>
              </div>
            </div>


          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">📰 Latest CA Law News</h2>
              <button
                onClick={() => runDailyAutomation()}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh News
              </button>
            </div>
            
            <div className="grid gap-6">
              {dashboardData?.recent?.news?.map((article: any, index: number) => (
                <div 
                  key={index} 
                  onClick={() => handleNewsClick({
                    id: article.id || index.toString(),
                    title: article.title,
                    content: article.content,
                    summary: article.summary,
                    source: article.source,
                    publishedAt: article.publishedAt,
                    category: article.category,
                    categories: article.categories || [article.category],
                    url: article.url
                  })}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 cursor-pointer hover:bg-white/20 hover:border-white/40 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{article.title}</h3>
                      <p className="text-gray-300 mb-2">{article.source} • {new Date(article.publishedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex space-x-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-blue-600">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags?.map((tag: string) => (
                      <span key={tag} className="text-xs px-2 py-1 bg-white/20 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Web Links for News Articles */}
                  <WebLinksComponent 
                    headline={article.title}
                    categories={article.category ? [article.category] : []}
                    maxLinks={2}
                    className="mb-4"
                  />
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        generateContent('tax-article');
                      }}
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                      Generate Article
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        generateContent('audit-checklist');
                      }}
                      className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                      Create Checklist
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNewsClick({
                          id: article.id || index.toString(),
                          title: article.title,
                          content: article.content,
                          summary: article.summary,
                          source: article.source,
                          publishedAt: article.publishedAt,
                          category: article.category,
                          categories: article.categories || [article.category],
                          url: article.url
                        });
                      }}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors flex items-center"
                    >
                      🤖 AI Summary
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Chat Tab */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 text-white">
              <h1 className="text-4xl font-bold mb-4">🤖 AI Chat Assistant</h1>
              <p className="text-xl text-blue-100 mb-4">
                Powered by Perplexity AI - Get instant answers, CA guidance, and expert assistance with real-time information.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <button
                  onClick={() => setChatMode('general')}
                  className={`p-3 rounded-lg transition-all ${chatMode === 'general' 
                    ? 'bg-white text-blue-600 shadow-lg' 
                    : 'bg-white/20 hover:bg-white/30'}`}
                >
                  <div className="text-sm font-medium">General Chat</div>
                </button>
                <button
                  onClick={() => setChatMode('ca-assistant')}
                  className={`p-3 rounded-lg transition-all ${chatMode === 'ca-assistant' 
                    ? 'bg-white text-blue-600 shadow-lg' 
                    : 'bg-white/20 hover:bg-white/30'}`}
                >
                  <div className="text-sm font-medium">🧮 CA Assistant</div>
                </button>
                <button
                  onClick={() => setChatMode('seo-content')}
                  className={`p-3 rounded-lg transition-all ${chatMode === 'seo-content' 
                    ? 'bg-white text-blue-600 shadow-lg' 
                    : 'bg-white/20 hover:bg-white/30'}`}
                >
                  <div className="text-sm font-medium">SEO Content</div>
                </button>
                <button
                  onClick={() => setChatMode('marketing-strategy')}
                  className={`p-3 rounded-lg transition-all ${chatMode === 'marketing-strategy' 
                    ? 'bg-white text-blue-600 shadow-lg' 
                    : 'bg-white/20 hover:bg-white/30'}`}
                >
                  <div className="text-sm font-medium">Marketing</div>
                </button>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="bg-white rounded-xl shadow-sm">
              <ChatInterface mode={chatMode} onModeChange={setChatMode} />
            </div>

            {/* Usage Guidelines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">CA Assistant Tips</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Ask about latest tax regulations and GST updates</li>
                  <li>• Get audit procedures and compliance guidance</li>
                  <li>• Request calculation examples and case studies</li>
                  <li>• Inquire about recent circulars and notifications</li>
                </ul>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">SEO Content Tips</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Use format: "topic: [title], keywords: [keyword1, keyword2]"</li>
                  <li>• Specify content type: blog, landing-page, meta-tags</li>
                  <li>• Include target audience for better optimization</li>
                  <li>• Request competitor analysis and keyword research</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Marketing & SEO Tab */}
        {activeTab === 'marketing' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white">
              <h1 className="text-4xl font-bold mb-4">Marketing & SEO Automation</h1>
              <p className="text-xl text-green-100 mb-6">
                AI-powered marketing strategies, SEO content generation, and automated campaign creation for your business growth.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-semibold">SEO Content Generation</span>
                  </div>
                  <p className="text-green-100 text-sm">Create optimized blogs, landing pages, and meta content</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="font-semibold">Marketing Strategy</span>
                  </div>
                  <p className="text-green-100 text-sm">Comprehensive marketing plans and customer acquisition</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                    <span className="font-semibold">Real-time Analysis</span>
                  </div>
                  <p className="text-green-100 text-sm">Market trends and competitor insights</p>
                </div>
              </div>
            </div>

            {/* Marketing Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SEO Content Generator */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">
                      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">SEO Content Generator</h3>
                    <p className="text-sm text-gray-600">Create optimized content that ranks</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <button 
                    onClick={() => { setActiveTab('chat'); setChatMode('seo-content'); }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start SEO Content Creation
                  </button>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>✓ Blog posts and articles</div>
                    <div>✓ Landing page copy</div>
                    <div>✓ Meta descriptions and titles</div>
                    <div>✓ Keyword optimization</div>
                  </div>
                </div>
              </div>

              {/* Marketing Strategy Planner */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">
                      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Marketing Strategy Planner</h3>
                    <p className="text-sm text-gray-600">Complete marketing roadmaps</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <button 
                    onClick={() => { setActiveTab('chat'); setChatMode('marketing-strategy'); }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Create Marketing Strategy
                  </button>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>✓ Customer persona development</div>
                    <div>✓ Channel recommendations</div>
                    <div>✓ Budget allocation strategies</div>
                    <div>✓ Performance metrics</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Marketing Templates */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Marketing Templates & Examples</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">SaaS Marketing</h4>
                  <p className="text-sm text-gray-600 mb-3">B2B software marketing strategy with lead generation focus</p>
                  <button 
                    onClick={() => { 
                      setActiveTab('chat'); 
                      setChatMode('marketing-strategy');
                    }}
                    className="text-xs bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
                  >
                    Use Template
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">E-commerce SEO</h4>
                  <p className="text-sm text-gray-600 mb-3">Product-focused content with conversion optimization</p>
                  <button 
                    onClick={() => { 
                      setActiveTab('chat'); 
                      setChatMode('seo-content');
                    }}
                    className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors"
                  >
                    Use Template
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Local Business</h4>
                  <p className="text-sm text-gray-600 mb-3">Local SEO and community-focused marketing strategies</p>
                  <button 
                    onClick={() => { 
                      setActiveTab('chat'); 
                      setChatMode('marketing-strategy');
                    }}
                    className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 transition-colors"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Generated Content Library</h2>
            
            <div className="grid gap-6">
              {dashboardData?.recent?.content?.map((content: any, index: number) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{content.title}</h3>
                      <p className="text-gray-300 mb-2">
                        {content.type.replace('_', ' ').toUpperCase()} • 
                        {content.metadata?.wordCount || 0} words • 
                        {content.metadata?.readingTime || 0} min read
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        content.status === 'published' ? 'bg-green-600' : 
                        content.status === 'draft' ? 'bg-yellow-600' : 'bg-gray-600'
                      }`}>
                        {content.status}
                      </span>
                      {content.metadata?.seoScore && (
                        <span className="text-xs px-3 py-1 rounded-full bg-blue-600">
                          SEO: {content.metadata.seoScore}/100
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => viewContent(content)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                      📖 View Content
                    </button>
                    <button className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors">
                      📧 Send as Newsletter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'exam-gen' && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold mb-4 text-center">❓ CA Exam Question Generator</h2>
              <p className="text-gray-300 mb-8 text-center">Generate practice questions based on latest regulations and updates</p>
              
              {/* Quick Topic Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <button
                  onClick={() => generateExamQuestions('Tax & GST')}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 p-4 rounded-lg transition-colors"
                >
                  Tax & GST Questions
                </button>
                
                <button
                  onClick={() => generateExamQuestions('Audit & Assurance')}
                  disabled={isGenerating}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 p-4 rounded-lg transition-colors"
                >
                  Audit Questions
                </button>
                
                <button
                  onClick={() => generateExamQuestions('Compliance & Ethics')}
                  disabled={isGenerating}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 p-4 rounded-lg transition-colors"
                >
                  📋 Ethics Questions
                </button>
              </div>

              {/* Chat Interface */}
              <div className="bg-white/5 rounded-lg p-6 min-h-[400px] flex flex-col">
                <h3 className="font-bold mb-4">Question Generator Chat</h3>
                
                {/* Messages Area */}
                <div className="flex-1 space-y-4 mb-4 max-h-[300px] overflow-y-auto">
                  {examResults.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <p>Click a topic above or enter a custom topic to generate exam questions</p>
                    </div>
                  ) : (
                    examResults.map((message, index) => (
                      <div key={index} className={`p-4 rounded-lg ${
                        message.type === 'user' ? 'bg-blue-600/20 ml-8' : 
                        message.type === 'error' ? 'bg-red-600/20 mr-8' :
                        'bg-green-600/20 mr-8'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">
                            <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold ${
                              message.type === 'user' ? 'bg-blue-500 text-white' : 
                              message.type === 'error' ? 'bg-red-500 text-white' : 
                              'bg-green-500 text-white'
                            }`}>
                              {message.type === 'user' ? 'U' : message.type === 'error' ? 'E' : 'AI'}
                            </span>
                          </div>
                          <div className="flex-1">
                            {message.title && (
                              <h4 className="font-bold mb-2">{message.title}</h4>
                            )}
                            <div className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {isGenerating && (
                    <div className="bg-gray-600/20 mr-8 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">🤖</div>
                        <div className="flex-1">
                          <div className="animate-pulse">Generating questions...</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter custom exam topic (e.g., 'GST Return Filing 2025')"
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        generateExamQuestions(e.currentTarget.value.trim());
                        e.currentTarget.value = '';
                      }
                    }}
                    disabled={isGenerating}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input.value.trim()) {
                        generateExamQuestions(input.value.trim());
                        input.value = '';
                      }
                    }}
                    disabled={isGenerating}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
                  >
                    {isGenerating ? '⏳' : '📤 Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">🤖 Automation Center</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold mb-4">Daily Automation</h3>
                <p className="text-gray-300 mb-4">
                  Automatically collect news from ANI, Economic Times & ICAI, generate content, 
                  create audit checklists, and send notifications to CEOs and users.
                </p>
                <button
                  onClick={runDailyAutomation}
                  disabled={runningAutomation}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-3 px-4 rounded-lg transition-colors font-semibold"
                >
                  {runningAutomation ? 'Running Daily Automation...' : 'Run Daily Automation'}
                </button>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold mb-4">Automation Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Last Run:</span>
                    <span className="text-green-400">{dashboardData?.automation?.lastRun || 'Never'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Scheduled:</span>
                    <span className="text-blue-400">Daily at 9:00 AM IST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tasks Completed Today:</span>
                    <span className="text-yellow-400">{dashboardData?.automation?.tasksCompleted || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Tasks */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-bold mb-4">Manual Tasks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => generateContent('tax-article')}
                  className="bg-green-600 hover:bg-green-700 p-4 rounded-lg transition-colors text-sm font-semibold"
                >
                  Generate Tax Article
                </button>
                
                <button
                  onClick={() => generateContent('seo-content')}
                  className="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg transition-colors text-sm font-semibold"
                >
                  Create SEO Content
                </button>
                
                <button
                  onClick={() => generateContent('compliance-guide')}
                  className="bg-orange-600 hover:bg-orange-700 p-4 rounded-lg transition-colors text-sm font-semibold"
                >
                  📋 Compliance Guide
                </button>
                
                <button
                  onClick={() => generateContent('loophole-analysis')}
                  className="bg-red-600 hover:bg-red-700 p-4 rounded-lg transition-colors text-sm font-semibold"
                >
                  🔍 Loophole Analysis
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Automation Notifications */}
      {showNotifications && automationNotifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
          {automationNotifications.slice(0, 3).map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg backdrop-blur-sm border border-white/20 ${
                notification.type === 'success' ? 'bg-green-600/90' :
                notification.type === 'error' ? 'bg-red-600/90' : 'bg-blue-600/90'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm">{notification.title}</h4>
                  <p className="text-xs mt-1 text-white/90">{notification.message}</p>
                  <p className="text-xs mt-1 text-white/70">
                    {notification.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-white/80 hover:text-white ml-2"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content View Modal */}
      {showContentModal && selectedContent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/20">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedContent.title}</h2>
                  <div className="flex space-x-4 text-sm text-gray-300">
                    <span>{selectedContent.type.replace('_', ' ').toUpperCase()}</span>
                    <span>•</span>
                    <span>{selectedContent.metadata?.wordCount || 0} words</span>
                    <span>•</span>
                    <span>{selectedContent.metadata?.readingTime || 0} min read</span>
                    <span>•</span>
                    <span>{new Date(selectedContent.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={closeContentModal}
                  className="text-gray-400 hover:text-white text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {isEditingContent ? (
                <div className="space-y-4">
                  {/* Edit Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="Enter title..."
                    />
                  </div>
                  
                  {/* Edit Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={20}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none font-mono text-sm"
                      placeholder="Enter content..."
                    />
                  </div>
                </div>
              ) : (
                <div className="prose prose-invert prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-gray-100 leading-relaxed font-medium">
                    {selectedContent.content}
                  </div>
                </div>
              )}

              {/* Content Metadata */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <h3 className="text-lg font-bold mb-4">Content Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      selectedContent.status === 'published' ? 'bg-green-600' : 
                      selectedContent.status === 'draft' ? 'bg-yellow-600' : 'bg-gray-600'
                    }`}>
                      {selectedContent.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Model:</span>
                    <span className="ml-2 text-white">{selectedContent.model}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Tokens:</span>
                    <span className="ml-2 text-white">{selectedContent.tokens || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Cost:</span>
                    <span className="ml-2 text-white">${(selectedContent.cost || 0).toFixed(4)}</span>
                  </div>
                  {selectedContent.metadata?.seoScore && (
                    <div>
                      <span className="text-gray-400">SEO Score:</span>
                      <span className="ml-2 text-white">{selectedContent.metadata.seoScore}/100</span>
                    </div>
                  )}
                  {selectedContent.metadata?.tags && selectedContent.metadata.tags.length > 0 && (
                    <div className="md:col-span-2">
                      <span className="text-gray-400">Tags:</span>
                      <div className="mt-1">
                        {selectedContent.metadata.tags.map((tag: string, index: number) => (
                          <span key={index} className="inline-block bg-blue-600 text-xs px-2 py-1 rounded mr-2 mb-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/20 flex justify-end space-x-2">
              <button
                onClick={closeContentModal}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
              >
                Close
              </button>
              
              {isEditingContent ? (
                <>
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEditedContent}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                  >
                    💾 Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors">
                    📧 Send as Newsletter
                  </button>
                  <button 
                    onClick={startEditingContent}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    📝 Edit Content
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Testing Modal */}
      {showEmailTesting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/20">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">🧪 Email Testing System</h2>
                <button
                  onClick={() => setShowEmailTesting(false)}
                  className="text-gray-400 hover:text-white text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-300 mt-2">Test email notifications to CAs and CEOs</p>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-4">
                {/* Recipient Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recipient Email *
                  </label>
                  <input
                    type="email"
                    value={emailTestForm.recipientEmail}
                    onChange={(e) => setEmailTestForm({...emailTestForm, recipientEmail: e.target.value})}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="ca@example.com"
                    required
                  />
                </div>

                {/* Recipient Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    value={emailTestForm.recipientName}
                    onChange={(e) => setEmailTestForm({...emailTestForm, recipientName: e.target.value})}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="CA John Doe"
                    required
                  />
                </div>

                {/* Email Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Type
                  </label>
                  <select
                    value={emailTestForm.emailType}
                    onChange={(e) => setEmailTestForm({...emailTestForm, emailType: e.target.value})}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="tax-update">🏛️ Tax Law Update</option>
                    <option value="compliance-alert">⚠️ Compliance Alert</option>
                    <option value="news-digest">📰 News Digest</option>
                  </select>
                </div>

                {/* Test Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Test Content (Optional)
                  </label>
                  <textarea
                    value={emailTestForm.testContent}
                    onChange={(e) => setEmailTestForm({...emailTestForm, testContent: e.target.value})}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                    rows={4}
                    placeholder="Enter custom test content or leave empty for default template..."
                  />
                </div>

                {/* Test Result */}
                {emailTestResult && (
                  <div className="bg-green-600/20 border border-green-400/30 rounded-lg p-4">
                    <h4 className="font-bold text-green-400 mb-2">✅ Test Email Sent Successfully!</h4>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p><strong>To:</strong> {emailTestResult.emailPreview.to}</p>
                      <p><strong>Subject:</strong> {emailTestResult.emailPreview.subject}</p>
                      <p><strong>Service:</strong> {emailTestResult.deliveryInfo.service}</p>
                      <p><strong>Message ID:</strong> {emailTestResult.deliveryInfo.messageId}</p>
                      <p><strong>Estimated Delivery:</strong> {emailTestResult.deliveryInfo.estimatedDelivery}</p>
                    </div>
                    <div className="mt-3 p-3 bg-black/20 rounded border max-h-32 overflow-y-auto">
                      <div className="text-xs text-gray-400" 
                           dangerouslySetInnerHTML={{__html: emailTestResult.emailPreview.html}} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/20 flex justify-end space-x-2">
              <button
                onClick={() => setShowEmailTesting(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
              >
                Close
              </button>
              <button
                onClick={sendTestEmail}
                disabled={sendingTestEmail || !emailTestForm.recipientEmail || !emailTestForm.recipientName}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed rounded transition-colors flex items-center space-x-2"
              >
                {sendingTestEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>📧</span>
                    <span>Send Test Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Workflow Modal */}
      {showSheetsWorkflow && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/20">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  {sheetsWorkflowType === 'drafting' && '📝 CA Drafting Workflow'}
                  {sheetsWorkflowType === 'auditing' && '🔍 CA Auditing Workflow'}
                  {sheetsWorkflowType === 'analytics' && '📈 Workflow Analytics'}
                </h2>
                <button
                  onClick={() => setShowSheetsWorkflow(false)}
                  className="text-gray-400 hover:text-white text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-300 mt-2">
                Automated CA workflow management via Google Sheets - like n8n but built in-house
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Spreadsheet ID Configuration */}
              <div className="mb-6 p-4 bg-blue-600/20 rounded-lg border border-blue-400/30">
                <h4 className="font-bold text-blue-400 mb-2">📊 Spreadsheet Configuration</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={workflowSpreadsheetId}
                    onChange={(e) => setWorkflowSpreadsheetId(e.target.value)}
                    className="flex-1 p-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 text-sm"
                    placeholder="Enter Google Sheets ID or create new..."
                  />
                  <button
                    onClick={createCAWorksheet}
                    disabled={loadingWorkflow}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 rounded transition-colors text-sm"
                  >
                    {loadingWorkflow ? '⏳' : '➕ Create New'}
                  </button>
                  {workflowSpreadsheetId && (
                    <button
                      onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${workflowSpreadsheetId}/edit`, '_blank')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-sm"
                    >
                      📊 Open Sheet
                    </button>
                  )}
                </div>
              </div>

              {/* Workflow Type Content */}
              {sheetsWorkflowType === 'drafting' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4">📝 Add New Drafting Task</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Client Name</label>
                      <input
                        type="text"
                        value={draftingForm.clientName}
                        onChange={(e) => setDraftingForm({...draftingForm, clientName: e.target.value})}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                        placeholder="Enter client name..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Document Type</label>
                      <select
                        value={draftingForm.documentType}
                        onChange={(e) => setDraftingForm({...draftingForm, documentType: e.target.value as any})}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                      >
                        <option value="Tax Return">Tax Return</option>
                        <option value="Audit Report">Audit Report</option>
                        <option value="Financial Statement">Financial Statement</option>
                        <option value="Compliance Report">Compliance Report</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                      <select
                        value={draftingForm.priority}
                        onChange={(e) => setDraftingForm({...draftingForm, priority: e.target.value as any})}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                      >
                        <option value="High">🔴 High Priority</option>
                        <option value="Medium">🟡 Medium Priority</option>
                        <option value="Low">🟢 Low Priority</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                      <input
                        type="date"
                        value={draftingForm.dueDate}
                        onChange={(e) => setDraftingForm({...draftingForm, dueDate: e.target.value})}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Content/Requirements</label>
                    <textarea
                      value={draftingForm.content}
                      onChange={(e) => setDraftingForm({...draftingForm, content: e.target.value})}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none"
                      rows={4}
                      placeholder="Enter detailed requirements, notes, or draft content..."
                    />
                  </div>

                  <button
                    onClick={addDraftingTask}
                    disabled={loadingWorkflow || !workflowSpreadsheetId || !draftingForm.clientName}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg transition-colors font-semibold"
                  >
                    {loadingWorkflow ? '⏳ Adding Task...' : '➕ Add Drafting Task to Sheets'}
                  </button>
                </div>
              )}

              {sheetsWorkflowType === 'auditing' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4">🔍 Add New Auditing Task</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Client Name</label>
                      <input
                        type="text"
                        value={auditingForm.clientName}
                        onChange={(e) => setAuditingForm({...auditingForm, clientName: e.target.value})}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                        placeholder="Enter client name..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Audit Type</label>
                      <select
                        value={auditingForm.auditType}
                        onChange={(e) => setAuditingForm({...auditingForm, auditType: e.target.value as any})}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                      >
                        <option value="Statutory Audit">Statutory Audit</option>
                        <option value="Internal Audit">Internal Audit</option>
                        <option value="Tax Audit">Tax Audit</option>
                        <option value="GST Audit">GST Audit</option>
                        <option value="Compliance Audit">Compliance Audit</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Risk Level</label>
                      <select
                        value={auditingForm.riskLevel}
                        onChange={(e) => setAuditingForm({...auditingForm, riskLevel: e.target.value as any})}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                      >
                        <option value="High">🔴 High Risk</option>
                        <option value="Medium">🟡 Medium Risk</option>
                        <option value="Low">🟢 Low Risk</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Initial Findings/Scope</label>
                    <textarea
                      value={auditingForm.findings}
                      onChange={(e) => setAuditingForm({...auditingForm, findings: e.target.value})}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none"
                      rows={4}
                      placeholder="Enter audit scope, initial findings, or key areas to focus..."
                    />
                  </div>

                  <button
                    onClick={addAuditingTask}
                    disabled={loadingWorkflow || !workflowSpreadsheetId || !auditingForm.clientName}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg transition-colors font-semibold"
                  >
                    {loadingWorkflow ? '⏳ Adding Task...' : '➕ Add Auditing Task to Sheets'}
                  </button>
                </div>
              )}

              {sheetsWorkflowType === 'analytics' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4">📈 Workflow Analytics Dashboard</h3>
                  
                  {workflowAnalytics ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-green-600/20 rounded-lg p-4 border border-green-400/30">
                        <h4 className="font-bold text-green-400 mb-2">📝 Drafting Metrics</h4>
                        <div className="space-y-2 text-sm">
                          <p>Total Drafts: <span className="font-bold">{workflowAnalytics.totalDrafts}</span></p>
                          <p>Pending Review: <span className="font-bold">{workflowAnalytics.pendingReview}</span></p>
                          <p>Completed Today: <span className="font-bold">{workflowAnalytics.completedToday}</span></p>
                        </div>
                      </div>

                      <div className="bg-orange-600/20 rounded-lg p-4 border border-orange-400/30">
                        <h4 className="font-bold text-orange-400 mb-2">🔍 Auditing Metrics</h4>
                        <div className="space-y-2 text-sm">
                          <p>Total Audits: <span className="font-bold">{workflowAnalytics.totalAudits}</span></p>
                          <p>In Progress: <span className="font-bold">{workflowAnalytics.auditsInProgress}</span></p>
                          <p>Completed This Month: <span className="font-bold">{workflowAnalytics.completedThisMonth}</span></p>
                        </div>
                      </div>

                      <div className="bg-purple-600/20 rounded-lg p-4 border border-purple-400/30">
                        <h4 className="font-bold text-purple-400 mb-2">⚡ Performance</h4>
                        <div className="space-y-2 text-sm">
                          <p>High Priority: <span className="font-bold">{workflowAnalytics.highPriorityItems}</span></p>
                          <p>Overdue Items: <span className="font-bold text-red-400">{workflowAnalytics.overdueItems}</span></p>
                          <p>Avg Completion: <span className="font-bold">{workflowAnalytics.avgCompletionTime} days</span></p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-4">Set up your spreadsheet to view analytics</p>
                      <button
                        onClick={loadWorkflowAnalytics}
                        disabled={!workflowSpreadsheetId}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 rounded-lg transition-colors"
                      >
                        📊 Load Analytics
                      </button>
                    </div>
                  )}

                  {workflowSpreadsheetId && (
                    <div className="mt-6 p-4 bg-white/5 rounded-lg">
                      <h4 className="font-bold text-white mb-2">🔄 Real-time Workflow Integration</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        Your CA workflow is automatically synced with Google Sheets for real-time collaboration, 
                        task assignment, and progress tracking.
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${workflowSpreadsheetId}/edit#gid=2`, '_blank')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-sm"
                        >
                          📊 View Analytics Sheet
                        </button>
                        <button
                          onClick={loadWorkflowAnalytics}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors text-sm"
                        >
                          🔄 Refresh Data
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/20 flex justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => setSheetsWorkflowType('drafting')}
                  className={`px-4 py-2 rounded transition-colors ${sheetsWorkflowType === 'drafting' ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                >
                  📝 Drafting
                </button>
                <button
                  onClick={() => setSheetsWorkflowType('auditing')}
                  className={`px-4 py-2 rounded transition-colors ${sheetsWorkflowType === 'auditing' ? 'bg-orange-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                >
                  🔍 Auditing
                </button>
                <button
                  onClick={() => setSheetsWorkflowType('analytics')}
                  className={`px-4 py-2 rounded transition-colors ${sheetsWorkflowType === 'analytics' ? 'bg-purple-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                >
                  📈 Analytics
                </button>
              </div>
              <button
                onClick={() => setShowSheetsWorkflow(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Builder Tab */}
      {activeTab === 'workflow' && (
        <div className="space-y-8">
          {/* Workflow Builder Header */}
          <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 rounded-2xl p-8 text-white">
            <div className="max-w-4xl">
              <h1 className="text-4xl font-bold mb-4">🔧 Visual Workflow Builder</h1>
              <p className="text-xl text-blue-100 mb-6">
                Create powerful CA workflows with our n8n-style drag-and-drop interface. 
                Build custom automation chains for client onboarding, tax processing, compliance checking, and more.
              </p>
              
              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-semibold">Real-time Execution</span>
                  </div>
                  <p className="text-blue-100 text-sm">Live monitoring and instant feedback during workflow execution</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="font-semibold">CA-Specific Nodes</span>
                  </div>
                  <p className="text-blue-100 text-sm">Pre-built nodes for tax calculations, compliance, and audit workflows</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                    <span className="font-semibold">Service Integration</span>
                  </div>
                  <p className="text-blue-100 text-sm">Connect to Google Sheets, email, banking APIs, and more</p>
                </div>
              </div>

              {/* Quick Start Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/workflow-builder')}
                  className="flex items-center justify-center space-x-3 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg text-lg"
                >
                  <span>🚀</span>
                  <span>Launch Workflow Builder</span>
                </button>
                
                <button
                  onClick={() => window.open('/workflow-builder', '_blank')}
                  className="flex items-center justify-center space-x-3 bg-blue-500 text-white px-6 py-4 rounded-lg font-medium hover:bg-blue-400 transition-colors border-2 border-white/20"
                >
                  <span>↗️</span>
                  <span>Open in New Tab</span>
                </button>
              </div>
            </div>
          </div>

          {/* Workflow Templates */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">📋 Pre-built Workflow Templates</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Client Onboarding Template */}
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-6 text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">👤</span>
                  <h3 className="text-xl font-semibold">Client Onboarding</h3>
                </div>
                <p className="text-green-100 text-sm mb-4">
                  Automated client intake → Document processing → Compliance verification → Account setup
                </p>
                <button 
                  onClick={() => router.push('/workflow-builder?template=client-onboarding')}
                  className="bg-white text-green-600 px-4 py-2 rounded font-medium hover:bg-green-50 transition-colors text-sm"
                >
                  Use Template
                </button>
              </div>

              {/* Tax Processing Template */}
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-6 text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">🧮</span>
                  <h3 className="text-xl font-semibold">Tax Processing</h3>
                </div>
                <p className="text-orange-100 text-sm mb-4">
                  Document intake → Tax calculation → GST/IT processing → Report generation → Client notification
                </p>
                <button 
                  onClick={() => router.push('/workflow-builder?template=tax-processing')}
                  className="bg-white text-orange-600 px-4 py-2 rounded font-medium hover:bg-orange-50 transition-colors text-sm"
                >
                  Use Template
                </button>
              </div>

              {/* Audit Workflow Template */}
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg p-6 text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">🔍</span>
                  <h3 className="text-xl font-semibold">Audit Workflow</h3>
                </div>
                <p className="text-purple-100 text-sm mb-4">
                  Audit planning → Risk assessment → Evidence collection → Report generation → Follow-up
                </p>
                <button 
                  onClick={() => router.push('/workflow-builder?template=audit-workflow')}
                  className="bg-white text-purple-600 px-4 py-2 rounded font-medium hover:bg-purple-50 transition-colors text-sm"
                >
                  Use Template
                </button>
              </div>
            </div>
          </div>

          {/* Getting Started Guide */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">🎓 Getting Started</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">📖 Quick Tutorial</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                    <p className="text-gray-300 text-sm">Drag nodes from the palette to create your workflow</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                    <p className="text-gray-300 text-sm">Connect nodes by dragging from output to input handles</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                    <p className="text-gray-300 text-sm">Configure each node by clicking on it</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                    <p className="text-gray-300 text-sm">Execute workflow and monitor real-time progress</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">🛠️ Available Node Types</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded p-3">
                    <div className="text-sm font-medium text-white">Triggers</div>
                    <div className="text-xs text-gray-400">Client Intake, Email, Schedule</div>
                  </div>
                  <div className="bg-white/5 rounded p-3">
                    <div className="text-sm font-medium text-white">Processors</div>
                    <div className="text-xs text-gray-400">Documents, Tax Calc, Validation</div>
                  </div>
                  <div className="bg-white/5 rounded p-3">
                    <div className="text-sm font-medium text-white">Compliance</div>
                    <div className="text-xs text-gray-400">Audit, Regulatory, Legal</div>
                  </div>
                  <div className="bg-white/5 rounded p-3">
                    <div className="text-sm font-medium text-white">Actions</div>
                    <div className="text-xs text-gray-400">Sheets, Email, Reports</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Writing Voice Questionnaire Tab */}
      {activeTab === 'questionnaire' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
            <h1 className="text-4xl font-bold mb-4">📋 Writing Voice Setup</h1>
            <p className="text-xl text-purple-100">
              Complete our questionnaire to determine your personalized writing voice and content preferences.
            </p>
          </div>
          <WritingVoiceQuestionnaire onComplete={handleQuestionnaireComplete} />
        </div>
      )}

      {/* Unified Content Creator Tab */}
      {activeTab === 'unified-creator' && (
        <UnifiedContentCreator />
      )}

      {/* Enhanced Content Hub Tab - NEW! */}
      {activeTab === 'enhanced-hub' && (
        <EnhancedContentHub />
      )}

      {/* Discover Feed Tab */}
      {activeTab === 'discover' && (
        <DiscoverFeed />
      )}



      {/* Basic Compliance Center Tab */}
      {activeTab === 'compliance' && (
        <ComplianceCenter />
      )}

      {/* Twitter/X Tab */}
      {activeTab === 'twitter' && (
        <TwitterPostGenerator />
      )}

      {/* LinkedIn Automation Tab */}
      {activeTab === 'linkedin' && (
        <LinkedInPostGenerator />
      )}

      {/* Content Repurposing Tab */}
      {activeTab === 'repurposing' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 text-white">
            <h1 className="text-4xl font-bold mb-4">🔄 Content Repurposing</h1>
            <p className="text-xl text-blue-100">
              Transform your content into multiple formats for maximum reach and engagement.
            </p>
          </div>
          <ContentRepurposing userPreferences={userPreferences || { writingVoice: { name: 'Professional' }, customizations: { formalityLevel: 7 }, targetAudience: ['Clients'], contentPreferences: ['Tax Updates'] }} />
        </div>
      )}

      {/* Case Study Generator Tab */}
      {activeTab === 'case-studies' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 text-white">
            <h1 className="text-4xl font-bold mb-4">📊 Case Study Generator</h1>
            <p className="text-xl text-blue-100">
              Create professional case studies that showcase your expertise while maintaining client confidentiality.
            </p>
          </div>
          <CaseStudyGenerator userPreferences={userPreferences || { writingVoice: { name: 'Professional' }, customizations: { formalityLevel: 7 }, targetAudience: ['Clients'], contentPreferences: ['Tax Updates'] }} />
        </div>
      )}



      {/* LinkedIn Network Analyzer Tab */}
      {activeTab === 'network' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
            <h1 className="text-4xl font-bold mb-4">LinkedIn Network Analyzer</h1>
            <p className="text-xl text-cyan-100">
              Analyze your LinkedIn network, discover opportunities, and optimize your professional connections.
            </p>
          </div>
          <LinkedInNetworkAnalyzer />
        </div>
      )}

      {/* AI Image Generator Tab */}
      {activeTab === 'images' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 text-white">
            <h1 className="text-4xl font-bold mb-4">AI Image Generator</h1>
            <p className="text-xl text-blue-100">
              Create professional images for your content using AI-powered generation with CA-specific templates.
            </p>
          </div>
          <ImageGenerator />
        </div>
      )}

      {/* Global Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-2xl p-8 text-white">
            <h1 className="text-4xl font-bold mb-4">Global Search</h1>
            <p className="text-xl text-purple-100">
              Search across all your content, news, case studies, and generated materials in one place.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search across all content..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 pl-12 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors">
                Search
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-colors">
                <div className="font-semibold text-white mb-1">News Articles</div>
                <div className="text-sm text-gray-300">Search across collected news</div>
              </button>
              <button className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-colors">
                <div className="font-semibold text-white mb-1">Generated Content</div>
                <div className="text-sm text-gray-300">Find your created posts & articles</div>
              </button>
              <button className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-colors">
                <div className="font-semibold text-white mb-1">Case Studies</div>
                <div className="text-sm text-gray-300">Search through case studies</div>
              </button>
            </div>
            
            <div className="text-center text-gray-400">
              <p>Start typing to see search results across all your content.</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
        <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <p className="text-gray-300">
                © 2025 CA Law Portal - Powered by AI for Chartered Accountants
              </p>
              <p className="text-sm text-gray-400">
                Last updated: {dashboardData?.lastUpdated || new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Perplexity News Modal */}
      <PerplexityNewsModal
        isOpen={isNewsModalOpen}
        onClose={closeNewsModal}
        newsItem={selectedNewsItem}
      />
    </div>
  );
}