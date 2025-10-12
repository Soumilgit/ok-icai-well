// Voice patterns from the swipe file
export type VoiceType = 'Storyteller' | 'Opinionator' | 'Fact Presenter' | 'F-Bomber' | 'Frameworker';

export interface VoicePattern {
  type: VoiceType;
  description: string;
  characteristics: string[];
  examples: string[];
  restrictions?: string[]; // Special restrictions for CA compliance
}

export const VOICE_PATTERNS: Record<VoiceType, VoicePattern> = {
  'Storyteller': {
    type: 'Storyteller',
    description: 'Personal narratives, anecdotes, and journey-based content',
    characteristics: [
      'First-person perspective',
      'Narrative arc with beginning, middle, end',
      'Personal experiences and lessons learned',
      'Emotional connection and relatability',
      'Timeline-based structure'
    ],
    examples: [
      'When I first started as a CA...',
      'Here\'s what happened when my client...',
      'Let me share a story about...'
    ]
  },
  'Opinionator': {
    type: 'Opinionator',
    description: 'Strong viewpoints, industry takes, and prescriptive advice',
    characteristics: [
      'Clear stance on industry issues',
      'Contrarian perspectives',
      'Advocacy for specific approaches',
      'Bold statements with backing',
      'Call-to-action oriented'
    ],
    examples: [
      'The biggest mistake I see CAs making is...',
      'Here\'s my controversial take on...',
      'Most professionals get this wrong...'
    ],
    restrictions: [
      'Must maintain ICAI professional standards',
      'Avoid defamatory statements',
      'Present balanced views when discussing regulations'
    ]
  },
  'Fact Presenter': {
    type: 'Fact Presenter',
    description: 'Data-driven, informational, and educational content',
    characteristics: [
      'Objective presentation of information',
      'Data and statistics focus',
      'Step-by-step explanations',
      'Reference to regulations and rules',
      'Educational tone'
    ],
    examples: [
      'Here are the key changes in GST...',
      'According to the latest ICAI guidelines...',
      '5 important tax deadlines you need to know...'
    ]
  },
  'F-Bomber': {
    type: 'F-Bomber',
    description: 'Urgent, direct, and hard-hitting content (modified for CA compliance)',
    characteristics: [
      'Urgent tone and messaging',
      'Direct communication style',
      'Warning about critical issues',
      'Time-sensitive information',
      'No-nonsense approach'
    ],
    examples: [
      'URGENT: New compliance deadline approaches...',
      'This mistake could cost you dearly...',
      'Warning: Don\'t ignore this regulation...'
    ],
    restrictions: [
      'NO profanity or unprofessional language',
      'Maintain professional dignity',
      'Use urgency appropriately, not as manipulation',
      'Focus on genuine warnings, not fear-mongering'
    ]
  },
  'Frameworker': {
    type: 'Frameworker',
    description: 'Structured, systematic, and actionable content',
    characteristics: [
      'Step-by-step frameworks',
      'Systematic approaches',
      'Actionable templates',
      'Process-oriented thinking',
      'Practical implementation focus'
    ],
    examples: [
      'Here\'s my 5-step framework for...',
      'Follow this process to ensure...',
      'Use this template for...'
    ]
  }
};

export interface UserPreferences {
  primaryVoice: VoiceType;
  secondaryVoice?: VoiceType;
  industryFocus: ('taxation' | 'auditing' | 'advisory' | 'compliance' | 'general')[];
  contentStyle: 'professional' | 'educational' | 'thought-leadership' | 'practical';
  targetAudience: ('fellow-cas' | 'businesses' | 'students' | 'general-public')[];
  topics: string[];
  avoidTopics: string[];
  personalBrand: {
    expertise: string[];
    experience: string;
    location?: string;
    specializations: string[];
  };
}

export interface QuizResponse {
  questionId: string;
  question: string;
  answer: string;
  weight: number; // How much this influences content generation
}

export interface UserProfile {
  id: string;
  preferences: UserPreferences;
  quizResponses: QuizResponse[];
  generatedContent: {
    postId: string;
    content: string;
    voice: VoiceType;
    engagement?: {
      likes: number;
      shares: number;
      comments: number;
    };
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// Voice mapping from swipe file data
export interface SwipeVoiceMap {
  post_number: number;
  voice: VoiceType;
  rationale: string;
}

export const SWIPE_VOICE_MAPPINGS: SwipeVoiceMap[] = [
  { post_number: 1, voice: 'Storyteller', rationale: 'Personal CFO anecdotes & lessons; first-person arc.' },
  { post_number: 2, voice: 'Opinionator', rationale: 'Sharp industry take and prescriptive actions; contrarian tone.' },
  { post_number: 3, voice: 'Opinionator', rationale: 'Advocacy + viewpoint on allocations and equity (opinionated).' },
  { post_number: 4, voice: 'Fact Presenter', rationale: 'Data + policy explanation about GST on basic food items.' },
  { post_number: 5, voice: 'F-Bomber', rationale: 'Blunt consumer call-out and urgent tone (watch out, this hurts people).' },
  { post_number: 6, voice: 'Fact Presenter', rationale: 'Factual ITAT case summary and legal takeaway.' },
  { post_number: 7, voice: 'Storyteller', rationale: 'Personal relocation story with step-by-step narrative.' },
  { post_number: 8, voice: 'Fact Presenter', rationale: 'Tax-optimization how-to with mechanics and numbers.' },
  { post_number: 9, voice: 'F-Bomber', rationale: 'Urgent fraud expose + stark penalties (alarmist, blunt).' },
  { post_number: 10, voice: 'Storyteller', rationale: 'Relatable anecdote about CA expectations at family functions.' },
  // Add more mappings as needed
];

export class RAGCacheService {
  private static instance: RAGCacheService;
  private userProfiles: Map<string, UserProfile> = new Map();
  private voiceMappings: SwipeVoiceMap[] = SWIPE_VOICE_MAPPINGS;
  private contentMemory: Map<string, any> = new Map();

  static getInstance(): RAGCacheService {
    if (!RAGCacheService.instance) {
      RAGCacheService.instance = new RAGCacheService();
    }
    return RAGCacheService.instance;
  }

  // Store user quiz responses and build preference profile
  updateUserProfile(userId: string, quizResponses: QuizResponse[]): UserProfile {
    const existingProfile = this.userProfiles.get(userId);
    const preferences = this.derivePreferencesFromQuiz(quizResponses);
    
    const profile: UserProfile = {
      id: userId,
      preferences,
      quizResponses,
      generatedContent: existingProfile?.generatedContent || [],
      createdAt: existingProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.userProfiles.set(userId, profile);
    return profile;
  }

  // Derive preferences from quiz responses
  private derivePreferencesFromQuiz(responses: QuizResponse[]): UserPreferences {
    // Analyze responses to determine voice preference
    const voiceScores: Record<VoiceType, number> = {
      'Storyteller': 0,
      'Opinionator': 0,
      'Fact Presenter': 0,
      'F-Bomber': 0,
      'Frameworker': 0
    };

    responses.forEach(response => {
      const answerLower = response.answer.toLowerCase();
      
      // Score based on answer patterns
      if (answerLower.includes('story') || answerLower.includes('experience') || answerLower.includes('journey')) {
        voiceScores['Storyteller'] += response.weight;
      }
      if (answerLower.includes('opinion') || answerLower.includes('believe') || answerLower.includes('think')) {
        voiceScores['Opinionator'] += response.weight;
      }
      if (answerLower.includes('fact') || answerLower.includes('data') || answerLower.includes('information')) {
        voiceScores['Fact Presenter'] += response.weight;
      }
      if (answerLower.includes('urgent') || answerLower.includes('important') || answerLower.includes('critical')) {
        voiceScores['F-Bomber'] += response.weight;
      }
      if (answerLower.includes('step') || answerLower.includes('process') || answerLower.includes('framework')) {
        voiceScores['Frameworker'] += response.weight;
      }
    });

    const primaryVoice = Object.keys(voiceScores).reduce((a, b) => 
      voiceScores[a as VoiceType] > voiceScores[b as VoiceType] ? a : b
    ) as VoiceType;

    // Extract other preferences from responses
    const industryFocus = this.extractIndustryFocus(responses);
    const targetAudience = this.extractTargetAudience(responses);
    const topics = this.extractTopics(responses);

    return {
      primaryVoice,
      industryFocus,
      contentStyle: 'professional', // Default, can be refined
      targetAudience,
      topics,
      avoidTopics: [],
      personalBrand: {
        expertise: this.extractExpertise(responses),
        experience: this.extractExperience(responses),
        specializations: this.extractSpecializations(responses)
      }
    };
  }

  private extractIndustryFocus(responses: QuizResponse[]): ('taxation' | 'auditing' | 'advisory' | 'compliance' | 'general')[] {
    const focus: ('taxation' | 'auditing' | 'advisory' | 'compliance' | 'general')[] = [];
    const combined = responses.map(r => r.answer.toLowerCase()).join(' ');
    
    if (combined.includes('tax') || combined.includes('gst')) focus.push('taxation');
    if (combined.includes('audit')) focus.push('auditing');
    if (combined.includes('advisory') || combined.includes('consulting')) focus.push('advisory');
    if (combined.includes('compliance') || combined.includes('regulation')) focus.push('compliance');
    
    return focus.length > 0 ? focus : ['general'];
  }

  private extractTargetAudience(responses: QuizResponse[]): ('fellow-cas' | 'businesses' | 'students' | 'general-public')[] {
    const audience: ('fellow-cas' | 'businesses' | 'students' | 'general-public')[] = [];
    const combined = responses.map(r => r.answer.toLowerCase()).join(' ');
    
    if (combined.includes('ca') || combined.includes('professional')) audience.push('fellow-cas');
    if (combined.includes('business') || combined.includes('company')) audience.push('businesses');
    if (combined.includes('student') || combined.includes('learning')) audience.push('students');
    
    return audience.length > 0 ? audience : ['general-public'];
  }

  private extractTopics(responses: QuizResponse[]): string[] {
    // Extract key topics from responses
    const topics: string[] = [];
    responses.forEach(response => {
      const words = response.answer.toLowerCase().split(' ');
      // Add sophisticated topic extraction logic here
      words.forEach(word => {
        if (word.length > 4 && !['this', 'that', 'with', 'from', 'they', 'have', 'will'].includes(word)) {
          if (!topics.includes(word)) topics.push(word);
        }
      });
    });
    return topics.slice(0, 10); // Limit to top 10 topics
  }

  private extractExpertise(responses: QuizResponse[]): string[] {
    const expertise: string[] = [];
    const combined = responses.map(r => r.answer.toLowerCase()).join(' ');
    
    const expertiseKeywords = ['taxation', 'auditing', 'compliance', 'gst', 'income tax', 'corporate law', 'ifrs', 'accounting standards'];
    expertiseKeywords.forEach(keyword => {
      if (combined.includes(keyword)) expertise.push(keyword);
    });
    
    return expertise;
  }

  private extractExperience(responses: QuizResponse[]): string {
    const experienceResponse = responses.find(r => 
      r.question.toLowerCase().includes('experience') || 
      r.question.toLowerCase().includes('years')
    );
    return experienceResponse?.answer || 'Professional experience in accounting and taxation';
  }

  private extractSpecializations(responses: QuizResponse[]): string[] {
    return this.extractExpertise(responses); // Same logic for now
  }

  // Generate content with bias based on user profile
  generateBiasedContent(userId: string, topic: string, platform: 'linkedin' | 'twitter' | 'general'): {
    content: string;
    voice: VoiceType;
    bias: string[];
  } {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      throw new Error('User profile not found. Please complete the questionnaire first.');
    }

    const voice = profile.preferences.primaryVoice;
    const pattern = VOICE_PATTERNS[voice];
    const bias = this.generateBiasFactors(profile);

    // Generate content based on voice pattern and user bias
    const content = this.generateContentWithVoice(topic, pattern, profile, platform);

    return {
      content,
      voice,
      bias
    };
  }

  private generateBiasFactors(profile: UserProfile): string[] {
    const bias: string[] = [];
    
    // Add bias based on preferences
    bias.push(`Voice: ${profile.preferences.primaryVoice}`);
    bias.push(`Industry Focus: ${profile.preferences.industryFocus.join(', ')}`);
    bias.push(`Audience: ${profile.preferences.targetAudience.join(', ')}`);
    bias.push(`Expertise: ${profile.preferences.personalBrand.expertise.join(', ')}`);
    
    return bias;
  }

  private generateContentWithVoice(topic: string, pattern: VoicePattern, profile: UserProfile, platform: string): string {
    // This is a simplified version - in production, you'd use a more sophisticated LLM
    const expertise = profile.preferences.personalBrand.expertise.join(', ');
    const audience = profile.preferences.targetAudience.join(', ');
    
    let content = '';
    
    switch (pattern.type) {
      case 'Storyteller':
        content = `Let me share my experience with ${topic}. When I first encountered this in my practice, I learned that ${expertise} requires a deep understanding of client needs. This story might resonate with ${audience}...`;
        break;
      case 'Opinionator':
        content = `Here's my take on ${topic}: Most professionals in ${expertise} miss this crucial point. After working with ${audience}, I believe we need to reconsider our approach...`;
        break;
      case 'Fact Presenter':
        content = `Key facts about ${topic} that every professional should know: Based on current regulations in ${expertise}, here are the essential points for ${audience}...`;
        break;
      case 'F-Bomber':
        content = `IMPORTANT: ${topic} update you cannot ignore! This affects everyone working in ${expertise}, especially those serving ${audience}. Don't let this catch you off guard...`;
        break;
      case 'Frameworker':
        content = `My proven framework for handling ${topic}: As someone specializing in ${expertise}, I've developed a systematic approach that works for ${audience}. Here's the step-by-step process...`;
        break;
    }

    // Platform-specific adjustments
    if (platform === 'twitter') {
      content = content.substring(0, 240) + '...'; // Twitter character limit
    }

    return content;
  }

  // Get user profile
  getUserProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }

  // Update content performance for learning
  updateContentPerformance(userId: string, postId: string, engagement: {
    likes: number;
    shares: number;
    comments: number;
  }): void {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      const contentIndex = profile.generatedContent.findIndex(c => c.postId === postId);
      if (contentIndex >= 0) {
        profile.generatedContent[contentIndex].engagement = engagement;
        profile.updatedAt = new Date().toISOString();
      }
    }
  }
}