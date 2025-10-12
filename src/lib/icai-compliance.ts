import { PerplexityService } from './perplexity-service';

export interface ComplianceRule {
  id: string;
  title: string;
  description: string;
  category: 'ethical' | 'technical' | 'professional' | 'regulatory';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string; // ICAI regulation reference
  keywords: string[];
  applicableTo: string[]; // Types of content this applies to
}

export interface ComplianceViolation {
  ruleId: string;
  rule: ComplianceRule;
  violationType: 'potential' | 'confirmed';
  description: string;
  suggestion: string;
  confidence: number; // 0-1 score
  context: string; // The text that triggered the violation
}

export interface ComplianceReport {
  contentId: string;
  contentType: string;
  overallScore: number; // 0-100
  violations: ComplianceViolation[];
  suggestions: string[];
  isCompliant: boolean;
  reviewRequired: boolean;
  generatedAt: Date;
}

export class ICAIComplianceService {
  private perplexityService: PerplexityService;
  private complianceRules: ComplianceRule[] = [];

  constructor() {
    this.perplexityService = new PerplexityService();
    this.initializeComplianceRules();
  }

  private initializeComplianceRules() {
    this.complianceRules = [
      {
        id: 'icai-001',
        title: 'Professional Competence and Due Care',
        description: 'Must maintain professional competence and perform services with due care',
        category: 'professional',
        severity: 'high',
        source: 'ICAI Code of Ethics Section 130',
        keywords: ['guarantee', 'certain results', 'promise specific outcomes'],
        applicableTo: ['linkedin-post', 'article', 'case-study', 'marketing']
      },
      {
        id: 'icai-002',
        title: 'Confidentiality',
        description: 'Must not disclose confidential client information',
        category: 'ethical',
        severity: 'critical',
        source: 'ICAI Code of Ethics Section 140',
        keywords: ['client name', 'specific financial figures', 'internal processes', 'confidential'],
        applicableTo: ['case-study', 'article', 'social-media']
      },
      {
        id: 'icai-003',
        title: 'Professional Behavior',
        description: 'Must not bring disrepute to the profession',
        category: 'professional',
        severity: 'high',
        source: 'ICAI Code of Ethics Section 150',
        keywords: ['inappropriate language', 'unprofessional', 'controversial statements'],
        applicableTo: ['all']
      },
      {
        id: 'icai-004',
        title: 'Advertising and Solicitation',
        description: 'Must comply with advertising guidelines and avoid solicitation',
        category: 'regulatory',
        severity: 'medium',
        source: 'ICAI Guidelines on Advertisement',
        keywords: ['best CA', 'cheapest', 'guaranteed savings', 'contact now', 'call immediately'],
        applicableTo: ['marketing', 'social-media', 'linkedin-post']
      },
      {
        id: 'icai-005',
        title: 'Independence and Objectivity',
        description: 'Must maintain independence in professional judgments',
        category: 'professional',
        severity: 'high',
        source: 'ICAI Code of Ethics Section 120',
        keywords: ['biased opinion', 'personal interest', 'financial stake'],
        applicableTo: ['article', 'case-study', 'advisory']
      },
      {
        id: 'icai-006',
        title: 'Technical Standards Compliance',
        description: 'Must comply with applicable technical and professional standards',
        category: 'technical',
        severity: 'medium',
        source: 'Various ICAI Standards',
        keywords: ['outdated standards', 'incorrect procedure', 'non-compliant method'],
        applicableTo: ['technical-content', 'how-to', 'advisory']
      },
      {
        id: 'icai-007',
        title: 'Misleading Information',
        description: 'Must not provide misleading or false information',
        category: 'ethical',
        severity: 'critical',
        source: 'ICAI Code of Ethics',
        keywords: ['always works', 'never fails', 'guaranteed', '100% success', 'foolproof'],
        applicableTo: ['all']
      },
      {
        id: 'icai-008',
        title: 'Qualification Claims',
        description: 'Must not make false claims about qualifications or experience',
        category: 'professional',
        severity: 'high',
        source: 'ICAI Professional Standards',
        keywords: ['expert in all areas', 'top CA', 'best in field', 'award-winning'],
        applicableTo: ['profile', 'bio', 'marketing']
      },
      {
        id: 'icai-009',
        title: 'Client Relationship Boundaries',
        description: 'Must maintain appropriate professional boundaries with clients',
        category: 'professional',
        severity: 'medium',
        source: 'ICAI Professional Guidelines',
        keywords: ['personal relationship', 'friendship', 'family matters'],
        applicableTo: ['case-study', 'testimonial']
      },
      {
        id: 'icai-010',
        title: 'Regulatory Update Accuracy',
        description: 'Must ensure accuracy when sharing regulatory updates',
        category: 'technical',
        severity: 'high',
        source: 'ICAI Technical Standards',
        keywords: ['might change', 'probably applies', 'could be updated'],
        applicableTo: ['regulatory-update', 'tax-advice', 'compliance-guide']
      }
    ];
  }

  async checkCompliance(content: string, contentType: string): Promise<ComplianceReport> {
    const violations: ComplianceViolation[] = [];
    let overallScore = 100;

    // Rule-based checking
    const ruleViolations = await this.checkAgainstRules(content, contentType);
    violations.push(...ruleViolations);

    // AI-powered compliance checking
    const aiViolations = await this.performAIComplianceCheck(content, contentType);
    violations.push(...aiViolations);

    // Calculate overall score
    const totalPenalty = violations.reduce((total, violation) => {
      const penalty = this.getSeverityPenalty(violation.rule.severity) * violation.confidence;
      return total + penalty;
    }, 0);

    overallScore = Math.max(0, 100 - totalPenalty);

    // Determine compliance status
    const criticalViolations = violations.filter(v => v.rule.severity === 'critical');
    const isCompliant = criticalViolations.length === 0 && overallScore >= 70;
    const reviewRequired = overallScore < 80 || violations.some(v => v.rule.severity === 'high');

    // Generate suggestions
    const suggestions = this.generateSuggestions(violations, content);

    return {
      contentId: Date.now().toString(),
      contentType,
      overallScore,
      violations,
      suggestions,
      isCompliant,
      reviewRequired,
      generatedAt: new Date()
    };
  }

  private async checkAgainstRules(content: string, contentType: string): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    const contentLower = content.toLowerCase();

    // Filter rules applicable to this content type
    const applicableRules = this.complianceRules.filter(rule => 
      rule.applicableTo.includes(contentType) || rule.applicableTo.includes('all')
    );

    for (const rule of applicableRules) {
      for (const keyword of rule.keywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          const contextStart = Math.max(0, contentLower.indexOf(keyword.toLowerCase()) - 50);
          const contextEnd = Math.min(content.length, contentLower.indexOf(keyword.toLowerCase()) + keyword.length + 50);
          const context = content.substring(contextStart, contextEnd);

          violations.push({
            ruleId: rule.id,
            rule,
            violationType: 'potential',
            description: `Potential violation of ${rule.title}: Found "${keyword}" in content`,
            suggestion: this.generateRuleSuggestion(rule, keyword),
            confidence: 0.7,
            context
          });
        }
      }
    }

    return violations;
  }

  private async performAIComplianceCheck(content: string, contentType: string): Promise<ComplianceViolation[]> {
    try {
      const prompt = `
Analyze this ${contentType} content for ICAI (Institute of Chartered Accountants of India) compliance violations:

Content to analyze:
${content}

Check for violations of:
1. Professional competence and due care
2. Confidentiality requirements
3. Professional behavior standards
4. Advertising and solicitation guidelines
5. Independence and objectivity
6. Technical standards compliance
7. Misleading information
8. Qualification claims
9. Client relationship boundaries
10. Regulatory update accuracy

For each potential violation found, provide:
- Rule category (ethical/technical/professional/regulatory)
- Severity (low/medium/high/critical)
- Description of the violation
- Specific text that caused the violation
- Suggestion for improvement
- Confidence level (0-100)

Format as JSON array with objects containing: category, severity, description, context, suggestion, confidence.
`;

      const response = await this.perplexityService.askQuestion(prompt);
      const aiResults = JSON.parse(response.choices[0]?.message.content || '[]');

      return aiResults.map((result: any, index: number) => ({
        ruleId: `ai-${index}`,
        rule: {
          id: `ai-${index}`,
          title: `AI Detected: ${result.category} Issue`,
          description: result.description,
          category: result.category,
          severity: result.severity,
          source: 'AI Analysis',
          keywords: [],
          applicableTo: [contentType]
        },
        violationType: 'potential' as const,
        description: result.description,
        suggestion: result.suggestion,
        confidence: result.confidence / 100,
        context: result.context
      }));
    } catch (error) {
      console.error('Error in AI compliance check:', error);
      return [];
    }
  }

  private getSeverityPenalty(severity: string): number {
    switch (severity) {
      case 'critical': return 30;
      case 'high': return 20;
      case 'medium': return 10;
      case 'low': return 5;
      default: return 5;
    }
  }

  private generateRuleSuggestion(rule: ComplianceRule, keyword: string): string {
    const suggestions: { [key: string]: string } = {
      'guarantee': 'Avoid using "guarantee" - instead use "typically helps" or "may result in"',
      'certain results': 'Replace with "expected outcomes" or "potential benefits"',
      'best CA': 'Remove superlative claims - focus on your specific expertise',
      'cheapest': 'Avoid price-focused claims - emphasize value and quality',
      'client name': 'Use anonymous references like "a manufacturing client" instead',
      'always works': 'Replace with "generally effective" or "has proven successful"',
      'never fails': 'Use "highly reliable" or "consistently effective" instead',
      'top CA': 'Focus on specific qualifications and experience rather than rankings'
    };

    return suggestions[keyword] || `Consider revising the use of "${keyword}" to comply with ${rule.title}`;
  }

  private generateSuggestions(violations: ComplianceViolation[], content: string): string[] {
    const suggestions: string[] = [];

    // General suggestions based on violation types
    const hasConfidentialityIssues = violations.some(v => v.rule.category === 'ethical' && v.rule.id === 'icai-002');
    if (hasConfidentialityIssues) {
      suggestions.push('Consider anonymizing client information and removing specific financial details');
    }

    const hasAdvertisingIssues = violations.some(v => v.rule.category === 'regulatory' && v.rule.id === 'icai-004');
    if (hasAdvertisingIssues) {
      suggestions.push('Review advertising language to ensure compliance with ICAI guidelines');
    }

    const hasMisleadingClaims = violations.some(v => v.rule.id === 'icai-007');
    if (hasMisleadingClaims) {
      suggestions.push('Replace absolute claims with qualified statements that reflect professional uncertainty');
    }

    const hasQualificationClaims = violations.some(v => v.rule.id === 'icai-008');
    if (hasQualificationClaims) {
      suggestions.push('Focus on specific expertise and qualifications rather than subjective rankings');
    }

    // Content-specific suggestions
    if (content.length > 500) {
      suggestions.push('Consider adding a disclaimer about professional advice and consultation requirements');
    }

    if (violations.length > 3) {
      suggestions.push('This content requires significant revision to meet ICAI compliance standards');
    }

    return suggestions;
  }

  async generateComplianceDisclaimer(contentType: string): Promise<string> {
    const disclaimers: { [key: string]: string } = {
      'tax-advice': 'This information is for general guidance only and should not be considered as professional tax advice. Please consult with a qualified Chartered Accountant for advice specific to your situation.',
      'financial-advice': 'The information provided is for educational purposes only and does not constitute financial advice. Individual circumstances may vary, and professional consultation is recommended.',
      'regulatory-update': 'This update is based on currently available information and may be subject to change. Please verify the latest regulations before making any decisions.',
      'case-study': 'This case study is for illustrative purposes only. Results may vary based on individual circumstances. Client information has been anonymized to protect confidentiality.',
      'general': 'This content is for informational purposes only and should not be considered as professional advice. Please consult with a qualified professional for advice specific to your situation.'
    };

    return disclaimers[contentType] || disclaimers['general'];
  }

  async suggestCompliantAlternatives(originalText: string, violation: ComplianceViolation): Promise<string[]> {
    try {
      const prompt = `
Original text: "${originalText}"
Compliance issue: ${violation.description}
Rule violated: ${violation.rule.title}

Suggest 3 alternative ways to express this that would comply with ICAI standards while maintaining the core message. 

Provide alternatives that:
1. Remove problematic language
2. Add appropriate qualifications
3. Maintain professional tone
4. Keep the essential meaning

Format as a simple array of alternatives.
`;

      const response = await this.perplexityService.askQuestion(prompt);
      const alternatives = response.choices[0]?.message.content.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 10);

      return alternatives.slice(0, 3);
    } catch (error) {
      console.error('Error generating alternatives:', error);
      return [
        'Consider revising this text to comply with professional standards',
        'Add appropriate qualifications to this statement',
        'Use more conservative language that reflects professional uncertainty'
      ];
    }
  }

  getComplianceRules(): ComplianceRule[] {
    return this.complianceRules;
  }

  async getLatestICAIUpdates(): Promise<any[]> {
    try {
      const prompt = `
Find the latest ICAI (Institute of Chartered Accountants of India) notifications, circulars, and regulatory updates from the past 30 days.

Focus on:
1. Code of Ethics updates
2. Professional standards changes
3. Advertising guideline modifications
4. Technical standard updates
5. Compliance requirements

For each update, provide:
- Title
- Date
- Summary
- Impact on CA practice
- Compliance implications

Format as JSON array.
`;

      const response = await this.perplexityService.searchNews(prompt);
      return JSON.parse(response.choices[0]?.message.content || '[]');
    } catch (error) {
      console.error('Error fetching ICAI updates:', error);
      return [];
    }
  }

  async createComplianceChecklist(contentType: string): Promise<string[]> {
    const checklists: { [key: string]: string[] } = {
      'linkedin-post': [
        'Does not contain client-specific confidential information',
        'Avoids superlative claims (best, top, cheapest)',
        'Does not guarantee specific results',
        'Uses professional and appropriate language',
        'Includes appropriate disclaimers if giving advice',
        'Does not directly solicit business inappropriately'
      ],
      'case-study': [
        'Client information is anonymized appropriately',
        'No confidential financial details are disclosed',
        'Results are presented objectively without exaggeration',
        'Professional boundaries are maintained',
        'Includes appropriate disclaimers',
        'Does not breach client confidentiality'
      ],
      'article': [
        'Information is accurate and up-to-date',
        'Sources are properly attributed',
        'Professional standards are maintained',
        'Does not provide misleading information',
        'Includes appropriate disclaimers for advice',
        'Maintains objectivity and independence'
      ],
      'marketing': [
        'Complies with ICAI advertising guidelines',
        'Avoids misleading claims',
        'Does not inappropriately solicit business',
        'Professional qualifications are accurately stated',
        'No false or exaggerated claims about expertise',
        'Maintains professional dignity'
      ]
    };

    return checklists[contentType] || checklists['article'];
  }
}