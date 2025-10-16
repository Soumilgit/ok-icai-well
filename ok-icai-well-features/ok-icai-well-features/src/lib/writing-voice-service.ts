export interface WritingVoice {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  useCase: string;
  examples: string[];
}

export interface QuestionnaireQuestion {
  id: string;
  question: string;
  type: 'single-choice' | 'multiple-choice' | 'scale' | 'text';
  options?: string[];
  category: 'style' | 'tone' | 'audience' | 'content' | 'engagement';
  voiceMapping: { [key: string]: number }; // Maps answers to voice scores
}

export interface UserPreferences {
  writingVoice: WritingVoice;
  secondaryVoice?: WritingVoice;
  customizations: {
    formalityLevel: number; // 1-10 scale
    technicality: number; // 1-10 scale
    personalTouch: number; // 1-10 scale
    urgency: number; // 1-10 scale
    storytelling: number; // 1-10 scale
  };
  targetAudience: string[];
  contentPreferences: string[];
  complianceLevel: 'strict' | 'balanced' | 'relaxed';
}

export class WritingVoiceService {
  private writingVoices: WritingVoice[] = [
    {
      id: 'storyteller',
      name: 'Storyteller',
      description: 'Personal narratives and anecdotes with emotional connection',
      characteristics: [
        'Uses first-person perspective',
        'Builds narrative arcs',
        'Includes personal experiences',
        'Creates emotional connections',
        'Uses conversational tone'
      ],
      useCase: 'Perfect for sharing experiences, case studies, and building personal brand',
      examples: [
        'Personal CFO journey stories',
        'Client success narratives',
        'Professional growth experiences',
        'Industry observations with personal touch'
      ]
    },
    {
      id: 'opinionator',
      name: 'Opinionator',
      description: 'Strong viewpoints and thought leadership with contrarian takes',
      characteristics: [
        'Takes clear positions',
        'Challenges conventional wisdom',
        'Uses persuasive language',
        'Provides strong recommendations',
        'Shows confidence in viewpoints'
      ],
      useCase: 'Ideal for thought leadership, industry commentary, and establishing expertise',
      examples: [
        'Industry trend predictions',
        'Contrarian business advice',
        'Policy critique and recommendations',
        'Market analysis with strong opinions'
      ]
    },
    {
      id: 'fact-presenter',
      name: 'Fact Presenter',
      description: 'Objective information delivery with clear explanations',
      characteristics: [
        'Focuses on data and facts',
        'Uses neutral tone',
        'Provides step-by-step explanations',
        'Includes specific details',
        'Maintains professional distance'
      ],
      useCase: 'Best for educational content, compliance updates, and technical explanations',
      examples: [
        'Tax law explanations',
        'Compliance checklists',
        'Regulatory updates',
        'Technical how-to guides'
      ]
    },
    {
      id: 'f-bomber',
      name: 'F-Bomber',
      description: 'Urgent, direct communication with strong warnings',
      characteristics: [
        'Uses urgent language',
        'Highlights risks and consequences',
        'Direct and blunt communication',
        'Creates sense of immediacy',
        'Focuses on critical issues'
      ],
      useCase: 'Perfect for compliance warnings, urgent updates, and risk alerts',
      examples: [
        'Fraud alerts and warnings',
        'Compliance deadline reminders',
        'Risk exposure alerts',
        'Critical regulatory changes'
      ]
    },
    {
      id: 'frameworker',
      name: 'Frameworker',
      description: 'Structured guidance with actionable frameworks and templates',
      characteristics: [
        'Provides step-by-step processes',
        'Creates actionable frameworks',
        'Uses structured formats',
        'Offers practical tools',
        'Focuses on implementation'
      ],
      useCase: 'Excellent for how-to content, templates, and practical guidance',
      examples: [
        'Business process templates',
        'Audit checklists',
        'Strategic planning frameworks',
        'Implementation guides'
      ]
    }
  ];

  private questionnaire: QuestionnaireQuestion[] = [
    {
      id: 'q1',
      question: 'When sharing professional insights, I prefer to:',
      type: 'single-choice',
      category: 'style',
      options: [
        'Share personal experiences and stories',
        'Present facts and data objectively',
        'Give strong opinions and recommendations',
        'Provide step-by-step frameworks',
        'Highlight urgent issues and risks'
      ],
      voiceMapping: {
        'Share personal experiences and stories': 5,
        'Present facts and data objectively': 3,
        'Give strong opinions and recommendations': 2,
        'Provide step-by-step frameworks': 4,
        'Highlight urgent issues and risks': 5
      }
    },
    {
      id: 'q2',
      question: 'My target audience primarily consists of:',
      type: 'multiple-choice',
      category: 'audience',
      options: [
        'Fellow CAs and accounting professionals',
        'Business owners and entrepreneurs',
        'Corporate executives and CFOs',
        'Students and young professionals',
        'General public interested in finance'
      ],
      voiceMapping: {
        'Fellow CAs and accounting professionals': 2,
        'Business owners and entrepreneurs': 1,
        'Corporate executives and CFOs': 2,
        'Students and young professionals': 1,
        'General public interested in finance': 1
      }
    },
    {
      id: 'q3',
      question: 'When explaining complex concepts, I prefer to:',
      type: 'single-choice',
      category: 'content',
      options: [
        'Use analogies and relatable examples',
        'Break down into simple, factual steps',
        'Provide strong context and implications',
        'Create structured frameworks and templates',
        'Emphasize the risks of not understanding'
      ],
      voiceMapping: {
        'Use analogies and relatable examples': 1,
        'Break down into simple, factual steps': 3,
        'Provide strong context and implications': 2,
        'Create structured frameworks and templates': 4,
        'Emphasize the risks of not understanding': 5
      }
    },
    {
      id: 'q4',
      question: 'My communication style is typically:',
      type: 'single-choice',
      category: 'tone',
      options: [
        'Warm and conversational',
        'Professional and neutral',
        'Confident and assertive',
        'Structured and methodical',
        'Direct and urgent'
      ],
      voiceMapping: {
        'Warm and conversational': 1,
        'Professional and neutral': 3,
        'Confident and assertive': 2,
        'Structured and methodical': 4,
        'Direct and urgent': 5
      }
    },
    {
      id: 'q5',
      question: 'When discussing industry changes, I tend to:',
      type: 'single-choice',
      category: 'engagement',
      options: [
        'Share how it affected me personally',
        'Explain the facts and implications',
        'Give my strong opinion on the matter',
        'Provide a framework for adapting',
        'Warn about potential negative impacts'
      ],
      voiceMapping: {
        'Share how it affected me personally': 1,
        'Explain the facts and implications': 3,
        'Give my strong opinion on the matter': 2,
        'Provide a framework for adapting': 4,
        'Warn about potential negative impacts': 5
      }
    },
    {
      id: 'q6',
      question: 'Rate your preference for including personal anecdotes (1-10):',
      type: 'scale',
      category: 'style',
      voiceMapping: {} // Will be calculated based on scale
    },
    {
      id: 'q7',
      question: 'Rate your preference for providing actionable frameworks (1-10):',
      type: 'scale',
      category: 'content',
      voiceMapping: {} // Will be calculated based on scale
    },
    {
      id: 'q8',
      question: 'Which types of content do you most enjoy creating?',
      type: 'multiple-choice',
      category: 'content',
      options: [
        'Case studies and success stories',
        'Educational how-to guides',
        'Industry analysis and commentary',
        'Compliance and regulatory updates',
        'Risk warnings and alerts',
        'Templates and frameworks',
        'Personal professional journey'
      ],
      voiceMapping: {
        'Case studies and success stories': 1,
        'Educational how-to guides': 3,
        'Industry analysis and commentary': 2,
        'Compliance and regulatory updates': 3,
        'Risk warnings and alerts': 5,
        'Templates and frameworks': 4,
        'Personal professional journey': 1
      }
    },
    {
      id: 'q9',
      question: 'When giving advice, I prefer to:',
      type: 'single-choice',
      category: 'tone',
      options: [
        'Share what worked for me',
        'Present multiple options objectively',
        'Give clear, definitive recommendations',
        'Provide structured decision-making tools',
        'Emphasize what could go wrong'
      ],
      voiceMapping: {
        'Share what worked for me': 1,
        'Present multiple options objectively': 3,
        'Give clear, definitive recommendations': 2,
        'Provide structured decision-making tools': 4,
        'Emphasize what could go wrong': 5
      }
    },
    {
      id: 'q10',
      question: 'My ideal content engagement includes:',
      type: 'multiple-choice',
      category: 'engagement',
      options: [
        'Personal stories that resonate',
        'Clear information that educates',
        'Thought-provoking opinions',
        'Practical tools people can use',
        'Important warnings that protect people'
      ],
      voiceMapping: {
        'Personal stories that resonate': 1,
        'Clear information that educates': 3,
        'Thought-provoking opinions': 2,
        'Practical tools people can use': 4,
        'Important warnings that protect people': 5
      }
    }
  ];

  getQuestionnaire(): QuestionnaireQuestion[] {
    return this.questionnaire;
  }

  getWritingVoices(): WritingVoice[] {
    return this.writingVoices;
  }

  analyzeResponses(responses: { [questionId: string]: any }): UserPreferences {
    const voiceScores = {
      storyteller: 0,
      opinionator: 0,
      'fact-presenter': 0,
      'f-bomber': 0,
      frameworker: 0
    };

    // Calculate voice scores based on responses
    this.questionnaire.forEach(question => {
      const response = responses[question.id];
      if (!response) return;

      if (question.type === 'single-choice' && question.voiceMapping[response]) {
        const voiceIndex = question.voiceMapping[response];
        this.addScoreToVoice(voiceScores, voiceIndex, 2);
      } else if (question.type === 'multiple-choice' && Array.isArray(response)) {
        response.forEach(answer => {
          if (question.voiceMapping[answer]) {
            const voiceIndex = question.voiceMapping[answer];
            this.addScoreToVoice(voiceScores, voiceIndex, 1);
          }
        });
      } else if (question.type === 'scale') {
        const scaleValue = parseInt(response);
        if (question.id === 'q6') { // Personal anecdotes
          voiceScores.storyteller += scaleValue;
        } else if (question.id === 'q7') { // Frameworks
          voiceScores.frameworker += scaleValue;
        }
      }
    });

    // Determine primary and secondary voices
    const sortedVoices = Object.entries(voiceScores)
      .sort(([,a], [,b]) => b - a);
    
    const primaryVoiceId = sortedVoices[0][0];
    const secondaryVoiceId = sortedVoices[1][0];

    const primaryVoice = this.writingVoices.find(v => v.id === primaryVoiceId)!;
    const secondaryVoice = this.writingVoices.find(v => v.id === secondaryVoiceId);

    // Calculate customizations
    const customizations = this.calculateCustomizations(responses);

    return {
      writingVoice: primaryVoice,
      secondaryVoice,
      customizations,
      targetAudience: this.extractTargetAudience(responses),
      contentPreferences: this.extractContentPreferences(responses),
      complianceLevel: this.determineComplianceLevel(responses)
    };
  }

  private addScoreToVoice(scores: any, voiceIndex: number, points: number) {
    const voices = ['storyteller', 'opinionator', 'fact-presenter', 'f-bomber', 'frameworker'];
    if (voiceIndex >= 1 && voiceIndex <= 5) {
      scores[voices[voiceIndex - 1]] += points;
    }
  }

  private calculateCustomizations(responses: any) {
    return {
      formalityLevel: this.calculateFormalityLevel(responses),
      technicality: this.calculateTechnicalityLevel(responses),
      personalTouch: parseInt(responses.q6) || 5,
      urgency: this.calculateUrgencyLevel(responses),
      storytelling: parseInt(responses.q6) || 5
    };
  }

  private calculateFormalityLevel(responses: any): number {
    // Higher formality for fact-presenter, lower for storyteller
    if (responses.q4 === 'Professional and neutral') return 8;
    if (responses.q4 === 'Warm and conversational') return 3;
    if (responses.q4 === 'Confident and assertive') return 6;
    if (responses.q4 === 'Structured and methodical') return 7;
    if (responses.q4 === 'Direct and urgent') return 5;
    return 5;
  }

  private calculateTechnicalityLevel(responses: any): number {
    const audience = responses.q2;
    if (Array.isArray(audience)) {
      if (audience.includes('Fellow CAs and accounting professionals')) return 8;
      if (audience.includes('Corporate executives and CFOs')) return 7;
      if (audience.includes('General public interested in finance')) return 3;
    }
    return 5;
  }

  private calculateUrgencyLevel(responses: any): number {
    if (responses.q1 === 'Highlight urgent issues and risks') return 8;
    if (responses.q9 === 'Emphasize what could go wrong') return 7;
    return 4;
  }

  private extractTargetAudience(responses: any): string[] {
    return Array.isArray(responses.q2) ? responses.q2 : [responses.q2];
  }

  private extractContentPreferences(responses: any): string[] {
    return Array.isArray(responses.q8) ? responses.q8 : [responses.q8];
  }

  private determineComplianceLevel(responses: any): 'strict' | 'balanced' | 'relaxed' {
    const audience = responses.q2;
    if (Array.isArray(audience) && audience.includes('Fellow CAs and accounting professionals')) {
      return 'strict';
    }
    if (responses.q1 === 'Highlight urgent issues and risks') {
      return 'strict';
    }
    if (responses.q4 === 'Professional and neutral') {
      return 'balanced';
    }
    return 'balanced';
  }

  generatePersonalizedPrompt(preferences: UserPreferences, contentType: string, topic: string): string {
    const voice = preferences.writingVoice;
    const customizations = preferences.customizations;

    let prompt = `Write a ${contentType} about "${topic}" using the ${voice.name} writing voice.

VOICE CHARACTERISTICS:
${voice.characteristics.map(c => `- ${c}`).join('\n')}

CUSTOMIZATION SETTINGS:
- Formality Level: ${customizations.formalityLevel}/10 (1=very casual, 10=very formal)
- Technical Detail: ${customizations.technicality}/10 (1=simple language, 10=technical jargon)
- Personal Touch: ${customizations.personalTouch}/10 (1=impersonal, 10=very personal)
- Urgency: ${customizations.urgency}/10 (1=relaxed, 10=urgent)
- Storytelling: ${customizations.storytelling}/10 (1=factual, 10=narrative)

TARGET AUDIENCE: ${preferences.targetAudience.join(', ')}

COMPLIANCE LEVEL: ${preferences.complianceLevel}
${preferences.complianceLevel === 'strict' ? '- Ensure full ICAI compliance\n- Include necessary disclaimers\n- Use precise technical language' : ''}
${preferences.complianceLevel === 'balanced' ? '- Balance accessibility with accuracy\n- Include basic compliance considerations' : ''}
${preferences.complianceLevel === 'relaxed' ? '- Focus on readability and engagement\n- Basic professional standards' : ''}

CONTENT PREFERENCES: Focus on ${preferences.contentPreferences.join(', ')}

${voice.id === 'storyteller' ? 'Include personal anecdotes, use first-person perspective, create emotional connection.' : ''}
${voice.id === 'opinionator' ? 'Take a clear position, provide strong recommendations, challenge conventional thinking.' : ''}
${voice.id === 'fact-presenter' ? 'Focus on facts and data, maintain objectivity, provide clear explanations.' : ''}
${voice.id === 'f-bomber' ? 'Use urgent language, highlight risks and consequences, create sense of immediacy.' : ''}
${voice.id === 'frameworker' ? 'Provide structured guidance, include actionable steps, create practical frameworks.' : ''}

Write the content now:`;

    return prompt;
  }
}