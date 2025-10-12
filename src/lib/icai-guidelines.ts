// ICAI Guidelines Compliance Checker
export interface ICAIGuideline {
  id: string;
  category: 'professional_conduct' | 'advertising' | 'social_media' | 'confidentiality' | 'competence';
  rule: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
}

export const ICAI_GUIDELINES: ICAIGuideline[] = [
  {
    id: 'SMG001',
    category: 'social_media',
    rule: 'No solicitation of clients through social media',
    description: 'CAs cannot directly solicit clients or advertise services in a manner that violates professional dignity',
    severity: 'critical'
  },
  {
    id: 'SMG002',
    category: 'social_media',
    rule: 'Maintain professional dignity in communications',
    description: 'All communications must maintain the dignity of the profession and avoid unprofessional language',
    severity: 'major'
  },
  {
    id: 'SMG003',
    category: 'advertising',
    rule: 'No false or misleading claims',
    description: 'Cannot make exaggerated claims about expertise or guaranteed outcomes',
    severity: 'critical'
  },
  {
    id: 'PC001',
    category: 'professional_conduct',
    rule: 'No defamatory statements',
    description: 'Cannot make statements that defame other professionals or institutions',
    severity: 'critical'
  },
  {
    id: 'PC002',
    category: 'professional_conduct',
    rule: 'Maintain objectivity',
    description: 'Must present balanced views and avoid biased statements that could mislead',
    severity: 'major'
  },
  {
    id: 'CONF001',
    category: 'confidentiality',
    rule: 'No disclosure of client information',
    description: 'Cannot share any client-specific information without explicit consent',
    severity: 'critical'
  },
  {
    id: 'COMP001',
    category: 'competence',
    rule: 'Stay within areas of competence',
    description: 'Cannot provide advice outside areas of professional competence',
    severity: 'major'
  }
];

export const PROHIBITED_WORDS = [
  // Professional violations
  'guaranteed results', 'sure shot', 'foolproof', 'get rich quick',
  // Unprofessional language
  'fuck', 'shit', 'damn', 'bloody', 'bastard', 'bitch',
  // Solicitation terms
  'hire me', 'contact me for services', 'dm for consultation',
  // Misleading claims
  'best CA', 'top expert', 'never fail', '100% success'
];

export interface ComplianceResult {
  isCompliant: boolean;
  violations: {
    guideline: ICAIGuideline;
    reason: string;
    suggestion: string;
  }[];
  score: number; // 0-100
  flaggedWords: string[];
}

export class ICAIComplianceChecker {
  static checkContent(content: string): ComplianceResult {
    const violations: ComplianceResult['violations'] = [];
    const flaggedWords: string[] = [];
    const contentLower = content.toLowerCase();

    // Check for prohibited words
    PROHIBITED_WORDS.forEach(word => {
      if (contentLower.includes(word.toLowerCase())) {
        flaggedWords.push(word);
        
        const relatedGuideline = ICAI_GUIDELINES.find(g => 
          g.category === 'professional_conduct' || g.category === 'social_media'
        );
        
        if (relatedGuideline) {
          violations.push({
            guideline: relatedGuideline,
            reason: `Contains prohibited word: "${word}"`,
            suggestion: 'Remove unprofessional language and use formal business terminology'
          });
        }
      }
    });

    // Check for direct solicitation patterns
    const solicitationPatterns = [
      /dm me/gi,
      /contact me/gi,
      /hire me/gi,
      /call now/gi,
      /book consultation/gi
    ];

    solicitationPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        violations.push({
          guideline: ICAI_GUIDELINES.find(g => g.id === 'SMG001')!,
          reason: 'Content contains direct client solicitation',
          suggestion: 'Reframe as educational content or thought leadership instead of direct solicitation'
        });
      }
    });

    // Check for exaggerated claims
    const exaggerationPatterns = [
      /guaranteed/gi,
      /100%/gi,
      /never fail/gi,
      /best ca/gi,
      /top expert/gi
    ];

    exaggerationPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        violations.push({
          guideline: ICAI_GUIDELINES.find(g => g.id === 'SMG003')!,
          reason: 'Content contains exaggerated or misleading claims',
          suggestion: 'Use qualified language like "typically", "generally", or "in most cases"'
        });
      }
    });

    // Calculate compliance score
    const totalPossibleViolations = ICAI_GUIDELINES.length;
    const actualViolations = violations.length;
    const score = Math.max(0, Math.round((1 - actualViolations / totalPossibleViolations) * 100));

    return {
      isCompliant: violations.length === 0,
      violations,
      score,
      flaggedWords
    };
  }

  static generateComplianceSuggestions(content: string): string[] {
    const result = this.checkContent(content);
    const suggestions: string[] = [];

    if (!result.isCompliant) {
      suggestions.push('Consider these ICAI compliance improvements:');
      result.violations.forEach(violation => {
        suggestions.push(`• ${violation.suggestion}`);
      });
    }

    // General professional suggestions
    suggestions.push(
      '• Frame content as educational or thought leadership',
      '• Use professional, measured language',
      '• Avoid direct client solicitation',
      '• Include disclaimers where appropriate',
      '• Focus on industry insights rather than self-promotion'
    );

    return suggestions;
  }
}