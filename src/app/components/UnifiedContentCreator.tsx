'use client';

import React, { useState, useEffect } from 'react';
import { RAGCacheService, QuizResponse, VoiceType, VOICE_PATTERNS } from '@/lib/rag-cache';
import { ICAIComplianceChecker, ComplianceResult } from '@/lib/icai-guidelines';

interface UnifiedContentCreatorProps {}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'text' | 'scale';
  options?: string[];
  weight: number;
}

const VOICE_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'content_style',
    question: 'What type of content do you prefer creating?',
    type: 'multiple-choice',
    options: [
      'Personal stories and experiences',
      'Strong opinions and takes on industry issues', 
      'Factual information and data',
      'Urgent warnings and important updates',
      'Step-by-step guides and frameworks'
    ],
    weight: 3
  },
  {
    id: 'expertise_area',
    question: 'What is your primary area of CA expertise?',
    type: 'multiple-choice',
    options: [
      'Taxation and GST',
      'Auditing and Assurance',
      'Corporate Advisory',
      'Compliance and Regulations',
      'General Practice'
    ],
    weight: 2
  },
  {
    id: 'target_audience',
    question: 'Who is your primary audience?',
    type: 'multiple-choice',
    options: [
      'Fellow CAs and professionals',
      'Business owners and entrepreneurs',
      'CA students and aspiring professionals',
      'General public seeking tax advice',
      'Corporate clients'
    ],
    weight: 2
  },
  {
    id: 'communication_style',
    question: 'How do you prefer to communicate complex topics?',
    type: 'multiple-choice',
    options: [
      'Through relatable stories and analogies',
      'Direct and to-the-point explanations',
      'Data-driven facts and figures',
      'With urgency to emphasize importance',
      'Using structured frameworks and processes'
    ],
    weight: 3
  },
  {
    id: 'content_goal',
    question: 'What is your main goal with content creation?',
    type: 'multiple-choice',
    options: [
      'Building personal brand through storytelling',
      'Establishing thought leadership',
      'Educating and informing my audience',
      'Warning about critical issues',
      'Providing actionable guidance'
    ],
    weight: 2
  }
];

export default function UnifiedContentCreator({}: UnifiedContentCreatorProps) {
  const [currentStep, setCurrentStep] = useState<'quiz' | 'research' | 'create' | 'review'>('quiz');
  const [quizResponses, setQuizResponses] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [researchQuery, setResearchQuery] = useState('');
  const [researchResults, setResearchResults] = useState<any[]>([]);
  const [loadingResearch, setLoadingResearch] = useState(false);
  const [contentTopic, setContentTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>('Fact Presenter');
  const [targetPlatform, setTargetPlatform] = useState<'linkedin' | 'twitter' | 'both'>('linkedin');
  const [complianceCheck, setComplianceCheck] = useState<ComplianceResult | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  const ragCache = RAGCacheService.getInstance();

  const handleQuizAnswer = (answer: string) => {
    const currentQuestion = VOICE_QUIZ_QUESTIONS[currentQuestionIndex];
    setQuizResponses(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));

    if (currentQuestionIndex < VOICE_QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz completed, process responses
      completeQuiz();
    }
  };

  const completeQuiz = () => {
    const responses: QuizResponse[] = Object.entries(quizResponses).map(([questionId, answer]) => {
      const question = VOICE_QUIZ_QUESTIONS.find(q => q.id === questionId)!;
      return {
        questionId,
        question: question.question,
        answer,
        weight: question.weight
      };
    });

    const userId = 'current-user'; // In production, get from auth
    const profile = ragCache.updateUserProfile(userId, responses);
    setUserProfile(profile);
    setSelectedVoice(profile.preferences.primaryVoice);
    setCurrentStep('research');
  };

  const handleResearch = async () => {
    if (!researchQuery.trim()) return;
    
    setLoadingResearch(true);
    try {
      // Simulate Perplexity API call - in production, integrate with actual API
      const mockResults = [
        {
          title: `Latest ${researchQuery} Updates in 2025`,
          summary: `Recent developments in ${researchQuery} affecting CA professionals...`,
          source: 'ICAI.org',
          date: '2025-01-15',
          url: '#'
        },
        {
          title: `${researchQuery} Compliance Changes`,
          summary: `New regulations regarding ${researchQuery} that CAs need to know...`,
          source: 'GST Council',
          date: '2025-01-10', 
          url: '#'
        },
        {
          title: `Industry Analysis: ${researchQuery} Trends`,
          summary: `Market trends and implications for ${researchQuery} in the CA profession...`,
          source: 'CA Today',
          date: '2025-01-05',
          url: '#'
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setResearchResults(mockResults);
      setCurrentStep('create');
    } catch (error) {
      console.error('Research error:', error);
    } finally {
      setLoadingResearch(false);
    }
  };

  const generateContent = async () => {
    if (!contentTopic.trim() || !userProfile) return;

    setLoadingContent(true);
    try {
      // Generate content using RAG cache bias
      const userId = 'current-user';
      const biasedContent = ragCache.generateBiasedContent(userId, contentTopic, targetPlatform === 'twitter' ? 'twitter' : 'linkedin');
      
      // Apply voice pattern
      const voicePattern = VOICE_PATTERNS[selectedVoice];
      let enhancedContent = biasedContent.content;

      // Add voice-specific enhancements
      switch (selectedVoice) {
        case 'Storyteller':
          enhancedContent = `Here's a story about ${contentTopic} that changed my perspective:\n\n${enhancedContent}\n\nWhat's your experience with this? Share your story in the comments.`;
          break;
        case 'Opinionator':
          enhancedContent = `My take on ${contentTopic}:\n\n${enhancedContent}\n\nDisagree? Let's discuss. The CA profession needs more of these conversations.`;
          break;
        case 'Fact Presenter':
          enhancedContent = `Essential facts about ${contentTopic}:\n\n${enhancedContent}\n\nSource: Latest ICAI guidelines and industry data.`;
          break;
        case 'F-Bomber':
          enhancedContent = `URGENT: ${contentTopic} update you cannot ignore!\n\n${enhancedContent}\n\nAction required: Review your current practices immediately.`;
          break;
        case 'Frameworker':
          enhancedContent = `My proven framework for ${contentTopic}:\n\n${enhancedContent}\n\nSave this post for reference. Share with colleagues who need this framework.`;
          break;
      }

      setGeneratedContent(enhancedContent);

      // Check ICAI compliance
      const compliance = ICAIComplianceChecker.checkContent(enhancedContent);
      setComplianceCheck(compliance);

      setCurrentStep('review');
    } catch (error) {
      console.error('Content generation error:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const generateImage = async () => {
    setLoadingImage(true);
    try {
      // Simulate image generation - in production, integrate with DALL-E or similar
      await new Promise(resolve => setTimeout(resolve, 3000));
      setGeneratedImage('/api/placeholder-image'); // Placeholder for generated image
    } catch (error) {
      console.error('Image generation error:', error);
    } finally {
      setLoadingImage(false);
    }
  };

  const resetProcess = () => {
    setCurrentStep('quiz');
    setCurrentQuestionIndex(0);
    setQuizResponses({});
    setUserProfile(null);
    setResearchQuery('');
    setResearchResults([]);
    setContentTopic('');
    setGeneratedContent('');
    setComplianceCheck(null);
    setGeneratedImage(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">🎯 Unified Content Creator</h1>
          <p className="text-xl text-purple-100">
            Complete workflow: Voice profiling → AI research → Content generation → Visual creation
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[
              { key: 'quiz', label: 'Voice Quiz', icon: '📋' },
              { key: 'research', label: 'AI Research', icon: '🔍' },
              { key: 'create', label: 'Generate', icon: '✨' },
              { key: 'review', label: 'Review', icon: '👀' }
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  currentStep === step.key ? 'bg-purple-600 border-purple-400' :
                  ['quiz', 'research', 'create', 'review'].indexOf(currentStep) > index ? 'bg-green-600 border-green-400' :
                  'bg-gray-700 border-gray-500'
                }`}>
                  <span className="text-lg">{step.icon}</span>
                </div>
                <span className="ml-2 text-sm font-medium">{step.label}</span>
                {index < 3 && <div className="w-8 h-0.5 bg-gray-600 mx-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'quiz' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-600">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Voice Profiling Quiz</h2>
                  <span className="text-sm bg-purple-600 px-3 py-1 rounded-full">
                    {currentQuestionIndex + 1} / {VOICE_QUIZ_QUESTIONS.length}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / VOICE_QUIZ_QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              {currentQuestionIndex < VOICE_QUIZ_QUESTIONS.length && (
                <div>
                  <h3 className="text-xl font-semibold mb-6">
                    {VOICE_QUIZ_QUESTIONS[currentQuestionIndex].question}
                  </h3>
                  <div className="space-y-3">
                    {VOICE_QUIZ_QUESTIONS[currentQuestionIndex].options?.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleQuizAnswer(option)}
                        className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors border border-gray-600 hover:border-purple-500"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 'research' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-600">
              <h2 className="text-2xl font-bold mb-6">🔍 AI-Powered Research</h2>
              
              {userProfile && (
                <div className="bg-purple-900/30 rounded-lg p-4 mb-6 border border-purple-700">
                  <h3 className="font-semibold text-purple-300 mb-2">Your Content Voice Profile:</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Primary Voice:</span>
                      <span className="ml-2 text-white font-medium">{userProfile.preferences.primaryVoice}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Focus Areas:</span>
                      <span className="ml-2 text-white">{userProfile.preferences.industryFocus.join(', ')}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Research Topic</label>
                  <input
                    type="text"
                    value={researchQuery}
                    onChange={(e) => setResearchQuery(e.target.value)}
                    placeholder="e.g., GST changes 2025, new audit standards, tax planning strategies..."
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleResearch}
                  disabled={loadingResearch || !researchQuery.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition-colors font-semibold"
                >
                  {loadingResearch ? 'Researching...' : '🔍 Start AI Research'}
                </button>
              </div>

              {researchResults.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Research Results</h3>
                  <div className="grid gap-4">
                    {researchResults.map((result, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        <h4 className="font-semibold text-lg mb-2">{result.title}</h4>
                        <p className="text-gray-300 mb-2">{result.summary}</p>
                        <div className="flex justify-between items-center text-sm text-gray-400">
                          <span>Source: {result.source}</span>
                          <span>{result.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentStep('create')}
                    className="mt-6 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors font-semibold"
                  >
                    Proceed to Content Creation →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 'create' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-600">
              <h2 className="text-2xl font-bold mb-6">✨ Content Generation</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Content Topic</label>
                  <input
                    type="text"
                    value={contentTopic}
                    onChange={(e) => setContentTopic(e.target.value)}
                    placeholder="What do you want to write about?"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Voice Style</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value as VoiceType)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {Object.keys(VOICE_PATTERNS).map(voice => (
                      <option key={voice} value={voice}>{voice}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Target Platform</label>
                <div className="flex space-x-4">
                  {[
                    { key: 'linkedin', label: 'LinkedIn', icon: '💼' },
                    { key: 'twitter', label: 'Twitter/X', icon: '𝕏' },
                    { key: 'both', label: 'Both', icon: '📱' }
                  ].map(platform => (
                    <button
                      key={platform.key}
                      onClick={() => setTargetPlatform(platform.key as any)}
                      className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                        targetPlatform === platform.key
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <span className="mr-2">{platform.icon}</span>
                      {platform.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={generateContent}
                  disabled={loadingContent || !contentTopic.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition-colors font-semibold flex items-center"
                >
                  {loadingContent ? 'Generating...' : '✨ Generate Content'}
                </button>
                <button
                  onClick={generateImage}
                  disabled={loadingImage}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition-colors font-semibold flex items-center"
                >
                  {loadingImage ? 'Creating...' : '🎨 Generate Image'}
                </button>
              </div>

              {generatedImage && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Generated Visual</h3>
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-6xl mb-2">🖼️</div>
                    <p className="text-gray-300">AI-generated image would appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 'review' && generatedContent && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-600">
              <h2 className="text-2xl font-bold mb-6">👀 Review & Compliance Check</h2>
              
              {/* Compliance Status */}
              {complianceCheck && (
                <div className={`rounded-lg p-4 mb-6 border ${
                  complianceCheck.isCompliant 
                    ? 'bg-green-900/30 border-green-700' 
                    : 'bg-red-900/30 border-red-700'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">ICAI Compliance Status</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      complianceCheck.isCompliant ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {complianceCheck.isCompliant ? '✅ Compliant' : '⚠️ Issues Found'}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span>Compliance Score: {complianceCheck.score}/100</span>
                  </div>
                  {complianceCheck.violations.length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-medium text-red-300 mb-2">Issues to Address:</h4>
                      <ul className="text-sm space-y-1">
                        {complianceCheck.violations.map((violation, index) => (
                          <li key={index} className="text-red-200">
                            • {violation.suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Generated Content */}
              <div className="bg-gray-700 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-4">Generated Content ({selectedVoice} voice)</h3>
                <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                  {generatedContent}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors font-semibold"
                  onClick={() => {
                    // In production, integrate with posting APIs
                    alert('Content would be posted to selected platforms');
                  }}
                >
                  📤 Post to Platforms
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors font-semibold"
                  onClick={() => setCurrentStep('create')}
                >
                  ✏️ Edit Content
                </button>
                <button
                  className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg transition-colors font-semibold"
                  onClick={resetProcess}
                >
                  🔄 Start Over
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}