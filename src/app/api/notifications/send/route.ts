import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notification-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      type, 
      title, 
      message, 
      content, 
      recipients, 
      priority = 'medium',
      metadata = {}
    } = body;
    
    // Validate required fields
    if (!type || !title || !message || !content || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: type, title, message, content, recipients' 
        },
        { status: 400 }
      );
    }
    
    // Validate recipients
    for (const recipient of recipients) {
      if (!recipient.email || !recipient.name || !recipient.role) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Each recipient must have email, name, and role' 
          },
          { status: 400 }
        );
      }
    }
    
    const notificationId = await notificationService.sendNotification({
      type,
      title,
      message,
      content,
      recipients,
      priority,
      metadata
    });
    
    return NextResponse.json({
      success: true,
      notificationId,
      message: 'Notification sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const stats = await notificationService.getNotificationStats();
    
    return NextResponse.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get notification stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
