import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trigger } = body;

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    switch (trigger) {
      case 'generate_content':
        // Trigger content generation
        const generateResponse = await fetch(`${baseUrl}/api/linkedin-pipeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generate_content' })
        });
        
        const generateResult = await generateResponse.json();
        return NextResponse.json({
          success: true,
          message: 'Content generation triggered',
          data: generateResult
        });

      case 'schedule_posts':
        // Trigger post scheduling
        const scheduleResponse = await fetch(`${baseUrl}/api/linkedin-pipeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'schedule_approved' })
        });
        
        const scheduleResult = await scheduleResponse.json();
        return NextResponse.json({
          success: true,
          message: 'Post scheduling triggered',
          data: scheduleResult
        });

      case 'post_now':
        // Trigger immediate posting of approved content
        const postNowResponse = await fetch(`${baseUrl}/api/linkedin-pipeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'post_immediately',
            config: {
              skipScheduling: true // Post approved content immediately
            }
          })
        });
        
        const postNowResult = await postNowResponse.json();
        return NextResponse.json({
          success: true,
          message: 'Immediate posting triggered',
          data: postNowResult
        });

      case 'full_pipeline':
        // Trigger full pipeline
        const pipelineResponse = await fetch(`${baseUrl}/api/linkedin-pipeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'run_full_pipeline',
            config: {
              enableAutoApproval: false // Always require human approval
            }
          })
        });
        
        const pipelineResult = await pipelineResponse.json();
        return NextResponse.json({
          success: true,
          message: 'Full pipeline triggered',
          data: pipelineResult
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown trigger type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error triggering LinkedIn automation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to trigger automation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Get current pipeline status
    const statusResponse = await fetch(`${baseUrl}/api/linkedin-pipeline`);
    const statusResult = await statusResponse.json();

    // Get pending posts count
    const approvalResponse = await fetch(`${baseUrl}/api/content-approval?status=pending`);
    const approvalResult = await approvalResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        pipelineStatus: statusResult.data,
        pendingPosts: approvalResult.data?.posts?.length || 0,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting automation status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}