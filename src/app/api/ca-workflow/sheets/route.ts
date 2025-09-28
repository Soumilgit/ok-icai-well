import { NextRequest, NextResponse } from 'next/server';
import { CAGoogleSheetsService, CADraftingRow, CAAuditingRow } from '../../../../lib/ca-sheets-service';
import { v4 as uuidv4 } from 'uuid';

const sheetsService = new CAGoogleSheetsService();

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'createWorksheet':
        return await handleCreateWorksheet(data);
      
      case 'addDraftingTask':
        return await handleAddDraftingTask(data);
      
      case 'addAuditingTask':
        return await handleAddAuditingTask(data);
      
      case 'updateTaskStatus':
        return await handleUpdateTaskStatus(data);
      
      case 'getAnalytics':
        return await handleGetAnalytics(data);
      
      case 'autoAssignTask':
        return await handleAutoAssignTask(data);
      
      case 'getTasks':
        return await handleGetTasks(data);

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('CA Sheets workflow error:', error);
    return NextResponse.json({
      success: false,
      error: `Workflow automation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

async function handleCreateWorksheet(data: { caFirmName: string }) {
  const spreadsheetId = await sheetsService.createCAWorkflowSpreadsheet(data.caFirmName);
  
  return NextResponse.json({
    success: true,
    message: 'CA Workflow spreadsheet created successfully!',
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  });
}

async function handleAddDraftingTask(data: {
  spreadsheetId: string;
  clientName: string;
  documentType: 'Tax Return' | 'Audit Report' | 'Financial Statement' | 'Compliance Report';
  priority: 'High' | 'Medium' | 'Low';
  content: string;
  dueDate: string;
  assignedCA?: string;
}) {
  const taskId = uuidv4();
  const assignedCA = data.assignedCA || await sheetsService.autoAssignTask(data.spreadsheetId, 'drafting');
  
  const draftingTask: CADraftingRow = {
    id: taskId,
    timestamp: new Date().toISOString(),
    clientName: data.clientName,
    documentType: data.documentType,
    priority: data.priority,
    assignedCA,
    status: 'Draft',
    dueDate: data.dueDate,
    content: data.content
  };

  await sheetsService.addDraftingTask(data.spreadsheetId, draftingTask);

  return NextResponse.json({
    success: true,
    message: 'Drafting task added successfully!',
    taskId,
    assignedCA,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit#gid=0`
  });
}

async function handleAddAuditingTask(data: {
  spreadsheetId: string;
  clientName: string;
  auditType: 'Statutory Audit' | 'Internal Audit' | 'Tax Audit' | 'GST Audit' | 'Compliance Audit';
  riskLevel: 'High' | 'Medium' | 'Low';
  findings: string;
  auditor?: string;
}) {
  const taskId = uuidv4();
  const auditor = data.auditor || await sheetsService.autoAssignTask(data.spreadsheetId, 'auditing');
  
  const auditingTask: CAAuditingRow = {
    id: taskId,
    timestamp: new Date().toISOString(),
    clientName: data.clientName,
    auditType: data.auditType,
    auditor,
    status: 'Planning',
    riskLevel: data.riskLevel,
    findings: data.findings
  };

  await sheetsService.addAuditingTask(data.spreadsheetId, auditingTask);

  return NextResponse.json({
    success: true,
    message: 'Auditing task added successfully!',
    taskId,
    auditor,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit#gid=1`
  });
}

async function handleUpdateTaskStatus(data: {
  spreadsheetId: string;
  taskId: string;
  newStatus: string;
  sheetName: 'Drafting Pipeline' | 'Auditing Pipeline';
  reviewNotes?: string;
  approvedBy?: string;
}) {
  await sheetsService.updateTaskStatus(
    data.spreadsheetId,
    data.taskId,
    data.newStatus,
    data.sheetName
  );

  return NextResponse.json({
    success: true,
    message: 'Task status updated successfully!',
    taskId: data.taskId,
    newStatus: data.newStatus
  });
}

async function handleGetAnalytics(data: { spreadsheetId: string }) {
  const analytics = await sheetsService.getWorkflowAnalytics(data.spreadsheetId);

  return NextResponse.json({
    success: true,
    analytics,
    message: 'Analytics retrieved successfully!'
  });
}

async function handleAutoAssignTask(data: {
  spreadsheetId: string;
  taskType: 'drafting' | 'auditing';
}) {
  const assignedCA = await sheetsService.autoAssignTask(data.spreadsheetId, data.taskType);

  return NextResponse.json({
    success: true,
    assignedCA,
    message: 'Task auto-assigned successfully!'
  });
}

async function handleGetTasks(data: {
  spreadsheetId: string;
  sheetName: 'Drafting Pipeline' | 'Auditing Pipeline';
}) {
  const tasks = await sheetsService.getTasks(data.spreadsheetId, data.sheetName);

  return NextResponse.json({
    success: true,
    tasks,
    message: 'Tasks retrieved successfully!'
  });
}

// GET endpoint for retrieving workflow data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const spreadsheetId = searchParams.get('spreadsheetId');
    const action = searchParams.get('action');

    if (!spreadsheetId) {
      return NextResponse.json({
        success: false,
        error: 'Spreadsheet ID is required'
      }, { status: 400 });
    }

    switch (action) {
      case 'analytics':
        const analytics = await sheetsService.getWorkflowAnalytics(spreadsheetId);
        return NextResponse.json({
          success: true,
          analytics,
          message: 'Analytics retrieved successfully!'
        });

      case 'drafting':
        const draftingTasks = await sheetsService.getTasks(spreadsheetId, 'Drafting Pipeline');
        return NextResponse.json({
          success: true,
          tasks: draftingTasks,
          message: 'Drafting tasks retrieved successfully!'
        });

      case 'auditing':
        const auditingTasks = await sheetsService.getTasks(spreadsheetId, 'Auditing Pipeline');
        return NextResponse.json({
          success: true,
          tasks: auditingTasks,
          message: 'Auditing tasks retrieved successfully!'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('CA Sheets workflow GET error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to retrieve workflow data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}