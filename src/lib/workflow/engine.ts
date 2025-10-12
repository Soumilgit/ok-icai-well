import { 
  Workflow, 
  WorkflowNode, 
  WorkflowExecutionContext, 
  ExecutionStatus, 
  ExecutionLog, 
  NodeType,
  ClientData,
  FinancialData,
  Document
} from './types';
import { CAGoogleSheetsService } from '../ca-sheets-service';

export class WorkflowEngine {
  private sheetsService: CAGoogleSheetsService;
  private activeExecutions: Map<string, WorkflowExecutionContext> = new Map();

  constructor() {
    this.sheetsService = new CAGoogleSheetsService();
  }

  async executeWorkflow(workflow: Workflow, initialData: Record<string, any> = {}): Promise<WorkflowExecutionContext> {
    const executionId = this.generateExecutionId();
    const context: WorkflowExecutionContext = {
      workflowId: workflow.id,
      executionId,
      userId: 'current-user', // TODO: Get from auth context
      startTime: new Date(),
      data: { ...initialData },
      logs: [],
      status: ExecutionStatus.PENDING
    };

    this.activeExecutions.set(executionId, context);
    
    try {
      context.status = ExecutionStatus.RUNNING;
      this.logExecution(context, 'info', `Starting workflow execution: ${workflow.name}`);

      // Find entry points (nodes with no inputs or trigger nodes)
      const entryNodes = this.findEntryNodes(workflow);
      
      if (entryNodes.length === 0) {
        throw new Error('No entry points found in workflow');
      }

      // Execute nodes in topological order
      const executionOrder = this.getExecutionOrder(workflow);
      
      for (const nodeId of executionOrder) {
        const node = workflow.nodes.find(n => n.id === nodeId);
        if (!node) continue;

        context.currentNodeId = nodeId;
        await this.executeNode(node, context);
      }

      context.status = ExecutionStatus.COMPLETED;
      this.logExecution(context, 'info', 'Workflow execution completed successfully');

    } catch (error) {
      context.status = ExecutionStatus.FAILED;
      this.logExecution(context, 'error', `Workflow execution failed: ${error.message}`);
      throw error;
    }

    return context;
  }

  private async executeNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<void> {
    this.logExecution(context, 'info', `Executing node: ${node.data.label} (${node.type})`);

    try {
      switch (node.type) {
        case NodeType.CLIENT_INTAKE:
          await this.executeClientIntakeNode(node, context);
          break;
        case NodeType.DOCUMENT_PROCESSOR:
          await this.executeDocumentProcessorNode(node, context);
          break;
        case NodeType.TAX_CALCULATOR:
          await this.executeTaxCalculatorNode(node, context);
          break;
        case NodeType.GST_PROCESSOR:
          await this.executeGSTProcessorNode(node, context);
          break;
        case NodeType.COMPLIANCE_CHECKER:
          await this.executeComplianceCheckerNode(node, context);
          break;
        case NodeType.GOOGLE_SHEETS_ACTION:
          await this.executeGoogleSheetsActionNode(node, context);
          break;
        case NodeType.EMAIL_SENDER:
          await this.executeEmailSenderNode(node, context);
          break;
        case NodeType.REPORT_GENERATOR:
          await this.executeReportGeneratorNode(node, context);
          break;
        case NodeType.CONDITION:
          await this.executeConditionNode(node, context);
          break;
        case NodeType.DATA_TRANSFORMER:
          await this.executeDataTransformerNode(node, context);
          break;
        case NodeType.AUDIT_LOG:
          await this.executeAuditLogNode(node, context);
          break;
        default:
          this.logExecution(context, 'warning', `Unknown node type: ${node.type}`);
      }

      this.logExecution(context, 'info', `Node executed successfully: ${node.data.label}`);
    } catch (error) {
      this.logExecution(context, 'error', `Node execution failed: ${node.data.label} - ${error.message}`);
      throw error;
    }
  }

  // Node execution implementations
  private async executeClientIntakeNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<void> {
    const config = node.data.config;
    
    // Validate required client data
    const requiredFields = ['name', 'email', 'pan'];
    for (const field of requiredFields) {
      if (!context.data[field]) {
        throw new Error(`Required field missing: ${field}`);
      }
    }

    // Create client data structure
    const clientData: ClientData = {
      id: this.generateId(),
      name: context.data.name,
      email: context.data.email,
      phone: context.data.phone || '',
      pan: context.data.pan,
      gstin: context.data.gstin,
      address: context.data.address || '',
      businessType: context.data.businessType || 'Individual',
      financialYear: context.data.financialYear || '2024-25',
      documents: []
    };

    context.data.client = clientData;
  }

  private async executeDocumentProcessorNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<void> {
    const config = node.data.config;
    const documents = context.data.documents as Document[] || [];
    
    const processedDocuments = [];
    
    for (const doc of documents) {
      // Simulate document processing
      const processed = {
        ...doc,
        processed: true,
        extractedData: await this.extractDocumentData(doc),
        processedAt: new Date()
      };
      
      processedDocuments.push(processed);
    }

    context.data.processedDocuments = processedDocuments;
  }

  private async executeTaxCalculatorNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<void> {
    const config = node.data.config;
    const financialData = context.data.financialData as FinancialData;
    
    if (!financialData) {
      throw new Error('Financial data required for tax calculation');
    }

    // Basic tax calculation logic
    const taxableIncome = financialData.revenue - financialData.expenses;
    let incomeTax = 0;

    // Income tax slabs for individuals (simplified)
    if (taxableIncome <= 250000) {
      incomeTax = 0;
    } else if (taxableIncome <= 500000) {
      incomeTax = (taxableIncome - 250000) * 0.05;
    } else if (taxableIncome <= 1000000) {
      incomeTax = 12500 + (taxableIncome - 500000) * 0.20;
    } else {
      incomeTax = 112500 + (taxableIncome - 1000000) * 0.30;
    }

    context.data.taxCalculation = {
      taxableIncome,
      incomeTax,
      cess: incomeTax * 0.04, // 4% health and education cess
      totalTax: incomeTax + (incomeTax * 0.04),
      calculatedAt: new Date()
    };
  }

  private async executeGSTProcessorNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<void> {
    const config = node.data.config;
    const financialData = context.data.financialData as FinancialData;
    
    if (!financialData) {
      throw new Error('Financial data required for GST processing');
    }

    // GST calculation
    const gstRate = config.gstRate || 0.18; // 18% default
    const turnover = financialData.revenue;
    
    context.data.gstCalculation = {
      turnover,
      gstRate,
      gstAmount: turnover * gstRate,
      cgst: (turnover * gstRate) / 2,
      sgst: (turnover * gstRate) / 2,
      igst: config.interstate ? turnover * gstRate : 0,
      calculatedAt: new Date()
    };
  }

  private async executeComplianceCheckerNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<void> {
    const config = node.data.config;
    const client = context.data.client as ClientData;
    
    const complianceChecks = [];

    // PAN validation
    if (client.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(client.pan)) {
      complianceChecks.push({
        type: 'PAN_INVALID',
        severity: 'error',
        message: 'Invalid PAN format'
      });
    }

    // GSTIN validation
    if (client.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(client.gstin)) {
      complianceChecks.push({
        type: 'GSTIN_INVALID',
        severity: 'error',
        message: 'Invalid GSTIN format'
      });
    }

    // Business type compliance
    if (client.businessType === 'Company' && !client.gstin) {
      complianceChecks.push({
        type: 'GST_REGISTRATION_REQUIRED',
        severity: 'warning',
        message: 'GST registration may be required for companies'
      });
    }

    context.data.complianceChecks = complianceChecks;
  }

  private async executeGoogleSheetsActionNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<void> {
    const config = node.data.config;
    const action = config.action; // 'create_task', 'update_data', 'generate_report'
    
    switch (action) {
      case 'create_drafting_task':
        if (context.data.client) {
          await this.sheetsService.addDraftingTask(
            context.data.client.name,
            config.taskType || 'General Task',
            new Date(config.dueDate || Date.now() + 7 * 24 * 60 * 60 * 1000),
            config.priority || 'Medium',
            config.description || 'Auto-generated task'
          );
        }
        break;
      case 'create_audit_task':
        if (context.data.client) {
          await this.sheetsService.addAuditingTask(
            context.data.client.name,
            config.auditType || 'Internal Audit',
            new Date(config.startDate || Date.now()),
            config.auditor || 'Auto-assigned',
            config.notes || 'Auto-generated audit task'
          );
        }
        break;
      case 'update_analytics':
        const analytics = await this.sheetsService.getWorkflowAnalytics();
        context.data.analytics = analytics;
        break;
    }
  }

  private async executeEmailSenderNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<void> {
    const config = node.data.config;
    const client = context.data.client as ClientData;
    
    // Email sending logic would go here
    // For now, we'll simulate it
    context.data.emailSent = {
      to: config.recipient || client?.email,
      subject: config.subject || 'Automated Notification',
      body: this.processTemplate(config.template || 'Default message', context.data),
      sentAt: new Date()
    };
  }

  private async executeReportGeneratorNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<void> {
    const config = node.data.config;
    const reportType = config.reportType;
    
    let report: any = {};
    
    switch (reportType) {
      case 'tax_summary':
        report = {
          type: 'Tax Summary Report',
          client: context.data.client,
          taxCalculation: context.data.taxCalculation,
          gstCalculation: context.data.gstCalculation,
          generatedAt: new Date()
        };
        break;
      case 'compliance_report':
        report = {
          type: 'Compliance Report',
          client: context.data.client,
          complianceChecks: context.data.complianceChecks,
          generatedAt: new Date()
        };
        break;
      default:
        report = {
          type: 'General Report',
          data: context.data,
          generatedAt: new Date()
        };
    }

    context.data.report = report;
  }

  private async executeConditionNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<void> {
    const config = node.data.config;
    const condition = config.condition;
    
    // Simple condition evaluation
    const result = this.evaluateCondition(condition, context.data);
    context.data[`condition_${node.id}`] = result;
  }

  private async executeDataTransformerNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<void> {
    const config = node.data.config;
    const transformations = config.transformations || [];
    
    for (const transform of transformations) {
      const { sourceField, targetField, operation, value } = transform;
      
      switch (operation) {
        case 'copy':
          context.data[targetField] = context.data[sourceField];
          break;
        case 'format':
          context.data[targetField] = this.formatValue(context.data[sourceField], value);
          break;
        case 'calculate':
          context.data[targetField] = this.calculateValue(context.data[sourceField], value);
          break;
      }
    }
  }

  private async executeAuditLogNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<void> {
    const config = node.data.config;
    
    const auditEntry = {
      workflowId: context.workflowId,
      executionId: context.executionId,
      timestamp: new Date(),
      action: config.action || 'workflow_execution',
      details: config.details || 'Workflow executed',
      data: config.includeData ? context.data : null
    };

    // In a real implementation, this would save to a database
    context.data.auditLog = auditEntry;
  }

  // Helper methods
  private findEntryNodes(workflow: Workflow): WorkflowNode[] {
    return workflow.nodes.filter(node => 
      node.inputs.length === 0 || 
      [NodeType.EMAIL_TRIGGER, NodeType.SCHEDULED_TRIGGER].includes(node.type)
    );
  }

  private getExecutionOrder(workflow: Workflow): string[] {
    // Simple topological sort implementation
    const visited = new Set<string>();
    const order: string[] = [];
    
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) return;
      
      // Visit dependencies first
      for (const input of node.inputs) {
        visit(input.sourceNodeId);
      }
      
      order.push(nodeId);
    };
    
    for (const node of workflow.nodes) {
      visit(node.id);
    }
    
    return order;
  }

  private async extractDocumentData(document: Document): Promise<any> {
    // Simulate document data extraction
    return {
      filename: document.filename,
      type: document.type,
      extractedFields: ['field1', 'field2'],
      confidence: 0.95
    };
  }

  private processTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/{{(\w+)}}/g, (match, key) => {
      return data[key] || match;
    });
  }

  private evaluateCondition(condition: string, data: Record<string, any>): boolean {
    // Simple condition evaluation - in production, use a proper expression parser
    try {
      // Replace variables in condition
      const processedCondition = condition.replace(/\$(\w+)/g, (match, key) => {
        return JSON.stringify(data[key]);
      });
      
      return Function(`"use strict"; return (${processedCondition})`)();
    } catch {
      return false;
    }
  }

  private formatValue(value: any, format: string): any {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-IN', { 
          style: 'currency', 
          currency: 'INR' 
        }).format(value);
      case 'date':
        return new Date(value).toLocaleDateString('en-IN');
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      default:
        return value;
    }
  }

  private calculateValue(value: number, operation: string): number {
    const [op, operand] = operation.split(' ');
    const num = parseFloat(operand);
    
    switch (op) {
      case 'add':
        return value + num;
      case 'subtract':
        return value - num;
      case 'multiply':
        return value * num;
      case 'divide':
        return value / num;
      case 'percentage':
        return (value * num) / 100;
      default:
        return value;
    }
  }

  private logExecution(context: WorkflowExecutionContext, level: 'info' | 'warning' | 'error', message: string, data?: any): void {
    const log: ExecutionLog = {
      timestamp: new Date(),
      nodeId: context.currentNodeId || 'system',
      level,
      message,
      data
    };
    
    context.logs.push(log);
    console.log(`[${level.toUpperCase()}] ${message}`, data);
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for workflow management
  getExecutionStatus(executionId: string): WorkflowExecutionContext | null {
    return this.activeExecutions.get(executionId) || null;
  }

  cancelExecution(executionId: string): boolean {
    const context = this.activeExecutions.get(executionId);
    if (context && context.status === ExecutionStatus.RUNNING) {
      context.status = ExecutionStatus.CANCELLED;
      this.logExecution(context, 'info', 'Workflow execution cancelled');
      return true;
    }
    return false;
  }

  getActiveExecutions(): WorkflowExecutionContext[] {
    return Array.from(this.activeExecutions.values())
      .filter(context => context.status === ExecutionStatus.RUNNING);
  }
}