import { NextRequest, NextResponse } from 'next/server';
import { ICAIComplianceChecker } from '@/lib/icai-guidelines';

interface PlagiarismCheckResult {
  overallScore: number;
  matches: Array<{
    text: string;
    source: string;
    similarity: number;
    startIndex: number;
    endIndex: number;
  }>;
  originalityScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

interface ICAIComplianceRequest {
  content: string;
  documentType: 'pitch-deck' | 'presentation' | 'report' | 'post' | 'article';
  userId: string;
  title?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { content, documentType, userId, title }: ICAIComplianceRequest = await request.json();

    if (!content || !documentType || !userId) {
      return NextResponse.json(
        { success: false, error: 'Content, documentType, and userId are required' },
        { status: 400 }
      );
    }

    // Step 1: ICAI Guidelines Compliance Check
    const complianceResult = ICAIComplianceChecker.checkContent(content);
    
    // Step 2: Enhanced compliance check for pitch decks
    const enhancedCompliance = documentType === 'pitch-deck' 
      ? await checkPitchDeckCompliance(content, title || 'Untitled Document')
      : complianceResult;

    // Step 3: Plagiarism Check
    const plagiarismResult = await checkPlagiarism(content, documentType);

    // Step 4: Constitutional Chunking for better analysis
    const chunks = performConstitutionalChunking(content);
    const chunkAnalysis = await analyzeChunks(chunks);

    // Step 5: Generate comprehensive report
    const report = generateComplianceReport(
      enhancedCompliance,
      plagiarismResult,
      chunkAnalysis,
      documentType
    );

    return NextResponse.json({
      success: true,
      data: {
        compliance: enhancedCompliance,
        plagiarism: plagiarismResult,
        chunks: chunkAnalysis,
        report,
        recommendations: generateRecommendations(enhancedCompliance, plagiarismResult),
        riskAssessment: calculateRiskAssessment(enhancedCompliance, plagiarismResult)
      }
    });

  } catch (error) {
    console.error('ICAI compliance check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform compliance check' },
      { status: 500 }
    );
  }
}

async function checkPitchDeckCompliance(content: string, title: string) {
  // Enhanced compliance check specifically for pitch decks
  const baseCompliance = ICAIComplianceChecker.checkContent(content);
  
  const pitchDeckViolations = [];
  const pitchDeckSuggestions = [];

  // Check for specific pitch deck requirements
  const requiredElements = [
    { element: 'professional credentials', pattern: /CA|chartered accountant|ICAI/i },
    { element: 'regulatory disclaimer', pattern: /subject to|regulatory approval|compliance/i },
    { element: 'risk disclosure', pattern: /risk|disclaimer|terms|conditions/i }
  ];

  requiredElements.forEach(req => {
    if (!req.pattern.test(content)) {
      pitchDeckViolations.push(`Missing ${req.element} in pitch deck`);
      pitchDeckSuggestions.push(`Add appropriate ${req.element} statement`);
    }
  });

  // Check for prohibited claims
  const prohibitedClaims = [
    /guaranteed returns?/gi,
    /zero risk/gi,
    /assured profit/gi,
    /100% success/gi,
    /never fails?/gi
  ];

  prohibitedClaims.forEach(pattern => {
    if (pattern.test(content)) {
      pitchDeckViolations.push('Contains prohibited guarantee claims');
      pitchDeckSuggestions.push('Remove guarantee language and add appropriate disclaimers');
    }
  });

  return {
    ...baseCompliance,
    violations: [...baseCompliance.violations, ...pitchDeckViolations],
    suggestions: [...baseCompliance.suggestions, ...pitchDeckSuggestions],
    pitchDeckSpecific: true
  };
}

async function checkPlagiarism(content: string, documentType: string): Promise<PlagiarismCheckResult> {
  // Simulate plagiarism checking (in production, integrate with actual plagiarism service)
  const words = content.split(/\s+/);
  const wordCount = words.length;
  
  // Mock plagiarism detection
  const mockMatches = [];
  let totalMatchedWords = 0;

  // Common phrases that might trigger false positives
  const commonPhrases = [
    'in accordance with',
    'as per the guidelines',
    'chartered accountant',
    'ICAI regulations',
    'professional standards'
  ];

  commonPhrases.forEach(phrase => {
    const regex = new RegExp(phrase, 'gi');
    const matches = content.match(regex);
    if (matches) {
      matches.forEach(match => {
        const startIndex = content.indexOf(match);
        mockMatches.push({
          text: match,
          source: 'Common professional terminology',
          similarity: 0.3, // Low similarity for common terms
          startIndex,
          endIndex: startIndex + match.length
        });
        totalMatchedWords += match.split(/\s+/).length;
      });
    }
  });

  // Add some mock high-similarity matches for demonstration
  if (content.length > 500) {
    mockMatches.push({
      text: content.substring(100, 200),
      source: 'Similar document found online',
      similarity: 0.85,
      startIndex: 100,
      endIndex: 200
    });
    totalMatchedWords += 20;
  }

  const overallScore = Math.min((totalMatchedWords / wordCount) * 100, 100);
  const originalityScore = Math.max(100 - overallScore, 0);
  
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (overallScore > 30) riskLevel = 'high';
  else if (overallScore > 15) riskLevel = 'medium';

  const recommendations = [];
  if (riskLevel === 'high') {
    recommendations.push('Significant plagiarism detected - requires major revision');
    recommendations.push('Rewrite flagged sections in your own words');
    recommendations.push('Add proper citations for referenced material');
  } else if (riskLevel === 'medium') {
    recommendations.push('Some similarities found - review flagged sections');
    recommendations.push('Consider paraphrasing to improve originality');
  } else {
    recommendations.push('Good originality score - minimal concerns');
    recommendations.push('Continue maintaining original content creation');
  }

  return {
    overallScore,
    matches: mockMatches,
    originalityScore,
    riskLevel,
    recommendations
  };
}

function performConstitutionalChunking(content: string) {
  // Constitutional chunking - break content into logical sections
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const chunks = [];
  
  let currentChunk = '';
  let chunkIndex = 0;

  sentences.forEach((sentence, index) => {
    currentChunk += sentence.trim() + '. ';
    
    // Create chunk every 3-4 sentences or when we hit certain triggers
    if (index % 3 === 2 || sentence.includes('however') || sentence.includes('therefore')) {
      chunks.push({
        id: chunkIndex++,
        content: currentChunk.trim(),
        type: determineChunkType(currentChunk),
        wordCount: currentChunk.split(/\s+/).length,
        startIndex: content.indexOf(currentChunk.substring(0, 20)),
        endIndex: content.indexOf(currentChunk.substring(0, 20)) + currentChunk.length
      });
      currentChunk = '';
    }
  });

  // Add remaining content as final chunk
  if (currentChunk.trim()) {
    chunks.push({
      id: chunkIndex,
      content: currentChunk.trim(),
      type: determineChunkType(currentChunk),
      wordCount: currentChunk.split(/\s+/).length,
      startIndex: content.lastIndexOf(currentChunk.substring(0, 20)),
      endIndex: content.length
    });
  }

  return chunks;
}

function determineChunkType(chunk: string): 'introduction' | 'body' | 'conclusion' | 'technical' | 'disclaimer' {
  if (chunk.toLowerCase().includes('introduction') || chunk.toLowerCase().includes('overview')) {
    return 'introduction';
  }
  if (chunk.toLowerCase().includes('conclusion') || chunk.toLowerCase().includes('summary')) {
    return 'conclusion';
  }
  if (chunk.toLowerCase().includes('disclaimer') || chunk.toLowerCase().includes('risk')) {
    return 'disclaimer';
  }
  if (chunk.toLowerCase().includes('technical') || chunk.toLowerCase().includes('regulation')) {
    return 'technical';
  }
  return 'body';
}

async function analyzeChunks(chunks: any[]) {
  return chunks.map(chunk => ({
    ...chunk,
    complianceScore: ICAIComplianceChecker.checkContent(chunk.content).score,
    keyTerms: extractKeyTerms(chunk.content),
    riskFactors: identifyRiskFactors(chunk.content),
    suggestions: generateChunkSuggestions(chunk.content, chunk.type)
  }));
}

function extractKeyTerms(content: string): string[] {
  const terms = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const frequency = {};
  
  terms.forEach(term => {
    frequency[term] = (frequency[term] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([term]) => term);
}

function identifyRiskFactors(content: string): string[] {
  const risks = [];
  
  if (/guarantee|assured|promise/gi.test(content)) {
    risks.push('Contains guarantee language');
  }
  if (/confidential|insider|exclusive/gi.test(content)) {
    risks.push('May contain sensitive information claims');
  }
  if (/best|top|leading/gi.test(content)) {
    risks.push('Contains superlative claims');
  }
  
  return risks;
}

function generateChunkSuggestions(content: string, type: string): string[] {
  const suggestions = [];
  
  switch (type) {
    case 'introduction':
      suggestions.push('Ensure professional credentials are mentioned');
      suggestions.push('Add appropriate regulatory disclaimers');
      break;
    case 'technical':
      suggestions.push('Verify technical accuracy');
      suggestions.push('Include relevant regulatory references');
      break;
    case 'disclaimer':
      suggestions.push('Ensure comprehensive risk disclosure');
      suggestions.push('Include ICAI compliance statements');
      break;
    default:
      suggestions.push('Maintain professional tone');
      suggestions.push('Ensure factual accuracy');
  }
  
  return suggestions;
}

function generateComplianceReport(compliance: any, plagiarism: PlagiarismCheckResult, chunks: any[], documentType: string) {
  return {
    summary: {
      overallGrade: calculateOverallGrade(compliance, plagiarism),
      complianceScore: compliance.score,
      originalityScore: plagiarism.originalityScore,
      documentType,
      riskLevel: calculateOverallRisk(compliance, plagiarism)
    },
    sections: {
      icaiCompliance: {
        score: compliance.score,
        violations: compliance.violations.length,
        criticalIssues: compliance.violations.filter(v => v.includes('violation')).length
      },
      plagiarism: {
        score: plagiarism.originalityScore,
        matches: plagiarism.matches.length,
        highRiskMatches: plagiarism.matches.filter(m => m.similarity > 0.7).length
      },
      structure: {
        totalChunks: chunks.length,
        averageChunkScore: chunks.reduce((acc, chunk) => acc + chunk.complianceScore, 0) / chunks.length,
        riskChunks: chunks.filter(chunk => chunk.riskFactors.length > 0).length
      }
    },
    timestamp: new Date().toISOString()
  };
}

function generateRecommendations(compliance: any, plagiarism: PlagiarismCheckResult): string[] {
  const recommendations = [];
  
  if (compliance.violationLevel === 'high') {
    recommendations.push('🚨 Critical: Address ICAI compliance violations immediately');
  }
  
  if (plagiarism.riskLevel === 'high') {
    recommendations.push('🚨 Critical: High plagiarism risk - major revision required');
  }
  
  recommendations.push(...compliance.suggestions);
  recommendations.push(...plagiarism.recommendations);
  
  return recommendations;
}

function calculateRiskAssessment(compliance: any, plagiarism: PlagiarismCheckResult) {
  let riskScore = 0;
  
  if (compliance.violationLevel === 'high') riskScore += 40;
  else if (compliance.violationLevel === 'medium') riskScore += 20;
  
  if (plagiarism.riskLevel === 'high') riskScore += 30;
  else if (plagiarism.riskLevel === 'medium') riskScore += 15;
  
  let level = 'low';
  if (riskScore > 50) level = 'high';
  else if (riskScore > 25) level = 'medium';
  
  return {
    score: riskScore,
    level,
    factors: [
      ...(compliance.violations || []),
      ...plagiarism.recommendations
    ]
  };
}

function calculateOverallGrade(compliance: any, plagiarism: PlagiarismCheckResult): string {
  const complianceScore = compliance.score || 0;
  const originalityScore = plagiarism.originalityScore || 0;
  const averageScore = (complianceScore + originalityScore) / 2;
  
  if (averageScore >= 90) return 'A+';
  if (averageScore >= 80) return 'A';
  if (averageScore >= 70) return 'B';
  if (averageScore >= 60) return 'C';
  return 'D';
}

function calculateOverallRisk(compliance: any, plagiarism: PlagiarismCheckResult): 'low' | 'medium' | 'high' {
  if (compliance.violationLevel === 'high' || plagiarism.riskLevel === 'high') {
    return 'high';
  }
  if (compliance.violationLevel === 'medium' || plagiarism.riskLevel === 'medium') {
    return 'medium';
  }
  return 'low';
}