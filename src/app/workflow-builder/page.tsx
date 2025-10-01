'use client'

import React from 'react'
import { WorkflowSocketProvider } from '@/lib/workflow/socket-context'
import ReactFlowBuilder from '@/components/workflow/ReactFlowBuilder'
import Navigation from '@/app/components/Navigation'
import { NodeType } from '@/lib/workflow/types'
import { Node, Edge } from '@xyflow/react'

const WorkflowBuilderPage: React.FC = () => {
  // Demo workflow with CA-specific nodes
  const demoNodes: Node[] = [
    {
      id: '1',
      type: 'workflowNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Client Intake',
        description: 'Collect client information and documents',
        nodeType: NodeType.CLIENT_INTAKE,
        executionStatus: 'idle',
        inputs: [],
        outputs: [{ id: 'out-1', label: 'Client Data', type: 'object' }],
        config: {
          clientFields: ['name', 'pan', 'contact', 'business_type'],
          requiredDocuments: ['PAN Card', 'Address Proof', 'Bank Statement']
        }
      }
    },
    {
      id: '2',
      type: 'workflowNode',
      position: { x: 400, y: 100 },
      data: {
        label: 'Document Processor',
        description: 'Extract and validate document data',
        nodeType: NodeType.DOCUMENT_PROCESSOR,
        executionStatus: 'idle',
        inputs: [{ id: 'in-1', label: 'Documents', type: 'array', required: true }],
        outputs: [{ id: 'out-1', label: 'Extracted Data', type: 'object' }],
        config: {
          supportedFormats: ['PDF', 'JPG', 'PNG'],
          ocrEnabled: true,
          dataValidation: true
        }
      }
    },
    {
      id: '3',
      type: 'workflowNode',
      position: { x: 700, y: 50 },
      data: {
        label: 'Tax Calculator',
        description: 'Calculate tax liability and deductions',
        nodeType: NodeType.TAX_CALCULATOR,
        executionStatus: 'idle',
        inputs: [{ id: 'in-1', label: 'Financial Data', type: 'object', required: true }],
        outputs: [{ id: 'out-1', label: 'Tax Calculations', type: 'object' }],
        config: {
          assessmentYear: '2024-25',
          taxRegime: 'new',
          includeDeductions: true
        }
      }
    },
    {
      id: '4',
      type: 'workflowNode',
      position: { x: 700, y: 200 },
      data: {
        label: 'Google Sheets Export',
        description: 'Export results to Google Sheets',
        nodeType: NodeType.GOOGLE_SHEETS_ACTION,
        executionStatus: 'idle',
        inputs: [{ id: 'in-1', label: 'Data', type: 'object', required: true }],
        outputs: [{ id: 'out-1', label: 'Sheet URL', type: 'string' }],
        config: {
          spreadsheetId: process.env.NEXT_PUBLIC_DEFAULT_CA_SPREADSHEET_ID || '',
          sheetName: 'Tax Calculations',
          operation: 'append'
        }
      }
    },
    {
      id: '5',
      type: 'workflowNode',
      position: { x: 1000, y: 100 },
      data: {
        label: 'Email Notification',
        description: 'Send completion email to client',
        nodeType: NodeType.EMAIL_SENDER,
        executionStatus: 'idle',
        inputs: [
          { id: 'in-1', label: 'Client Data', type: 'object', required: true },
          { id: 'in-2', label: 'Results', type: 'object', required: true }
        ],
        outputs: [{ id: 'out-1', label: 'Email Status', type: 'string' }],
        config: {
          template: 'tax-calculation-complete',
          includeAttachments: true,
          priority: 'normal'
        }
      }
    }
  ]

  const demoEdges: Edge[] = [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      sourceHandle: 'out-1',
      targetHandle: 'in-1',
      type: 'smoothstep'
    },
    {
      id: 'e2-3',
      source: '2',
      target: '3',
      sourceHandle: 'out-1',
      targetHandle: 'in-1',
      type: 'smoothstep'
    },
    {
      id: 'e2-4',
      source: '2',
      target: '4',
      sourceHandle: 'out-1',
      targetHandle: 'in-1',
      type: 'smoothstep'
    },
    {
      id: 'e3-5',
      source: '3',
      target: '5',
      sourceHandle: 'out-1',
      targetHandle: 'in-2',
      type: 'smoothstep'
    },
    {
      id: 'e1-5',
      source: '1',
      target: '5',
      sourceHandle: 'out-1',
      targetHandle: 'in-1',
      type: 'smoothstep'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="pt-16">
        <WorkflowSocketProvider>
          <div className="h-[calc(100vh-4rem)]">
            <ReactFlowBuilder 
              workflowId="demo-ca-tax-workflow"
              initialNodes={demoNodes}
              initialEdges={demoEdges}
              onSave={(nodes, edges) => {
                console.log('Saving CA Tax Workflow:', { nodes, edges })
                // TODO: Implement save to backend
                alert('Workflow saved successfully! (Demo Mode)')
              }}
            />
          </div>
        </WorkflowSocketProvider>
      </div>
    </div>
  )
}

export default WorkflowBuilderPage