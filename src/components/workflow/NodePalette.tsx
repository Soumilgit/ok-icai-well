'use client'

import React, { useState } from 'react'
import { NodeType } from '@/lib/workflow/types'

interface NodePaletteProps {
  onNodeDrag: (nodeType: NodeType, event: React.DragEvent) => void
}

const NodePalette: React.FC<NodePaletteProps> = ({ onNodeDrag }) => {
  const [activeCategory, setActiveCategory] = useState<string>('triggers')

  const nodeCategories = {
    triggers: {
      label: 'Triggers',
      icon: '🚀',
      nodes: [
        {
          type: NodeType.CLIENT_INTAKE,
          label: 'Client Intake',
          description: 'Start workflow from client data',
          icon: '👤'
        },
        {
          type: NodeType.EMAIL_TRIGGER,
          label: 'Email Trigger',
          description: 'Trigger on email received',
          icon: '📧'
        },
        {
          type: NodeType.SCHEDULED_TRIGGER,
          label: 'Schedule',
          description: 'Run on schedule',
          icon: '⏰'
        },
        {
          type: NodeType.DOCUMENT_UPLOAD,
          label: 'Document Upload',
          description: 'Trigger on document upload',
          icon: '📄'
        }
      ]
    },
    processors: {
      label: 'Processors',
      icon: '⚙️',
      nodes: [
        {
          type: NodeType.DOCUMENT_PROCESSOR,
          label: 'Document Processor',
          description: 'Extract data from documents',
          icon: '🔍'
        },
        {
          type: NodeType.DATA_VALIDATOR,
          label: 'Data Validator',
          description: 'Validate data integrity',
          icon: '✅'
        },
        {
          type: NodeType.TAX_CALCULATOR,
          label: 'Tax Calculator',
          description: 'Calculate tax amounts',
          icon: '🧮'
        },
        {
          type: NodeType.GST_PROCESSOR,
          label: 'GST Processor',
          description: 'Process GST calculations',
          icon: '💰'
        },
        {
          type: NodeType.INCOME_TAX_PROCESSOR,
          label: 'Income Tax',
          description: 'Process income tax',
          icon: '📊'
        },
        {
          type: NodeType.DATA_TRANSFORMER,
          label: 'Data Transformer',
          description: 'Transform data format',
          icon: '🔧'
        }
      ]
    },
    compliance: {
      label: 'Compliance',
      icon: '⚖️',
      nodes: [
        {
          type: NodeType.COMPLIANCE_CHECKER,
          label: 'Compliance Check',
          description: 'Verify regulatory compliance',
          icon: '⚖️'
        },
        {
          type: NodeType.AUDIT_VALIDATOR,
          label: 'Audit Validator',
          description: 'Validate audit requirements',
          icon: '🔍'
        },
        {
          type: NodeType.REGULATORY_CHECKER,
          label: 'Regulatory Check',
          description: 'Check regulatory requirements',
          icon: '📋'
        },
        {
          type: NodeType.AUDIT_LOG,
          label: 'Audit Log',
          description: 'Create audit trail',
          icon: '📝'
        }
      ]
    },
    actions: {
      label: 'Actions',
      icon: '🎯',
      nodes: [
        {
          type: NodeType.GOOGLE_SHEETS_ACTION,
          label: 'Google Sheets',
          description: 'Read/write Google Sheets',
          icon: '📈'
        },
        {
          type: NodeType.EMAIL_SENDER,
          label: 'Send Email',
          description: 'Send email notifications',
          icon: '✉️'
        },
        {
          type: NodeType.SMS_SENDER,
          label: 'Send SMS',
          description: 'Send SMS notifications',
          icon: '📱'
        },
        {
          type: NodeType.BANK_API_CONNECTOR,
          label: 'Bank API',
          description: 'Connect to banking APIs',
          icon: '🏦'
        },
        {
          type: NodeType.REPORT_GENERATOR,
          label: 'Generate Report',
          description: 'Create custom reports',
          icon: '📑'
        },
        {
          type: NodeType.NOTIFICATION_SENDER,
          label: 'Notification',
          description: 'Send notifications',
          icon: '🔔'
        },
        {
          type: NodeType.FILE_EXPORT,
          label: 'Export File',
          description: 'Export data to file',
          icon: '💾'
        }
      ]
    },
    logic: {
      label: 'Logic & Flow',
      icon: '🧠',
      nodes: [
        {
          type: NodeType.CONDITION,
          label: 'Condition',
          description: 'Conditional branching',
          icon: '🔀'
        },
        {
          type: NodeType.LOOP,
          label: 'Loop',
          description: 'Repeat actions',
          icon: '🔄'
        },
        {
          type: NodeType.DELAY,
          label: 'Delay',
          description: 'Add time delay',
          icon: '⏳'
        }
      ]
    }
  }

  const handleDragStart = (nodeType: NodeType, event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
    onNodeDrag(nodeType, event)
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Node Palette</h2>
        <p className="text-sm text-gray-600 mt-1">Drag nodes to canvas</p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap border-b border-gray-200">
        {Object.entries(nodeCategories).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeCategory === key
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="mr-1">{category.icon}</span>
            {category.label}
          </button>
        ))}
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {nodeCategories[activeCategory as keyof typeof nodeCategories].nodes.map((node) => (
            <div
              key={node.type}
              draggable
              onDragStart={(e) => handleDragStart(node.type, e)}
              className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg cursor-grab active:cursor-grabbing transition-colors group"
            >
              <div className="flex items-start space-x-3">
                <div className="text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                  {node.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {node.label}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {node.description}
                  </div>
                </div>
              </div>
              
              {/* Drag Indicator */}
              <div className="flex justify-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Live connections to real services</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Real-time execution feedback</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NodePalette