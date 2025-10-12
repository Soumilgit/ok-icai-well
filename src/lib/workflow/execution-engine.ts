'use client'

import { NodeType, WorkflowNode as WorkflowNodeType } from '@/lib/workflow/types'

interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: Date
  completedAt?: Date
  nodeExecutions: NodeExecution[]
  error?: string
  triggeredBy: string
}

interface NodeExecution {
  nodeId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startedAt?: Date
  completedAt?: Date
  input?: any
  output?: any
  error?: string
  executionTime?: number
}

export class WorkflowExecutionEngine {
  private nodes: WorkflowNodeType[] = []
  private edges: any[] = []
  private executionContext: any = {}
  
  constructor(nodes: WorkflowNodeType[], edges: any[]) {
    this.nodes = nodes
    this.edges = edges
  }

  async executeWorkflow(triggerNodeId?: string): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}`,
      workflowId: 'demo_workflow',
      status: 'running',
      startedAt: new Date(),
      nodeExecutions: [],
      triggeredBy: 'user'
    }

    try {
      // Find starting nodes (nodes with no inputs or specified trigger)
      const startNodes = triggerNodeId 
        ? [this.nodes.find(n => n.id === triggerNodeId)!]
        : this.nodes.filter(node => 
            !this.edges.some(edge => edge.target === node.id)
          )

      // Execute nodes in sequence
      for (const startNode of startNodes) {
        await this.executeNode(startNode, execution)
      }

      execution.status = 'completed'
      execution.completedAt = new Date()
      
    } catch (error: any) {
      execution.status = 'failed'
      execution.error = error.message
      execution.completedAt = new Date()
    }

    return execution
  }

  private async executeNode(node: WorkflowNodeType, execution: WorkflowExecution): Promise<any> {
    const nodeExecution: NodeExecution = {
      nodeId: node.id,
      status: 'running',
      startedAt: new Date(),
      input: this.executionContext[node.id] || {}
    }

    execution.nodeExecutions.push(nodeExecution)

    try {
      // Simulate node execution based on type
      const result = await this.simulateNodeExecution(node)
      
      nodeExecution.status = 'completed'
      nodeExecution.output = result
      nodeExecution.completedAt = new Date()
      nodeExecution.executionTime = Date.now() - nodeExecution.startedAt!.getTime()

      // Store result in execution context
      this.executionContext[node.id] = result

      // Execute connected nodes
      const connectedEdges = this.edges.filter(edge => edge.source === node.id)
      for (const edge of connectedEdges) {
        const nextNode = this.nodes.find(n => n.id === edge.target)
        if (nextNode) {
          await this.executeNode(nextNode, execution)
        }
      }

      return result

    } catch (error: any) {
      nodeExecution.status = 'failed'
      nodeExecution.error = error.message
      nodeExecution.completedAt = new Date()
      throw error
    }
  }

  private async simulateNodeExecution(node: WorkflowNodeType): Promise<any> {
    // Add realistic delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500))

    const config = node.data.config || {}

    switch ((node.data as any).nodeType) {
      case NodeType.CLIENT_INTAKE:
        return {
          clientId: `client_${Date.now()}`,
          name: 'Sample Client',
          pan: 'ABCDE1234F',
          email: 'client@example.com',
          phone: '+91-9876543210',
          businessType: 'Individual',
          documents: config.requiredDocuments?.map((doc: string) => ({
            type: doc,
            status: 'uploaded',
            url: `/documents/${doc.toLowerCase().replace(' ', '_')}.pdf`
          })) || []
        }

      case NodeType.TAX_CALCULATOR:
        const grossIncome = 800000 // Sample income
        const deductions = config.includeDeductions ? 150000 : 0
        const taxableIncome = Math.max(0, grossIncome - deductions)
        const taxAmount = this.calculateIncomeTax(taxableIncome, config.taxRegime)
        
        return {
          grossIncome,
          deductions,
          taxableIncome,
          taxAmount,
          taxRegime: config.taxRegime || 'new',
          assessmentYear: config.assessmentYear || '2024-25',
          calculations: {
            basicTax: taxAmount * 0.8,
            surcharge: taxAmount * 0.1,
            cess: taxAmount * 0.04,
            totalTax: taxAmount
          }
        }

      case NodeType.EMAIL_SENDER:
        return {
          emailId: `email_${Date.now()}`,
          recipients: config.recipients || ['client@example.com'],
          subject: config.subject || 'Tax Calculation Complete',
          template: config.template || 'default',
          status: 'sent',
          sentAt: new Date(),
          deliveryStatus: 'delivered'
        }

      case NodeType.GOOGLE_SHEETS_ACTION:
        return {
          spreadsheetId: config.spreadsheetId,
          sheetName: config.sheetName || 'Sheet1',
          operation: config.operation || 'append',
          rowsAffected: Math.floor(Math.random() * 10) + 1,
          lastRow: Math.floor(Math.random() * 100) + 10,
          status: 'success'
        }

      case NodeType.CONDITION:
        const inputValue = this.executionContext[node.id]?.[config.fieldPath]
        const result = this.evaluateCondition(inputValue, config.operator, config.compareValue)
        
        return {
          condition: `${config.fieldPath} ${config.operator} ${config.compareValue}`,
          inputValue,
          result,
          nextPath: result ? 'true' : 'false'
        }

      case NodeType.DOCUMENT_PROCESSOR:
        return {
          documentsProcessed: Math.floor(Math.random() * 5) + 1,
          extractedData: {
            panNumber: 'ABCDE1234F',
            name: 'John Doe',
            address: '123 Main St, Mumbai',
            income: 750000
          },
          confidence: 0.95,
          status: 'completed'
        }

      case NodeType.COMPLIANCE_CHECKER:
        const complianceScore = Math.random() * 100
        return {
          complianceScore: Math.round(complianceScore),
          status: complianceScore > 80 ? 'compliant' : 'non-compliant',
          issues: complianceScore < 80 ? [
            'Missing required documentation',
            'Incomplete tax filings'
          ] : [],
          recommendations: [
            'File ITR by due date',
            'Maintain proper books of accounts'
          ]
        }

      default:
        return {
          nodeType: (node.data as any).nodeType,
          status: 'executed',
          timestamp: new Date(),
          message: 'Node executed successfully'
        }
    }
  }

  private calculateIncomeTax(taxableIncome: number, regime: string = 'new'): number {
    if (regime === 'old') {
      // Old tax regime slabs
      if (taxableIncome <= 250000) return 0
      if (taxableIncome <= 500000) return (taxableIncome - 250000) * 0.05
      if (taxableIncome <= 1000000) return 12500 + (taxableIncome - 500000) * 0.2
      return 112500 + (taxableIncome - 1000000) * 0.3
    } else {
      // New tax regime slabs (2024-25)
      if (taxableIncome <= 300000) return 0
      if (taxableIncome <= 600000) return (taxableIncome - 300000) * 0.05
      if (taxableIncome <= 900000) return 15000 + (taxableIncome - 600000) * 0.1
      if (taxableIncome <= 1200000) return 45000 + (taxableIncome - 900000) * 0.15
      if (taxableIncome <= 1500000) return 90000 + (taxableIncome - 1200000) * 0.2
      return 150000 + (taxableIncome - 1500000) * 0.3
    }
  }

  private evaluateCondition(value: any, operator: string, compareValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === compareValue
      case 'not_equals':
        return value !== compareValue
      case 'greater_than':
        return Number(value) > Number(compareValue)
      case 'less_than':
        return Number(value) < Number(compareValue)
      case 'contains':
        return String(value).includes(String(compareValue))
      default:
        return false
    }
  }
}

// Hook for using the execution engine
export const useWorkflowExecution = () => {
  const executeWorkflow = async (nodes: WorkflowNodeType[], edges: any[], triggerNodeId?: string) => {
    const engine = new WorkflowExecutionEngine(nodes, edges)
    return await engine.executeWorkflow(triggerNodeId)
  }

  const executeNode = async (node: WorkflowNodeType) => {
    const engine = new WorkflowExecutionEngine([node], [])
    return await engine.executeWorkflow(node.id)
  }

  return { executeWorkflow, executeNode }
}