import { Workflow, WorkflowExecutionContext, WorkflowTemplate, TemplateCategory } from './types';
import { WorkflowEngine } from './engine';
import { WORKFLOW_TEMPLATES, getTemplateById } from './templates';

export class WorkflowService {
  private engine: WorkflowEngine;
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecutionContext> = new Map();

  constructor() {
    this.engine = new WorkflowEngine();
    this.loadWorkflows();
  }

  // Workflow CRUD operations
  async createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
    const newWorkflow: Workflow = {
      ...workflow,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflows.set(newWorkflow.id, newWorkflow);
    await this.saveWorkflows();
    
    return newWorkflow;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | null> {
    const workflow = this.workflows.get(id);
    if (!workflow) return null;

    const updatedWorkflow: Workflow = {
      ...workflow,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    this.workflows.set(id, updatedWorkflow);
    await this.saveWorkflows();
    
    return updatedWorkflow;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    const deleted = this.workflows.delete(id);
    if (deleted) {
      await this.saveWorkflows();
    }
    return deleted;
  }

  getWorkflow(id: string): Workflow | null {
    return this.workflows.get(id) || null;
  }

  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  getWorkflowsByUser(userId: string): Workflow[] {
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.createdBy === userId);
  }

  searchWorkflows(query: string): Workflow[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.workflows.values())
      .filter(workflow => 
        workflow.name.toLowerCase().includes(lowercaseQuery) ||
        workflow.description.toLowerCase().includes(lowercaseQuery) ||
        workflow.tags.some(tag => tag.includes(lowercaseQuery))
      );
  }

  // Template operations
  createWorkflowFromTemplate(templateId: string, customizations?: Partial<Workflow>): Workflow | null {
    const template = getTemplateById(templateId);
    if (!template || !template.workflow) return null;

    const workflow: Workflow = {
      ...template.workflow,
      id: this.generateId(),
      name: customizations?.name || `${template.workflow.name} (Copy)`,
      description: customizations?.description || template.workflow.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: customizations?.createdBy || 'current-user',
      isActive: false,
      ...customizations
    };

    this.workflows.set(workflow.id, workflow);
    this.saveWorkflows();
    
    return workflow;
  }

  getTemplates(): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES;
  }

  getTemplatesByCategory(category: TemplateCategory): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES.filter(template => template.category === category);
  }

  // Workflow execution
  async executeWorkflow(workflowId: string, initialData: Record<string, any> = {}): Promise<WorkflowExecutionContext> {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (!workflow.isActive) {
      throw new Error(`Workflow is not active: ${workflow.name}`);
    }

    const context = await this.engine.executeWorkflow(workflow, initialData);
    this.executions.set(context.executionId, context);
    
    return context;
  }

  async executeTemplate(templateId: string, initialData: Record<string, any> = {}): Promise<WorkflowExecutionContext> {
    const template = getTemplateById(templateId);
    if (!template || !template.workflow) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const workflow: Workflow = {
      ...template.workflow,
      id: `temp_${this.generateId()}`,
      isActive: true
    };

    const context = await this.engine.executeWorkflow(workflow, initialData);
    this.executions.set(context.executionId, context);
    
    return context;
  }

  getExecutionStatus(executionId: string): WorkflowExecutionContext | null {
    return this.executions.get(executionId) || this.engine.getExecutionStatus(executionId);
  }

  cancelExecution(executionId: string): boolean {
    return this.engine.cancelExecution(executionId);
  }

  getExecutionHistory(workflowId?: string): WorkflowExecutionContext[] {
    const allExecutions = Array.from(this.executions.values());
    
    if (workflowId) {
      return allExecutions.filter(execution => execution.workflowId === workflowId);
    }
    
    return allExecutions;
  }

  // Workflow validation
  validateWorkflow(workflow: Workflow): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!workflow.name?.trim()) {
      errors.push('Workflow name is required');
    }

    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    // Node validation
    const nodeIds = new Set<string>();
    for (const node of workflow.nodes) {
      if (!node.id?.trim()) {
        errors.push('All nodes must have valid IDs');
        continue;
      }

      if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id}`);
      }
      nodeIds.add(node.id);

      if (!node.type) {
        errors.push(`Node ${node.id} must have a type`);
      }

      if (!node.data?.label?.trim()) {
        errors.push(`Node ${node.id} must have a label`);
      }
    }

    // Connection validation
    for (const connection of workflow.connections) {
      if (!nodeIds.has(connection.sourceNodeId)) {
        errors.push(`Connection references invalid source node: ${connection.sourceNodeId}`);
      }

      if (!nodeIds.has(connection.targetNodeId)) {
        errors.push(`Connection references invalid target node: ${connection.targetNodeId}`);
      }

      if (connection.sourceNodeId === connection.targetNodeId) {
        errors.push('Node cannot connect to itself');
      }
    }

    // Check for circular dependencies
    if (this.hasCircularDependencies(workflow)) {
      errors.push('Workflow contains circular dependencies');
    }

    // Check for unreachable nodes
    const unreachableNodes = this.findUnreachableNodes(workflow);
    if (unreachableNodes.length > 0) {
      errors.push(`Unreachable nodes found: ${unreachableNodes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Workflow analysis
  analyzeWorkflow(workflow: Workflow): {
    nodeCount: number;
    connectionCount: number;
    entryPoints: number;
    exitPoints: number;
    estimatedExecutionTime: number;
    complexity: 'simple' | 'moderate' | 'complex';
  } {
    const nodeCount = workflow.nodes.length;
    const connectionCount = workflow.connections.length;
    
    // Find entry points (nodes with no incoming connections)
    const hasIncoming = new Set(workflow.connections.map(c => c.targetNodeId));
    const entryPoints = workflow.nodes.filter(n => !hasIncoming.has(n.id)).length;
    
    // Find exit points (nodes with no outgoing connections)
    const hasOutgoing = new Set(workflow.connections.map(c => c.sourceNodeId));
    const exitPoints = workflow.nodes.filter(n => !hasOutgoing.has(n.id)).length;
    
    // Estimate execution time (simplified)
    const estimatedExecutionTime = nodeCount * 30; // 30 seconds per node average
    
    // Determine complexity
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (nodeCount > 10 || connectionCount > 15) {
      complexity = 'complex';
    } else if (nodeCount > 5 || connectionCount > 8) {
      complexity = 'moderate';
    }

    return {
      nodeCount,
      connectionCount,
      entryPoints,
      exitPoints,
      estimatedExecutionTime,
      complexity
    };
  }

  // Workflow operations
  async cloneWorkflow(workflowId: string, newName?: string): Promise<Workflow | null> {
    const original = this.getWorkflow(workflowId);
    if (!original) return null;

    const cloned: Workflow = {
      ...original,
      id: this.generateId(),
      name: newName || `${original.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false
    };

    this.workflows.set(cloned.id, cloned);
    await this.saveWorkflows();
    
    return cloned;
  }

  async exportWorkflow(workflowId: string): Promise<string | null> {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) return null;

    return JSON.stringify(workflow, null, 2);
  }

  async importWorkflow(workflowJson: string, userId: string): Promise<Workflow | null> {
    try {
      const workflow = JSON.parse(workflowJson) as Workflow;
      
      // Generate new ID and update metadata
      workflow.id = this.generateId();
      workflow.createdBy = userId;
      workflow.createdAt = new Date();
      workflow.updatedAt = new Date();
      workflow.isActive = false;

      // Validate before importing
      const validation = this.validateWorkflow(workflow);
      if (!validation.isValid) {
        throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
      }

      this.workflows.set(workflow.id, workflow);
      await this.saveWorkflows();
      
      return workflow;
    } catch (error) {
      console.error('Error importing workflow:', error);
      return null;
    }
  }

  // Private helper methods
  private hasCircularDependencies(workflow: Workflow): boolean {
    const graph = new Map<string, string[]>();
    
    // Build adjacency list
    for (const node of workflow.nodes) {
      graph.set(node.id, []);
    }
    
    for (const connection of workflow.connections) {
      const targets = graph.get(connection.sourceNodeId) || [];
      targets.push(connection.targetNodeId);
      graph.set(connection.sourceNodeId, targets);
    }
    
    // DFS to detect cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycle(nodeId)) return true;
      }
    }
    
    return false;
  }

  private findUnreachableNodes(workflow: Workflow): string[] {
    const reachable = new Set<string>();
    const graph = new Map<string, string[]>();
    
    // Build adjacency list
    for (const node of workflow.nodes) {
      graph.set(node.id, []);
    }
    
    for (const connection of workflow.connections) {
      const targets = graph.get(connection.sourceNodeId) || [];
      targets.push(connection.targetNodeId);
      graph.set(connection.sourceNodeId, targets);
    }
    
    // Find entry points
    const hasIncoming = new Set(workflow.connections.map(c => c.targetNodeId));
    const entryPoints = workflow.nodes
      .filter(n => !hasIncoming.has(n.id))
      .map(n => n.id);
    
    // DFS from entry points
    const visit = (nodeId: string) => {
      if (reachable.has(nodeId)) return;
      reachable.add(nodeId);
      
      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        visit(neighbor);
      }
    };
    
    for (const entryPoint of entryPoints) {
      visit(entryPoint);
    }
    
    // Find unreachable nodes
    return workflow.nodes
      .filter(n => !reachable.has(n.id))
      .map(n => n.id);
  }

  private async loadWorkflows(): Promise<void> {
    // In a real implementation, this would load from a database
    // For now, we'll keep workflows in memory
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('ca_workflows');
        if (stored) {
          const workflows = JSON.parse(stored) as Workflow[];
          for (const workflow of workflows) {
            this.workflows.set(workflow.id, workflow);
          }
        }
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  }

  private async saveWorkflows(): Promise<void> {
    // In a real implementation, this would save to a database
    try {
      if (typeof window !== 'undefined') {
        const workflows = Array.from(this.workflows.values());
        localStorage.setItem('ca_workflows', JSON.stringify(workflows));
      }
    } catch (error) {
      console.error('Error saving workflows:', error);
    }
  }

  private generateId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Statistics and insights
  getWorkflowStats(): {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
  } {
    const workflows = Array.from(this.workflows.values());
    const executions = Array.from(this.executions.values());
    
    const successfulExecutions = executions.filter(e => e.status === 'completed').length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;
    
    const completedExecutions = executions.filter(e => e.status === 'completed');
    const averageExecutionTime = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => {
          const duration = new Date().getTime() - e.startTime.getTime();
          return sum + duration;
        }, 0) / completedExecutions.length
      : 0;

    return {
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.isActive).length,
      totalExecutions: executions.length,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime
    };
  }
}