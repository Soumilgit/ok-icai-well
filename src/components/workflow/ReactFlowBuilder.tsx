'use client'

import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Node,
  Edge,
  Connection,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { NodeType } from '@/lib/workflow/types'
import { NODE_DEFINITIONS, NODE_CATEGORIES } from '@/lib/workflow/nodes'
import { useWorkflowSocket } from '@/lib/workflow/socket-context'
import { useWorkflowExecution } from '@/lib/workflow/execution-engine'
import WorkflowNode from './WorkflowNode'
import NodePalette from './NodePalette'
import WorkflowControls from './WorkflowControls'

interface ReactFlowBuilderProps {
  workflowId?: string
  initialNodes?: Node[]
  initialEdges?: Edge[]
  onSave?: (nodes: Node[], edges: Edge[]) => void
  readonly?: boolean
}

const nodeTypes = {
  workflowNode: WorkflowNode,
}

const ReactFlowBuilder: React.FC<ReactFlowBuilderProps> = ({
  workflowId,
  initialNodes = [],
  initialEdges = [],
  onSave,
  readonly = false
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionProgress, setExecutionProgress] = useState<Record<string, string>>({})

  const { socket, isConnected, joinWorkflow, startWorkflow, sendWorkflowLog } = useWorkflowSocket()
  const { executeWorkflow: runWorkflowExecution } = useWorkflowExecution()

  useEffect(() => {
    if (workflowId && isConnected) {
      joinWorkflow(workflowId)
    }
  }, [workflowId, isConnected, joinWorkflow])

  // Listen for real-time execution updates
  useEffect(() => {
    if (!socket) return

    const handleNodeStatusUpdate = (data: any) => {
      setExecutionProgress(prev => ({
        ...prev,
        [data.nodeId]: data.status
      }))

      // Update node visual status
      setNodes(nodes => 
        nodes.map(node => 
          node.id === data.nodeId 
            ? { ...node, data: { ...node.data, executionStatus: data.status } }
            : node
        )
      )
    }

    const handleWorkflowStarted = (data: any) => {
      setIsExecuting(true)
      setExecutionProgress({})
    }

    const handleWorkflowCompleted = (data: any) => {
      setIsExecuting(false)
      console.log('Workflow execution completed:', data)
    }

    socket.on('node_status_update', handleNodeStatusUpdate)
    socket.on('workflow_started', handleWorkflowStarted)
    socket.on('workflow_completed', handleWorkflowCompleted)

    return () => {
      socket.off('node_status_update', handleNodeStatusUpdate)
      socket.off('workflow_started', handleWorkflowStarted)
      socket.off('workflow_completed', handleWorkflowCompleted)
    }
  }, [socket, setNodes])

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/nodeType') as NodeType
      if (!type) return

      const position = {
        x: event.clientX - 250,
        y: event.clientY - 100,
      }

      const nodeDefinition = NODE_DEFINITIONS[type]
      const newNode: Node = {
        id: `${type}_${Date.now()}`,
        type: 'workflowNode',
        position,
        data: {
          ...nodeDefinition,
          nodeType: type,
          executionStatus: 'idle'
        },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [setNodes]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const executeWorkflow = useCallback(async () => {
    if (isExecuting || nodes.length === 0) return

    try {
      setIsExecuting(true)
      
      // Send start signal via WebSocket
      if (workflowId) {
        startWorkflow(workflowId, 'current-user')
      }
      
      // Convert React Flow nodes to our workflow format
      const workflowNodes = nodes.map(node => ({
        id: node.id,
        type: (node.data as any).nodeType || NodeType.CLIENT_INTAKE,
        position: node.position,
        data: {
          label: (node.data as any).label || 'Unknown Node',
          config: (node.data as any).config || {},
          inputs: (node.data as any).inputs || [],
          outputs: (node.data as any).outputs || []
        },
        inputs: [],
        outputs: []
      }))
      
      console.log('Starting workflow execution...')
      const execution = await runWorkflowExecution(workflowNodes, edges)
      
      console.log('Workflow execution completed:', execution)
      setIsExecuting(false)
      
      if (workflowId) {
        sendWorkflowLog(workflowId, 'info', `Workflow execution completed with status: ${execution.status}`)
      }
      
    } catch (error: any) {
      console.error('Error executing workflow:', error)
      setIsExecuting(false)
      if (workflowId) {
        sendWorkflowLog(workflowId, 'error', `Failed to execute workflow: ${error.message}`)
      }
    }
  }, [nodes, edges, isExecuting, workflowId, startWorkflow, sendWorkflowLog])

  const saveWorkflow = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges)
    }
  }, [nodes, edges, onSave])

  const clearWorkflow = useCallback(() => {
    setNodes([])
    setEdges([])
    setSelectedNode(null)
    setExecutionProgress({})
  }, [setNodes, setEdges])

  return (
    <div className="h-full flex">
      {/* Node Palette */}
      {!readonly && (
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <NodePalette />
        </div>
      )}

      {/* Main Flow Area */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} />
        </ReactFlow>

        {/* Workflow Controls */}
        <WorkflowControls
          isExecuting={isExecuting}
          isConnected={isConnected}
          onExecute={executeWorkflow}
          onSave={saveWorkflow}
          onClear={clearWorkflow}
          readonly={readonly}
        />

        {/* Execution Status */}
        {isExecuting && (
          <div className="absolute top-4 right-4 bg-blue-100 border border-blue-300 rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-800 font-medium">Executing Workflow...</span>
            </div>
            <div className="mt-2 text-sm text-blue-600">
              Progress: {Object.keys(executionProgress).length} / {nodes.length} nodes
            </div>
          </div>
        )}
      </div>

      {/* Node Configuration Panel */}
      {selectedNode && !readonly && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Node Configuration</h3>
            <p className="text-sm text-gray-600">{selectedNode.data.label}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Node Label
              </label>
              <input
                type="text"
                value={selectedNode.data.label}
                onChange={(e) => {
                  const updatedNode = {
                    ...selectedNode,
                    data: { ...selectedNode.data, label: e.target.value }
                  }
                  setSelectedNode(updatedNode)
                  setNodes(nodes => 
                    nodes.map(n => n.id === selectedNode.id ? updatedNode : n)
                  )
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={selectedNode.data.description || ''}
                onChange={(e) => {
                  const updatedNode = {
                    ...selectedNode,
                    data: { ...selectedNode.data, description: e.target.value }
                  }
                  setSelectedNode(updatedNode)
                  setNodes(nodes => 
                    nodes.map(n => n.id === selectedNode.id ? updatedNode : n)
                  )
                }}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Node-specific configuration */}
            {selectedNode.data.nodeType === NodeType.GOOGLE_SHEETS_ACTION && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Type
                  </label>
                  <select
                    value={selectedNode.data.config?.action || 'read'}
                    onChange={(e) => {
                      const updatedNode = {
                        ...selectedNode,
                        data: { 
                          ...selectedNode.data, 
                          config: { ...selectedNode.data.config, action: e.target.value }
                        }
                      }
                      setSelectedNode(updatedNode)
                      setNodes(nodes => 
                        nodes.map(n => n.id === selectedNode.id ? updatedNode : n)
                      )
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="read">Read Data</option>
                    <option value="write">Write Data</option>
                    <option value="create_task">Create Task</option>
                    <option value="update_analytics">Update Analytics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sheet Name
                  </label>
                  <input
                    type="text"
                    value={selectedNode.data.config?.sheetName || ''}
                    onChange={(e) => {
                      const updatedNode = {
                        ...selectedNode,
                        data: { 
                          ...selectedNode.data, 
                          config: { ...selectedNode.data.config, sheetName: e.target.value }
                        }
                      }
                      setSelectedNode(updatedNode)
                      setNodes(nodes => 
                        nodes.map(n => n.id === selectedNode.id ? updatedNode : n)
                      )
                    }}
                    placeholder="e.g., Drafting Pipeline"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {selectedNode.data.nodeType === NodeType.EMAIL_SENDER && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Template
                  </label>
                  <select
                    value={selectedNode.data.config?.template || 'default'}
                    onChange={(e) => {
                      const updatedNode = {
                        ...selectedNode,
                        data: { 
                          ...selectedNode.data, 
                          config: { ...selectedNode.data.config, template: e.target.value }
                        }
                      }
                      setSelectedNode(updatedNode)
                      setNodes(nodes => 
                        nodes.map(n => n.id === selectedNode.id ? updatedNode : n)
                      )
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="default">Default Template</option>
                    <option value="client_welcome">Client Welcome</option>
                    <option value="task_notification">Task Notification</option>
                    <option value="compliance_alert">Compliance Alert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={selectedNode.data.config?.subject || ''}
                    onChange={(e) => {
                      const updatedNode = {
                        ...selectedNode,
                        data: { 
                          ...selectedNode.data, 
                          config: { ...selectedNode.data.config, subject: e.target.value }
                        }
                      }
                      setSelectedNode(updatedNode)
                      setNodes(nodes => 
                        nodes.map(n => n.id === selectedNode.id ? updatedNode : n)
                      )
                    }}
                    placeholder="Email subject"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Execution Status */}
            {selectedNode.data.executionStatus && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Execution Status</h4>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  selectedNode.data.executionStatus === 'completed' ? 'bg-green-100 text-green-800' :
                  selectedNode.data.executionStatus === 'running' ? 'bg-blue-100 text-blue-800' :
                  selectedNode.data.executionStatus === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedNode.data.executionStatus}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setSelectedNode(null)}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close Panel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const ReactFlowBuilderWrapper: React.FC<ReactFlowBuilderProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ReactFlowBuilder {...props} />
    </ReactFlowProvider>
  )
}

export default ReactFlowBuilderWrapper