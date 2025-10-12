import { NextRequest, NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/workflow/service';

const workflowService = new WorkflowService();

// POST /api/workflow/[id]/execute - Execute workflow
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { data = {} } = body;

    const execution = await workflowService.executeWorkflow(id, data);

    return NextResponse.json({
      success: true,
      data: execution,
      message: 'Workflow execution started'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute workflow'
    }, { status: 500 });
  }
}