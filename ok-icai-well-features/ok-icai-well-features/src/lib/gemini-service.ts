export class GeminiService {
  constructor() {
    console.log('🔧 Gemini Service initialized - using server-side API route');
  }

  async generateCaseStudy(caseStudyData: any): Promise<string> {
    try {
      console.log('🚀 Calling Gemini API via server route...');
      
      const response = await fetch('/api/gemini/case-study', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseStudyData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.content) {
        throw new Error('Invalid response from Gemini API service');
      }

      console.log('✅ Case study generated successfully via Gemini API');
      return data.content;
      
    } catch (error) {
      console.error('❌ Gemini service error:', error);
      throw error;
    }
  }


}