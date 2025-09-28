'use client';

import { useState, useEffect } from 'react';
import { useUser, SignOutButton } from '@clerk/nextjs';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'content' | 'automation' | 'exam-gen'>('overview');
  const [runningAutomation, setRunningAutomation] = useState(false);
  
  // Chat interface state
  const [examResults, setExamResults] = useState<any[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
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
    }
  }, [isLoaded]);

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
                    className="w-full text-left p-3 text-sm text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 hover:translate-x-2 bg-green-600/20 rounded"
                  >
                    📝 CA Drafting Workflow
                  </button>
                  <button 
                    onClick={() => {
                      setShowSheetsWorkflow(!showSheetsWorkflow);
                      setSheetsWorkflowType('auditing');
                    }}
                    className="w-full text-left p-3 text-sm text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 hover:translate-x-2 bg-orange-600/20 rounded"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">Today's News</p>
                    <p className="text-3xl font-bold">{dashboardData?.overview?.today?.newsArticles || 0}</p>
                  </div>
                  <div className="text-4xl">📰</div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">Generated Content</p>
                    <p className="text-3xl font-bold">{dashboardData?.overview?.today?.generatedContent || 0}</p>
                  </div>
                  <div className="text-4xl">📝</div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">Notifications Sent</p>
                    <p className="text-3xl font-bold">{dashboardData?.overview?.today?.notifications || 0}</p>
                  </div>
                  <div className="text-4xl">🔔</div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">Automation Status</p>
                    <p className="text-lg font-bold text-green-400">Active</p>
                  </div>
                  <div className="text-4xl">🤖</div>
                </div>
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
                  className="bg-green-600 hover:bg-green-700 p-4 rounded-lg transition-colors font-semibold"
                >
                  📊 Generate Tax Article
                </button>
                
                <button
                  onClick={() => generateContent('audit-checklist')}
                  className="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg transition-colors font-semibold"
                >
                  ✅ Create Audit Checklist
                </button>
                
                <button
                  onClick={() => generateExamQuestions('General CA Topics')}
                  className="bg-orange-600 hover:bg-orange-700 p-4 rounded-lg transition-colors font-semibold"
                >
                  ❓ Generate Exam Questions
                </button>
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