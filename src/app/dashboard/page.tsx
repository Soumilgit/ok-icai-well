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

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'content' | 'automation' | 'exam-gen' | 'workflow' | 'chat' | 'marketing' | 'questionnaire' | 'linkedin' | 'repurposing' | 'case-studies' | 'compliance' | 'network' | 'images'>('overview');
  
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
  
  // Automation notifications
  const [automationNotifications, setAutomationNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      fetchDashboardData();
      loadUserPreferences();
      
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

  // Auto-refresh function for real-time updates
  const startAutoRefresh = () => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  };

  // Start auto-refresh when component mounts
  useEffect(() => {
    const cleanup = startAutoRefresh();
    return cleanup;
  }, []);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading CA Law Portal Dashboard...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white flex">
      {/* Left Edge Trigger Zone with Visual Indicator */}
      <div 
        className="fixed inset-y-0 left-0 z-40 w-8 h-full group cursor-pointer"
        onClick={() => setSidebarOpen(true)}
      >
        {/* Subtle indicator line */}
        <div className={`absolute top-1/2 left-0 w-1 h-16 rounded-r-full transform -translate-y-1/2 transition-all duration-300 ${
          !sidebarOpen 
            ? 'bg-blue-400/40 opacity-60 group-hover:opacity-100' 
            : 'bg-white/20 opacity-0 group-hover:opacity-100'
        }`} />
        
        {/* Hover hint text */}
        <div className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white/60 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
          Click for workflows
        </div>
        
        {/* Manual close indicator */}
        {!sidebarOpen && (
          <div className="absolute top-4 left-2 w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
        )}
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-black/20 backdrop-blur-lg border-r border-white/20 transform transition-all duration-300 ease-out ${sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-walsheim)' }}>
                Workflows
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                title="Close sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-6" style={{ fontFamily: 'var(--font-walsheim)' }}>
            <div className="space-y-8">
              {/* Google Sheets Integration */}
              <div className="space-y-4">
                <h3 className="font-bold text-white text-lg border-b border-white/20 pb-2">📊 Google Sheets</h3>
                <div className="space-y-1">
                  <button 
                    onClick={() => {
                      setShowSheetsWorkflow(!showSheetsWorkflow);
                      setSheetsWorkflowType('drafting');
                    }}
                    className="w-full text-left p-3 text-sm text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 hover:translate-x-2 bg-blue-600/20 rounded"
                  >
                    📝 CA Drafting Workflow
                  </button>
                  <button 
                    onClick={() => {
                      setShowSheetsWorkflow(!showSheetsWorkflow);
                      setSheetsWorkflowType('auditing');
                    }}
                    className="w-full text-left p-3 text-sm text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 hover:translate-x-2 bg-blue-600/20 rounded"
                  >
                    🔍 CA Auditing Workflow
                  </button>
                  <button 
                    onClick={() => {
                      setShowSheetsWorkflow(!showSheetsWorkflow);
                      setSheetsWorkflowType('analytics');
                    }}
                    className="w-full text-left p-3 text-sm text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 hover:translate-x-2 bg-purple-600/20 rounded"
                  >
                    📈 Workflow Analytics
                  </button>
                </div>
              </div>
              
              {/* Email Automation */}
              <div className="space-y-4">
                <h3 className="font-bold text-white text-lg border-b border-white/20 pb-2"> Email Automation</h3>
                <div className="space-y-1">
                  <button 
                    onClick={() => setShowEmailTesting(!showEmailTesting)}
                    className="w-full text-left p-3 text-sm text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 hover:translate-x-2 bg-blue-600/20 rounded"
                  >
                     Test Email System
                  </button>
                  <button className="w-full text-left p-3 text-sm text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 hover:translate-x-2">
                     Stakeholder Notifications
                  </button>
                  <button className="w-full text-left p-3 text-sm text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 hover:translate-x-2">
                     Executive Summaries
                  </button>
                  <button className="w-full text-left p-3 text-sm text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 hover:translate-x-2">
                     Alert Management
                  </button>
                </div>
              </div>
              
              {/* Workflow Pipeline */}
              <div className="space-y-4">
                <h3 className="font-bold text-white text-lg border-b border-white/20 pb-2"> Workflows</h3>
                <div className="space-y-1">
                  <button 
                    onClick={() => setSelectedWorkflow('zapier-pipeline')}
                    className="w-full text-left p-3 text-sm text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 hover:translate-x-2"
                  >
                     News → Content → Email
                  </button>
                  <button 
                    onClick={() => setSelectedWorkflow('audit-workflow')}
                    className="w-full text-left p-3 text-sm text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 hover:translate-x-2"
                  >
                     Compliance Workflow
                  </button>
                  <button 
                    onClick={() => setSelectedWorkflow('reporting-workflow')}
                    className="w-full text-left p-3 text-sm text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 hover:translate-x-2"
                  >
                     Reporting Pipeline
                  </button>
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
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-4' : ''}`}>
        {/* Header */}
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
              <h1 className="text-2xl font-bold">CA Law Portal</h1>
              <span className="bg-green-500 text-xs px-2 py-1 rounded-full">Live</span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications Bell */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                🔔
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
                  className="text-sm text-blue-600 hover:text-blue-700"
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
                        {notification.type === 'success' ? '✅' : '❌'}
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

      {/* Navigation Tabs */}
      <nav className="bg-black/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: '📊 Overview' },
              { id: 'questionnaire', label: '📋 Writing Voice Setup' },
              { id: 'linkedin', label: '💼 LinkedIn Automation' },
              { id: 'repurposing', label: '🔄 Content Repurposing' },
              { id: 'case-studies', label: '📊 Case Studies' },
              { id: 'compliance', label: '✅ ICAI Compliance' },
              { id: 'network', label: '🌐 Network Analyzer' },
              { id: 'images', label: '🎨 AI Images' },
              ...(hasWorkflowAccess ? [{ id: 'workflow', label: '🔧 Workflow Builder (Company)' }] : []),
              { id: 'chat', label: '🤖 AI Chat' },
              { id: 'marketing', label: '📈 Marketing & SEO' },
              { id: 'news', label: '📰 Latest News' },
              { id: 'content', label: '📝 Generated Content' },
              { id: 'exam-gen', label: '❓ Exam Generator' },
              { id: 'automation', label: '🤖 Automation' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-white/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
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
                  <div className="text-2xl">📝</div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300">LinkedIn Posts</p>
                    <p className="text-2xl font-bold">{dashboardData?.overview?.today?.linkedinPosts || 8}</p>
                  </div>
                  <div className="text-2xl">💼</div>
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
                  <div className="text-2xl">🎨</div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300">Compliance Checks</p>
                    <p className="text-2xl font-bold">{dashboardData?.overview?.today?.complianceChecks || 6}</p>
                  </div>
                  <div className="text-2xl">✅</div>
                </div>
              </div>
            </div>

            {/* New Features Overview */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold mb-4">🆕 New AI-Powered Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('questionnaire')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-lg transition-all hover:scale-105 text-left"
                >
                  <div className="text-2xl mb-2">📋</div>
                  <div className="font-semibold">Writing Voice Setup</div>
                  <div className="text-sm text-blue-100">Personalize your content style</div>
                </button>
                
                <button
                  onClick={() => setActiveTab('linkedin')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-lg transition-all hover:scale-105 text-left"
                >
                  <div className="text-2xl mb-2">💼</div>
                  <div className="font-semibold">LinkedIn Automation</div>
                  <div className="text-sm text-blue-100">Automate post creation & publishing</div>
                </button>
                
                <button
                  onClick={() => setActiveTab('repurposing')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-lg transition-all hover:scale-105 text-left"
                >
                  <div className="text-2xl mb-2">🔄</div>
                  <div className="font-semibold">Content Repurposing</div>
                  <div className="text-sm text-blue-100">Transform content for all platforms</div>
                </button>
                
                <button
                  onClick={() => setActiveTab('case-studies')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-lg transition-all hover:scale-105 text-left"
                >
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-semibold">Case Study Generator</div>
                  <div className="text-sm text-blue-100">Create professional case studies</div>
                </button>
                
                <button
                  onClick={() => setActiveTab('compliance')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-lg transition-all hover:scale-105 text-left"
                >
                  <div className="text-2xl mb-2">✅</div>
                  <div className="font-semibold">ICAI Compliance</div>
                  <div className="text-sm text-blue-100">Ensure regulatory compliance</div>
                </button>
                
                <button
                  onClick={() => setActiveTab('network')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-lg transition-all hover:scale-105 text-left"
                >
                  <div className="text-2xl mb-2">🌐</div>
                  <div className="font-semibold">Network Analyzer</div>
                  <div className="text-sm text-blue-100">Optimize LinkedIn connections</div>
                </button>
                
                <button
                  onClick={() => setActiveTab('images')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-lg transition-all hover:scale-105 text-left"
                >
                  <div className="text-2xl mb-2">🎨</div>
                  <div className="font-semibold">AI Image Generator</div>
                  <div className="text-sm text-blue-100">Create professional visuals</div>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold mb-4">🚀 Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={runDailyAutomation}
                  disabled={runningAutomation}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 p-4 rounded-lg transition-colors font-semibold"
                >
                  {runningAutomation ? '⏳ Running...' : '🔄 Run Daily Automation'}
                </button>
                
                <button
                  onClick={() => generateContent('tax-article')}
                  className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg transition-colors font-semibold"
                >
                  📊 Generate Tax Article
                </button>
                
                <button
                  onClick={() => generateContent('audit-checklist')}
                  className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg transition-colors font-semibold"
                >
                  ✅ Create Audit Checklist
                </button>
                
                <button
                  onClick={() => generateExamQuestions('General CA Topics')}
                  className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg transition-colors font-semibold"
                >
                  ❓ Generate Exam Questions
                </button>
              </div>
              
              {/* Workflow Builder - @aminutemantechnologies.com Only */}
              {hasWorkflowAccess && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl border border-blue-400">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">🔥 NEW: Visual Workflow Builder</h3>
                    <p className="text-blue-100 text-sm mb-3">Create custom CA workflows with drag-and-drop interface, real-time execution monitoring, and live service connections.</p>
                    <div className="flex items-center space-x-4 text-xs text-blue-200">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>Real-time execution</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Google Sheets integration</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span>n8n-style interface</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push('/workflow-builder')}
                      className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-lg font-semibold transition-colors shadow-lg flex items-center space-x-2"
                    >
                      <span>🚀</span>
                      <span>Open Builder</span>
                    </button>
                    <button
                      onClick={() => window.open('/workflow-builder', '_blank')}
                      className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-3 rounded-lg font-medium transition-colors shadow-lg"
                      title="Open in new tab"
                    >
                      <span>↗️</span>
                    </button>
                  </div>
                </div>
              </div>
              )}

              {/* Show access info for non-company domain users */}
              {!hasWorkflowAccess && (
              <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">🔒</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Workflow Builder</h3>
                    <p className="text-gray-600 text-sm mb-2">
                      Advanced workflow automation for CA professionals. Available for company team members only.
                    </p>
                    <p className="text-xs text-gray-500">
                      <strong>Access Requirements:</strong> @aminutemantechnologies.com email address required
                    </p>
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* Platform Capabilities Overview */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold mb-6">🚀 Complete AI-Powered CA Platform</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Content Creation & Personalization */}
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg p-4 border border-purple-400/30">
                  <h3 className="text-lg font-semibold mb-3 text-purple-200">📝 Content Creation</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Personalized Writing Voices (5 types)</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>100+ Swipe File Templates</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Content Repurposing (6+ formats)</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Case Study Generator</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>AI Image Generation</li>
                  </ul>
                </div>

                {/* LinkedIn & Social Media */}
                <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-lg p-4 border border-blue-400/30">
                  <h3 className="text-lg font-semibold mb-3 text-blue-200">💼 LinkedIn Automation</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Custom & Full Automation</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Direct Publishing</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Post Scheduling</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Network Analysis</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Engagement Tracking</li>
                  </ul>
                </div>

                {/* Compliance & News */}
                <div className="bg-gradient-to-br from-red-600/20 to-orange-600/20 rounded-lg p-4 border border-red-400/30">
                  <h3 className="text-lg font-semibold mb-3 text-red-200">✅ Compliance & News</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>ICAI Compliance Checking</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Daily News Scraping (8 sources)</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Regulatory Updates</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Violation Detection</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Improvement Suggestions</li>
                  </ul>
                </div>

                {/* AI & Automation */}
                <div className="bg-gradient-to-br from-green-600/20 to-teal-600/20 rounded-lg p-4 border border-green-400/30">
                  <h3 className="text-lg font-semibold mb-3 text-green-200">🤖 AI & Automation</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Perplexity AI Integration</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Smart Content Analysis</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Automated Workflows</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Real-time Processing</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Intelligent Categorization</li>
                  </ul>
                </div>

                {/* Analytics & Insights */}
                <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-lg p-4 border border-cyan-400/30">
                  <h3 className="text-lg font-semibold mb-3 text-cyan-200">📊 Analytics & Insights</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Network Growth Analysis</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Content Performance</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Engagement Metrics</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Opportunity Identification</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Professional Scoring</li>
                  </ul>
                </div>

                {/* Education & Learning */}
                <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-lg p-4 border border-yellow-400/30">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-200">🎓 Education & Learning</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Exam Question Generation</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Topic-based Learning</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Knowledge Base Access</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>CA-specific Guidance</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✓</span>Professional Development</li>
                  </ul>
                </div>
              </div>

              {/* Getting Started Guide */}
              <div className="mt-6 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-lg p-6 border border-indigo-400/30">
                <h3 className="text-lg font-semibold mb-4 text-indigo-200">🎯 Quick Start Guide</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-2xl mb-2">1️⃣</div>
                    <div className="font-semibold text-white mb-1">Setup Your Voice</div>
                    <div className="text-sm text-gray-300">Complete the writing voice questionnaire to personalize your content</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-2xl mb-2">2️⃣</div>
                    <div className="font-semibold text-white mb-1">Connect LinkedIn</div>
                    <div className="text-sm text-gray-300">Authorize LinkedIn integration for automated posting and analytics</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-2xl mb-2">3️⃣</div>
                    <div className="font-semibold text-white mb-1">Create Content</div>
                    <div className="text-sm text-gray-300">Generate personalized content and repurpose across platforms</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-2xl mb-2">4️⃣</div>
                    <div className="font-semibold text-white mb-1">Monitor & Optimize</div>
                    <div className="text-sm text-gray-300">Track performance and optimize your professional network</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold mb-4">📰 Recent News</h3>
                <div className="space-y-3">
                  {dashboardData?.recent?.news?.slice(0, 5).map((article: any, index: number) => (
                    <div key={index} className="border-b border-white/10 pb-3 last:border-b-0">
                      <h4 className="font-semibold text-sm">{article.title}</h4>
                      <p className="text-xs text-gray-300">{article.source} • {article.category}</p>
                      <div className="flex space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${
                          article.impact === 'high' ? 'bg-red-600' : 
                          article.impact === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                        }`}>
                          {article.impact} impact
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold mb-4">📝 Recent Content</h3>
                <div className="space-y-3">
                  {dashboardData?.recent?.content?.slice(0, 5).map((content: any, index: number) => (
                    <div key={index} className="border-b border-white/10 pb-3 last:border-b-0">
                      <h4 className="font-semibold text-sm">{content.title}</h4>
                      <p className="text-xs text-gray-300">{content.type.replace('_', ' ')} • {content.metadata?.wordCount || 0} words</p>
                      <div className="flex space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${
                          content.status === 'published' ? 'bg-green-600' : 
                          content.status === 'draft' ? 'bg-yellow-600' : 'bg-gray-600'
                        }`}>
                          {content.status}
                        </span>
                      </div>
                    </div>
                  ))}
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
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                🔄 Refresh News
              </button>
            </div>
            
            <div className="grid gap-6">
              {dashboardData?.recent?.news?.map((article: any, index: number) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{article.title}</h3>
                      <p className="text-gray-300 mb-2">{article.source} • {new Date(article.publishedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        article.impact === 'high' ? 'bg-red-600' : 
                        article.impact === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                      }`}>
                        {article.impact} impact
                      </span>
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
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => generateContent('tax-article')}
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                      Generate Article
                    </button>
                    <button 
                      onClick={() => generateContent('audit-checklist')}
                      className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                      Create Checklist
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
                  <div className="text-sm font-medium">💬 General Chat</div>
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
                  <div className="text-sm font-medium">📝 SEO Content</div>
                </button>
                <button
                  onClick={() => setChatMode('marketing-strategy')}
                  className={`p-3 rounded-lg transition-all ${chatMode === 'marketing-strategy' 
                    ? 'bg-white text-blue-600 shadow-lg' 
                    : 'bg-white/20 hover:bg-white/30'}`}
                >
                  <div className="text-sm font-medium">📈 Marketing</div>
                </button>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="bg-white rounded-xl shadow-sm">
              <ChatInterface mode={chatMode} onModeChange={setChatMode} />
            </div>

            {/* Usage Guidelines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 CA Assistant Tips</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Ask about latest tax regulations and GST updates</li>
                  <li>• Get audit procedures and compliance guidance</li>
                  <li>• Request calculation examples and case studies</li>
                  <li>• Inquire about recent circulars and notifications</li>
                </ul>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">📝 SEO Content Tips</h3>
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
              <h1 className="text-4xl font-bold mb-4">📈 Marketing & SEO Automation</h1>
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
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
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
                    <span className="text-2xl">📝</span>
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
                    🚀 Start SEO Content Creation
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
                    <span className="text-2xl">📈</span>
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
                    🎯 Create Marketing Strategy
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Marketing Templates & Examples</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">SaaS Marketing</h4>
                  <p className="text-sm text-gray-600 mb-3">B2B software marketing strategy with lead generation focus</p>
                  <button 
                    onClick={() => { 
                      setActiveTab('chat'); 
                      setChatMode('marketing-strategy');
                    }}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
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
            <h2 className="text-2xl font-bold">📝 Generated Content Library</h2>
            
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
                  📊 Tax & GST Questions
                </button>
                
                <button
                  onClick={() => generateExamQuestions('Audit & Assurance')}
                  disabled={isGenerating}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 p-4 rounded-lg transition-colors"
                >
                  ✅ Audit Questions
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
                <h3 className="font-bold mb-4">💬 Question Generator Chat</h3>
                
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
                            {message.type === 'user' ? '👤' : message.type === 'error' ? '❌' : '🤖'}
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
                <h3 className="text-lg font-bold mb-4">🔄 Daily Automation</h3>
                <p className="text-gray-300 mb-4">
                  Automatically collect news from ANI, Economic Times & ICAI, generate content, 
                  create audit checklists, and send notifications to CEOs and users.
                </p>
                <button
                  onClick={runDailyAutomation}
                  disabled={runningAutomation}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-3 px-4 rounded-lg transition-colors font-semibold"
                >
                  {runningAutomation ? '⏳ Running Daily Automation...' : '🚀 Run Daily Automation'}
                </button>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold mb-4">📊 Automation Status</h3>
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
                    <span className="text-green-400">✅ Active</span>
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
              <h3 className="text-lg font-bold mb-4">⚡ Manual Tasks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => generateContent('tax-article')}
                  className="bg-green-600 hover:bg-green-700 p-4 rounded-lg transition-colors text-sm font-semibold"
                >
                  📊 Generate Tax Article
                </button>
                
                <button
                  onClick={() => generateContent('seo-content')}
                  className="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg transition-colors text-sm font-semibold"
                >
                  🎯 Create SEO Content
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
                <h3 className="text-lg font-bold mb-4">📊 Content Details</h3>
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
                    ❌ Cancel
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
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
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

      {/* LinkedIn Automation Tab */}
      {activeTab === 'linkedin' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
            <h1 className="text-4xl font-bold mb-4">💼 LinkedIn Automation</h1>
            <p className="text-xl text-blue-100">
              Automate your LinkedIn content creation, scheduling, and engagement with AI-powered tools.
            </p>
          </div>
          <LinkedInAutomation userPreferences={userPreferences || { writingVoice: { name: 'Professional' }, customizations: { formalityLevel: 7 }, targetAudience: ['Clients'], contentPreferences: ['Tax Updates'] }} />
        </div>
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

      {/* ICAI Compliance Checker Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 text-white">
            <h1 className="text-4xl font-bold mb-4">✅ ICAI Compliance Checker</h1>
            <p className="text-xl text-blue-100">
              Ensure your content meets ICAI guidelines and regulatory requirements with AI-powered compliance checking.
            </p>
          </div>
          <ICAIComplianceChecker />
        </div>
      )}

      {/* LinkedIn Network Analyzer Tab */}
      {activeTab === 'network' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
            <h1 className="text-4xl font-bold mb-4">🌐 LinkedIn Network Analyzer</h1>
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
            <h1 className="text-4xl font-bold mb-4">🎨 AI Image Generator</h1>
            <p className="text-xl text-blue-100">
              Create professional images for your content using AI-powered generation with CA-specific templates.
            </p>
          </div>
          <ImageGenerator />
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
    </div>
  );
}