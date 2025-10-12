import { NextRequest, NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/workflow/service';

const workflowService = new WorkflowService();

// GET /api/workflow/[id] - Get specific workflow
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const workflow = workflowService.getWorkflow(id);

    if (!workflow) {
      return NextResponse.json({
        success: false,
        error: 'Workflow not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// PUT /api/workflow/[id] - Update workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate workflow before updating
    if (body.nodes || body.connections) {
      const tempWorkflow = {
        ...body,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'temp'
      };
      
      const validation = workflowService.validateWorkflow(tempWorkflow);
      if (!validation.isValid) {
        return NextResponse.json({
          success: false,
          error: 'Invalid workflow',
          details: validation.errors
        }, { status: 400 });
      }
    }

    const updatedWorkflow = await workflowService.updateWorkflow(id, body);

    if (!updatedWorkflow) {
      return NextResponse.json({
        success: false,
        error: 'Workflow not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedWorkflow,
      message: 'Workflow updated successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update workflow'
    }, { status: 500 });
  }
}

// DELETE /api/workflow/[id] - Delete workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const deleted = await workflowService.deleteWorkflow(id);

    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Workflow not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete workflow'
    }, { status: 500 });
  }
}