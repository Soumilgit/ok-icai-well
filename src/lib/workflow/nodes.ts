import { NodeType, DataType, NodeData } from './types';

export const NODE_DEFINITIONS: Record<NodeType, NodeData> = {
  // Input/Trigger Nodes
  [NodeType.CLIENT_INTAKE]: {
    label: 'Client Intake',
    description: 'Collects and validates client information for CA services',
    config: {
      requiredFields: ['name', 'email', 'pan'],
      optionalFields: ['phone', 'gstin', 'address', 'businessType']
    },
    inputs: [],
    outputs: [
      { id: 'client_data', label: 'Client Data', type: DataType.CLIENT_DATA }
    ]
  },

  [NodeType.DOCUMENT_UPLOAD]: {
    label: 'Document Upload',
    description: 'Handles document uploads and file management',
    config: {
      allowedTypes: ['pdf', 'jpg', 'png', 'xlsx', 'csv'],
      maxSize: 10485760, // 10MB
      autoProcess: true
    },
    inputs: [],
    outputs: [
      { id: 'documents', label: 'Documents', type: DataType.DOCUMENT }
    ]
  },

  [NodeType.EMAIL_TRIGGER]: {
    label: 'Email Trigger',
    description: 'Triggers workflow when specific emails are received',
    config: {
      emailFilters: {
        from: '',
        subject: '',
        keywords: []
      },
      autoExtractData: true
    },
    inputs: [],
    outputs: [
      { id: 'email_data', label: 'Email Data', type: DataType.EMAIL },
      { id: 'attachments', label: 'Attachments', type: DataType.DOCUMENT }
    ]
  },

  [NodeType.SCHEDULED_TRIGGER]: {
    label: 'Scheduled Trigger',
    description: 'Runs workflow on a schedule (daily, weekly, monthly)',
    config: {
      schedule: 'daily', // daily, weekly, monthly, custom
      time: '09:00',
      timezone: 'Asia/Kolkata',
      customCron: ''
    },
    inputs: [],
    outputs: [
      { id: 'trigger_data', label: 'Trigger Data', type: DataType.ANY }
    ]
  },

  // Processing Nodes
  [NodeType.DOCUMENT_PROCESSOR]: {
    label: 'Document Processor',
    description: 'Extracts data from uploaded documents using OCR and AI',
    config: {
      extractionMode: 'auto', // auto, manual, template
      outputFormat: 'json',
      confidence: 0.8
    },
    inputs: [
      { id: 'documents', label: 'Documents', type: DataType.DOCUMENT, required: true }
    ],
    outputs: [
      { id: 'extracted_data', label: 'Extracted Data', type: DataType.ANY },
      { id: 'processed_documents', label: 'Processed Documents', type: DataType.DOCUMENT }
    ]
  },

  [NodeType.DATA_VALIDATOR]: {
    label: 'Data Validator',
    description: 'Validates data integrity and format compliance',
    config: {
      validationRules: [],
      strictMode: true,
      autoCorrect: false
    },
    inputs: [
      { id: 'data', label: 'Data to Validate', type: DataType.ANY, required: true }
    ],
    outputs: [
      { id: 'validated_data', label: 'Validated Data', type: DataType.ANY },
      { id: 'validation_errors', label: 'Validation Errors', type: DataType.ANY }
    ]
  },

  [NodeType.TAX_CALCULATOR]: {
    label: 'Tax Calculator',
    description: 'Calculates income tax based on financial data',
    config: {
      taxYear: '2024-25',
      taxType: 'individual', // individual, company, partnership
      includeEscalations: true,
      deductions: []
    },
    inputs: [
      { id: 'financial_data', label: 'Financial Data', type: DataType.FINANCIAL_DATA, required: true }
    ],
    outputs: [
      { id: 'tax_calculation', label: 'Tax Calculation', type: DataType.TAX_DATA }
    ]
  },

  [NodeType.GST_PROCESSOR]: {
    label: 'GST Processor',
    description: 'Processes GST calculations and return generation',
    config: {
      gstType: 'GSTR-1', // GSTR-1, GSTR-3B, GSTR-9
      period: 'monthly',
      autoSubmit: false
    },
    inputs: [
      { id: 'financial_data', label: 'Financial Data', type: DataType.FINANCIAL_DATA, required: true }
    ],
    outputs: [
      { id: 'gst_calculation', label: 'GST Calculation', type: DataType.TAX_DATA },
      { id: 'gst_return', label: 'GST Return', type: DataType.DOCUMENT }
    ]
  },

  [NodeType.INCOME_TAX_PROCESSOR]: {
    label: 'Income Tax Processor',
    description: 'Processes income tax returns and TDS calculations',
    config: {
      returnType: 'ITR-1', // ITR-1, ITR-2, ITR-3, ITR-4
      assessmentYear: '2024-25',
      includeTDS: true
    },
    inputs: [
      { id: 'financial_data', label: 'Financial Data', type: DataType.FINANCIAL_DATA, required: true },
      { id: 'tax_calculation', label: 'Tax Calculation', type: DataType.TAX_DATA, required: false }
    ],
    outputs: [
      { id: 'itr_data', label: 'ITR Data', type: DataType.TAX_DATA },
      { id: 'itr_document', label: 'ITR Document', type: DataType.DOCUMENT }
    ]
  },

  // Compliance & Legal Nodes
  [NodeType.COMPLIANCE_CHECKER]: {
    label: 'Compliance Checker',
    description: 'Checks regulatory compliance for tax and business requirements',
    config: {
      checkTypes: ['pan', 'gstin', 'regulatory', 'financial'],
      severity: 'strict',
      autoFix: false
    },
    inputs: [
      { id: 'client_data', label: 'Client Data', type: DataType.CLIENT_DATA, required: true }
    ],
    outputs: [
      { id: 'compliance_report', label: 'Compliance Report', type: DataType.REPORT },
      { id: 'compliance_status', label: 'Compliance Status', type: DataType.BOOLEAN }
    ]
  },

  [NodeType.AUDIT_VALIDATOR]: {
    label: 'Audit Validator',
    description: 'Validates audit requirements and documentation',
    config: {
      auditType: 'internal', // internal, statutory, tax
      validationLevel: 'comprehensive',
      generateReport: true
    },
    inputs: [
      { id: 'financial_data', label: 'Financial Data', type: DataType.FINANCIAL_DATA, required: true },
      { id: 'documents', label: 'Supporting Documents', type: DataType.DOCUMENT, required: false }
    ],
    outputs: [
      { id: 'audit_report', label: 'Audit Report', type: DataType.REPORT },
      { id: 'audit_status', label: 'Audit Status', type: DataType.BOOLEAN }
    ]
  },

  [NodeType.REGULATORY_CHECKER]: {
    label: 'Regulatory Checker',
    description: 'Checks compliance with latest regulatory changes',
    config: {
      regulations: ['income_tax', 'gst', 'company_law'],
      autoUpdate: true,
      alertLevel: 'medium'
    },
    inputs: [
      { id: 'business_data', label: 'Business Data', type: DataType.ANY, required: true }
    ],
    outputs: [
      { id: 'regulatory_status', label: 'Regulatory Status', type: DataType.REPORT },
      { id: 'action_items', label: 'Action Items', type: DataType.ANY }
    ]
  },

  // Integration Nodes
  [NodeType.GOOGLE_SHEETS_ACTION]: {
    label: 'Google Sheets Action',
    description: 'Performs actions on Google Sheets (create, update, read)',
    config: {
      action: 'create_task', // create_task, update_data, read_data
      spreadsheetId: '',
      sheetName: '',
      range: 'A1'
    },
    inputs: [
      { id: 'data', label: 'Data', type: DataType.ANY, required: true }
    ],
    outputs: [
      { id: 'result', label: 'Action Result', type: DataType.ANY },
      { id: 'updated_data', label: 'Updated Data', type: DataType.ANY }
    ]
  },

  [NodeType.EMAIL_SENDER]: {
    label: 'Email Sender',
    description: 'Sends automated emails to clients and stakeholders',
    config: {
      template: 'default',
      recipient: '',
      subject: '',
      attachments: true
    },
    inputs: [
      { id: 'email_data', label: 'Email Data', type: DataType.EMAIL, required: true },
      { id: 'attachments', label: 'Attachments', type: DataType.DOCUMENT, required: false }
    ],
    outputs: [
      { id: 'email_status', label: 'Email Status', type: DataType.BOOLEAN },
      { id: 'delivery_info', label: 'Delivery Info', type: DataType.ANY }
    ]
  },

  [NodeType.SMS_SENDER]: {
    label: 'SMS Sender',
    description: 'Sends SMS notifications for urgent updates',
    config: {
      provider: 'twilio',
      template: '',
      urgencyLevel: 'normal'
    },
    inputs: [
      { id: 'message_data', label: 'Message Data', type: DataType.STRING, required: true },
      { id: 'phone_number', label: 'Phone Number', type: DataType.STRING, required: true }
    ],
    outputs: [
      { id: 'sms_status', label: 'SMS Status', type: DataType.BOOLEAN },
      { id: 'delivery_info', label: 'Delivery Info', type: DataType.ANY }
    ]
  },

  [NodeType.BANK_API_CONNECTOR]: {
    label: 'Bank API Connector',
    description: 'Connects to bank APIs for transaction data',
    config: {
      bankType: 'icici', // icici, hdfc, sbi, axis
      dataType: 'transactions',
      dateRange: '30_days'
    },
    inputs: [
      { id: 'account_info', label: 'Account Info', type: DataType.ANY, required: true }
    ],
    outputs: [
      { id: 'bank_data', label: 'Bank Data', type: DataType.FINANCIAL_DATA },
      { id: 'transactions', label: 'Transactions', type: DataType.ANY }
    ]
  },

  // Logic Nodes
  [NodeType.CONDITION]: {
    label: 'Condition',
    description: 'Routes workflow based on conditional logic',
    config: {
      condition: '$amount > 100000',
      trueLabel: 'Yes',
      falseLabel: 'No'
    },
    inputs: [
      { id: 'data', label: 'Data to Check', type: DataType.ANY, required: true }
    ],
    outputs: [
      { id: 'true_path', label: 'True Path', type: DataType.BOOLEAN },
      { id: 'false_path', label: 'False Path', type: DataType.BOOLEAN }
    ]
  },

  [NodeType.LOOP]: {
    label: 'Loop',
    description: 'Repeats actions for each item in a collection',
    config: {
      iterationField: 'items',
      maxIterations: 100,
      breakCondition: ''
    },
    inputs: [
      { id: 'collection', label: 'Collection', type: DataType.ANY, required: true }
    ],
    outputs: [
      { id: 'current_item', label: 'Current Item', type: DataType.ANY },
      { id: 'loop_index', label: 'Loop Index', type: DataType.NUMBER }
    ]
  },

  [NodeType.DELAY]: {
    label: 'Delay',
    description: 'Adds a time delay in workflow execution',
    config: {
      delayType: 'fixed', // fixed, random, conditional
      duration: 5, // in seconds
      unit: 'minutes' // seconds, minutes, hours, days
    },
    inputs: [
      { id: 'trigger', label: 'Trigger', type: DataType.ANY, required: true }
    ],
    outputs: [
      { id: 'delayed_output', label: 'Delayed Output', type: DataType.ANY }
    ]
  },

  [NodeType.DATA_TRANSFORMER]: {
    label: 'Data Transformer',
    description: 'Transforms and manipulates data between workflow steps',
    config: {
      transformations: [
        { sourceField: '', targetField: '', operation: 'copy' }
      ]
    },
    inputs: [
      { id: 'input_data', label: 'Input Data', type: DataType.ANY, required: true }
    ],
    outputs: [
      { id: 'transformed_data', label: 'Transformed Data', type: DataType.ANY }
    ]
  },

  // Output Nodes
  [NodeType.REPORT_GENERATOR]: {
    label: 'Report Generator',
    description: 'Generates formatted reports from workflow data',
    config: {
      reportType: 'tax_summary', // tax_summary, compliance_report, audit_report
      format: 'pdf', // pdf, excel, html
      template: 'standard'
    },
    inputs: [
      { id: 'report_data', label: 'Report Data', type: DataType.ANY, required: true }
    ],
    outputs: [
      { id: 'report', label: 'Generated Report', type: DataType.REPORT },
      { id: 'report_file', label: 'Report File', type: DataType.DOCUMENT }
    ]
  },

  [NodeType.NOTIFICATION_SENDER]: {
    label: 'Notification Sender',
    description: 'Sends notifications through multiple channels',
    config: {
      channels: ['email', 'sms', 'push'],
      priority: 'medium',
      template: 'notification'
    },
    inputs: [
      { id: 'notification_data', label: 'Notification Data', type: DataType.ANY, required: true }
    ],
    outputs: [
      { id: 'notification_status', label: 'Notification Status', type: DataType.BOOLEAN }
    ]
  },

  [NodeType.FILE_EXPORT]: {
    label: 'File Export',
    description: 'Exports data to various file formats',
    config: {
      format: 'excel', // excel, csv, pdf, json
      filename: 'export_{{timestamp}}',
      includeHeaders: true
    },
    inputs: [
      { id: 'export_data', label: 'Export Data', type: DataType.ANY, required: true }
    ],
    outputs: [
      { id: 'exported_file', label: 'Exported File', type: DataType.DOCUMENT },
      { id: 'export_status', label: 'Export Status', type: DataType.BOOLEAN }
    ]
  },

  [NodeType.AUDIT_LOG]: {
    label: 'Audit Log',
    description: 'Logs workflow actions for compliance and tracking',
    config: {
      logLevel: 'info', // debug, info, warning, error
      includeData: false,
      retention: '1_year'
    },
    inputs: [
      { id: 'log_data', label: 'Log Data', type: DataType.ANY, required: true }
    ],
    outputs: [
      { id: 'log_entry', label: 'Log Entry', type: DataType.ANY }
    ]
  }
};

// Node categories for UI organization
export const NODE_CATEGORIES = {
  TRIGGERS: {
    label: 'Triggers',
    nodes: [
      NodeType.CLIENT_INTAKE,
      NodeType.DOCUMENT_UPLOAD,
      NodeType.EMAIL_TRIGGER,
      NodeType.SCHEDULED_TRIGGER
    ]
  },
  PROCESSING: {
    label: 'Processing',
    nodes: [
      NodeType.DOCUMENT_PROCESSOR,
      NodeType.DATA_VALIDATOR,
      NodeType.TAX_CALCULATOR,
      NodeType.GST_PROCESSOR,
      NodeType.INCOME_TAX_PROCESSOR
    ]
  },
  COMPLIANCE: {
    label: 'Compliance',
    nodes: [
      NodeType.COMPLIANCE_CHECKER,
      NodeType.AUDIT_VALIDATOR,
      NodeType.REGULATORY_CHECKER
    ]
  },
  INTEGRATIONS: {
    label: 'Integrations',
    nodes: [
      NodeType.GOOGLE_SHEETS_ACTION,
      NodeType.EMAIL_SENDER,
      NodeType.SMS_SENDER,
      NodeType.BANK_API_CONNECTOR
    ]
  },
  LOGIC: {
    label: 'Logic',
    nodes: [
      NodeType.CONDITION,
      NodeType.LOOP,
      NodeType.DELAY,
      NodeType.DATA_TRANSFORMER
    ]
  },
  OUTPUT: {
    label: 'Output',
    nodes: [
      NodeType.REPORT_GENERATOR,
      NodeType.NOTIFICATION_SENDER,
      NodeType.FILE_EXPORT,
      NodeType.AUDIT_LOG
    ]
  }
};

// Helper function to get node definition
export function getNodeDefinition(nodeType: NodeType): NodeData {
  return NODE_DEFINITIONS[nodeType];
}

// Helper function to get node category
export function getNodeCategory(nodeType: NodeType): string {
  for (const [category, config] of Object.entries(NODE_CATEGORIES)) {
    if (config.nodes.includes(nodeType)) {
      return category;
    }
  }
  return 'UNKNOWN';
}