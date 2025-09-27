import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import GeneratedContent from '@/models/GeneratedContent';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content } = body;
    
    if (!id || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'ID, title, and content are required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Update the content
    const updatedContent = await GeneratedContent.findByIdAndUpdate(
      id,
      { 
        title,
        content,
        updatedAt: new Date(),
        // Recalculate metadata
        'metadata.wordCount': content.split(/\s+/).length,
        'metadata.readingTime': Math.ceil(content.split(/\s+/).length / 200)
      },
      { new: true }
    );
    
    if (!updatedContent) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      content: updatedContent,
      message: 'Content updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}