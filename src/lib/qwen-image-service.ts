import { InferenceClient } from "@huggingface/inference";

// Using both direct fetch API and InferenceClient for maximum compatibility

export interface QwenImageRequest {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  numInferenceSteps?: number;
  trueCfgScale?: number;
  seed?: number;
  language?: 'en' | 'zh';
}

export interface QwenImageResponse {
  id: string;
  url: string;
  prompt: string;
  width: number;
  height: number;
  createdAt: Date;
  downloadUrl?: string;
}

export class QwenImageService {
  private primaryModel = 'stabilityai/stable-diffusion-xl-base-1.0';
  private fallbackModel = 'runwayml/stable-diffusion-v1-5';
  private isConnected: boolean = false;
  private apiKey: string | null = null;
  private inferenceClient: InferenceClient | null = null;

  // Qwen-Image supported aspect ratios
  public static readonly ASPECT_RATIOS = {
    '1:1': { width: 1328, height: 1328 },
    '16:9': { width: 1664, height: 928 },
    '9:16': { width: 928, height: 1664 },
    '4:3': { width: 1472, height: 1140 },
    '3:4': { width: 1140, height: 1472 },
    '3:2': { width: 1584, height: 1056 },
    '2:3': { width: 1056, height: 1584 }
  } as const;

  // Magic prompts for better results
  private static readonly MAGIC_PROMPTS = {
    en: ', Ultra HD, 4K, cinematic composition.',
    zh: ', 超清，4K，电影级构图.'
  };

  constructor() {
    // Try both possible environment variable names
    const apiKey = process.env.HUGGING_FACE_API_KEY || process.env.HF_TOKEN;
    if (!apiKey) {
      console.warn('⚠️ HUGGING_FACE_API_KEY or HF_TOKEN not found in environment variables');
      this.isConnected = false;
      return;
    }

    this.apiKey = apiKey;
    this.isConnected = true;
    
    // Initialize InferenceClient as backup
    try {
      this.inferenceClient = new InferenceClient(apiKey);
    } catch (error) {
      console.warn('⚠️ Failed to initialize InferenceClient:', error);
    }
    
    console.log('✅ Image generation service initialized with Hugging Face API (Stable Diffusion XL + SD v1.5 fallback)');
  }

  /**
   * Generate image using Stable Diffusion XL with SD v1.5 fallback
   */
  async generateImage(request: QwenImageRequest): Promise<QwenImageResponse> {
    if (!this.isConnected) {
      throw new Error('Image generation service not connected. Please check HUGGING_FACE_API_KEY.');
    }

    // Try Stable Diffusion XL first
    try {
      return await this.generateWithModel(this.primaryModel, request, 'Stable Diffusion XL');
    } catch (sdxlError) {
      console.warn('⚠️ Stable Diffusion XL failed, trying SD v1.5 fallback:', sdxlError);
      
      // Fallback to SD v1.5
      try {
        return await this.generateWithModel(this.fallbackModel, request, 'SD v1.5');
      } catch (sdError) {
        console.error('❌ Both models failed:', { sdxlError, sdError });
        throw new Error(`Failed to generate image with both Stable Diffusion XL and SD v1.5: ${sdError instanceof Error ? sdError.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Generate image with a specific model
   */
  private async generateWithModel(modelName: string, request: QwenImageRequest, modelType: string): Promise<QwenImageResponse> {
    // Enhance prompt with magic prompt based on language
    const language = request.language || this.detectLanguage(request.prompt);
    const magicPrompt = QwenImageService.MAGIC_PROMPTS[language];
    const enhancedPrompt = request.prompt + magicPrompt;

    console.log(`🎨 Generating image with ${modelType}:`, {
      model: modelName,
      prompt: request.prompt,
      enhancedPrompt,
      language,
      dimensions: `${request.width}x${request.height}`
    });

    const apiKey = this.apiKey;
    let response: Response;

    // Use standard Hugging Face API for both HunyuanImage-3.0 and DeepSeek
    response = await fetch(
      `https://api-inference.huggingface.co/models/${modelName}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: enhancedPrompt,
          parameters: {
            negative_prompt: request.negativePrompt || 'blurry, low quality, distorted',
            width: request.width,
            height: request.height,
            num_inference_steps: request.numInferenceSteps || 20,
            guidance_scale: 7.5
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${modelType} API error: ${response.status} - ${errorText}`);
    }

    // Convert response to blob and then to data URL
    const blob = await response.blob();
    const imageUrl = await this.blobToDataUrl(blob);

    const result: QwenImageResponse = {
      id: `${modelType.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: imageUrl,
      prompt: request.prompt,
      width: request.width,
      height: request.height,
      createdAt: new Date(),
      downloadUrl: imageUrl
    };

    console.log(`✅ ${modelType} generation successful:`, result.id);
    return result;
  }

  /**
   * Generate multiple variations of an image
   */
  async generateVariations(
    basePrompt: string, 
    count: number = 3, 
    aspectRatio: keyof typeof QwenImageService.ASPECT_RATIOS = '1:1',
    language: 'en' | 'zh' = 'en'
  ): Promise<QwenImageResponse[]> {
    const { width, height } = QwenImageService.ASPECT_RATIOS[aspectRatio];
    const variations: QwenImageResponse[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const request: QwenImageRequest = {
          prompt: basePrompt,
          width,
          height,
          language,
          seed: Math.floor(Math.random() * 1000000) // Different seed for each variation
        };

        const image = await this.generateImage(request);
        variations.push(image);
      } catch (error) {
        console.error(`Failed to generate variation ${i + 1}:`, error);
      }
    }

    return variations;
  }

  /**
   * Generate CA-specific professional images with fallback
   */
  async generateCAImage(
    prompt: string,
    style: 'professional' | 'modern' | 'minimalist' | 'infographic' | 'social-media',
    aspectRatio: keyof typeof QwenImageService.ASPECT_RATIOS = '1:1',
    theme: string = 'accounting and finance'
  ): Promise<QwenImageResponse> {
    if (!this.isConnected) {
      throw new Error('Image generation service not connected. Please check HUGGING_FACE_API_KEY.');
    }

    console.log('🎨 Generating CA-specific image with Stable Diffusion XL:', { prompt, style, aspectRatio, theme });
    
    // Enhance prompt for CA context
    const caEnhancedPrompt = this.enhancePromptForCA(prompt, style, theme);
    
    const { width, height } = QwenImageService.ASPECT_RATIOS[aspectRatio];
    
    // Try Stable Diffusion XL first, then fallback to SD v1.5
    try {
      return await this.generateWithModel(this.primaryModel, {
        prompt: caEnhancedPrompt,
        width,
        height,
        language: 'en'
      }, 'Stable Diffusion XL');
    } catch (sdxlError) {
      console.warn('⚠️ Stable Diffusion XL failed for CA image, trying SD v1.5 fallback:', sdxlError);
      
      try {
        return await this.generateWithModel(this.fallbackModel, {
          prompt: caEnhancedPrompt,
          width,
          height,
          language: 'en'
        }, 'SD v1.5');
      } catch (sdError) {
        console.error('❌ Both models failed for CA image:', { sdxlError, sdError });
        throw new Error(`Failed to generate CA image with both Stable Diffusion XL and SD v1.5: ${sdError instanceof Error ? sdError.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Detect language from prompt
   */
  private detectLanguage(prompt: string): 'en' | 'zh' {
    // Simple detection based on character types
    const chineseChars = /[\u4e00-\u9fff]/;
    return chineseChars.test(prompt) ? 'zh' : 'en';
  }

  /**
   * Enhance prompt for CA/accounting context
   */
  private enhancePromptForCA(originalPrompt: string, style: string, theme: string): string {
    const styleDescriptions = {
      'professional': 'clean, corporate, business-appropriate, professional photography style',
      'modern': 'contemporary, sleek, minimalist design, modern business aesthetic',
      'minimalist': 'simple, clean lines, plenty of white space, minimalist design',
      'infographic': 'data visualization, charts, graphs, informative, professional infographic style',
      'social-media': 'engaging, eye-catching, social platform optimized, vibrant colors'
    };

    const enhancedPrompt = `
${originalPrompt}

Style: ${styleDescriptions[style as keyof typeof styleDescriptions]}
Context: Professional accounting and finance
Theme: ${theme}
Requirements: Professional, trustworthy, suitable for chartered accountant content
Colors: Corporate blues, grays, whites with professional accent colors
Typography: Clean, readable, professional fonts
High quality, sharp, suitable for social media and professional use
No people faces, focus on concepts, data, and professional imagery
`.trim();

    return enhancedPrompt;
  }

  /**
   * Convert Blob to data URL (Node.js compatible)
   */
  private async blobToDataUrl(blob: Blob): Promise<string> {
    // Convert blob to buffer for Node.js environment
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = blob.type || 'image/png';
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; error?: string }> {
    try {
      if (!this.isConnected) {
        return { status: 'unhealthy', error: 'Service not connected' };
      }

      // Test with a simple generation
      await this.generateImage({
        prompt: 'test',
        width: 512,
        height: 512
      });

      return { status: 'healthy' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get available aspect ratios
   */
  static getAspectRatios(): typeof QwenImageService.ASPECT_RATIOS {
    return QwenImageService.ASPECT_RATIOS;
  }

  /**
   * Convert size string to Qwen dimensions
   */
  static convertSizeToQwenDimensions(size: string): { width: number; height: number } | null {
    const sizeMap: { [key: string]: keyof typeof QwenImageService.ASPECT_RATIOS } = {
      '1080x1080': '1:1',
      '1200x630': '16:9',
      '800x600': '4:3',
      '1920x1080': '16:9'
    };

    const aspectRatio = sizeMap[size];
    if (!aspectRatio) return null;

    return QwenImageService.ASPECT_RATIOS[aspectRatio];
  }
}

// Singleton instance
export const qwenImageService = new QwenImageService();
