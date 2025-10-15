import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for demo purposes
// In a real app, you'd use a database
const messageStore = new Map<string, {
  id: string
  content: string
  role: string
  timestamp: string
  mode?: string
}>()

// Store a message (called when a message is created)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { content, role, mode } = await request.json()
    const { id: messageId } = await params

    messageStore.set(messageId, {
      id: messageId,
      content,
      role,
      timestamp: new Date().toISOString(),
      mode
    })

    return NextResponse.json({
      success: true,
      message: { id: messageId, content, role, timestamp: new Date().toISOString(), mode }
    })
  } catch (error) {
    console.error('Error storing message:', error)
    return NextResponse.json(
      { error: 'Failed to store message' },
      { status: 500 }
    )
  }
}

// Get a message by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params
    const message = messageStore.get(messageId)

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message
    })
  } catch (error) {
    console.error('Error fetching message:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message' },
      { status: 500 }
    )
  }
}
