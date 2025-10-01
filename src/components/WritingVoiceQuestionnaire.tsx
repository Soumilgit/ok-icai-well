'use client';

import React, { useState } from 'react';
import { WritingVoiceService, QuestionnaireQuestion, UserPreferences } from '../lib/writing-voice-service';

interface QuestionnaireProps {
  onComplete?: (preferences: UserPreferences) => void;
  onClose?: () => void;
}

export default function WritingVoiceQuestionnaire({ onComplete, onClose }: QuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<{ [questionId: string]: any }>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const writingVoiceService = new WritingVoiceService();
  const questions = writingVoiceService.getQuestionnaire();
  const totalSteps = questions.length;

  const handleResponse = (questionId: string, answer: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsAnalyzing(true);
    try {
      const preferences = writingVoiceService.analyzeResponses(responses);
      
      // Save preferences to localStorage for later use
      localStorage.setItem('writing_voice_preferences', JSON.stringify(preferences));
      
      // Call onComplete if provided
      if (onComplete) {
        onComplete(preferences);
      }
      
      // Show success message if no onComplete callback
      if (!onComplete) {
        alert(`Your writing voice has been set to: ${preferences.writingVoice.name}\n\nYou can now use personalized content generation throughout the platform!`);
      }
    } catch (error) {
      console.error('Error analyzing responses:', error);
      alert('There was an error analyzing your responses. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isCurrentQuestionAnswered = () => {
    const currentQuestion = questions[currentStep];
    const response = responses[currentQuestion.id];
    
    if (currentQuestion.type === 'multiple-choice') {
      return Array.isArray(response) && response.length > 0;
    }
    
    return response !== undefined && response !== '';
  };

  const renderQuestion = (question: QuestionnaireQuestion) => {
    const response = responses[question.id];

    switch (question.type) {
      case 'single-choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={response === option}
                  onChange={(e) => handleResponse(question.id, e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(response) && response.includes(option)}
                  onChange={(e) => {
                    const currentResponses = Array.isArray(response) ? response : [];
                    if (e.target.checked) {
                      handleResponse(question.id, [...currentResponses, option]);
                    } else {
                      handleResponse(question.id, currentResponses.filter(r => r !== option));
                    }
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'scale':
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>1 (Not at all)</span>
              <span>10 (Extremely)</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={response || 5}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-center">
              <span className="text-lg font-semibold text-blue-600">{response || 5}</span>
            </div>
          </div>
        );

      case 'text':
        return (
          <textarea
            value={response || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            placeholder="Type your answer here..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        );

      default:
        return null;
    }
  };

  if (isAnalyzing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Your Preferences</h3>
            <p className="text-gray-600">We're determining your ideal writing voice...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Writing Voice Assessment</h2>
              <p className="text-gray-600 mt-1">
                Help us personalize your content creation experience
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Question {currentStep + 1} of {totalSteps}</span>
              <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-6">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mb-3">
              {questions[currentStep].category.replace('-', ' ').toUpperCase()}
            </span>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {questions[currentStep].question}
            </h3>
          </div>

          {renderQuestion(questions[currentStep])}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <button
              onClick={handleNext}
              disabled={!isCurrentQuestionAnswered()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === totalSteps - 1 ? 'Complete Assessment' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}