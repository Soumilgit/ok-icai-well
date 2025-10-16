import { NextRequest, NextResponse } from 'next/server'

// Use the same API key as other routes
const apiKey = process.env.GEMINI_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { prompt, documentType, context } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    // Use Gemini 2.5 Flash Lite model
    const model = 'gemini-2.5-flash-lite'
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

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

Generate a professional document that addresses the user's needs comprehensively. Use proper formatting, clear headings, and ensure the content is actionable and well-structured.

IMPORTANT FORMATTING RULES:
- DO NOT use any markdown symbols like *, **, #, ##, ###, or other special formatting characters
- DO NOT use asterisks for bold or italic text
- DO NOT use hashtags for headers
- Use plain text with clear organization through numbering (1., 2., 3.) and line breaks
- Separate sections with blank lines for better readability
- Use simple dashes (-) only for list items if needed
- Write section titles on their own line followed by content
- Make the output clean, natural, and easy to read like a professional document
- Focus on clarity and readability without any markdown styling

Please respond with a JSON object containing:
{
  "title": "Document Title",
  "subtitle": "Brief subtitle",
  "summary": "2-3 sentence summary for preview",
  "content": "Full detailed content without markdown formatting",
  "documentType": "${documentType || 'general'}",
  "sections": [
    {
      "heading": "Section Title",
      "content": "Section content"
    }
  ],
  "metadata": {
    "author": "AI Assistant",
    "date": "${new Date().toLocaleDateString()}",
    "version": "1.0"
  }
}`

    const response = await fetch(`${baseUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 0.8,
          maxOutputTokens: 2048,
          candidateCount: 1,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Gemini API Error:', response.status, errorText)
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Invalid Gemini response structure:', data)
      throw new Error('Invalid response from Gemini API - no content received')
    }

    const text = data.candidates[0].content.parts[0].text

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
