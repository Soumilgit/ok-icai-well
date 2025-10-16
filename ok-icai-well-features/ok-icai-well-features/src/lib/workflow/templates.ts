import { WorkflowTemplate, TemplateCategory, Workflow, NodeType } from './types';

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'client_onboarding_basic',
    name: 'Basic Client Onboarding',
    description: 'Automated workflow for onboarding new CA clients with document collection and compliance checks',
    category: TemplateCategory.CLIENT_ONBOARDING,
    preview: 'Client Intake → Document Processing → Compliance Check → Google Sheets → Email Notification',
    estimatedTime: 15,
    complexity: 'beginner',
    workflow: {
      id: 'template_client_onboarding_basic',
      name: 'Basic Client Onboarding',
      description: 'Automated client onboarding process',
      nodes: [
        {
          id: 'node_1',
          type: NodeType.CLIENT_INTAKE,
          position: { x: 100, y: 100 },
          data: {
            label: 'New Client Details',
            config: {
              requiredFields: ['name', 'email', 'pan', 'businessType'],
              autoValidate: true
            },
            inputs: [],
            outputs: [
              { id: 'client_data', label: 'Client Data', type: 'client_data' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_2',
          type: NodeType.DOCUMENT_UPLOAD,
          position: { x: 300, y: 100 },
          data: {
            label: 'Document Collection',
            config: {
              requiredDocuments: ['pan_card', 'address_proof', 'bank_statement'],
              autoProcess: true
            },
            inputs: [
              { id: 'client_info', label: 'Client Info', type: 'client_data' as any, required: true }
            ],
            outputs: [
              { id: 'documents', label: 'Documents', type: 'document' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_3',
          type: NodeType.COMPLIANCE_CHECKER,
          position: { x: 500, y: 100 },
          data: {
            label: 'Initial Compliance Check',
            config: {
              checkTypes: ['pan', 'gstin', 'basic_regulatory'],
              severity: 'medium'
            },
            inputs: [
              { id: 'client_data', label: 'Client Data', type: 'client_data' as any, required: true }
            ],
            outputs: [
              { id: 'compliance_status', label: 'Compliance Status', type: 'boolean' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_4',
          type: NodeType.GOOGLE_SHEETS_ACTION,
          position: { x: 700, y: 100 },
          data: {
            label: 'Add to Client Database',
            config: {
              action: 'create_client_record',
              sheetName: 'Clients',
              autoFormat: true
            },
            inputs: [
              { id: 'client_data', label: 'Client Data', type: 'client_data' as any, required: true }
            ],
            outputs: [
              { id: 'record_created', label: 'Record Created', type: 'boolean' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_5',
          type: NodeType.EMAIL_SENDER,
          position: { x: 900, y: 100 },
          data: {
            label: 'Welcome Email',
            config: {
              template: 'client_welcome',
              subject: 'Welcome to Our CA Services',
              includeNextSteps: true
            },
            inputs: [
              { id: 'client_data', label: 'Client Data', type: 'client_data' as any, required: true }
            ],
            outputs: [
              { id: 'email_sent', label: 'Email Sent', type: 'boolean' as any }
            ]
          },
          inputs: [],
          outputs: []
        }
      ],
      connections: [
        {
          id: 'conn_1',
          sourceNodeId: 'node_1',
          targetNodeId: 'node_2',
          sourceHandle: 'client_data',
          targetHandle: 'client_info'
        },
        {
          id: 'conn_2',
          sourceNodeId: 'node_1',
          targetNodeId: 'node_3',
          sourceHandle: 'client_data',
          targetHandle: 'client_data'
        },
        {
          id: 'conn_3',
          sourceNodeId: 'node_1',
          targetNodeId: 'node_4',
          sourceHandle: 'client_data',
          targetHandle: 'client_data'
        },
        {
          id: 'conn_4',
          sourceNodeId: 'node_1',
          targetNodeId: 'node_5',
          sourceHandle: 'client_data',
          targetHandle: 'client_data'
        }
      ],
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false,
      tags: ['onboarding', 'client', 'basic']
    }
  },

  {
    id: 'tax_filing_individual',
    name: 'Individual Tax Filing Workflow',
    description: 'Complete tax filing process for individual clients including calculation, document generation, and filing',
    category: TemplateCategory.TAX_FILING,
    preview: 'Document Processing → Tax Calculation → ITR Generation → Compliance Check → Filing → Notification',
    estimatedTime: 45,
    complexity: 'intermediate',
    workflow: {
      id: 'template_tax_filing_individual',
      name: 'Individual Tax Filing Workflow',
      description: 'Automated individual tax filing process',
      nodes: [
        {
          id: 'node_1',
          type: NodeType.DOCUMENT_PROCESSOR,
          position: { x: 100, y: 100 },
          data: {
            label: 'Process Tax Documents',
            config: {
              documentTypes: ['form16', 'bank_interest', 'investment_proofs'],
              extractionMode: 'auto'
            },
            inputs: [
              { id: 'tax_documents', label: 'Tax Documents', type: 'document' as any, required: true }
            ],
            outputs: [
              { id: 'financial_data', label: 'Financial Data', type: 'financial_data' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_2',
          type: NodeType.TAX_CALCULATOR,
          position: { x: 300, y: 100 },
          data: {
            label: 'Calculate Income Tax',
            config: {
              taxYear: '2024-25',
              taxType: 'individual',
              includeDeductions: true
            },
            inputs: [
              { id: 'financial_data', label: 'Financial Data', type: 'financial_data' as any, required: true }
            ],
            outputs: [
              { id: 'tax_calculation', label: 'Tax Calculation', type: 'tax_data' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_3',
          type: NodeType.INCOME_TAX_PROCESSOR,
          position: { x: 500, y: 100 },
          data: {
            label: 'Generate ITR',
            config: {
              returnType: 'ITR-1',
              includeTDS: true,
              autoValidate: true
            },
            inputs: [
              { id: 'financial_data', label: 'Financial Data', type: 'financial_data' as any, required: true },
              { id: 'tax_calculation', label: 'Tax Calculation', type: 'tax_data' as any, required: true }
            ],
            outputs: [
              { id: 'itr_document', label: 'ITR Document', type: 'document' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_4',
          type: NodeType.COMPLIANCE_CHECKER,
          position: { x: 700, y: 100 },
          data: {
            label: 'Pre-filing Compliance Check',
            config: {
              checkTypes: ['tax_compliance', 'document_completeness'],
              severity: 'strict'
            },
            inputs: [
              { id: 'itr_data', label: 'ITR Data', type: 'tax_data' as any, required: true }
            ],
            outputs: [
              { id: 'compliance_status', label: 'Compliance Status', type: 'boolean' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_5',
          type: NodeType.GOOGLE_SHEETS_ACTION,
          position: { x: 900, y: 100 },
          data: {
            label: 'Update Tax Records',
            config: {
              action: 'update_tax_record',
              sheetName: 'Tax Filing',
              includeStatus: true
            },
            inputs: [
              { id: 'tax_data', label: 'Tax Data', type: 'tax_data' as any, required: true }
            ],
            outputs: [
              { id: 'record_updated', label: 'Record Updated', type: 'boolean' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_6',
          type: NodeType.EMAIL_SENDER,
          position: { x: 1100, y: 100 },
          data: {
            label: 'Tax Filing Confirmation',
            config: {
              template: 'tax_filing_complete',
              attachITR: true,
              includeNextSteps: true
            },
            inputs: [
              { id: 'filing_data', label: 'Filing Data', type: 'any' as any, required: true }
            ],
            outputs: [
              { id: 'notification_sent', label: 'Notification Sent', type: 'boolean' as any }
            ]
          },
          inputs: [],
          outputs: []
        }
      ],
      connections: [
        {
          id: 'conn_1',
          sourceNodeId: 'node_1',
          targetNodeId: 'node_2',
          sourceHandle: 'financial_data',
          targetHandle: 'financial_data'
        },
        {
          id: 'conn_2',
          sourceNodeId: 'node_1',
          targetNodeId: 'node_3',
          sourceHandle: 'financial_data',
          targetHandle: 'financial_data'
        },
        {
          id: 'conn_3',
          sourceNodeId: 'node_2',
          targetNodeId: 'node_3',
          sourceHandle: 'tax_calculation',
          targetHandle: 'tax_calculation'
        },
        {
          id: 'conn_4',
          sourceNodeId: 'node_3',
          targetNodeId: 'node_4',
          sourceHandle: 'itr_data',
          targetHandle: 'itr_data'
        },
        {
          id: 'conn_5',
          sourceNodeId: 'node_2',
          targetNodeId: 'node_5',
          sourceHandle: 'tax_calculation',
          targetHandle: 'tax_data'
        },
        {
          id: 'conn_6',
          sourceNodeId: 'node_5',
          targetNodeId: 'node_6',
          sourceHandle: 'record_updated',
          targetHandle: 'filing_data'
        }
      ],
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false,
      tags: ['tax', 'individual', 'itr', 'filing']
    }
  },

  {
    id: 'gst_return_monthly',
    name: 'Monthly GST Return Filing',
    description: 'Automated monthly GST return preparation and filing workflow',
    category: TemplateCategory.TAX_FILING,
    preview: 'Transaction Data → GST Calculation → GSTR-3B → Compliance Check → Filing → Analytics Update',
    estimatedTime: 30,
    complexity: 'intermediate',
    workflow: {
      id: 'template_gst_return_monthly',
      name: 'Monthly GST Return Filing',
      description: 'Automated GST return filing process',
      nodes: [
        {
          id: 'node_1',
          type: NodeType.BANK_API_CONNECTOR,
          position: { x: 100, y: 100 },
          data: {
            label: 'Fetch Transaction Data',
            config: {
              dataType: 'gst_transactions',
              period: 'current_month'
            },
            inputs: [
              { id: 'account_info', label: 'Account Info', type: 'any' as any, required: true }
            ],
            outputs: [
              { id: 'transaction_data', label: 'Transaction Data', type: 'financial_data' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_2',
          type: NodeType.GST_PROCESSOR,
          position: { x: 300, y: 100 },
          data: {
            label: 'Process GST Calculations',
            config: {
              gstType: 'GSTR-3B',
              period: 'monthly',
              autoReconcile: true
            },
            inputs: [
              { id: 'financial_data', label: 'Financial Data', type: 'financial_data' as any, required: true }
            ],
            outputs: [
              { id: 'gst_calculation', label: 'GST Calculation', type: 'tax_data' as any },
              { id: 'gst_return', label: 'GST Return', type: 'document' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_3',
          type: NodeType.COMPLIANCE_CHECKER,
          position: { x: 500, y: 100 },
          data: {
            label: 'GST Compliance Check',
            config: {
              checkTypes: ['gst_reconciliation', 'input_credit'],
              severity: 'strict'
            },
            inputs: [
              { id: 'gst_data', label: 'GST Data', type: 'tax_data' as any, required: true }
            ],
            outputs: [
              { id: 'compliance_status', label: 'Compliance Status', type: 'boolean' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_4',
          type: NodeType.CONDITION,
          position: { x: 700, y: 100 },
          data: {
            label: 'Check Compliance Status',
            config: {
              condition: '$compliance_status == true',
              trueLabel: 'Compliant',
              falseLabel: 'Issues Found'
            },
            inputs: [
              { id: 'compliance_result', label: 'Compliance Result', type: 'boolean' as any, required: true }
            ],
            outputs: [
              { id: 'proceed_filing', label: 'Proceed with Filing', type: 'boolean' as any },
              { id: 'needs_review', label: 'Needs Review', type: 'boolean' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_5',
          type: NodeType.GOOGLE_SHEETS_ACTION,
          position: { x: 900, y: 50 },
          data: {
            label: 'Update GST Analytics',
            config: {
              action: 'update_gst_analytics',
              sheetName: 'GST Analytics',
              includeCharts: true
            },
            inputs: [
              { id: 'gst_data', label: 'GST Data', type: 'tax_data' as any, required: true }
            ],
            outputs: [
              { id: 'analytics_updated', label: 'Analytics Updated', type: 'boolean' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_6',
          type: NodeType.EMAIL_SENDER,
          position: { x: 900, y: 150 },
          data: {
            label: 'Send Review Alert',
            config: {
              template: 'gst_review_required',
              priority: 'high',
              includeReport: true
            },
            inputs: [
              { id: 'review_data', label: 'Review Data', type: 'any' as any, required: true }
            ],
            outputs: [
              { id: 'alert_sent', label: 'Alert Sent', type: 'boolean' as any }
            ]
          },
          inputs: [],
          outputs: []
        }
      ],
      connections: [
        {
          id: 'conn_1',
          sourceNodeId: 'node_1',
          targetNodeId: 'node_2',
          sourceHandle: 'transaction_data',
          targetHandle: 'financial_data'
        },
        {
          id: 'conn_2',
          sourceNodeId: 'node_2',
          targetNodeId: 'node_3',
          sourceHandle: 'gst_calculation',
          targetHandle: 'gst_data'
        },
        {
          id: 'conn_3',
          sourceNodeId: 'node_3',
          targetNodeId: 'node_4',
          sourceHandle: 'compliance_status',
          targetHandle: 'compliance_result'
        },
        {
          id: 'conn_4',
          sourceNodeId: 'node_4',
          targetNodeId: 'node_5',
          sourceHandle: 'proceed_filing',
          targetHandle: 'gst_data'
        },
        {
          id: 'conn_5',
          sourceNodeId: 'node_4',
          targetNodeId: 'node_6',
          sourceHandle: 'needs_review',
          targetHandle: 'review_data'
        }
      ],
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false,
      tags: ['gst', 'monthly', 'return', 'compliance']
    }
  },

  {
    id: 'audit_preparation',
    name: 'Audit Preparation Workflow',
    description: 'Comprehensive audit preparation including document collection, validation, and preliminary checks',
    category: TemplateCategory.AUDIT_PROCESS,
    preview: 'Document Collection → Financial Validation → Compliance Audit → Report Generation → Stakeholder Notification',
    estimatedTime: 60,
    complexity: 'advanced',
    workflow: {
      id: 'template_audit_preparation',
      name: 'Audit Preparation Workflow',
      description: 'Comprehensive audit preparation process',
      nodes: [
        {
          id: 'node_1',
          type: NodeType.SCHEDULED_TRIGGER,
          position: { x: 100, y: 100 },
          data: {
            label: 'Audit Season Trigger',
            config: {
              schedule: 'custom',
              customCron: '0 9 1 3 *', // March 1st at 9 AM
              timezone: 'Asia/Kolkata'
            },
            inputs: [],
            outputs: [
              { id: 'audit_start', label: 'Audit Start', type: 'any' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_2',
          type: NodeType.DOCUMENT_PROCESSOR,
          position: { x: 300, y: 100 },
          data: {
            label: 'Process Audit Documents',
            config: {
              documentTypes: ['balance_sheet', 'profit_loss', 'cash_flow', 'ledgers'],
              validationLevel: 'strict'
            },
            inputs: [
              { id: 'audit_documents', label: 'Audit Documents', type: 'document' as any, required: true }
            ],
            outputs: [
              { id: 'processed_financials', label: 'Processed Financials', type: 'financial_data' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_3',
          type: NodeType.AUDIT_VALIDATOR,
          position: { x: 500, y: 100 },
          data: {
            label: 'Audit Validation',
            config: {
              auditType: 'statutory',
              validationLevel: 'comprehensive',
              includeRatioAnalysis: true
            },
            inputs: [
              { id: 'financial_data', label: 'Financial Data', type: 'financial_data' as any, required: true }
            ],
            outputs: [
              { id: 'audit_report', label: 'Audit Report', type: 'report' as any },
              { id: 'validation_status', label: 'Validation Status', type: 'boolean' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_4',
          type: NodeType.REPORT_GENERATOR,
          position: { x: 700, y: 100 },
          data: {
            label: 'Generate Audit Report',
            config: {
              reportType: 'audit_report',
              format: 'pdf',
              includeCharts: true
            },
            inputs: [
              { id: 'audit_data', label: 'Audit Data', type: 'report' as any, required: true }
            ],
            outputs: [
              { id: 'final_report', label: 'Final Report', type: 'document' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_5',
          type: NodeType.GOOGLE_SHEETS_ACTION,
          position: { x: 900, y: 100 },
          data: {
            label: 'Create Audit Task',
            config: {
              action: 'create_audit_task',
              sheetName: 'Auditing Pipeline',
              priority: 'high'
            },
            inputs: [
              { id: 'audit_info', label: 'Audit Info', type: 'any' as any, required: true }
            ],
            outputs: [
              { id: 'task_created', label: 'Task Created', type: 'boolean' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_6',
          type: NodeType.EMAIL_SENDER,
          position: { x: 1100, y: 100 },
          data: {
            label: 'Notify Stakeholders',
            config: {
              template: 'audit_ready',
              recipients: ['client', 'audit_team', 'partners'],
              includeReport: true
            },
            inputs: [
              { id: 'notification_data', label: 'Notification Data', type: 'any' as any, required: true }
            ],
            outputs: [
              { id: 'notifications_sent', label: 'Notifications Sent', type: 'boolean' as any }
            ]
          },
          inputs: [],
          outputs: []
        }
      ],
      connections: [
        {
          id: 'conn_1',
          sourceNodeId: 'node_1',
          targetNodeId: 'node_2',
          sourceHandle: 'audit_start',
          targetHandle: 'audit_documents'
        },
        {
          id: 'conn_2',
          sourceNodeId: 'node_2',
          targetNodeId: 'node_3',
          sourceHandle: 'processed_financials',
          targetHandle: 'financial_data'
        },
        {
          id: 'conn_3',
          sourceNodeId: 'node_3',
          targetNodeId: 'node_4',
          sourceHandle: 'audit_report',
          targetHandle: 'audit_data'
        },
        {
          id: 'conn_4',
          sourceNodeId: 'node_3',
          targetNodeId: 'node_5',
          sourceHandle: 'audit_report',
          targetHandle: 'audit_info'
        },
        {
          id: 'conn_5',
          sourceNodeId: 'node_4',
          targetNodeId: 'node_6',
          sourceHandle: 'final_report',
          targetHandle: 'notification_data'
        }
      ],
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false,
      tags: ['audit', 'preparation', 'statutory', 'advanced']
    }
  },

  {
    id: 'compliance_monitoring',
    name: 'Daily Compliance Monitoring',
    description: 'Automated daily compliance monitoring for multiple clients with alerts and reporting',
    category: TemplateCategory.COMPLIANCE_CHECK,
    preview: 'Scheduled Check → Multi-client Validation → Regulatory Updates → Alert Generation → Management Dashboard',
    estimatedTime: 20,
    complexity: 'intermediate',
    workflow: {
      id: 'template_compliance_monitoring',
      name: 'Daily Compliance Monitoring',
      description: 'Automated compliance monitoring workflow',
      nodes: [
        {
          id: 'node_1',
          type: NodeType.SCHEDULED_TRIGGER,
          position: { x: 100, y: 100 },
          data: {
            label: 'Daily Compliance Check',
            config: {
              schedule: 'daily',
              time: '08:00',
              timezone: 'Asia/Kolkata'
            },
            inputs: [],
            outputs: [
              { id: 'daily_trigger', label: 'Daily Trigger', type: 'any' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_2',
          type: NodeType.LOOP,
          position: { x: 300, y: 100 },
          data: {
            label: 'Process Each Client',
            config: {
              iterationField: 'clients',
              maxIterations: 100
            },
            inputs: [
              { id: 'client_list', label: 'Client List', type: 'any' as any, required: true }
            ],
            outputs: [
              { id: 'current_client', label: 'Current Client', type: 'client_data' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_3',
          type: NodeType.COMPLIANCE_CHECKER,
          position: { x: 500, y: 100 },
          data: {
            label: 'Check Client Compliance',
            config: {
              checkTypes: ['deadline_monitoring', 'regulatory_updates', 'filing_status'],
              autoAlert: true
            },
            inputs: [
              { id: 'client_data', label: 'Client Data', type: 'client_data' as any, required: true }
            ],
            outputs: [
              { id: 'compliance_status', label: 'Compliance Status', type: 'report' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_4',
          type: NodeType.CONDITION,
          position: { x: 700, y: 100 },
          data: {
            label: 'Check for Issues',
            config: {
              condition: '$compliance_issues > 0',
              trueLabel: 'Issues Found',
              falseLabel: 'All Clear'
            },
            inputs: [
              { id: 'compliance_data', label: 'Compliance Data', type: 'report' as any, required: true }
            ],
            outputs: [
              { id: 'has_issues', label: 'Has Issues', type: 'boolean' as any },
              { id: 'no_issues', label: 'No Issues', type: 'boolean' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_5',
          type: NodeType.EMAIL_SENDER,
          position: { x: 900, y: 50 },
          data: {
            label: 'Send Alert',
            config: {
              template: 'compliance_alert',
              priority: 'high',
              escalate: true
            },
            inputs: [
              { id: 'alert_data', label: 'Alert Data', type: 'any' as any, required: true }
            ],
            outputs: [
              { id: 'alert_sent', label: 'Alert Sent', type: 'boolean' as any }
            ]
          },
          inputs: [],
          outputs: []
        },
        {
          id: 'node_6',
          type: NodeType.GOOGLE_SHEETS_ACTION,
          position: { x: 900, y: 150 },
          data: {
            label: 'Update Compliance Dashboard',
            config: {
              action: 'update_compliance_dashboard',
              sheetName: 'Compliance Dashboard',
              includeCharts: true
            },
            inputs: [
              { id: 'dashboard_data', label: 'Dashboard Data', type: 'any' as any, required: true }
            ],
            outputs: [
              { id: 'dashboard_updated', label: 'Dashboard Updated', type: 'boolean' as any }
            ]
          },
          inputs: [],
          outputs: []
        }
      ],
      connections: [
        {
          id: 'conn_1',
          sourceNodeId: 'node_1',
          targetNodeId: 'node_2',
          sourceHandle: 'daily_trigger',
          targetHandle: 'client_list'
        },
        {
          id: 'conn_2',
          sourceNodeId: 'node_2',
          targetNodeId: 'node_3',
          sourceHandle: 'current_client',
          targetHandle: 'client_data'
        },
        {
          id: 'conn_3',
          sourceNodeId: 'node_3',
          targetNodeId: 'node_4',
          sourceHandle: 'compliance_status',
          targetHandle: 'compliance_data'
        },
        {
          id: 'conn_4',
          sourceNodeId: 'node_4',
          targetNodeId: 'node_5',
          sourceHandle: 'has_issues',
          targetHandle: 'alert_data'
        },
        {
          id: 'conn_5',
          sourceNodeId: 'node_3',
          targetNodeId: 'node_6',
          sourceHandle: 'compliance_status',
          targetHandle: 'dashboard_data'
        }
      ],
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false,
      tags: ['compliance', 'monitoring', 'daily', 'automated']
    }
  }
];

// Helper functions for template management
export function getTemplatesByCategory(category: TemplateCategory): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter(template => template.category === category);
}

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByComplexity(complexity: 'beginner' | 'intermediate' | 'advanced'): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter(template => template.complexity === complexity);
}

export function getAllTemplateCategories(): TemplateCategory[] {
  return Object.values(TemplateCategory);
}

export function searchTemplates(query: string): WorkflowTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return WORKFLOW_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.workflow.tags?.some(tag => tag.includes(lowercaseQuery))
  );
}