import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { prompt, documentType, context } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Define the structured output schema for document generation
    const generationConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title of the document'
          },
          subtitle: {
            type: 'string',
            description: 'Subtitle or brief description'
          },
          summary: {
            type: 'string',
            description: 'Brief summary for preview box'
          },
          content: {
            type: 'string',
            description: 'Full detailed content of the document'
          },
          documentType: {
            type: 'string',
            enum: ['report', 'proposal', 'analysis', 'summary', 'plan', 'audit'],
            description: 'Type of document being generated'
          },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                heading: { type: 'string' },
                content: { type: 'string' }
              }
            },
            description: 'Structured sections of the document'
          },
          metadata: {
            type: 'object',
            properties: {
              author: { type: 'string' },
              date: { type: 'string' },
              version: { type: 'string' }
            }
          }
        },
        required: ['title', 'content', 'documentType', 'summary']
      }
    }

    // Create a comprehensive prompt for document generation
    const systemPrompt = `You are a professional document generator specializing in creating structured business documents. 

Based on the user's request, generate a comprehensive document with the following structure:

1. Create a clear, professional title
2. Provide a concise subtitle
3. Generate a brief summary (2-3 sentences) for preview
4. Create detailed, well-structured content
5. Organize content into logical sections
6. Include relevant metadata

Document Type: ${documentType || 'general'}
Context: ${context || 'No additional context provided'}

User Request: ${prompt}

Generate a professional document that addresses the user's needs comprehensively. Use proper formatting, clear headings, and ensure the content is actionable and well-structured.`

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      generationConfig
    })

    const response = await result.response
    const text = response.text()

    try {
      const artifactData = JSON.parse(text)
      
      // Generate a unique artifact ID
      const artifactId = `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Create the artifact response
      const artifact = {
        id: artifactId,
        title: artifactData.title,
        subtitle: artifactData.subtitle,
        summary: artifactData.summary,
        content: artifactData.content,
        documentType: artifactData.documentType,
        sections: artifactData.sections || [],
        metadata: {
          ...artifactData.metadata,
          generatedAt: new Date().toISOString(),
          id: artifactId
        },
        downloadUrl: `/api/artifacts/download/${artifactId}`,
        previewMode: true
      }

      return NextResponse.json({
        success: true,
        artifact
      })

    } catch (parseError) {
      console.error('Failed to parse artifact JSON:', parseError)
      return NextResponse.json({
        success: true,
        artifact: {
          id: `artifact_${Date.now()}`,
          title: 'Generated Document',
          subtitle: 'AI-Generated Content',
          summary: text.substring(0, 200) + '...',
          content: text,
          documentType: documentType || 'general',
          sections: [],
          metadata: {
            generatedAt: new Date().toISOString()
          },
          downloadUrl: null,
          previewMode: true
        }
      })
    }

  } catch (error) {
    console.error('Artifact generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate artifact', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
