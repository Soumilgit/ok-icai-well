import { PerplexityService } from './perplexity-service';
import { WritingVoiceService, UserPreferences } from './writing-voice-service';

export interface SwipeTemplate {
  id: number;
  voice: string;
  title: string;
  template: string;
  rationale: string;
  variables: string[];
  examples: string[];
}

export interface ContentRequest {
  topic: string;
  contentType: 'linkedin-post' | 'article' | 'case-study' | 'newsletter' | 'social-media';
  targetAudience: string[];
  keyPoints?: string[];
  tone?: 'professional' | 'casual' | 'urgent' | 'educational';
  length?: 'short' | 'medium' | 'long';
  includeHashtags?: boolean;
  includeCallToAction?: boolean;
}

export interface GeneratedContent {
  content: string;
  voice: string;
  template: SwipeTemplate;
  hashtags: string[];
  callToAction?: string;
  alternativeVersions: string[];
}

export class ContentGenerator {
  private perplexityService: PerplexityService;
  private writingVoiceService: WritingVoiceService;
  private swipeTemplates: SwipeTemplate[] = [];

  constructor() {
    this.perplexityService = new PerplexityService();
    this.writingVoiceService = new WritingVoiceService();
    this.initializeSwipeTemplates();
  }

  private initializeSwipeTemplates() {
    // Based on the attached swipe file data
    this.swipeTemplates = [
      {
        id: 1,
        voice: 'Storyteller',
        title: 'Personal CFO Journey',
        template: 'I remember when [situation]. As a [role], I learned that [lesson]. Here\'s what happened: [story details]. The key takeaway? [insight]. This taught me [broader principle].',
        rationale: 'Personal CFO anecdotes & lessons; first-person arc.',
        variables: ['situation', 'role', 'lesson', 'story details', 'insight', 'broader principle'],
        examples: ['Personal finance journey', 'Client success story', 'Professional growth experience']
      },
      {
        id: 2,
        voice: 'Opinionator',
        title: 'Industry Contrarian Take',
        template: 'Everyone says [common belief]. But I disagree. Here\'s why: [contrarian viewpoint]. The reality is [supporting argument]. What you should do instead: [actionable advice]. This approach will [predicted outcome].',
        rationale: 'Sharp industry take and prescriptive actions; contrarian tone.',
        variables: ['common belief', 'contrarian viewpoint', 'supporting argument', 'actionable advice', 'predicted outcome'],
        examples: ['Challenge conventional audit practices', 'Contrarian tax planning advice', 'Alternative business strategies']
      },
      {
        id: 3,
        voice: 'Fact Presenter',
        title: 'Regulatory Update Explainer',
        template: 'New regulation: [regulation name]. Effective date: [date]. Key changes: [list of changes]. Impact on [target audience]: [specific impacts]. Action required: [compliance steps]. Deadline: [deadline].',
        rationale: 'Data + policy explanation about regulations and compliance.',
        variables: ['regulation name', 'date', 'list of changes', 'target audience', 'specific impacts', 'compliance steps', 'deadline'],
        examples: ['GST updates', 'Income tax changes', 'ICAI notifications']
      },
      {
        id: 4,
        voice: 'F-Bomber',
        title: 'Urgent Compliance Warning',
        template: 'ALERT: [urgent issue] is happening RIGHT NOW. This affects [audience]. If you don\'t act by [deadline], you risk [consequences]. Here\'s what you MUST do: [immediate actions]. Don\'t ignore this - [final warning].',
        rationale: 'Blunt consumer call-out and urgent tone for critical issues.',
        variables: ['urgent issue', 'audience', 'deadline', 'consequences', 'immediate actions', 'final warning'],
        examples: ['Fraud alerts', 'Compliance deadlines', 'Risk exposures']
      },
      {
        id: 5,
        voice: 'Frameworker',
        title: 'Step-by-Step Process',
        template: 'How to [achieve goal]: Step 1: [action 1] Step 2: [action 2] Step 3: [action 3] Pro tip: [bonus advice] Result: [expected outcome] Save this framework for [future use case].',
        rationale: 'Prescriptive playbook with structured guidance.',
        variables: ['achieve goal', 'action 1', 'action 2', 'action 3', 'bonus advice', 'expected outcome', 'future use case'],
        examples: ['Audit checklists', 'Tax planning frameworks', 'Business process guides']
      },
      {
        id: 11,
        voice: 'Frameworker',
        title: 'Founder Finance Playbook',
        template: 'Founder finances in [time period]: 1. [Financial principle 1] - [explanation] 2. [Financial principle 2] - [explanation] 3. [Financial principle 3] - [explanation] Master these fundamentals to [benefit].',
        rationale: 'Prescriptive playbook for founder finances with step sequence.',
        variables: ['time period', 'Financial principle 1', 'explanation', 'Financial principle 2', 'Financial principle 3', 'benefit'],
        examples: ['Startup financial management', 'Cash flow optimization', 'Investment strategies']
      },
      {
        id: 19,
        voice: 'Frameworker',
        title: 'Financial Decision Framework',
        template: 'The [Rule Name]: [Rule explanation]. How it works: [mechanism]. Example: [practical example]. Use this when: [application scenarios]. Result: [expected outcome].',
        rationale: 'Finance rule presented as decision framework.',
        variables: ['Rule Name', 'Rule explanation', 'mechanism', 'practical example', 'application scenarios', 'expected outcome'],
        examples: ['Rule of 72', 'Debt-to-equity ratios', 'ROI calculations']
      },
      {
        id: 31,
        voice: 'Frameworker',
        title: 'Viral Action Template',
        template: 'Want to [desired outcome]? Here\'s how: ✅ [Action 1] ✅ [Action 2] ✅ [Action 3] ✅ [Action 4] Follow this blueprint and you\'ll [result] in [timeframe].',
        rationale: 'Viral template: achievable actions → results.',
        variables: ['desired outcome', 'Action 1', 'Action 2', 'Action 3', 'Action 4', 'result', 'timeframe'],
        examples: ['Business growth strategies', 'Compliance checklists', 'Performance improvements']
      },
      {
        id: 35,
        voice: 'Storyteller',
        title: 'Once Upon a Time Narrative',
        template: 'Once upon a time, [initial situation]. Then [challenge occurred]. I thought [initial reaction]. But then [turning point]. The lesson? [key insight]. Now I [current state/action].',
        rationale: 'Narrative structure for sharing lessons.',
        variables: ['initial situation', 'challenge occurred', 'initial reaction', 'turning point', 'key insight', 'current state/action'],
        examples: ['Career transitions', 'Client challenges', 'Industry changes']
      },
      {
        id: 47,
        voice: 'Fact Presenter',
        title: 'Breaking News Analysis',
        template: 'BREAKING: [recent event] revealed [new information]. Here\'s what you need to know: • [Key point 1] • [Key point 2] • [Key point 3] Impact: [implications]. What this means for [audience]: [specific relevance].',
        rationale: 'Startling fact → research → implications.',
        variables: ['recent event', 'new information', 'Key point 1', 'Key point 2', 'Key point 3', 'implications', 'audience', 'specific relevance'],
        examples: ['Regulatory announcements', 'Market developments', 'Industry updates']
      }
    ];
  }

  async generateContent(request: ContentRequest, userPreferences: UserPreferences): Promise<GeneratedContent> {
    try {
      // Select appropriate template based on user's voice preference
      const template = this.selectTemplate(userPreferences.writingVoice.id, request.contentType);
      
      // Generate personalized prompt
      const prompt = this.buildGenerationPrompt(request, userPreferences, template);
      
      // Generate content using Perplexity
      const response = await this.perplexityService.generateContent(prompt);
      
      const content = response.choices[0]?.message.content || '';
      
      // Generate hashtags if requested
      const hashtags = request.includeHashtags ? await this.generateHashtags(request.topic, request.targetAudience) : [];
      
      // Generate call to action if requested
      const callToAction = request.includeCallToAction ? await this.generateCallToAction(request.contentType, request.topic) : undefined;
      
      // Generate alternative versions
      const alternativeVersions = await this.generateAlternativeVersions(content, userPreferences, 2);
      
      return {
        content,
        voice: userPreferences.writingVoice.name,
        template,
        hashtags,
        callToAction,
        alternativeVersions
      };
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate content');
    }
  }

  private selectTemplate(voiceId: string, contentType: string): SwipeTemplate {
    const voiceTemplates = this.swipeTemplates.filter(t => t.voice.toLowerCase() === voiceId);
    
    if (voiceTemplates.length === 0) {
      // Fallback to first template of the voice
      return this.swipeTemplates.find(t => t.voice.toLowerCase().includes(voiceId)) || this.swipeTemplates[0];
    }
    
    // Select template based on content type
    if (contentType === 'linkedin-post') {
      return voiceTemplates.find(t => t.id === 31) || voiceTemplates[0]; // Viral template for LinkedIn
    } else if (contentType === 'case-study') {
      return voiceTemplates.find(t => t.id === 35) || voiceTemplates[0]; // Narrative template
    } else if (contentType === 'article') {
      return voiceTemplates.find(t => t.id === 47) || voiceTemplates[0]; // Analysis template
    }
    
    return voiceTemplates[0];
  }

  private buildGenerationPrompt(request: ContentRequest, preferences: UserPreferences, template: SwipeTemplate): string {
    const basePrompt = this.writingVoiceService.generatePersonalizedPrompt(
      preferences,
      request.contentType,
      request.topic
    );

    const templatePrompt = `
USE THIS TEMPLATE STRUCTURE:
${template.template}

TEMPLATE VARIABLES TO FILL:
${template.variables.map(v => `- ${v}: [Relevant content for ${request.topic}]`).join('\n')}

CONTENT REQUIREMENTS:
- Topic: ${request.topic}
- Content Type: ${request.contentType}
- Target Audience: ${request.targetAudience.join(', ')}
- Length: ${request.length || 'medium'}
- Tone: ${request.tone || 'professional'}

${request.keyPoints ? `KEY POINTS TO INCLUDE:\n${request.keyPoints.map(p => `- ${p}`).join('\n')}` : ''}

EXAMPLE APPLICATIONS:
${template.examples.map(e => `- ${e}`).join('\n')}

${basePrompt}

Follow the template structure but adapt the content naturally. Don't use placeholder brackets in the final output.
`;

    return templatePrompt;
  }

  private async generateHashtags(topic: string, audience: string[]): Promise<string[]> {
    const prompt = `Generate 5-8 relevant hashtags for a post about "${topic}" targeting ${audience.join(', ')}. 
    Include a mix of:
    - Industry-specific hashtags (CA, accounting, audit, tax)
    - Topic-specific hashtags
    - Audience-specific hashtags
    - 1-2 broader business hashtags
    
    Return only the hashtags, one per line, with # symbol.`;

    try {
      const response = await this.perplexityService.askQuestion(prompt);
      const hashtagText = response.choices[0]?.message.content || '';
      
      return hashtagText
        .split('\n')
        .filter(line => line.trim().startsWith('#'))
        .map(line => line.trim())
        .slice(0, 8);
    } catch (error) {
      console.error('Error generating hashtags:', error);
      return ['#CA', '#CharteredAccountant', '#Accounting', '#BusinessAdvice'];
    }
  }

  private async generateCallToAction(contentType: string, topic: string): Promise<string> {
    const prompt = `Generate an engaging call-to-action for a ${contentType} about "${topic}".
    
    The CTA should:
    - Be relevant to CA/accounting services
    - Encourage engagement (comments, shares, connections)
    - Be professional but approachable
    - Be 1-2 sentences maximum
    
    Examples:
    - "What's your experience with [topic]? Share in the comments below."
    - "Found this helpful? Follow for more [topic] insights."
    - "Questions about [topic]? DM me for a consultation."
    
    Return only the CTA text.`;

    try {
      const response = await this.perplexityService.askQuestion(prompt);
      return response.choices[0]?.message.content.trim() || 'What are your thoughts on this? Share below!';
    } catch (error) {
      console.error('Error generating CTA:', error);
      return 'What are your thoughts on this? Share below!';
    }
  }

  private async generateAlternativeVersions(originalContent: string, preferences: UserPreferences, count: number): Promise<string[]> {
    const alternatives: string[] = [];
    
    try {
      for (let i = 0; i < count; i++) {
        const variation = i === 0 ? 'shorter and more direct' : 'longer and more detailed';
        
        const prompt = `Rewrite this content to be ${variation} while maintaining the same ${preferences.writingVoice.name} voice:

Original content:
${originalContent}

Keep the same key points but adjust the length and style. Maintain the voice characteristics:
${preferences.writingVoice.characteristics.join(', ')}`;

        const response = await this.perplexityService.askQuestion(prompt);
        alternatives.push(response.choices[0]?.message.content || '');
      }
    } catch (error) {
      console.error('Error generating alternatives:', error);
    }
    
    return alternatives;
  }

  async repurposeContent(originalContent: string, fromFormat: string, toFormat: string, preferences: UserPreferences): Promise<string> {
    const prompt = `Repurpose this ${fromFormat} into a ${toFormat} while maintaining the ${preferences.writingVoice.name} voice:

Original ${fromFormat}:
${originalContent}

Requirements for ${toFormat}:
${this.getFormatRequirements(toFormat)}

Voice characteristics to maintain:
${preferences.writingVoice.characteristics.join(', ')}

Adapt the content appropriately for the new format while keeping the core message and voice.`;

    try {
      const response = await this.perplexityService.askQuestion(prompt);
      return response.choices[0]?.message.content || '';
    } catch (error) {
      console.error('Error repurposing content:', error);
      throw new Error('Failed to repurpose content');
    }
  }

  private getFormatRequirements(format: string): string {
    const requirements = {
      'linkedin-post': '- 1-3 paragraphs\n- Professional tone\n- Include relevant hashtags\n- Encourage engagement',
      'twitter-thread': '- Break into 280-character tweets\n- Use thread numbering\n- Include key points in each tweet',
      'instagram-caption': '- Engaging first line\n- Use line breaks for readability\n- Include relevant hashtags\n- Call to action',
      'newsletter': '- Professional structure\n- Clear sections\n- Actionable insights\n- Email-friendly formatting',
      'blog-post': '- Clear headings\n- Introduction and conclusion\n- Detailed explanations\n- SEO-friendly structure',
      'case-study': '- Problem/Solution/Results structure\n- Specific metrics\n- Client perspective\n- Lessons learned'
    };

    return requirements[format] || 'Follow best practices for the format';
  }

  getSwipeTemplates(): SwipeTemplate[] {
    return this.swipeTemplates;
  }

  getTemplatesByVoice(voiceId: string): SwipeTemplate[] {
    return this.swipeTemplates.filter(t => t.voice.toLowerCase() === voiceId.toLowerCase());
  }
}