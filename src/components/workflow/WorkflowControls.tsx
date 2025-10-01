'use client'

import React, { useState } from 'react'
import { Play, Pause, Square, Save, Download, Upload, Settings, Zap, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface WorkflowControlsProps {
  workflowId?: string
  isExecuting: boolean
  executionStatus: 'idle' | 'running' | 'completed' | 'failed'
  onExecute: () => void
  onPause: () => void
  onStop: () => void
  onSave: () => void
  onLoad: () => void
  onExport: () => void
  onSettings: () => void
  executionProgress?: {
    current: number
    total: number
    currentNodeId?: string
  }
}

const WorkflowControls: React.FC<WorkflowControlsProps> = ({
  workflowId,
  isExecuting,
  executionStatus,
  onExecute,
  onPause,
  onStop,
  onSave,
  onLoad,
  onExport,
  onSettings,
  executionProgress
}) => {
  const [showExecutionDetails, setShowExecutionDetails] = useState(false)

  const getStatusIcon = () => {
    switch (executionStatus) {
      case 'running':
        return <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (executionStatus) {
      case 'running':
        return 'Executing...'
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      default:
        return 'Ready'
    }
  }

  const getStatusColor = () => {
    switch (executionStatus) {
      case 'running':
        return 'bg-blue-50 border-blue-200 text-blue-700'
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-700'
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-700'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700'
    }
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* Main Controls Row */}
      <div className="flex items-center justify-between">
        {/* Left: Execution Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {!isExecuting ? (
              <button
                onClick={onExecute}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Execute</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={onPause}
                  className="flex items-center space-x-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={onStop}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop</span>
                </button>
              </div>
            )}
          </div>

          {/* Status Display */}
          <div 
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer ${getStatusColor()}`}
            onClick={() => setShowExecutionDetails(!showExecutionDetails)}
          >
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
            {executionProgress && (
              <span className="text-xs">
                ({executionProgress.current}/{executionProgress.total})
              </span>
            )}
          </div>
        </div>

        {/* Right: Workflow Management */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onSave}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            title="Save Workflow"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>
          
          <button
            onClick={onLoad}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            title="Load Workflow"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Load</span>
          </button>
          
          <button
            onClick={onExport}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            title="Export Workflow"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          
          <button
            onClick={onSettings}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            title="Workflow Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Execution Progress Bar */}
      {executionProgress && executionProgress.total > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round((executionProgress.current / executionProgress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(executionProgress.current / executionProgress.total) * 100}%` }}
            ></div>
          </div>
          {executionProgress.currentNodeId && (
            <div className="text-xs text-gray-600 mt-1">
              Current: {executionProgress.currentNodeId}
            </div>
          )}
        </div>
      )}

      {/* Execution Details (Collapsible) */}
      {showExecutionDetails && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
          <div className="text-sm text-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium text-gray-900">Workflow ID</div>
                <div className="text-gray-600 font-mono text-xs">{workflowId || 'Unsaved'}</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Status</div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon()}
                  <span>{getStatusText()}</span>
                </div>
              </div>
              {executionProgress && (
                <>
                  <div>
                    <div className="font-medium text-gray-900">Nodes Executed</div>
                    <div>{executionProgress.current} of {executionProgress.total}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Current Node</div>
                    <div className="text-xs font-mono">{executionProgress.currentNodeId || 'None'}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Indicators */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>WebSocket Connected</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Real-time Execution</span>
          </div>
        </div>
        <div>
          Built with ❤️ for CA Professionals
        </div>
      </div>
    </div>
  )
}

export default WorkflowControls