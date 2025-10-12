'use client';

import React, { useState } from 'react';
import { ICAIComplianceChecker, ComplianceResult, ICAI_GUIDELINES } from '@/lib/icai-guidelines';

interface PlagiarismResult {
  overallScore: number;
  sources: {
    url: string;
    similarity: number;
    matchedText: string;
    source: string;
  }[];
  isOriginal: boolean;
  suggestions: string[];
}

interface ComplianceCenterProps {}

export default function ComplianceCenter({}: ComplianceCenterProps) {
  const [activeMode, setActiveMode] = useState<'content' | 'document'>('content');
  const [contentToCheck, setContentToCheck] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [plagiarismResult, setPlagiarismResult] = useState<PlagiarismResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkType, setCheckType] = useState<'compliance' | 'plagiarism' | 'both'>('both');

  const handleContentCheck = async () => {
    if (!contentToCheck.trim()) return;
    
    setIsChecking(true);
    try {
      // ICAI Compliance Check
      if (checkType === 'compliance' || checkType === 'both') {
        const compliance = ICAIComplianceChecker.checkContent(contentToCheck);
        setComplianceResult(compliance);
      }

      // Plagiarism Check (simulated)
      if (checkType === 'plagiarism' || checkType === 'both') {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate API call
        
        const mockPlagiarismResult: PlagiarismResult = {
          overallScore: Math.floor(Math.random() * 100),
          sources: [
            {
              url: 'https://example-ca-blog.com/tax-planning-2025',
              similarity: 15,
              matchedText: 'Tax planning strategies for the financial year...',
              source: 'CA Blog Network'
            },
            {
              url: 'https://icai.org/guidelines/audit-standards',
              similarity: 8,
              matchedText: 'Audit standards require proper documentation...',
              source: 'ICAI Official'
            }
          ],
          isOriginal: true,
          suggestions: [
            'Consider paraphrasing sections with higher similarity scores',
            'Add proper citations for factual statements',
            'Ensure unique insights are highlighted'
          ]
        };
        
        mockPlagiarismResult.isOriginal = mockPlagiarismResult.overallScore < 25;
        setPlagiarismResult(mockPlagiarismResult);
      }
    } catch (error) {
      console.error('Check error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDocumentFile(file);
      
      // Extract text from document (simplified)
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setContentToCheck(text.substring(0, 5000)); // Limit for demo
      };
      reader.readAsText(file);
    }
  };

  const handleAutoFix = () => {
    if (!complianceResult || !contentToCheck) return;
    
    let fixedContent = contentToCheck;
    
    // Apply automatic fixes based on violations
    complianceResult.violations.forEach(violation => {
      switch (violation.guideline.id) {
        case 'SMG002':
          // Replace unprofessional language
          complianceResult.flaggedWords.forEach(word => {
            const replacement = getProfessionalReplacement(word);
            fixedContent = fixedContent.replace(new RegExp(word, 'gi'), replacement);
          });
          break;
        case 'SMG001':
          // Remove solicitation language
          fixedContent = fixedContent.replace(/dm me|contact me|hire me/gi, 'connect to discuss');
          break;
        case 'SMG003':
          // Soften exaggerated claims
          fixedContent = fixedContent
            .replace(/guaranteed/gi, 'typically')
            .replace(/100%/gi, 'highly effective')
            .replace(/never fail/gi, 'reliable');
          break;
      }
    });
    
    setContentToCheck(fixedContent);
    
    // Recheck compliance
    const newCompliance = ICAIComplianceChecker.checkContent(fixedContent);
    setComplianceResult(newCompliance);
  };

  const getProfessionalReplacement = (word: string): string => {
    const replacements: Record<string, string> = {
      'fuck': 'extremely',
      'shit': 'poor quality',
      'damn': 'quite',
      'bloody': 'very',
      'bastard': 'individual',
      'bitch': 'difficult situation'
    };
    return replacements[word.toLowerCase()] || word;
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      contentLength: contentToCheck.length,
      compliance: complianceResult,
      plagiarism: plagiarismResult,
      recommendations: [
        ...ICAIComplianceChecker.generateComplianceSuggestions(contentToCheck),
        ...(plagiarismResult?.suggestions || [])
      ]
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">⚖️ ICAI Compliance Center</h1>
          <p className="text-xl text-red-100">
            Professional guidelines checker with plagiarism detection for CA content
          </p>
        </div>

        {/* Mode Selection */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-600 mb-8">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveMode('content')}
              className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
                activeMode === 'content'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="mr-2">📝</span>
              Content Check
            </button>
            <button
              onClick={() => setActiveMode('document')}
              className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
                activeMode === 'document'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="mr-2">📄</span>
              Document Upload
            </button>
          </div>

          {/* Check Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Check Type</label>
            <div className="flex space-x-4">
              {[
                { key: 'both', label: 'Compliance + Plagiarism', icon: '🔍' },
                { key: 'compliance', label: 'ICAI Compliance Only', icon: '⚖️' },
                { key: 'plagiarism', label: 'Plagiarism Only', icon: '📋' }
              ].map(type => (
                <button
                  key={type.key}
                  onClick={() => setCheckType(type.key as any)}
                  className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                    checkType === type.key
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span className="mr-2">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Input */}
          {activeMode === 'content' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium">Content to Check</label>
              <textarea
                value={contentToCheck}
                onChange={(e) => setContentToCheck(e.target.value)}
                placeholder="Paste your content here for ICAI compliance and plagiarism checking..."
                rows={8}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>{contentToCheck.length} characters</span>
                <span>Max recommended: 5,000 characters</span>
              </div>
            </div>
          )}

          {/* Document Upload */}
          {activeMode === 'document' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium">Upload Document</label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                <input
                  type="file"
                  onChange={handleDocumentUpload}
                  accept=".txt,.docx,.pdf"
                  className="hidden"
                  id="document-upload"
                />
                <label htmlFor="document-upload" className="cursor-pointer">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-lg mb-2">Drop your document here or click to browse</p>
                  <p className="text-sm text-gray-400">Supports: .txt, .docx, .pdf (Max 10MB)</p>
                </label>
                {documentFile && (
                  <div className="mt-4 p-3 bg-gray-700 rounded text-left">
                    <strong>Selected:</strong> {documentFile.name}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Check Button */}
          <button
            onClick={handleContentCheck}
            disabled={isChecking || !contentToCheck.trim()}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-6 py-4 rounded-lg transition-colors font-semibold text-lg mt-6 flex items-center justify-center"
          >
            {isChecking ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Analyzing Content...
              </>
            ) : (
              <>
                🔍 Run Compliance Check
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {(complianceResult || plagiarismResult) && (
          <div className="space-y-6">
            {/* Compliance Results */}
            {complianceResult && (
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-600">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">⚖️ ICAI Compliance Results</h2>
                  <div className={`px-4 py-2 rounded-full font-semibold ${
                    complianceResult.isCompliant ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    Score: {complianceResult.score}/100
                  </div>
                </div>

                {/* Overall Status */}
                <div className={`rounded-lg p-4 mb-6 ${
                  complianceResult.isCompliant ? 'bg-green-900/30' : 'bg-red-900/30'
                }`}>
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {complianceResult.isCompliant ? '✅' : '⚠️'}
                    </span>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {complianceResult.isCompliant ? 'Compliant' : 'Issues Found'}
                      </h3>
                      <p className={complianceResult.isCompliant ? 'text-green-300' : 'text-red-300'}>
                        {complianceResult.isCompliant 
                          ? 'Content meets ICAI professional standards'
                          : `${complianceResult.violations.length} violations detected`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Violations */}
                {complianceResult.violations.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-4">Violations Found</h3>
                    <div className="space-y-3">
                      {complianceResult.violations.map((violation, index) => (
                        <div key={index} className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                          <div className="flex items-start">
                            <span className={`px-2 py-1 rounded text-xs font-medium mr-3 ${
                              violation.guideline.severity === 'critical' ? 'bg-red-600' :
                              violation.guideline.severity === 'major' ? 'bg-orange-600' :
                              'bg-yellow-600'
                            }`}>
                              {violation.guideline.severity.toUpperCase()}
                            </span>
                            <div className="flex-1">
                              <h4 className="font-medium">{violation.guideline.rule}</h4>
                              <p className="text-sm text-gray-300 mt-1">{violation.reason}</p>
                              <p className="text-sm text-blue-300 mt-2">
                                <strong>Suggestion:</strong> {violation.suggestion}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Auto-fix */}
                {!complianceResult.isCompliant && (
                  <div className="flex space-x-4">
                    <button
                      onClick={handleAutoFix}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors font-semibold"
                    >
                      🔧 Auto-Fix Issues
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Plagiarism Results */}
            {plagiarismResult && (
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-600">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">📋 Plagiarism Check Results</h2>
                  <div className={`px-4 py-2 rounded-full font-semibold ${
                    plagiarismResult.isOriginal ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    Similarity: {plagiarismResult.overallScore}%
                  </div>
                </div>

                {/* Overall Status */}
                <div className={`rounded-lg p-4 mb-6 ${
                  plagiarismResult.isOriginal ? 'bg-green-900/30' : 'bg-yellow-900/30'
                }`}>
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {plagiarismResult.isOriginal ? '✅' : '⚠️'}
                    </span>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {plagiarismResult.isOriginal ? 'Original Content' : 'Similarity Detected'}
                      </h3>
                      <p className={plagiarismResult.isOriginal ? 'text-green-300' : 'text-yellow-300'}>
                        {plagiarismResult.isOriginal 
                          ? 'Content appears to be original'
                          : 'Some similarities found with existing sources'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Similar Sources */}
                {plagiarismResult.sources.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-4">Similar Sources</h3>
                    <div className="space-y-3">
                      {plagiarismResult.sources.map((source, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{source.source}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              source.similarity > 20 ? 'bg-red-600' :
                              source.similarity > 10 ? 'bg-yellow-600' :
                              'bg-green-600'
                            }`}>
                              {source.similarity}% match
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">"{source.matchedText}"</p>
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            View Source →
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Export Report */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Generate Report</h3>
                  <p className="text-gray-400">Export detailed compliance and plagiarism report</p>
                </div>
                <button
                  onClick={exportReport}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors font-semibold"
                >
                  📊 Export Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ICAI Guidelines Reference */}
        <div className="mt-8 bg-gray-800 rounded-2xl p-6 border border-gray-600">
          <h2 className="text-2xl font-bold mb-4">📚 ICAI Guidelines Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ICAI_GUIDELINES.map(guideline => (
              <div key={guideline.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{guideline.id}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    guideline.severity === 'critical' ? 'bg-red-600' :
                    guideline.severity === 'major' ? 'bg-orange-600' :
                    'bg-yellow-600'
                  }`}>
                    {guideline.severity.toUpperCase()}
                  </span>
                </div>
                <h4 className="font-semibold mb-2">{guideline.rule}</h4>
                <p className="text-sm text-gray-300">{guideline.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}