export interface ImageGenerationRequest {
  prompt: string;
  style: 'professional' | 'modern' | 'minimalist' | 'infographic' | 'social-media';
  size: '1080x1080' | '1200x630' | '800x600' | '1920x1080';
  theme: string;
  branding?: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    fontStyle: string;
  };
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  size: string;
  createdAt: Date;
  downloadUrl?: string;
}

export class ImageGenerationService {
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.DALL_E_API_KEY || null;
  }

  async generateImage(request: ImageGenerationRequest): Promise<GeneratedImage> {
    try {
      // Enhanced prompt based on CA/accounting context
      const enhancedPrompt = this.enhancePromptForCA(request.prompt, request.style, request.theme);
      
      if (this.apiKey) {
        // Use DALL-E API if available
        return await this.generateWithDALLE(enhancedPrompt, request);
      } else {
        // Fallback to mock generation or free alternatives
        return await this.generateMockImage(enhancedPrompt, request);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      throw new Error('Failed to generate image');
    }
  }

  private enhancePromptForCA(originalPrompt: string, style: string, theme: string): string {
    const caContext = 'professional accounting and finance';
    const styleDescriptions = {
      'professional': 'clean, corporate, business-appropriate',
      'modern': 'contemporary, sleek, minimalist design',
      'minimalist': 'simple, clean lines, plenty of white space',
      'infographic': 'data visualization, charts, graphs, informative',
      'social-media': 'engaging, eye-catching, social platform optimized'
    };

    const enhancedPrompt = `
${originalPrompt}

Style: ${styleDescriptions[style as keyof typeof styleDescriptions]}
Context: ${caContext}
Theme: ${theme}
Requirements: Professional, trustworthy, suitable for chartered accountant content
Colors: Corporate blues, grays, whites with professional accent colors
Typography: Clean, readable, professional fonts
No people faces, focus on concepts, data, and professional imagery
High quality, sharp, suitable for social media and professional use
`;

    return enhancedPrompt;
  }

  private async generateWithDALLE(prompt: string, request: ImageGenerationRequest): Promise<GeneratedImage> {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt.substring(0, 1000), // DALL-E has prompt limits
        n: 1,
        size: this.convertSizeForDALLE(request.size),
        quality: 'standard',
        style: 'natural'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate image with DALL-E');
    }

    const data = await response.json();
    const imageUrl = data.data[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E');
    }

    return {
      id: `dalle_${Date.now()}`,
      url: imageUrl,
      prompt: request.prompt,
      style: request.style,
      size: request.size,
      createdAt: new Date(),
      downloadUrl: imageUrl
    };
  }

  private async generateMockImage(prompt: string, request: ImageGenerationRequest): Promise<GeneratedImage> {
    // Generate a placeholder image with relevant styling
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Cannot create canvas context');
    }

    // Set canvas size
    const [width, height] = request.size.split('x').map(Number);
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = this.getBackgroundColor(request.style);
    ctx.fillRect(0, 0, width, height);

    // Add branding colors if provided
    if (request.branding?.primaryColor) {
      ctx.fillStyle = request.branding.primaryColor;
      ctx.fillRect(0, 0, width, 50); // Header bar
    }

    // Add text
    ctx.fillStyle = '#333333';
    ctx.font = this.getFontStyle(request.style, Math.min(width, height));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Wrap text
    const lines = this.wrapText(ctx, request.prompt, width - 100);
    const lineHeight = parseInt(ctx.font) * 1.2;
    const startY = height / 2 - (lines.length * lineHeight) / 2;

    lines.forEach((line, index) => {
      ctx.fillText(line, width / 2, startY + (index * lineHeight));
    });

    // Add decorative elements based on style
    this.addStyleElements(ctx, width, height, request.style);

    // Convert to blob and create URL
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve({
            id: `mock_${Date.now()}`,
            url,
            prompt: request.prompt,
            style: request.style,
            size: request.size,
            createdAt: new Date(),
            downloadUrl: url
          });
        }
      }, 'image/png');
    });
  }

  private convertSizeForDALLE(size: string): string {
    // DALL-E supports specific sizes
    const sizeMap: { [key: string]: string } = {
      '1080x1080': '1024x1024',
      '1200x630': '1792x1024',
      '800x600': '1024x1024',
      '1920x1080': '1792x1024'
    };
    return sizeMap[size] || '1024x1024';
  }

  private getBackgroundColor(style: string): string {
    const colors = {
      'professional': '#f8f9fa',
      'modern': '#ffffff',
      'minimalist': '#ffffff',
      'infographic': '#f1f3f4',
      'social-media': '#e3f2fd'
    };
    return colors[style as keyof typeof colors] || '#ffffff';
  }

  private getFontStyle(style: string, size: number): string {
    const baseSize = Math.max(20, size / 30);
    const fonts = {
      'professional': `${baseSize}px Arial, sans-serif`,
      'modern': `${baseSize}px 'Helvetica Neue', sans-serif`,
      'minimalist': `${baseSize}px 'Segoe UI', sans-serif`,
      'infographic': `bold ${baseSize}px Arial, sans-serif`,
      'social-media': `bold ${baseSize * 1.2}px Arial, sans-serif`
    };
    return fonts[style as keyof typeof fonts] || `${baseSize}px Arial, sans-serif`;
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private addStyleElements(ctx: CanvasRenderingContext2D, width: number, height: number, style: string) {
    switch (style) {
      case 'professional':
        // Add corner accent
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(width - 100, height - 100, 100, 100);
        break;
      case 'modern':
        // Add geometric shapes
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(width - 50, 50, 30, 0, 2 * Math.PI);
        ctx.fill();
        break;
      case 'infographic':
        // Add chart-like elements
        ctx.fillStyle = '#10b981';
        ctx.fillRect(50, height - 150, 20, 100);
        ctx.fillRect(80, height - 120, 20, 70);
        ctx.fillRect(110, height - 180, 20, 130);
        break;
    }
  }

  async generateTemplateVariations(basePrompt: string, count: number = 3): Promise<GeneratedImage[]> {
    const variations = [
      { style: 'professional' as const, theme: 'corporate finance' },
      { style: 'modern' as const, theme: 'digital accounting' },
      { style: 'infographic' as const, theme: 'data visualization' }
    ];

    const results: GeneratedImage[] = [];

    for (let i = 0; i < Math.min(count, variations.length); i++) {
      const variation = variations[i];
      const request: ImageGenerationRequest = {
        prompt: basePrompt,
        style: variation.style,
        size: '1080x1080',
        theme: variation.theme
      };

      try {
        const image = await this.generateImage(request);
        results.push(image);
      } catch (error) {
        console.error(`Failed to generate variation ${i}:`, error);
      }
    }

    return results;
  }

  generateCASpecificPrompts(topic: string, contentType: string): string[] {
    const prompts = {
      'tax-planning': [
        'Professional tax planning infographic with charts and calculator',
        'Modern tax optimization flowchart with corporate styling',
        'Clean tax compliance checklist design with checkmarks'
      ],
      'audit': [
        'Professional audit process workflow diagram',
        'Modern financial audit checklist with professional styling',
        'Clean audit report template design'
      ],
      'financial-advisory': [
        'Professional financial planning consultation illustration',
        'Modern investment advisory infographic with graphs',
        'Clean financial growth chart with upward trends'
      ],
      'compliance': [
        'Professional compliance framework diagram',
        'Modern regulatory compliance flowchart',
        'Clean compliance checklist with professional styling'
      ],
      'general': [
        `Professional ${topic} concept illustration for chartered accountants`,
        `Modern ${topic} infographic with business styling`,
        `Clean ${topic} visual for accounting professionals`
      ]
    };

    return prompts[contentType as keyof typeof prompts] || prompts.general;
  }

  async saveImage(image: GeneratedImage): Promise<boolean> {
    try {
      // Save to local storage or database
      const saved = JSON.parse(localStorage.getItem('generated_images') || '[]');
      saved.push({
        ...image,
        createdAt: image.createdAt.toISOString()
      });
      localStorage.setItem('generated_images', JSON.stringify(saved));
      return true;
    } catch (error) {
      console.error('Error saving image:', error);
      return false;
    }
  }

  async getSavedImages(): Promise<GeneratedImage[]> {
    try {
      const saved = JSON.parse(localStorage.getItem('generated_images') || '[]');
      return saved.map((img: any) => ({
        ...img,
        createdAt: new Date(img.createdAt)
      }));
    } catch (error) {
      console.error('Error loading saved images:', error);
      return [];
    }
  }

  async downloadImage(image: GeneratedImage): Promise<void> {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ca-image-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error downloading image:', error);
      throw new Error('Failed to download image');
    }
  }
}