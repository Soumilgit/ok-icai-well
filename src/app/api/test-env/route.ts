import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    clerk_publishable_key: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET',
    clerk_secret_key: process.env.CLERK_SECRET_KEY ? 'SET' : 'NOT SET',
    clerk_webhook_secret: process.env.CLERK_WEBHOOK_SECRET ? 'SET' : 'NOT SET',
    database_url: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    groq_api_key: process.env.GROQ_API_KEY ? 'SET' : 'NOT SET',
    hf_api_key: process.env.HUGGING_FACE_API_KEY ? 'SET' : 'NOT SET'
  });
}