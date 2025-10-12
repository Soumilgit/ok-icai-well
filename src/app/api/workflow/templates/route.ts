import { NextRequest, NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/workflow/service';

const workflowService = new WorkflowService();

// GET /api/workflow/templates - Get all workflow templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const complexity = searchParams.get('complexity') as 'beginner' | 'intermediate' | 'advanced' | null;

    let templates = workflowService.getTemplates();

    if (category) {
      templates = workflowService.getTemplatesByCategory(category as any);
    }

    if (complexity) {
      templates = templates.filter(template => template.complexity === complexity);
    }

    return NextResponse.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get templates'
    }, { status: 500 });
  }
}

// POST /api/workflow/templates - Create workflow from template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, name, description, createdBy = 'current-user' } = body;

    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: 'Template ID is required'
      }, { status: 400 });
    }

    const workflow = workflowService.createWorkflowFromTemplate(templateId, {
      name,
      description,
      createdBy
    });

    if (!workflow) {
      return NextResponse.json({
        success: false,
        error: 'Template not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: workflow,
      message: 'Workflow created from template successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create workflow from template'
    }, { status: 500 });
  }
}