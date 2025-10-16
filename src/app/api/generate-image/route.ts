import { NextRequest, NextResponse } from 'next/server';
import { qwenImageService, QwenImageService } from '@/lib/qwen-image-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, style, size, theme, language, branding } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Convert size to Qwen dimensions
    const qwenDimensions = QwenImageService.convertSizeToQwenDimensions(size);
    if (!qwenDimensions) {
      return NextResponse.json(
        { error: 'Invalid size provided' },
        { status: 400 }
      );
    }

    // Generate image using Qwen-Image
    const result = await qwenImageService.generateCAImage(
      prompt,
      style || 'professional',
      getAspectRatioFromSize(size),
      theme || 'accounting and finance'
    );

    return NextResponse.json({
      id: result.id,
      url: result.url,
      prompt: result.prompt,
      style: style || 'professional',
      size: size,
      createdAt: result.createdAt,
      downloadUrl: result.downloadUrl
    });

  } catch (error) {
    console.error('❌ Image generation API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getAspectRatioFromSize(size: string): keyof typeof QwenImageService.ASPECT_RATIOS {
  const sizeToAspectRatio: { [key: string]: keyof typeof QwenImageService.ASPECT_RATIOS } = {
    '1080x1080': '1:1',
    '1328x1328': '1:1',
    '1200x630': '16:9',
    '1664x928': '16:9',
    '1920x1080': '16:9',
    '928x1664': '9:16',
    '800x600': '4:3',
    '1472x1140': '4:3',
    '1140x1472': '3:4',
    '1584x1056': '3:2',
    '1056x1584': '2:3'
  };
  
  return sizeToAspectRatio[size] || '1:1';
}
