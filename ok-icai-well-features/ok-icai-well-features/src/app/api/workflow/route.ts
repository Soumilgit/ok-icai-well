import { NextRequest, NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/workflow/service';
import { Workflow } from '@/lib/workflow/types';

const workflowService = new WorkflowService();

// GET /api/workflow - Get all workflows or search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const userId = searchParams.get('userId');

    let workflows: Workflow[] = [];

    if (query) {
      workflows = workflowService.searchWorkflows(query);
    } else if (userId) {
      workflows = workflowService.getWorkflowsByUser(userId);
    } else {
      workflows = workflowService.getAllWorkflows();
    }

    return NextResponse.json({
      success: true,
      data: workflows,
      count: workflows.length
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// POST /api/workflow - Create new workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, nodes = [], connections = [], tags = [], createdBy = 'current-user', isActive = false } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Workflow name is required'
      }, { status: 400 });
    }

    const workflow = await workflowService.createWorkflow({
      name: name.trim(),
      description: description || '',
      nodes,
      connections,
      createdBy,
      isActive,
      tags
    });

    return NextResponse.json({
      success: true,
      data: workflow,
      message: 'Workflow created successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create workflow'
    }, { status: 500 });
  }
}