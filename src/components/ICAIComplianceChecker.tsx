'use client';

import React, { useState } from 'react';
import { ICAIComplianceService, ComplianceReport, ComplianceViolation } from '../lib/icai-compliance';

export default function ICAIComplianceChecker() {
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('linkedin-post');
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [alternatives, setAlternatives] = useState<{ [key: string]: string[] }>({});

  const complianceService = new ICAIComplianceService();

  const contentTypes = [
    { value: 'linkedin-post', label: 'LinkedIn Post' },
    { value: 'article', label: 'Article' },
    { value: 'case-study', label: 'Case Study' },
    { value: 'marketing', label: 'Marketing Content' },
    { value: 'tax-advice', label: 'Tax Advice' },
    { value: 'financial-advice', label: 'Financial Advice' },
    { value: 'regulatory-update', label: 'Regulatory Update' },
    { value: 'general', label: 'General Content' }
  ];

  const handleCheck = async () => {
    if (!content.trim()) return;

    setIsChecking(true);
    try {
      const report = await complianceService.checkCompliance(content, contentType);
      setComplianceReport(report);
    } catch (error) {
      console.error('Error checking compliance:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleGetAlternatives = async (violation: ComplianceViolation) => {
    try {
      const suggestionAlternatives = await complianceService.suggestCompliantAlternatives(
        violation.context,
        violation
      );
      setAlternatives(prev => ({
        ...prev,
        [violation.ruleId]: suggestionAlternatives
      }));
    } catch (error) {
      console.error('Error getting alternatives:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Input Section */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ICAI Compliance Checker</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              {contentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content to Check
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your content here to check for ICAI compliance..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
            />
            <div className="text-sm text-gray-500 mt-1">
              {content.length} characters
            </div>
          </div>

          <button
            onClick={handleCheck}
            disabled={!content.trim() || isChecking}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChecking ? 'Checking Compliance...' : 'Check ICAI Compliance'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {complianceReport && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Compliance Score</h3>
              <div className="flex items-center space-x-2">
                <span className={`text-3xl font-bold ${getScoreColor(complianceReport.overallScore)}`}>
                  {complianceReport.overallScore.toFixed(0)}
                </span>
                <span className="text-gray-500">/100</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  complianceReport.isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {complianceReport.isCompliant ? '✓ Compliant' : '✗ Non-Compliant'}
                </div>
              </div>
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  complianceReport.reviewRequired ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {complianceReport.reviewRequired ? '⚠ Review Required' : '✓ Ready to Publish'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">
                  {complianceReport.violations.length} Violation{complianceReport.violations.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  complianceReport.overallScore >= 80 ? 'bg-green-500' :
                  complianceReport.overallScore >= 60 ? 'bg-yellow-500' :
                  complianceReport.overallScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${complianceReport.overallScore}%` }}
              ></div>
            </div>
          </div>

          {/* Violations */}
          {complianceReport.violations.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Compliance Issues</h3>
              <div className="space-y-4">
                {complianceReport.violations.map((violation, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{violation.rule.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(violation.rule.severity)}`}>
                        {violation.rule.severity.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{violation.description}</p>
                    
                    {violation.context && (
                      <div className="bg-gray-50 rounded p-2 mb-2">
                        <p className="text-xs text-gray-500 mb-1">Problematic text:</p>
                        <p className="text-sm font-mono">{violation.context}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-blue-600">{violation.suggestion}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {Math.round(violation.confidence * 100)}% confidence
                        </span>
                        <button
                          onClick={() => handleGetAlternatives(violation)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Get Alternatives
                        </button>
                      </div>
                    </div>

                    {alternatives[violation.ruleId] && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <p className="text-sm font-medium text-blue-900 mb-2">Suggested Alternatives:</p>
                        <ul className="space-y-1">
                          {alternatives[violation.ruleId].map((alt, altIndex) => (
                            <li key={altIndex} className="text-sm text-blue-800">
                              • {alt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {complianceReport.suggestions.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Improvement Suggestions</h3>
              <ul className="space-y-2">
                {complianceReport.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">💡</span>
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer Generator */}
          <DisclaimerGenerator contentType={contentType} />

          {/* Compliance Checklist */}
          <ComplianceChecklist contentType={contentType} />
        </div>
      )}
    </div>
  );
}

function DisclaimerGenerator({ contentType }: { contentType: string }) {
  const [disclaimer, setDisclaimer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const complianceService = new ICAIComplianceService();

  const generateDisclaimer = async () => {
    setIsGenerating(true);
    try {
      const generatedDisclaimer = await complianceService.generateComplianceDisclaimer(contentType);
      setDisclaimer(generatedDisclaimer);
    } catch (error) {
      console.error('Error generating disclaimer:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Compliance Disclaimer</h3>
      <p className="text-sm text-gray-600 mb-4">
        Generate an appropriate disclaimer for your {contentType} content to ensure ICAI compliance.
      </p>
      
      <button
        onClick={generateDisclaimer}
        disabled={isGenerating}
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {isGenerating ? 'Generating...' : 'Generate Disclaimer'}
      </button>

      {disclaimer && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-900">Suggested Disclaimer:</h4>
            <button
              onClick={() => navigator.clipboard.writeText(disclaimer)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Copy
            </button>
          </div>
          <p className="text-sm text-gray-700 italic">{disclaimer}</p>
        </div>
      )}
    </div>
  );
}

function ComplianceChecklist({ contentType }: { contentType: string }) {
  const [checklist, setChecklist] = useState<string[]>([]);
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>({});

  const complianceService = new ICAIComplianceService();

  React.useEffect(() => {
    const loadChecklist = async () => {
      const items = await complianceService.createComplianceChecklist(contentType);
      setChecklist(items);
      setCheckedItems({});
    };
    loadChecklist();
  }, [contentType]);

  const handleCheck = (index: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const completedItems = Object.values(checkedItems).filter(Boolean).length;
  const completionPercentage = checklist.length > 0 ? (completedItems / checklist.length) * 100 : 0;

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Compliance Checklist</h3>
        <span className="text-sm text-gray-600">
          {completedItems}/{checklist.length} completed ({completionPercentage.toFixed(0)}%)
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        ></div>
      </div>

      <div className="space-y-3">
        {checklist.map((item, index) => (
          <label key={index} className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checkedItems[index] || false}
              onChange={() => handleCheck(index)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className={`text-sm ${checkedItems[index] ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
              {item}
            </span>
          </label>
        ))}
      </div>

      {completionPercentage === 100 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            ✅ All compliance checks completed! Your content is ready for review.
          </p>
        </div>
      )}
    </div>
  );
}