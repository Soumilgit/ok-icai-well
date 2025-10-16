import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const artifactId = params.id;
    
    if (!artifactId) {
      return NextResponse.json({ error: 'Artifact ID is required' }, { status: 400 });
    }

    // For now, we'll return a simple text file
    // In a real implementation, you'd fetch the artifact from a database
    const artifactContent = `Artifact ID: ${artifactId}
Generated: ${new Date().toISOString()}

This is a placeholder artifact content. In a real implementation, this would contain the actual generated content.

To implement this properly, you would:
1. Store artifacts in a database when they're generated
2. Retrieve the artifact content by ID
3. Return the actual content here

For now, this serves as a working download endpoint.`;

    return new NextResponse(artifactContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="artifact_${artifactId}.txt"`,
      },
    });

  } catch (error) {
    console.error('Artifact download error:', error);
    return NextResponse.json(
      { error: 'Failed to download artifact' },
      { status: 500 }
    );
  }
}