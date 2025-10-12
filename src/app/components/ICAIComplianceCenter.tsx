'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface ICAIComplianceCenterProps {}

interface ComplianceResult {
  compliance: {
    score: number;
    violations: string[];
    suggestions: string[];
    violationLevel: 'low' | 'medium' | 'high';
  };
  plagiarism: {
    overallScore: number;
    originalityScore: number;
    matches: Array<{
      text: string;
      source: string;
      similarity: number;
    }>;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
  report: {
    summary: {
      overallGrade: string;
      complianceScore: number;
      originalityScore: number;
      riskLevel: 'low' | 'medium' | 'high';
    };
    sections: {
      icaiCompliance: {
        score: number;
        violations: number;
        criticalIssues: number;
      };
      plagiarism: {
        score: number;
        matches: number;
        highRiskMatches: number;
      };
      structure: {
        totalChunks: number;
        averageChunkScore: number;
        riskChunks: number;
      };
    };
  };
  chunks: Array<{
    id: number;
    content: string;
    type: string;
    complianceScore: number;
    keyTerms: string[];
    riskFactors: string[];
  }>;
  recommendations: string[];
}

export default function ICAIComplianceCenter({}: ICAIComplianceCenterProps) {
  const { user } = useUser();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState<'pitch-deck' | 'presentation' | 'report' | 'post' | 'article'>('pitch-deck');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [showDetailedReport, setShowDetailedReport] = useState(false);

  const handleComplianceCheck = async () => {
    if (!content.trim() || !user) return;
    
    setIsChecking(true);
    try {
      const response = await fetch('/api/icai/compliance-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          documentType,
          userId: user.id,
          title
        })
      });
      
      const apiResult = await response.json();
      if (apiResult.success) {
        setResult(apiResult.data);
      } else {
        alert(`Compliance check failed: ${apiResult.error}`);
      }
    } catch (error) {
      console.error('Compliance check error:', error);
      alert('Failed to perform compliance check. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-600';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-600';
      case 'low': return 'text-green-400 bg-green-900/20 border-green-600';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-400';
    if (grade.startsWith('B')) return 'text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-xl p-6 border border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-4">🛡️ ICAI Compliance & Plagiarism Checker</h3>
        <p className="text-gray-300 mb-6">
          Ensure your content meets ICAI professional standards and check for plagiarism using constitutional chunking analysis.
        </p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as any)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="pitch-deck">🎯 Pitch Deck</option>
                <option value="presentation">📊 Presentation</option>
                <option value="report">📄 Professional Report</option>
                <option value="post">📱 Social Media Post</option>
                <option value="article">📝 Article/Blog</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Document Title (Optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Content to Analyze</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your content here for comprehensive ICAI compliance and plagiarism analysis..."
              rows={12}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-400">
                {content.split(/\s+/).filter(word => word.length > 0).length} words
              </span>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleComplianceCheck}
                  disabled={isChecking || !content.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {isChecking ? '🔍 Analyzing...' : '🔍 Check Compliance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className={`rounded-xl p-6 border ${getRiskColor(result.report.summary.riskLevel)}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">📋 Compliance Report</h3>
              <div className={`text-3xl font-bold ${getGradeColor(result.report.summary.overallGrade)}`}>
                Grade: {result.report.summary.overallGrade}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-400 mb-2">🏛️ ICAI Compliance</h4>
                <div className="text-2xl font-bold text-white mb-1">
                  {result.compliance.score}/100
                </div>
                <div className="text-sm text-gray-300">
                  {result.compliance.violations.length} violations found
                </div>
                <div className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${getRiskColor(result.compliance.violationLevel)}`}>
                  {result.compliance.violationLevel.toUpperCase()} RISK
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-green-400 mb-2">✅ Originality</h4>
                <div className="text-2xl font-bold text-white mb-1">
                  {result.plagiarism.originalityScore}/100
                </div>
                <div className="text-sm text-gray-300">
                  {result.plagiarism.matches.length} matches found
                </div>
                <div className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${getRiskColor(result.plagiarism.riskLevel)}`}>
                  {result.plagiarism.riskLevel.toUpperCase()} RISK
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-purple-400 mb-2">🧩 Structure</h4>
                <div className="text-2xl font-bold text-white mb-1">
                  {result.chunks.length}
                </div>
                <div className="text-sm text-gray-300">chunks analyzed</div>
                <div className="text-xs text-gray-400 mt-2">
                  Avg score: {result.report.sections.structure.averageChunkScore.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
              <h4 className="text-xl font-bold text-white mb-4">💡 Recommendations</h4>
              <div className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-300">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Violations */}
          {result.compliance.violations.length > 0 && (
            <div className="bg-red-900/20 rounded-xl p-6 border border-red-600">
              <h4 className="text-xl font-bold text-red-400 mb-4">⚠️ ICAI Compliance Issues</h4>
              <div className="space-y-2">
                {result.compliance.violations.map((violation, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-red-300">{violation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plagiarism Matches */}
          {result.plagiarism.matches.filter(m => m.similarity > 0.5).length > 0 && (
            <div className="bg-yellow-900/20 rounded-xl p-6 border border-yellow-600">
              <h4 className="text-xl font-bold text-yellow-400 mb-4">🔍 High-Similarity Matches</h4>
              <div className="space-y-3">
                {result.plagiarism.matches
                  .filter(match => match.similarity > 0.5)
                  .map((match, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-yellow-400">
                          Similarity: {(match.similarity * 100).toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-400">{match.source}</span>
                      </div>
                      <p className="text-gray-300 text-sm italic">"{match.text}"</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Detailed Analysis Toggle */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
            <button
              onClick={() => setShowDetailedReport(!showDetailedReport)}
              className="w-full flex items-center justify-between text-left"
            >
              <h4 className="text-xl font-bold text-white">🔬 Detailed Constitutional Analysis</h4>
              <svg
                className={`w-6 h-6 text-gray-400 transform transition-transform ${
                  showDetailedReport ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showDetailedReport && (
              <div className="mt-6 space-y-4">
                {result.chunks.map((chunk, index) => (
                  <div key={chunk.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-white">
                        Chunk {chunk.id + 1} - {chunk.type.replace('-', ' ').toUpperCase()}
                      </h5>
                      <div className="flex space-x-2">
                        <span className="text-sm bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                          Score: {chunk.complianceScore}/100
                        </span>
                        {chunk.riskFactors.length > 0 && (
                          <span className="text-sm bg-red-900/50 text-red-300 px-2 py-1 rounded">
                            {chunk.riskFactors.length} risks
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-3 italic">
                      "{chunk.content.substring(0, 200)}..."
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      <div className="text-xs text-gray-400">
                        <strong>Key terms:</strong> {chunk.keyTerms.join(', ')}
                      </div>
                    </div>
                    
                    {chunk.riskFactors.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-red-400">
                          <strong>Risk factors:</strong> {chunk.riskFactors.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}