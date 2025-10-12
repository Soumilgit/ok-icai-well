'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

interface WorkflowSocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinWorkflow: (workflowId: string) => void
  leaveWorkflow: (workflowId: string) => void
  startWorkflow: (workflowId: string, userId: string) => void
  sendNodeUpdate: (data: any) => void
  sendWorkflowLog: (workflowId: string, level: string, message: string, nodeId?: string) => void
}

const WorkflowSocketContext = createContext<WorkflowSocketContextType | undefined>(undefined)

export const useWorkflowSocket = () => {
  const context = useContext(WorkflowSocketContext)
  if (!context) {
    throw new Error('useWorkflowSocket must be used within a WorkflowSocketProvider')
  }
  return context
}

interface WorkflowSocketProviderProps {
  children: ReactNode
}

export const WorkflowSocketProvider: React.FC<WorkflowSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Demo mode - simulate WebSocket connection without actual Socket.IO server
    console.log('🔗 Initializing WebSocket connection (Demo Mode)')
    
    // Simulate connection delay
    const connectionTimer = setTimeout(() => {
      console.log('✅ Simulated WebSocket connected - Real-time features active')
      setIsConnected(true)
    }, 1500)

    // Create a complete mock socket interface for demo purposes
    const eventHandlers = new Map<string, Set<Function>>()
    
    const mockSocket = {
      // Event handling
      on: (event: string, handler: Function) => {
        console.log(`📡 Registered handler for: ${event}`)
        if (!eventHandlers.has(event)) {
          eventHandlers.set(event, new Set())
        }
        eventHandlers.get(event)?.add(handler)
      },
      off: (event: string, handler: Function) => {
        console.log(`📡 Removed handler for: ${event}`)
        eventHandlers.get(event)?.delete(handler)
      },
      emit: (event: string, data?: any) => {
        console.log(`📤 Emitting: ${event}`, data)
        // Simulate event handling in demo mode
        const handlers = eventHandlers.get(event)
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler(data)
            } catch (error) {
              console.log(`Error in ${event} handler:`, error)
            }
          })
        }
      },
      // Connection management
      connect: () => {
        console.log('🔗 Mock socket connect called')
        setIsConnected(true)
      },
      disconnect: () => {
        console.log('🔌 Mock socket disconnect called')
        setIsConnected(false)
      },
      close: () => {
        console.log('🔌 Mock socket closed')
        setIsConnected(false)
      },
      // Socket.IO specific methods
      join: (room: string) => {
        console.log(`🏠 Joined room: ${room}`)
      },
      leave: (room: string) => {
        console.log(`🚪 Left room: ${room}`)
      },
      // Mock properties
      id: 'mock-socket-id',
      connected: true,
      disconnected: false
    }
    
    // Set up default event handlers for the mock socket
    mockSocket.on('workflow_started', (data: any) => {
      console.log('📊 Workflow started:', data)
    })

    mockSocket.on('node_status_update', (data: any) => {
      console.log('🔄 Node status update:', data)
    })

    mockSocket.on('workflow_completed', (data: any) => {
      console.log('✅ Workflow completed:', data)
    })

    mockSocket.on('log_update', (data: any) => {
      console.log('📝 Log update:', data)
    })
    
    setSocket(mockSocket as any)

    return () => {
      clearTimeout(connectionTimer)
      setIsConnected(false)
      eventHandlers.clear()
      console.log('🔌 WebSocket connection cleaned up')
    }
  }, [])

  const joinWorkflow = (workflowId: string) => {
    if (socket) {
      socket.emit('join_workflow', workflowId)
    }
  }

  const leaveWorkflow = (workflowId: string) => {
    if (socket) {
      socket.emit('leave_workflow', workflowId)
    }
  }

  const startWorkflow = (workflowId: string, userId: string) => {
    if (socket) {
      socket.emit('start_workflow', { workflowId, userId })
    }
  }

  const sendNodeUpdate = (data: any) => {
    if (socket) {
      socket.emit('node_update', data)
    }
  }

  const sendWorkflowLog = (workflowId: string, level: string, message: string, nodeId?: string) => {
    if (socket) {
      socket.emit('workflow_log', { workflowId, level, message, nodeId })
    }
  }

  const value: WorkflowSocketContextType = {
    socket,
    isConnected,
    joinWorkflow,
    leaveWorkflow,
    startWorkflow,
    sendNodeUpdate,
    sendWorkflowLog,
  }

  return (
    <WorkflowSocketContext.Provider value={value}>
      {children}
    </WorkflowSocketContext.Provider>
  )
}