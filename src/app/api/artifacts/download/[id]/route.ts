import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: artifactId } = await params

    if (!artifactId) {
      return NextResponse.json({ error: 'Artifact ID is required' }, { status: 400 })
    }

    // For now, we'll return a placeholder response
    // In a real implementation, you would:
    // 1. Retrieve the artifact data from a database
    // 2. Generate the actual document file (.odt, .docx, etc.)
    // 3. Return the file as a download

    const mockDocument = {
      id: artifactId,
      title: 'Generated Document',
      content: 'This is a placeholder for the actual document content.',
      type: 'text/plain'
    }

    // Try to fetch the actual message content if it's a doc_ ID
    let documentContent = ''
    let documentTitle = 'Generated Document'
    
    if (artifactId.startsWith('doc_')) {
      try {
        // In a real implementation, you'd fetch from your message store
        // For now, we'll create a comprehensive document
        const messageId = artifactId.replace('doc_', '')
        documentTitle = `AI Response Document - ${messageId}`
        
        // Try to fetch the actual message content to create real document
        try {
          const messageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/messages/${messageId}`)
          const messageData = await messageResponse.json()
          
          let realSummary = 'This document contains a comprehensive analysis and actionable insights based on your AI assistant conversation.'
          let realKeyPoints = '• Review the recommendations above\n• Implement suggested changes\n• Follow up as needed'
          let realActionItems = '• Review the recommendations above\n• Implement suggested changes\n• Follow up as needed'
          
          if (messageData.success && messageData.message) {
            const content = messageData.message.content
            
            // Create real summary (slightly longer, about 35% of original content)
            const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15)
            if (sentences.length > 0) {
              const targetLength = Math.min(content.length * 0.35, 400) // Cap at 400 characters
              let summary = ''
              let currentLength = 0
              
              for (let i = 0; i < sentences.length && currentLength < targetLength; i++) {
                const sentence = sentences[i].trim()
                if (sentence.length > 20) {
                  summary += sentence + '. '
                  currentLength += sentence.length + 2
                }
              }
              
              // If summary is too short, add one more sentence if available
              if (currentLength < targetLength * 0.7 && sentences.length > 3) {
                const nextSentence = sentences[3].trim()
                if (nextSentence.length > 20) {
                  summary += nextSentence + '. '
                }
              }
              
              realSummary = summary.trim() || 'This document contains a comprehensive analysis and actionable insights based on your AI assistant conversation.'
            }
            
            // Extract real key points
            const keySentences = sentences.filter(s => 
              ['important', 'key', 'critical', 'essential', 'should', 'must', 'recommend'].some(keyword => 
                s.toLowerCase().includes(keyword)
              )
            )
            if (keySentences.length > 0) {
              realKeyPoints = keySentences.slice(0, 5).map(s => `• ${s.trim()}`).join('\n')
            }
            
            // Extract real action items
            const actionSentences = sentences.filter(s => 
              ['should', 'need to', 'recommended', 'consider', 'implement', 'ensure'].some(keyword => 
                s.toLowerCase().includes(keyword)
              )
            )
            if (actionSentences.length > 0) {
              realActionItems = actionSentences.slice(0, 5).map(s => `• ${s.trim()}`).join('\n')
            }
          }
          
          // Clean the content for text download
          const cleanSummary = realSummary.replace(/[#*\-]/g, '').replace(/\n+/g, ' ').trim()
          const cleanKeyPoints = realKeyPoints.replace(/[#*\-]/g, '').replace(/\n+/g, '\n').trim()
          const cleanActionItems = realActionItems.replace(/[#*\-]/g, '').replace(/\n+/g, '\n').trim()
          
          documentContent = `AI ASSISTANT RESPONSE DOCUMENT
==========================================

Document ID: ${artifactId}
Message ID: ${messageId}
Generated: ${new Date().toLocaleString()}
Source: AI Assistant Chat Response

==========================================
EXECUTIVE SUMMARY
==========================================

${cleanSummary}

==========================================
KEY TAKEAWAYS
==========================================

${cleanKeyPoints}

==========================================
ACTION ITEMS
==========================================

${cleanActionItems}

==========================================
ADDITIONAL NOTES
==========================================

This document was automatically generated from your AI assistant conversation. 
All recommendations and insights are based on the latest available information 
and best practices.

Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
Document ID: ${artifactId}
Source: AI Assistant Response

==========================================
END OF DOCUMENT
==========================================`
        } catch (fetchError) {
          // Fallback to basic content if fetch fails
          documentContent = `AI ASSISTANT RESPONSE DOCUMENT
==========================================

Document ID: ${artifactId}
Message ID: ${messageId}
Generated: ${new Date().toLocaleString()}
Source: AI Assistant Chat Response

==========================================
EXECUTIVE SUMMARY
==========================================

This document contains a comprehensive analysis and actionable insights 
based on your AI assistant conversation.

==========================================
KEY TAKEAWAYS
==========================================

• Review the recommendations above
• Implement suggested changes
• Follow up as needed

==========================================
ACTION ITEMS
==========================================

• Review the recommendations above
• Implement suggested changes  
• Follow up as needed

==========================================
ADDITIONAL NOTES
==========================================

This document was automatically generated from your AI assistant conversation. 
All recommendations and insights are based on the latest available information 
and best practices.

Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
Document ID: ${artifactId}
Source: AI Assistant Response

==========================================
END OF DOCUMENT
==========================================`
        }
      } catch (error) {
        console.error('Error generating document content:', error)
        documentContent = `Error generating document content for ${artifactId}`
      }
    } else {
      documentTitle = `AI Generated Document - ${artifactId}`
      documentContent = `AI GENERATED DOCUMENT
==========================================

Document ID: ${artifactId}
Generated: ${new Date().toLocaleString()}
Source: AI Assistant

==========================================

This is a comprehensive document generated by our AI assistant. 
The content below represents a detailed analysis and actionable 
insights based on your specific request.

[Document content would be generated here in a full implementation]

Generated at: ${new Date().toISOString()}
Artifact ID: ${artifactId}`
    }

    const headers = new Headers()
    headers.set('Content-Type', 'text/plain')
    headers.set('Content-Disposition', `attachment; filename="${documentTitle.replace(/[^a-zA-Z0-9]/g, '_')}.txt"`)

    return new NextResponse(documentContent, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to download artifact', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
