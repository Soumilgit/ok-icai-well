import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const caseStudyData = await request.json();
    
    // Get API key from environment variables (server-side)
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Use the correct model parameter
    const model = 'gemini-2.5-flash-lite';
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // Create the comprehensive prompt
    const prompt = createCaseStudyPrompt(caseStudyData);
    
    console.log('🚀 Calling Gemini API with model:', model);
    
    const response = await fetch(`${baseUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, response.statusText, errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Invalid response structure from Gemini API:', data);
      throw new Error('Invalid response from Gemini API');
    }

    const generatedContent = data.candidates[0].content.parts[0].text;
    console.log('✅ Case study generated successfully');
    
    return NextResponse.json({ 
      content: generatedContent,
      success: true 
    });

  } catch (error) {
    console.error('❌ Gemini case study generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate case study', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

function createCaseStudyPrompt(caseStudyData: any): string {
  const clientName = caseStudyData.client.anonymize 
    ? `[Anonymous ${caseStudyData.client.industry} Company]` 
    : caseStudyData.client.name;

  const promptElements = [
    "You are an expert business case study writer. Create a comprehensive, professional case study that demonstrates clear value and expertise.",
    "",
    "# Case Study Generation Request",
    "",
    `**Title:** ${caseStudyData.title}`,
    "",
    "## 1. CLIENT BACKGROUND",
    `- **Company:** ${clientName}`,
    `- **Industry:** ${caseStudyData.client.industry}`,
    `- **Company Size:** ${caseStudyData.client.size}`,
    `- **Location:** ${caseStudyData.client.location}`,
    "",
    "## 2. CHALLENGE ANALYSIS",
    `- **Primary Challenge:** ${caseStudyData.challenge.description}`,
    `- **Business Impact:** ${caseStudyData.challenge.impact}`,
    `- **Urgency Level:** ${caseStudyData.challenge.urgency}`,
    `- **Challenge Category:** ${caseStudyData.challenge.category}`,
    "",
    "## 3. SOLUTION APPROACH",
    `- **Strategy:** ${caseStudyData.solution.approach}`,
    `- **Timeline:** ${caseStudyData.solution.timeline}`,
    "",
    "### Implementation Steps:",
    ...caseStudyData.solution.steps
      .filter((s: string) => s.trim())
      .map((step: string, i: number) => `${i + 1}. ${step}`),
    "",
    "### Resources Utilized:",
    ...caseStudyData.solution.resources
      .filter((r: string) => r.trim())
      .map((resource: string) => `- ${resource}`),
    "",
    "## 4. MEASURABLE RESULTS",
    "",
    "### Quantitative Outcomes:",
    ...caseStudyData.results.metrics
      .filter((m: any) => m.metric.trim())
      .map((metric: any) => `- **${metric.metric}:** ${metric.before} → ${metric.after} (${metric.improvement})`),
    "",
    "### Qualitative Benefits:",
    ...caseStudyData.results.qualitativeResults
      .filter((r: string) => r.trim())
      .map((result: string) => `- ${result}`),
    "",
    `### Client Testimonial:`,
    `"${caseStudyData.results.clientFeedback}"`,
    "",
    "## 5. TARGET AUDIENCE CONSIDERATIONS",
    `**Primary Audience:** ${caseStudyData.targetAudience.join(', ')}`,
    "",
    "## 6. KEY TAKEAWAYS & INSIGHTS",
    ...caseStudyData.keyTakeaways
      .filter((t: string) => t.trim())
      .map((takeaway: string) => `- ${takeaway}`),
    "",
    "---",
    "",
    "**WRITING REQUIREMENTS:**",
    "- Create a compelling narrative that flows naturally from challenge to solution to results",
    "- Use professional business language appropriate for the target audience",
    "- Include specific data points and metrics to demonstrate credibility",
    "- Structure with clear headings and subheadings for easy readability",
    "- Emphasize the unique value proposition and expertise demonstrated",
    "- Include actionable insights that readers can apply to their own situations",
    "- Maintain a confident, professional tone throughout",
    "- Ensure the case study is approximately 800-1200 words",
    "",
    "Generate a complete, professional case study based on this information:"
  ];

  return promptElements.join('\n');
}