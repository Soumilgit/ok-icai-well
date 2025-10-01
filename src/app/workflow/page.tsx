'use client'

import React, { useState, useEffect } from 'react';
import { WorkflowTemplate, TemplateCategory, Workflow } from '@/lib/workflow/types';

const WorkflowBuilder: React.FC = () => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'workflows' | 'builder'>('templates');
  const [isLoading, setIsLoading] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<{
    status: string;
    logs: Array<{
      timestamp: string;
      level: string;
      message: string;
    }>;
  } | null>(null);

  useEffect(() => {
    loadTemplates();
    loadWorkflows();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/workflow/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/workflow');
      const data = await response.json();
      if (data.success) {
        setWorkflows(data.data);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  };

  const createWorkflowFromTemplate = async (templateId: string, name: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/workflow/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, name })
      });
      
      const data = await response.json();
      if (data.success) {
        setWorkflows([...workflows, data.data]);
        setSelectedWorkflow(data.data);
        setActiveTab('builder');
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
    }
    setIsLoading(false);
  };

  const executeWorkflow = async (workflowId: string, inputData: any = {}) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/workflow/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: inputData })
      });
      
      const data = await response.json();
      if (data.success) {
        setExecutionStatus(data.data);
        // Poll for status updates
        pollExecutionStatus(data.data.executionId);
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
    }
    setIsLoading(false);
  };

  const pollExecutionStatus = async (executionId: string) => {
    try {
      const response = await fetch(`/api/workflow/execution/${executionId}`);
      const data = await response.json();
      
      if (data.success) {
        setExecutionStatus(data.data);
        
        if (data.data.status === 'running') {
          setTimeout(() => pollExecutionStatus(executionId), 2000);
        }
      }
    } catch (error) {
      console.error('Error polling execution status:', error);
    }
  };

  const getCategoryColor = (category: TemplateCategory): string => {
    const colors = {
      [TemplateCategory.CLIENT_ONBOARDING]: 'bg-blue-100 text-blue-800',
      [TemplateCategory.TAX_FILING]: 'bg-green-100 text-green-800',
      [TemplateCategory.AUDIT_PROCESS]: 'bg-purple-100 text-purple-800',
      [TemplateCategory.COMPLIANCE_CHECK]: 'bg-yellow-100 text-yellow-800',
      [TemplateCategory.REPORT_GENERATION]: 'bg-pink-100 text-pink-800',
      [TemplateCategory.DOCUMENT_PROCESSING]: 'bg-indigo-100 text-indigo-800',
      [TemplateCategory.NOTIFICATION_SYSTEM]: 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getComplexityColor = (complexity: string): string => {
    const colors: Record<string, string> = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800'
    };
    return colors[complexity] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CA Workflow Builder</h1>
              <p className="mt-1 text-sm text-gray-500">
                Design custom automation workflows for your CA practice
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === 'templates'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveTab('workflows')}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === 'workflows'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                My Workflows
              </button>
              <button
                onClick={() => setActiveTab('builder')}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === 'builder'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Builder
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow Templates</h2>
              <p className="text-gray-600">
                Choose from pre-built templates designed specifically for CA workflows
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                      {template.category.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(template.complexity)}`}>
                      {template.complexity}
                    </span>
                    <span className="text-sm text-gray-500">~{template.estimatedTime} min</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    <strong>Flow:</strong> {template.preview}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const name = prompt('Enter workflow name:', `My ${template.name}`);
                      if (name) {
                        createWorkflowFromTemplate(template.id, name);
                      }
                    }}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating...' : 'Use Template'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Workflows Tab */}
        {activeTab === 'workflows' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">My Workflows</h2>
              <p className="text-gray-600">
                Manage and execute your custom workflows
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      workflow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {workflow.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{workflow.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">
                      {workflow.nodes.length} nodes, {workflow.connections.length} connections
                    </span>
                    <span className="text-sm text-gray-500">
                      Updated {new Date(workflow.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedWorkflow(workflow);
                        setActiveTab('builder');
                      }}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        const inputData = prompt('Enter input data (JSON):');
                        try {
                          const data = inputData ? JSON.parse(inputData) : {};
                          executeWorkflow(workflow.id, data);
                        } catch (error) {
                          alert('Invalid JSON format');
                        }
                      }}
                      disabled={!workflow.isActive || isLoading}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Running...' : 'Execute'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workflow Builder Tab */}
        {activeTab === 'builder' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow Builder</h2>
              <p className="text-gray-600">
                Visual workflow editor (Coming Soon - Advanced UI)
              </p>
            </div>
            
            {selectedWorkflow ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">{selectedWorkflow.name}</h3>
                <p className="text-gray-600 mb-6">{selectedWorkflow.description}</p>
                
                {/* Workflow Visualization */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
                  <div className="text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Visual Workflow Editor</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Advanced drag-and-drop interface coming soon
                    </p>
                  </div>
                </div>

                {/* Workflow Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Workflow Nodes ({selectedWorkflow.nodes.length})</h4>
                    <div className="space-y-2">
                      {selectedWorkflow.nodes.map((node, index) => (
                        <div key={node.id} className="flex items-center p-3 bg-gray-50 rounded-md">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">{index + 1}</span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{node.data.label}</p>
                            <p className="text-xs text-gray-500">{node.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Workflow Info</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          selectedWorkflow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedWorkflow.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Created:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {new Date(selectedWorkflow.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Tags:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedWorkflow.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Workflow Selected</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Select a workflow from templates or your workflows to start building
                </p>
              </div>
            )}
          </div>
        )}

        {/* Execution Status Modal */}
        {executionStatus && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Workflow Execution</h3>
                <button
                  onClick={() => setExecutionStatus(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  executionStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                  executionStatus.status === 'failed' ? 'bg-red-100 text-red-800' :
                  executionStatus.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {executionStatus.status}
                </span>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Execution Logs</h4>
                <div className="max-h-60 overflow-y-auto bg-gray-50 p-3 rounded-md">
                  {executionStatus.logs.map((log: any, index: number) => (
                    <div key={index} className="mb-2 text-sm">
                      <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className={`ml-2 font-medium ${
                        log.level === 'error' ? 'text-red-600' :
                        log.level === 'warning' ? 'text-yellow-600' :
                        'text-gray-900'
                      }`}>
                        [{log.level.toUpperCase()}]
                      </span>
                      <span className="ml-2">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setExecutionStatus(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilder;