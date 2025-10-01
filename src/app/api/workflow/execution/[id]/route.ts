import { NextRequest, NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/workflow/service';

const workflowService = new WorkflowService();

// GET /api/workflow/execution/[id] - Get execution status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const execution = workflowService.getExecutionStatus(id);

    if (!execution) {
      return NextResponse.json({
        success: false,
        error: 'Execution not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: execution
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get execution status'
    }, { status: 500 });
  }
}

// DELETE /api/workflow/execution/[id] - Cancel execution
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const cancelled = workflowService.cancelExecution(id);

    if (!cancelled) {
      return NextResponse.json({
        success: false,
        error: 'Execution not found or cannot be cancelled'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Execution cancelled successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel execution'
    }, { status: 500 });
  }
}