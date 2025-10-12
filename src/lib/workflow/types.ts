// Workflow Builder Types for CA-specific automation
export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
  inputs: Connection[];
  outputs: Connection[];
}

export interface Connection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle: string;
  targetHandle: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: Connection[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  tags: string[];
}

// CA-specific node types
export enum NodeType {
  // Input/Output Nodes
  CLIENT_INTAKE = 'client_intake',
  DOCUMENT_UPLOAD = 'document_upload',
  EMAIL_TRIGGER = 'email_trigger',
  SCHEDULED_TRIGGER = 'scheduled_trigger',
  
  // Processing Nodes
  DOCUMENT_PROCESSOR = 'document_processor',
  DATA_VALIDATOR = 'data_validator',
  TAX_CALCULATOR = 'tax_calculator',
  GST_PROCESSOR = 'gst_processor',
  INCOME_TAX_PROCESSOR = 'income_tax_processor',
  
  // Compliance & Legal Nodes
  COMPLIANCE_CHECKER = 'compliance_checker',
  AUDIT_VALIDATOR = 'audit_validator',
  REGULATORY_CHECKER = 'regulatory_checker',
  
  // Integration Nodes
  GOOGLE_SHEETS_ACTION = 'google_sheets_action',
  EMAIL_SENDER = 'email_sender',
  SMS_SENDER = 'sms_sender',
  BANK_API_CONNECTOR = 'bank_api_connector',
  
  // Logic Nodes
  CONDITION = 'condition',
  LOOP = 'loop',
  DELAY = 'delay',
  DATA_TRANSFORMER = 'data_transformer',
  
  // Output Nodes
  REPORT_GENERATOR = 'report_generator',
  NOTIFICATION_SENDER = 'notification_sender',
  FILE_EXPORT = 'file_export',
  AUDIT_LOG = 'audit_log'
}

// Node configuration data
export interface NodeData {
  label: string;
  description?: string;
  config: Record<string, any>;
  inputs: NodeInput[];
  outputs: NodeOutput[];
}

export interface NodeInput {
  id: string;
  label: string;
  type: DataType;
  required: boolean;
  defaultValue?: any;
}

export interface NodeOutput {
  id: string;
  label: string;
  type: DataType;
}

export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  FILE = 'file',
  CLIENT_DATA = 'client_data',
  FINANCIAL_DATA = 'financial_data',
  TAX_DATA = 'tax_data',
  DOCUMENT = 'document',
  EMAIL = 'email',
  REPORT = 'report',
  ANY = 'any'
}

// Workflow execution context
export interface WorkflowExecutionContext {
  workflowId: string;
  executionId: string;
  userId: string;
  startTime: Date;
  currentNodeId?: string;
  data: Record<string, any>;
  logs: ExecutionLog[];
  status: ExecutionStatus;
}

export interface ExecutionLog {
  timestamp: Date;
  nodeId: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  data?: any;
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Node Configuration Interfaces
export interface ClientIntakeConfig {
  clientFields: string[]
  requiredDocuments: string[]
  autoValidation: boolean
  notificationSettings: {
    email: boolean
    sms: boolean
    whatsapp: boolean
  }
}

export interface TaxCalculatorConfig {
  assessmentYear: string
  taxRegime: 'old' | 'new'
  includeDeductions: boolean
  calculationMethod: 'standard' | 'advanced'
  exemptions: string[]
}

export interface EmailSenderConfig {
  template: string
  subject: string
  recipients: string[]
  includeAttachments: boolean
  priority: 'low' | 'normal' | 'high'
  trackOpens: boolean
}

export interface ConditionConfig {
  conditionType: 'value' | 'exists' | 'regex' | 'custom'
  fieldPath: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex'
  compareValue: any
  truePath?: string
  falsePath?: string
}

export interface GoogleSheetsConfig {
  spreadsheetId: string
  sheetName: string
  operation: 'append' | 'update' | 'clear' | 'read'
  range?: string
  mapping?: { [key: string]: string }
}

// CA-specific data structures
export interface ClientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  pan: string;
  gstin?: string;
  address: string;
  businessType: string;
  financialYear: string;
  documents: Document[];
}

export interface FinancialData {
  clientId: string;
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  tax: number;
  gst: number;
  entries: JournalEntry[];
}

export interface JournalEntry {
  date: Date;
  description: string;
  debit: number;
  credit: number;
  account: string;
  reference: string;
}

export interface Document {
  id: string;
  filename: string;
  type: DocumentType;
  uploadDate: Date;
  size: number;
  url: string;
  metadata?: Record<string, any>;
}

export enum DocumentType {
  INCOME_TAX_RETURN = 'income_tax_return',
  GST_RETURN = 'gst_return',
  BANK_STATEMENT = 'bank_statement',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  BALANCE_SHEET = 'balance_sheet',
  PROFIT_LOSS = 'profit_loss',
  AUDIT_REPORT = 'audit_report',
  OTHER = 'other'
}

// Workflow template for common CA tasks
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  workflow: Partial<Workflow>;
  preview: string;
  estimatedTime: number; // in minutes
  complexity: 'beginner' | 'intermediate' | 'advanced';
}

export enum TemplateCategory {
  TAX_FILING = 'tax_filing',
  AUDIT_PROCESS = 'audit_process',
  CLIENT_ONBOARDING = 'client_onboarding',
  COMPLIANCE_CHECK = 'compliance_check',
  REPORT_GENERATION = 'report_generation',
  DOCUMENT_PROCESSING = 'document_processing',
  NOTIFICATION_SYSTEM = 'notification_system'
}