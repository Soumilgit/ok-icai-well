'use client'

import React, { useState } from 'react'
import { X, Save, Play, Settings } from 'lucide-react'
import { NodeType } from '@/lib/workflow/types'

interface NodeConfigPanelProps {
  nodeId: string
  nodeType: NodeType
  nodeData: any
  isOpen: boolean
  onClose: () => void
  onSave: (config: any) => void
  onExecute?: () => void
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  nodeId,
  nodeType,
  nodeData,
  isOpen,
  onClose,
  onSave,
  onExecute
}) => {
  const [config, setConfig] = useState(nodeData.config || {})
  const [loading, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(config)
      onClose()
    } catch (error) {
      console.error('Failed to save node config:', error)
    } finally {
      setSaving(false)
    }
  }

  const renderConfigForm = () => {
    switch (nodeType) {
      case NodeType.CLIENT_INTAKE:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Client Fields
              </label>
              <div className="space-y-2">
                {['name', 'pan', 'contact', 'business_type', 'address'].map(field => (
                  <label key={field} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.clientFields?.includes(field) || false}
                      onChange={(e) => {
                        const fields = config.clientFields || []
                        if (e.target.checked) {
                          setConfig({...config, clientFields: [...fields, field]})
                        } else {
                          setConfig({...config, clientFields: fields.filter((f: string) => f !== field)})
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{field.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Documents
              </label>
              <textarea
                value={config.requiredDocuments?.join(', ') || ''}
                onChange={(e) => setConfig({
                  ...config, 
                  requiredDocuments: e.target.value.split(', ').filter(d => d.trim())
                })}
                placeholder="PAN Card, Address Proof, Bank Statement"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
          </div>
        )

      case NodeType.TAX_CALCULATOR:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assessment Year
              </label>
              <select
                value={config.assessmentYear || '2024-25'}
                onChange={(e) => setConfig({...config, assessmentYear: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Regime
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="taxRegime"
                    value="old"
                    checked={config.taxRegime === 'old'}
                    onChange={(e) => setConfig({...config, taxRegime: e.target.value})}
                  />
                  <span>Old Tax Regime</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="taxRegime"
                    value="new"
                    checked={config.taxRegime === 'new'}
                    onChange={(e) => setConfig({...config, taxRegime: e.target.value})}
                  />
                  <span>New Tax Regime</span>
                </label>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.includeDeductions || false}
                onChange={(e) => setConfig({...config, includeDeductions: e.target.checked})}
              />
              <span className="text-sm">Include Deductions (80C, 80D, etc.)</span>
            </div>
          </div>
        )

      case NodeType.GOOGLE_SHEETS_ACTION:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spreadsheet ID
              </label>
              <input
                type="text"
                value={config.spreadsheetId || ''}
                onChange={(e) => setConfig({...config, spreadsheetId: e.target.value})}
                placeholder="1A2B3C4D5E6F..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sheet Name
              </label>
              <input
                type="text"
                value={config.sheetName || 'Sheet1'}
                onChange={(e) => setConfig({...config, sheetName: e.target.value})}
                placeholder="Sheet1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operation
              </label>
              <select
                value={config.operation || 'append'}
                onChange={(e) => setConfig({...config, operation: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="append">Append Data</option>
                <option value="update">Update Range</option>
                <option value="clear">Clear Sheet</option>
                <option value="read">Read Data</option>
              </select>
            </div>
          </div>
        )

      case NodeType.EMAIL_SENDER:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Template
              </label>
              <select
                value={config.template || 'default'}
                onChange={(e) => setConfig({...config, template: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="tax-calculation-complete">Tax Calculation Complete</option>
                <option value="document-request">Document Request</option>
                <option value="compliance-alert">Compliance Alert</option>
                <option value="custom">Custom Template</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Line
              </label>
              <input
                type="text"
                value={config.subject || ''}
                onChange={(e) => setConfig({...config, subject: e.target.value})}
                placeholder="Your tax calculation is ready"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.includeAttachments || false}
                onChange={(e) => setConfig({...config, includeAttachments: e.target.checked})}
              />
              <span className="text-sm">Include Attachments</span>
            </div>
          </div>
        )

      case NodeType.CONDITION:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition Type
              </label>
              <select
                value={config.conditionType || 'value'}
                onChange={(e) => setConfig({...config, conditionType: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="value">Value Comparison</option>
                <option value="exists">Field Exists</option>
                <option value="regex">Regex Match</option>
                <option value="custom">Custom Logic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field Path
              </label>
              <input
                type="text"
                value={config.fieldPath || ''}
                onChange={(e) => setConfig({...config, fieldPath: e.target.value})}
                placeholder="data.taxAmount"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operator
              </label>
              <select
                value={config.operator || 'equals'}
                onChange={(e) => setConfig({...config, operator: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="contains">Contains</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comparison Value
              </label>
              <input
                type="text"
                value={config.compareValue || ''}
                onChange={(e) => setConfig({...config, compareValue: e.target.value})}
                placeholder="50000"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Configuration
              </label>
              <textarea
                value={JSON.stringify(config, null, 2)}
                onChange={(e) => {
                  try {
                    setConfig(JSON.parse(e.target.value))
                  } catch (error) {
                    // Invalid JSON, don't update
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={8}
                placeholder='{"key": "value"}'
              />
            </div>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 border-l border-gray-200">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Configure Node</h2>
              <p className="text-sm text-gray-600">{nodeData.label}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {renderConfigForm()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Configuration'}</span>
            </button>
            {onExecute && (
              <button
                onClick={onExecute}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Play className="w-4 h-4" />
                <span>Test</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NodeConfigPanel