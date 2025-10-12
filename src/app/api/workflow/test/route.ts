import { NextRequest, NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/workflow/service';

const workflowService = new WorkflowService();

// POST /api/workflow/test - Test workflow system with sample data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId = 'client_onboarding_basic', testData = {} } = body;

    // Default test data for client onboarding
    const defaultTestData = {
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@example.com',
      phone: '+91-9876543210',
      pan: 'ABCDE1234F',
      gstin: '07ABCDE1234F1Z5',
      address: '123 MG Road, Bangalore, Karnataka 560001',
      businessType: 'Individual',
      financialYear: '2024-25',
      documents: [
        {
          id: 'doc_1',
          filename: 'pan_card.pdf',
          type: 'pan_card',
          uploadDate: new Date(),
          size: 125000,
          url: '/uploads/pan_card.pdf'
        },
        {
          id: 'doc_2',
          filename: 'address_proof.pdf',
          type: 'address_proof',
          uploadDate: new Date(),
          size: 89000,
          url: '/uploads/address_proof.pdf'
        }
      ]
    };

    const inputData = { ...defaultTestData, ...testData };

    // Execute template with test data
    const execution = await workflowService.executeTemplate(templateId, inputData);

    return NextResponse.json({
      success: true,
      data: {
        execution,
        testData: inputData,
        message: 'Workflow test completed successfully'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test execution failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// GET /api/workflow/test - Get workflow system stats and health
export async function GET(request: NextRequest) {
  try {
    const stats = workflowService.getWorkflowStats();
    const templates = workflowService.getTemplates();
    const workflows = workflowService.getAllWorkflows();

    return NextResponse.json({
      success: true,
      data: {
        stats,
        templateCount: templates.length,
        workflowCount: workflows.length,
        availableTemplates: templates.map(t => ({
          id: t.id,
          name: t.name,
          category: t.category,
          complexity: t.complexity
        })),
        systemHealth: 'healthy'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed'
    }, { status: 500 });
  }
}