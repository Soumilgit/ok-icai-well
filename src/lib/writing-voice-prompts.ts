export interface WritingVoiceTemplate {
  id: string;
  voice: 'storyteller' | 'opinionator' | 'fact-presenter' | 'frameworker' | 'f-bomber';
  template: string;
  placeholders: string[];
  instructions: string;
  wordCount: string;
  useCase: string;
}

export interface VoiceVariables {
  openingHooks: string[];
  closingCTAs: string[];
  specificNumbers: string[];
  clientTypes: string[];
  topics: string[];
  results: string[];
  locations: string[];
}

export class WritingVoicePromptService {
  private templates: WritingVoiceTemplate[] = [
    // STORYTELLER TEMPLATES
    {
      id: 'S1',
      voice: 'storyteller',
      template: `When I first {role_or_event}, I thought the hardest part would be {expected_problem}. It turned out the real challenge was {surprising_challenge}. One day, {short_episode}, and that changed everything. I learned to {action_taken}, which led to {positive_result}. If you're in the same place, try {small_action}. It won't fix everything — but it will get you moving. Curious? Tell me one thing you'd try this month.`,
      placeholders: ['role_or_event', 'expected_problem', 'surprising_challenge', 'short_episode', 'action_taken', 'positive_result', 'small_action'],
      instructions: 'First-person, reflective, 150-300 words, personable, finish with single-sentence takeaway and CTA',
      wordCount: '150-300',
      useCase: 'Personal growth stories, professional journey narratives'
    },
    {
      id: 'S2',
      voice: 'storyteller',
      template: `There's a moment I still remember from {year_location}: {vivid_moment}. Back then I was worried about {fear}. I did {step_1}, then {step_2}, and eventually {turnaround_result}. People ask me how I became {outcome}; the honest answer is: I started small, and I changed one habit. If you want the template I used, say "Show me the steps" in the comments.`,
      placeholders: ['year_location', 'vivid_moment', 'fear', 'step_1', 'step_2', 'turnaround_result', 'outcome'],
      instructions: 'Memory-based narrative with clear transformation arc',
      wordCount: '150-300',
      useCase: 'Career transformation stories, overcoming challenges'
    },
    {
      id: 'S3',
      voice: 'storyteller',
      template: `I once helped a client {client_goal} with a tiny change: {small_change}. They expected a small win — instead they got {unexpected_result}. Here's the short story: {three_line_sequence}. The lesson? {one_sentence_lesson}. If this resonates, DM me your biggest content worry and I'll share a practical tip.`,
      placeholders: ['client_goal', 'small_change', 'unexpected_result', 'three_line_sequence', 'one_sentence_lesson'],
      instructions: 'Client success story with unexpected outcomes',
      wordCount: '150-300',
      useCase: 'Client case studies, demonstrating expertise impact'
    },
    {
      id: 'S4',
      voice: 'storyteller',
      template: `Growing up in {place}, I thought success meant {old_belief}. Years later, after working with {type_of_clients}, I realised success is actually {new_belief}. One example: {short_case}. Today I do {habit_or_process}. If you want to change how people see your work online, start with {first_small_step}.`,
      placeholders: ['place', 'old_belief', 'type_of_clients', 'new_belief', 'short_case', 'habit_or_process', 'first_small_step'],
      instructions: 'Belief evolution story with practical application',
      wordCount: '150-300',
      useCase: 'Professional philosophy evolution, mindset shifts'
    },
    {
      id: 'S5',
      voice: 'storyteller',
      template: `I used to dread posting. I'd write a draft, edit it forever, then never publish. Then one morning I tried a different approach: {new_approach}. Within weeks, {measurable_result}. The trick wasn't fancy copy — it was {simple_principle}. If your posts keep dying in drafts, try this principle for 7 days and tell me what changes.`,
      placeholders: ['new_approach', 'measurable_result', 'simple_principle'],
      instructions: 'Content creation struggle to success story',
      wordCount: '150-300',
      useCase: 'Content marketing journey, overcoming posting anxiety'
    },

    // OPINIONATOR TEMPLATES
    {
      id: 'O1',
      voice: 'opinionator',
      template: `Here's an unpopular truth: {contrarian_claim}. Most people avoid saying it because {reason}. But the data and experience show {supporting_point}. If you keep doing {common_practice}, you'll keep getting {common_outcome}. I'd rather do {alternative}. Who else is tired of the same old playbook?`,
      placeholders: ['contrarian_claim', 'reason', 'supporting_point', 'common_practice', 'common_outcome', 'alternative'],
      instructions: 'Firm, crisp, 150-300 words, provocative but respectful, end with direct CTA that invites debate',
      wordCount: '150-300',
      useCase: 'Industry contrarian takes, challenging conventional wisdom'
    },
    {
      id: 'O2',
      voice: 'opinionator',
      template: `Stop pretending {widespread_belief} solves the problem. It doesn't — it only {negative_consequence}. The smarter move is {recommended_move}. I'll say it again: {contrarian_claim}. If you disagree, tell me why — I'm reading.`,
      placeholders: ['widespread_belief', 'negative_consequence', 'recommended_move', 'contrarian_claim'],
      instructions: 'Direct challenge to common beliefs with alternative solution',
      wordCount: '150-300',
      useCase: 'Debunking industry myths, promoting better practices'
    },
    {
      id: 'O3',
      voice: 'opinionator',
      template: `Everyone talks about {trend}, but here's what they're missing: {key_missing_point}. That's why {practical_implication}. If you want different results, stop following {popular_advice} and start doing {practical_alternative}. Who's ready to try this?`,
      placeholders: ['trend', 'key_missing_point', 'practical_implication', 'popular_advice', 'practical_alternative'],
      instructions: 'Trend analysis with contrarian perspective',
      wordCount: '150-300',
      useCase: 'Industry trend commentary, alternative approaches'
    },
    {
      id: 'O4',
      voice: 'opinionator',
      template: `If your firm still does {old_practice}, you're choosing convenience over value. That choice costs clients and credibility. The people who get ahead will adopt {new_practice} — even if it feels uncomfortable now. I predict in {timeframe} this will be standard. Prepare or be left behind.`,
      placeholders: ['old_practice', 'new_practice', 'timeframe'],
      instructions: 'Future prediction with urgency for change',
      wordCount: '150-300',
      useCase: 'Industry evolution predictions, modernization advocacy'
    },
    {
      id: 'O5',
      voice: 'opinionator',
      template: `We need to stop celebrating {superficial_metric}. It's misleading and distracts from real work: {real_goal}. Smart leaders measure {meaningful_metric} instead. Let's measure better. Comment with the one metric you wish more people cared about.`,
      placeholders: ['superficial_metric', 'real_goal', 'meaningful_metric'],
      instructions: 'Metrics and measurement philosophy critique',
      wordCount: '150-300',
      useCase: 'Performance measurement critique, better KPI advocacy'
    },

    // FACT PRESENTER TEMPLATES
    {
      id: 'F1',
      voice: 'fact-presenter',
      template: `Update: {policy_or_data_point} was announced on {date} by {authority}. Key points: 1) {fact_1}; 2) {fact_2}; 3) {fact_3}. For CAs this means {practical_implication}. If you advise clients in {sector}, check {action_item} by {deadline}.`,
      placeholders: ['policy_or_data_point', 'date', 'authority', 'fact_1', 'fact_2', 'fact_3', 'practical_implication', 'sector', 'action_item', 'deadline'],
      instructions: 'Objective tone, 150-300 words, include 2-3 crisp facts or numbers, finish with implication for CAs',
      wordCount: '150-300',
      useCase: 'Regulatory updates, policy announcements, compliance news'
    },
    {
      id: 'F2',
      voice: 'fact-presenter',
      template: `Quick explainer: {topic}. The essentials are: • {bullet_fact_a} • {bullet_fact_b} • {bullet_fact_c}. Why it matters: {short_reason}. Practical next step for advisors: {action_step}.`,
      placeholders: ['topic', 'bullet_fact_a', 'bullet_fact_b', 'bullet_fact_c', 'short_reason', 'action_step'],
      instructions: 'Concise educational content with actionable takeaway',
      wordCount: '150-300',
      useCase: 'Educational content, concept explanations, how-to guides'
    },
    {
      id: 'F3',
      voice: 'fact-presenter',
      template: `New data from {source} shows {statistic}. Compared to {previous_period}, that's {percent_change}. The likely effects on {industry_clients} include {implication_1} and {implication_2}. Recommended immediate action: {short_action}.`,
      placeholders: ['source', 'statistic', 'previous_period', 'percent_change', 'industry_clients', 'implication_1', 'implication_2', 'short_action'],
      instructions: 'Data-driven analysis with comparative context',
      wordCount: '150-300',
      useCase: 'Market analysis, statistical reports, trend data'
    },
    {
      id: 'F4',
      voice: 'fact-presenter',
      template: `Rule of thumb: if {condition}, then {consequence}. Example: {short_example_with_numbers}. What to do: {checklist_3_items}. Save this post if you need to revisit these steps next quarter.`,
      placeholders: ['condition', 'consequence', 'short_example_with_numbers', 'checklist_3_items'],
      instructions: 'Practical rules with concrete examples',
      wordCount: '150-300',
      useCase: 'Business rules, best practices, decision frameworks'
    },
    {
      id: 'F5',
      voice: 'fact-presenter',
      template: `FAQ: {common_question}. Short answer: {concise_answer}. Why: {brief_reason}. For compliance, watch {regulator_update} and make sure your client does {compliance_action}.`,
      placeholders: ['common_question', 'concise_answer', 'brief_reason', 'regulator_update', 'compliance_action'],
      instructions: 'FAQ format with compliance focus',
      wordCount: '150-300',
      useCase: 'Common questions, compliance guidance, client education'
    },

    // FRAMEWORKER TEMPLATES
    {
      id: 'R1',
      voice: 'frameworker',
      template: `How to {achieve_goal} in 5 steps:\n1. {step_1} — {one_line_how_1}\n2. {step_2} — {one_line_how_2}\n3. {step_3} — {one_line_how_3}\n4. {step_4} — {one_line_how_4}\n5. {step_5} — {one_line_how_5}\n\nDo these for 30 days and review results. Want a filled spreadsheet? Comment "Template" and I'll share.`,
      placeholders: ['achieve_goal', 'step_1', 'one_line_how_1', 'step_2', 'one_line_how_2', 'step_3', 'one_line_how_3', 'step_4', 'one_line_how_4', 'step_5', 'one_line_how_5'],
      instructions: 'Tactical, numbered/bulleted lists, 150-300 words, end with simple CTA to download or ask for template',
      wordCount: '150-300',
      useCase: 'Process guides, implementation frameworks, step-by-step tutorials'
    },
    {
      id: 'R2',
      voice: 'frameworker',
      template: `Checklist for {process}:\n• {check_1}\n• {check_2}\n• {check_3}\n• {check_4}\n• {check_5}\n\nThis is what I use for client reviews — it reduces rework by {specific_benefit}.`,
      placeholders: ['process', 'check_1', 'check_2', 'check_3', 'check_4', 'check_5', 'specific_benefit'],
      instructions: 'Checklist format with proven benefits',
      wordCount: '150-300',
      useCase: 'Quality control, process optimization, client management'
    },
    {
      id: 'R3',
      voice: 'frameworker',
      template: `Template: Post structure to turn a client case into a thought-leadership post:\n\nHook (one sentence)\nProblem (2 lines)\nAction we took (3 lines)\nImpact (one line with numbers)\nLesson + CTA\n\nUse this for every case study — it converts interest into inbound enquiries.`,
      placeholders: [],
      instructions: 'Meta-template for content creation structure',
      wordCount: '150-300',
      useCase: 'Content strategy, thought leadership, case study frameworks'
    },
    {
      id: 'R4',
      voice: 'frameworker',
      template: `The 3-question framework to validate an idea before you post:\n1. Will this help a client? (Yes/No)\n2. Is it compliant? (Yes/No)\n3. Can you prove it? (Data/Example)\n\nIf answer = Yes/Yes/Yes → publish. If No in any → revise.`,
      placeholders: [],
      instructions: 'Decision framework for content validation',
      wordCount: '150-300',
      useCase: 'Content planning, quality control, compliance checking'
    },

    // F-BOMBER TEMPLATES
    {
      id: 'FB1',
      voice: 'f-bomber',
      template: `Stop waiting. Your silence is costing clients. If you're still hiding behind "I don't have time," you're letting the competition take trust, meetings, and fees. Publish one helpful post this week. No excuses.`,
      placeholders: [],
      instructions: 'Short, punchy, 150-300 words, direct language, create friction but avoid slander. End with provocative CTA',
      wordCount: '150-300',
      useCase: 'Urgency creation, action motivation, overcoming procrastination'
    },
    {
      id: 'FB2',
      voice: 'f-bomber',
      template: `Fact: most firms spend ₹{big_number} on marketing and get zero ROI because their content is boring. If your content reads like an annual report, don't expect clients to notice. Fix your opening line or be forgotten.`,
      placeholders: ['big_number'],
      instructions: 'Blunt truth about marketing effectiveness',
      wordCount: '150-300',
      useCase: 'Marketing wake-up calls, content quality improvement'
    },
    {
      id: 'FB3',
      voice: 'f-bomber',
      template: `Here's a blunt truth: generic AI posts make you sound like every other firm. If you paste "thought leadership" from a bot, clients know. Use your own voice — or watch leads vanish.`,
      placeholders: [],
      instructions: 'AI content authenticity warning',
      wordCount: '150-300',
      useCase: 'Authenticity advocacy, AI content critique'
    },
    {
      id: 'FB4',
      voice: 'f-bomber',
      template: `If you promise "guaranteed savings" in client outreach copy, stop. It's risky, unethical, and will get you in trouble. Say what you do: advise, analyse, support — not "guarantee." Be bold — and honest.`,
      placeholders: [],
      instructions: 'Compliance and ethics enforcement',
      wordCount: '150-300',
      useCase: 'Ethical practice advocacy, compliance warnings'
    },
    {
      id: 'FB5',
      voice: 'f-bomber',
      template: `Wake up: LinkedIn isn't optional anymore. Firms that treat it as a checkbox will be digital fossils in 18 months. Publish, engage, measure. Or accept shrinking invoices.`,
      placeholders: [],
      instructions: 'Digital transformation urgency',
      wordCount: '150-300',
      useCase: 'Digital marketing necessity, future-proofing firms'
    }
  ];

  private voiceVariables: VoiceVariables = {
    openingHooks: [
      "Quick story:",
      "Here's the truth:",
      "ICYMI:",
      "A simple framework:",
      "I learned this the hard way:",
      "Data point:",
      "Stop doing this:"
    ],
    closingCTAs: [
      "What's your take?",
      "DM me if you want a template.",
      "Comment 'Template' to get the checklist.",
      "Try it for 7 days and tell me what changed.",
      "Share if this helped."
    ],
    specificNumbers: ["3", "7", "30", "90", "1,500", "6%", "25%", "70%", "18"],
    clientTypes: ["SMEs", "startups", "mid-market CFOs", "tax teams", "family businesses", "tech companies"],
    topics: ["GST changes", "IFRS update", "tax filing", "accounting automation", "compliance deadlines", "digital transformation"],
    results: ["saved 25% time", "cut drafts by 70%", "doubled responses", "increased efficiency", "reduced errors", "improved compliance"],
    locations: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Pune", "Hyderabad", "Kolkata", "Ahmedabad"]
  };

  public getTemplatesByVoice(voice: string): WritingVoiceTemplate[] {
    return this.templates.filter(template => template.voice === voice);
  }

  public getRandomTemplate(voice: string): WritingVoiceTemplate | null {
    const voiceTemplates = this.getTemplatesByVoice(voice);
    if (voiceTemplates.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * voiceTemplates.length);
    return voiceTemplates[randomIndex];
  }

  public fillPlaceholders(template: WritingVoiceTemplate, userInput: string, contentType: string = 'general'): string {
    let filledTemplate = template.template;
    
    // Fill placeholders intelligently based on user input and content type
    template.placeholders.forEach(placeholder => {
      const value = this.generatePlaceholderValue(placeholder, userInput, contentType);
      filledTemplate = filledTemplate.replace(new RegExp(`{${placeholder}}`, 'g'), value);
    });

    return filledTemplate;
  }

  private generatePlaceholderValue(placeholder: string, userInput: string, contentType: string): string {
    // Smart placeholder filling logic based on context
    const randomChoice = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
    
    switch (placeholder) {
      case 'specific_number':
        return randomChoice(this.voiceVariables.specificNumbers);
      case 'client_type':
        return randomChoice(this.voiceVariables.clientTypes);
      case 'topic':
        return randomChoice(this.voiceVariables.topics);
      case 'result':
        return randomChoice(this.voiceVariables.results);
      case 'location':
        return randomChoice(this.voiceVariables.locations);
      case 'big_number':
        return randomChoice(["50,000", "1,00,000", "2,50,000", "5,00,000"]);
      default:
        // For content-specific placeholders, use AI-appropriate defaults or extract from user input
        return this.extractContextualValue(placeholder, userInput);
    }
  }

  private extractContextualValue(placeholder: string, userInput: string): string {
    // Extract or generate contextual values based on user input
    // This would ideally use NLP, but for now we'll use simple heuristics
    
    if (placeholder.includes('goal') && userInput.toLowerCase().includes('help')) {
      return "improve their financial processes";
    }
    
    if (placeholder.includes('problem') && userInput.toLowerCase().includes('tax')) {
      return "complex tax compliance requirements";
    }
    
    if (placeholder.includes('challenge') && userInput.toLowerCase().includes('client')) {
      return "managing client expectations during regulatory changes";
    }
    
    // Default contextual values for CA professionals
    const caDefaults: { [key: string]: string } = {
      'role_or_event': 'started my CA practice',
      'expected_problem': 'finding clients',
      'surprising_challenge': 'managing their expectations during complex regulations',
      'action_taken': 'focus on education and clear communication',
      'positive_result': 'stronger client relationships and referrals',
      'small_action': 'explaining one complex concept simply each week',
      'contrarian_claim': 'most CA firms focus too much on compliance and not enough on advisory',
      'widespread_belief': 'automated software will replace accountants',
      'new_practice': 'proactive advisory with digital tools',
      'old_practice': 'reactive compliance-only services'
    };

    return caDefaults[placeholder] || `[${placeholder}]`;
  }

  public createPromptForVoice(
    voice: string, 
    userInput: string, 
    contentType: 'linkedin' | 'twitter' | 'general' = 'general',
    wordCount: string = '150-200'
  ): string {
    const template = this.getRandomTemplate(voice);
    if (!template) {
      return this.createGenericPrompt(voice, userInput, contentType, wordCount);
    }

    const filledTemplate = this.fillPlaceholders(template, userInput, contentType);
    const opener = this.voiceVariables.openingHooks[Math.floor(Math.random() * this.voiceVariables.openingHooks.length)];
    const closer = this.voiceVariables.closingCTAs[Math.floor(Math.random() * this.voiceVariables.closingCTAs.length)];

    return `You are a professional Chartered Accountant content creator. Write a ${contentType} post in the ${voice} voice.

TEMPLATE TO FOLLOW:
${filledTemplate}

WRITING INSTRUCTIONS:
${template.instructions}

CONTENT REQUIREMENTS:
- Length: ${wordCount} words
- Voice: ${voice}
- Platform: ${contentType}
- Keep it CA-appropriate and compliant with ICAI guidelines
- Avoid promotional language that sounds like advertising
- Use professional but engaging tone
- Include relevant CA/finance context

USER INPUT: ${userInput}

VARIATION ELEMENTS:
- Opening hook: ${opener}
- Closing CTA: ${closer}

Generate the content following the template structure while incorporating the user's specific request. Make it authentic, valuable, and appropriate for Indian CA professionals.`;
  }

  private createGenericPrompt(voice: string, userInput: string, contentType: string, wordCount: string): string {
    const voiceInstructions = {
      'storyteller': 'Use first-person narrative, include personal experiences, create emotional connection',
      'opinionator': 'Take strong positions, challenge conventional wisdom, be persuasive but respectful',
      'fact-presenter': 'Focus on data and facts, use neutral tone, provide step-by-step explanations',
      'frameworker': 'Create actionable frameworks, use structured formats, offer practical tools',
      'f-bomber': 'Use urgent language, be direct and blunt, create sense of immediacy'
    };

    return `You are a professional Chartered Accountant content creator. Write a ${contentType} post in the ${voice} voice.

VOICE CHARACTERISTICS: ${voiceInstructions[voice as keyof typeof voiceInstructions]}

CONTENT REQUIREMENTS:
- Length: ${wordCount} words  
- Voice: ${voice}
- Platform: ${contentType}
- Keep it CA-appropriate and compliant with ICAI guidelines
- Avoid promotional language that sounds like advertising
- Use professional but engaging tone
- Include relevant CA/finance context

USER REQUEST: ${userInput}

Generate engaging, valuable content that provides genuine value to CA professionals and their clients.`;
  }

  public getVoiceVariables(): VoiceVariables {
    return this.voiceVariables;
  }

  public getAllTemplates(): WritingVoiceTemplate[] {
    return this.templates;
  }
}