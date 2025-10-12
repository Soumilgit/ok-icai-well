import { NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { Socket as NetSocket } from 'net'
import { Server as HttpServer } from 'http'

export interface SocketServer extends HttpServer {
  io?: ServerIO | undefined
}

export interface SocketWithIO extends NetSocket {
  server: SocketServer
}

export interface NextApiResponseServerIO extends NextApiResponse {
  socket: SocketWithIO
}

// Workflow execution events
export interface WorkflowExecutionEvent {
  workflowId: string
  nodeId?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  message?: string
  data?: any
  timestamp: string
}

export interface NodeExecutionEvent {
  nodeId: string
  workflowId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'error'
  output?: any
  error?: string
  executionTime?: number
  timestamp: string
}

export interface WorkflowLogEvent {
  workflowId: string
  nodeId?: string
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  data?: any
  timestamp: string
}