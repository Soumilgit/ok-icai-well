'use client'

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Settings } from 'lucide-react'
import { NodeType } from '@/lib/workflow/types'
import NodeConfigPanel from './NodeConfigPanel'

interface WorkflowNodeData {
  label: string
  description?: string
  nodeType: NodeType
  executionStatus?: 'idle' | 'running' | 'completed' | 'failed'
  config?: Record<string, unknown>
  inputs: Array<{ id: string; label: string; type: string; required: boolean }>
  outputs: Array<{ id: string; label: string; type: string }>
}

const WorkflowNode: React.FC<NodeProps> = ({ data, selected, id }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const nodeData = data as unknown as WorkflowNodeData
  
  const handleConfigSave = (config: any) => {
    console.log('Saving node config:', { nodeId: id, config })
    // This would typically dispatch an action to update the node in the workflow state
  }

  const handleTestNode = () => {
    console.log('Testing node:', id)
    // Execute individual node for testing
  }
  const getNodeIcon = (nodeType: NodeType): string => {
    const iconMap: Record<NodeType, string> = {
      [NodeType.CLIENT_INTAKE]: '👤',
      [NodeType.DOCUMENT_UPLOAD]: '📄',
      [NodeType.EMAIL_TRIGGER]: '📧',
      [NodeType.SCHEDULED_TRIGGER]: '⏰',
      [NodeType.DOCUMENT_PROCESSOR]: '🔍',
      [NodeType.DATA_VALIDATOR]: '✅',
      [NodeType.TAX_CALCULATOR]: '🧮',
      [NodeType.GST_PROCESSOR]: '💰',
      [NodeType.INCOME_TAX_PROCESSOR]: '📊',
      [NodeType.COMPLIANCE_CHECKER]: '⚖️',
      [NodeType.AUDIT_VALIDATOR]: '🔍',
      [NodeType.REGULATORY_CHECKER]: '📋',
      [NodeType.GOOGLE_SHEETS_ACTION]: '📈',
      [NodeType.EMAIL_SENDER]: '✉️',
      [NodeType.SMS_SENDER]: '📱',
      [NodeType.BANK_API_CONNECTOR]: '🏦',
      [NodeType.CONDITION]: '🔀',
      [NodeType.LOOP]: '🔄',
      [NodeType.DELAY]: '⏳',
      [NodeType.DATA_TRANSFORMER]: '🔧',
      [NodeType.REPORT_GENERATOR]: '📑',
      [NodeType.NOTIFICATION_SENDER]: '🔔',
      [NodeType.FILE_EXPORT]: '💾',
      [NodeType.AUDIT_LOG]: '📝'
    }
    return iconMap[nodeType] || '⚙️'
  }

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 border-blue-300'
      case 'completed':
        return 'bg-green-100 border-green-300'
      case 'failed':
        return 'bg-red-100 border-red-300'
      default:
        return 'bg-white border-gray-300'
    }
  }

  return (
    <div className={`
      relative px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[200px] 
      ${selected ? 'border-blue-500' : getStatusColor(nodeData.executionStatus)}
      ${nodeData.executionStatus === 'running' ? 'animate-pulse' : ''}
    `}>
      {/* Input Handles */}
      {nodeData.inputs.map((input, index) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          style={{ top: 20 + (index * 25) }}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
      ))}

      {/* Output Handles */}
      {nodeData.outputs.map((output, index) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          style={{ top: 20 + (index * 25) }}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
      ))}

      {/* Node Content */}
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{getNodeIcon(nodeData.nodeType)}</div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 text-sm">{nodeData.label}</div>
          {nodeData.description && (
            <div className="text-xs text-gray-500 mt-1 truncate">{nodeData.description}</div>
          )}
          {/* Configuration indicator */}
          {nodeData.config && Object.keys(nodeData.config).length > 0 && (
            <div className="flex items-center space-x-1 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600">Configured</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsConfigOpen(true)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Execution Status */}
      {nodeData.executionStatus && nodeData.executionStatus !== 'idle' && (
        <div className="absolute -top-2 -right-2">
          <div className={`
            w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold
            ${nodeData.executionStatus === 'running' ? 'bg-blue-500 text-white' :
              nodeData.executionStatus === 'completed' ? 'bg-green-500 text-white' :
              nodeData.executionStatus === 'failed' ? 'bg-red-500 text-white' : ''}
          `}>
            {nodeData.executionStatus === 'running' && '⏳'}
            {nodeData.executionStatus === 'completed' && '✓'}
            {nodeData.executionStatus === 'failed' && '✗'}
          </div>
        </div>
      )}

      {/* Node Type Badge */}
      <div className="absolute -bottom-2 left-2">
        <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
          {nodeData.nodeType.replace(/_/g, ' ')}
        </div>
      </div>

      {/* Configuration Panel */}
      <NodeConfigPanel
        nodeId={id || ''}
        nodeType={nodeData.nodeType}
        nodeData={nodeData}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={handleConfigSave}
        onExecute={handleTestNode}
      />
    </div>
  )
}

export default memo(WorkflowNode)