import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

export interface CADraftingRow {
  id: string;
  timestamp: string;
  clientName: string;
  documentType: 'Tax Return' | 'Audit Report' | 'Financial Statement' | 'Compliance Report';
  priority: 'High' | 'Medium' | 'Low';
  assignedCA: string;
  status: 'Draft' | 'Review' | 'Approved' | 'Rejected' | 'Completed';
  dueDate: string;
  content: string;
  reviewNotes?: string;
  approvedBy?: string;
  completedAt?: string;
}

export interface CAAuditingRow {
  id: string;
  timestamp: string;
  clientName: string;
  auditType: 'Statutory Audit' | 'Internal Audit' | 'Tax Audit' | 'GST Audit' | 'Compliance Audit';
  auditor: string;
  status: 'Planning' | 'In Progress' | 'Review' | 'Draft Report' | 'Final Report' | 'Completed';
  riskLevel: 'High' | 'Medium' | 'Low';
  findings: string;
  recommendations?: string;
  managementResponse?: string;
  followUpDate?: string;
}

export class CAGoogleSheetsService {
  private auth: GoogleAuth;
  private sheets: any;

  constructor() {
    // Initialize Google Auth with service account using separate environment variables
    this.auth = new GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
      ],
      // Use separate environment variables for better reliability
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID
      }
    });
    
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  // Helper method to get sheet ID by name
  private async getSheetIdByName(spreadsheetId: string, sheetName: string): Promise<number | null> {
    try {
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId
      });

      const sheet = spreadsheet.data.sheets?.find((sheet: any) => 
        sheet.properties?.title === sheetName
      );

      return sheet?.properties?.sheetId ?? null;
    } catch (error) {
      console.error(`Error getting sheet ID for ${sheetName}:`, error);
      return null;
    }
  }

  // Create a new CA Drafting & Auditing spreadsheet
  async createCAWorkflowSpreadsheet(caFirmName: string): Promise<string> {
    try {
      const spreadsheet = await this.sheets.spreadsheets.create({
        resource: {
          properties: {
            title: `${caFirmName} - CA Drafting & Auditing Workflow - ${new Date().getFullYear()}`
          },
          sheets: [
            {
              properties: {
                title: 'Drafting Pipeline',
                gridProperties: { rowCount: 1000, columnCount: 15 }
              }
            },
            {
              properties: {
                title: 'Auditing Pipeline',
                gridProperties: { rowCount: 1000, columnCount: 15 }
              }
            },
            {
              properties: {
                title: 'Analytics Dashboard',
                gridProperties: { rowCount: 50, columnCount: 10 }
              }
            }
          ]
        }
      });

      const spreadsheetId = spreadsheet.data.spreadsheetId!;

      // Setup headers for Drafting Pipeline
      await this.setupDraftingHeaders(spreadsheetId);
      
      // Setup headers for Auditing Pipeline
      await this.setupAuditingHeaders(spreadsheetId);
      
      // Setup Analytics Dashboard
      await this.setupAnalyticsDashboard(spreadsheetId);

      return spreadsheetId;
    } catch (error) {
      console.error('Error creating CA workflow spreadsheet:', error);
      throw error;
    }
  }

  // Setup Drafting Pipeline headers
  private async setupDraftingHeaders(spreadsheetId: string) {
    const headers = [
      'ID', 'Timestamp', 'Client Name', 'Document Type', 'Priority', 
      'Assigned CA', 'Status', 'Due Date', 'Content Preview', 
      'Review Notes', 'Approved By', 'Completed At', 'Actions', 'Tags', 'Files'
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Drafting Pipeline!A1:O1',
      valueInputOption: 'RAW',
      resource: {
        values: [headers]
      }
    });

    // Get the actual sheet ID dynamically
    const sheetId = await this.getSheetIdByName(spreadsheetId, 'Drafting Pipeline');
    
    if (sheetId !== null) {
      // Format headers
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 15
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.6, blue: 1.0, alpha: 1.0 },
                    textFormat: { bold: true, foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 } }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            }
          ]
        }
      });
    }
  }

  // Setup Auditing Pipeline headers
  private async setupAuditingHeaders(spreadsheetId: string) {
    const headers = [
      'ID', 'Timestamp', 'Client Name', 'Audit Type', 'Auditor', 
      'Status', 'Risk Level', 'Findings', 'Recommendations', 
      'Management Response', 'Follow-up Date', 'Actions', 'Tags', 'Files', 'Reports'
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Auditing Pipeline!A1:O1',
      valueInputOption: 'RAW',
      resource: {
        values: [headers]
      }
    });

    // Get the actual sheet ID dynamically
    const sheetId = await this.getSheetIdByName(spreadsheetId, 'Auditing Pipeline');
    
    if (sheetId !== null) {
      // Format headers
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 15
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 1.0, green: 0.6, blue: 0.2, alpha: 1.0 },
                    textFormat: { bold: true, foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 } }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            }
          ]
        }
      });
    }
  }

  // Setup Analytics Dashboard
  private async setupAnalyticsDashboard(spreadsheetId: string) {
    const analyticsData = [
      ['CA WORKFLOW ANALYTICS DASHBOARD', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', ''],
      ['DRAFTING METRICS', 'Value', '', 'AUDITING METRICS', 'Value', '', 'PERFORMANCE', 'Value', '', ''],
      ['Total Drafts', '=COUNTA(\'Drafting Pipeline\'!A2:A)', '', 'Total Audits', '=COUNTA(\'Auditing Pipeline\'!A2:A)', '', 'Avg Completion Time', '=AVERAGE(L2:L)', '', ''],
      ['Pending Review', '=COUNTIF(\'Drafting Pipeline\'!G:G,"Review")', '', 'In Progress', '=COUNTIF(\'Auditing Pipeline\'!F:F,"In Progress")', '', 'High Priority Items', '=COUNTIF(\'Drafting Pipeline\'!E:E,"High")', '', ''],
      ['Completed Today', '=COUNTIFS(\'Drafting Pipeline\'!G:G,"Completed",\'Drafting Pipeline\'!L:L,TODAY())', '', 'Completed This Month', '=COUNTIFS(\'Auditing Pipeline\'!F:F,"Completed",\'Auditing Pipeline\'!B:B,">="&EOMONTH(TODAY(),-1)+1)', '', 'Overdue Items', '=COUNTIF(\'Drafting Pipeline\'!H:H,"<"&TODAY())', '', ''],
      ['', '', '', '', '', '', '', '', '', ''],
      ['WORKLOAD DISTRIBUTION', '', '', 'COMPLIANCE STATUS', '', '', 'ALERTS', '', '', ''],
      ['CA Name', 'Active Tasks', 'Completion Rate', 'Audit Type', 'Status', 'Due Date', 'Alert Type', 'Count', 'Action Required', ''],
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Analytics Dashboard!A1:J9',
      valueInputOption: 'USER_ENTERED', // This will interpret formulas
      resource: {
        values: analyticsData
      }
    });

    // Get the actual sheet ID dynamically
    const sheetId = await this.getSheetIdByName(spreadsheetId, 'Analytics Dashboard');
    
    if (sheetId !== null) {
      // Format the analytics dashboard
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            // Title formatting
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                  endColumnIndex: 10
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.1, green: 0.1, blue: 0.1, alpha: 1.0 },
                    textFormat: { bold: true, fontSize: 16, foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 } },
                    horizontalAlignment: 'CENTER'
                  }
                },
                fields: 'userEnteredFormat'
              }
            }
          ]
        }
      });
    }
  }

  // Add a new drafting task
  async addDraftingTask(spreadsheetId: string, task: CADraftingRow): Promise<void> {
    try {
      // Ensure the required sheets exist first
      await this.ensureRequiredSheets(spreadsheetId);
      
      const values = [
        task.id,
        task.timestamp,
        task.clientName,
        task.documentType,
        task.priority,
        task.assignedCA,
        task.status,
        task.dueDate,
        task.content.substring(0, 100) + '...', // Preview
        task.reviewNotes || '',
        task.approvedBy || '',
        task.completedAt || '',
        '=HYPERLINK("https://your-dashboard.com/task/" & A' + await this.getNextRowNumber(spreadsheetId, 'Drafting Pipeline') + ',"View")',
        '', // Tags
        '' // Files
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Drafting Pipeline!A2:O',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [values]
        }
      });
    } catch (error) {
      console.error('Error adding drafting task:', error);
      throw error;
    }
  }

  // Add a new auditing task
  async addAuditingTask(spreadsheetId: string, audit: CAAuditingRow): Promise<void> {
    try {
      // Ensure the required sheets exist first
      await this.ensureRequiredSheets(spreadsheetId);
      
      const values = [
        audit.id,
        audit.timestamp,
        audit.clientName,
        audit.auditType,
        audit.auditor,
        audit.status,
        audit.riskLevel,
        audit.findings,
        audit.recommendations || '',
        audit.managementResponse || '',
        audit.followUpDate || '',
        '=HYPERLINK("https://your-dashboard.com/audit/" & A' + await this.getNextRowNumber(spreadsheetId, 'Auditing Pipeline') + ',"View")',
        '', // Tags
        '', // Files
        '' // Reports
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Auditing Pipeline!A2:O',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [values]
        }
      });
    } catch (error) {
      console.error('Error adding auditing task:', error);
      throw error;
    }
  }

  // Update task status
  async updateTaskStatus(
    spreadsheetId: string, 
    taskId: string, 
    newStatus: string, 
    sheetName: 'Drafting Pipeline' | 'Auditing Pipeline'
  ): Promise<void> {
    // Find the row with the matching ID
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any[]) => row[0] === taskId);

    if (rowIndex > 0) { // Skip header row
      const statusColumn = sheetName === 'Drafting Pipeline' ? 'G' : 'F';
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${statusColumn}${rowIndex + 1}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[newStatus]]
        }
      });

      // If status is completed, add completion timestamp
      if (newStatus === 'Completed') {
        const completedColumn = sheetName === 'Drafting Pipeline' ? 'L' : 'K';
        await this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!${completedColumn}${rowIndex + 1}`,
          valueInputOption: 'RAW',
          resource: {
            values: [[new Date().toISOString()]]
          }
        });
      }
    }
  }

  // Ensure required sheets exist in the spreadsheet
  async ensureRequiredSheets(spreadsheetId: string): Promise<void> {
    try {
      // Get existing sheets
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId
      });

      const existingSheets = spreadsheet.data.sheets?.map((sheet: any) => sheet.properties?.title) || [];
      const requiredSheets = ['Drafting Pipeline', 'Auditing Pipeline', 'Analytics Dashboard'];
      
      const missingSheets = requiredSheets.filter(sheet => !existingSheets.includes(sheet));

      if (missingSheets.length > 0) {
        console.log(`Creating missing sheets: ${missingSheets.join(', ')}`);
        
        // Create missing sheets
        const requests = missingSheets.map(sheetName => ({
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: { rowCount: 1000, columnCount: 15 }
            }
          }
        }));

        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          resource: { requests }
        });

        // Set up headers for each missing sheet
        for (const sheetName of missingSheets) {
          if (sheetName === 'Drafting Pipeline') {
            await this.setupDraftingHeaders(spreadsheetId);
          } else if (sheetName === 'Auditing Pipeline') {
            await this.setupAuditingHeaders(spreadsheetId);
          } else if (sheetName === 'Analytics Dashboard') {
            await this.setupAnalyticsDashboard(spreadsheetId);
          }
        }
      }
    } catch (error) {
      console.error('Error ensuring required sheets:', error);
      throw error;
    }
  }

  // Get all tasks from a sheet
  async getTasks(spreadsheetId: string, sheetName: 'Drafting Pipeline' | 'Auditing Pipeline'): Promise<any[]> {
    try {
      // Ensure the required sheets exist first
      await this.ensureRequiredSheets(spreadsheetId);
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A2:O`
      });

      return response.data.values || [];
    } catch (error) {
      console.error(`Error getting tasks from ${sheetName}:`, error);
      throw error;
    }
  }

  // Get workflow analytics
  async getWorkflowAnalytics(spreadsheetId: string): Promise<any> {
    try {
      // Ensure the required sheets exist first
      await this.ensureRequiredSheets(spreadsheetId);
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Analytics Dashboard!A1:J20'
      });

      const data = response.data.values || [];
      return {
        totalDrafts: data[3] ? data[3][1] : 0,
        pendingReview: data[4] ? data[4][1] : 0,
        completedToday: data[5] ? data[5][1] : 0,
        totalAudits: data[3] ? data[3][4] : 0,
        auditsInProgress: data[4] ? data[4][4] : 0,
        completedThisMonth: data[5] ? data[5][4] : 0,
        avgCompletionTime: data[3] ? data[3][7] : 0,
        highPriorityItems: data[4] ? data[4][7] : 0,
        overdueItems: data[5] ? data[5][7] : 0
      };
    } catch (error) {
      console.error('Error getting workflow analytics:', error);
      throw error;
    }
  }

  // Helper method to get next row number
  private async getNextRowNumber(spreadsheetId: string, sheetName: string): Promise<number> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`
    });

    const rows = response.data.values || [];
    return rows.length + 1;
  }

  // Auto-assign tasks based on workload
  async autoAssignTask(spreadsheetId: string, taskType: 'drafting' | 'auditing'): Promise<string> {
    const sheetName = taskType === 'drafting' ? 'Drafting Pipeline' : 'Auditing Pipeline';
    const tasks = await this.getTasks(spreadsheetId, sheetName);
    
    // Get CA workload (simplified logic)
    const caWorkload: { [key: string]: number } = {};
    
    tasks.forEach((task: any[]) => {
      const assignedCA = task[5]; // CA column
      const status = task[6]; // Status column
      
      if (assignedCA && status !== 'Completed') {
        caWorkload[assignedCA] = (caWorkload[assignedCA] || 0) + 1;
      }
    });

    // Find CA with least workload
    const availableCAs = ['CA John Doe', 'CA Jane Smith', 'CA Mike Johnson', 'CA Sarah Wilson'];
    let assignedCA = availableCAs[0];
    let minWorkload = caWorkload[assignedCA] || 0;

    availableCAs.forEach(ca => {
      const workload = caWorkload[ca] || 0;
      if (workload < minWorkload) {
        minWorkload = workload;
        assignedCA = ca;
      }
    });

    return assignedCA;
  }
}