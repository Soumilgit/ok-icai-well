'use client';

import React, { useState } from 'react';
import { GeminiService } from '../lib/gemini-service';
import { UserPreferences } from '../lib/writing-voice-service';

interface CaseStudyProps {
  userPreferences: UserPreferences;
}

interface CaseStudyData {
  title: string;
  client: {
    name: string;
    industry: string;
    size: string;
    location: string;
    anonymize: boolean;
  };
  challenge: {
    description: string;
    impact: string;
    urgency: 'low' | 'medium' | 'high';
    category: string;
  };
  solution: {
    approach: string;
    steps: string[];
    timeline: string;
    resources: string[];
  };
  results: {
    metrics: Array<{
      metric: string;
      before: string;
      after: string;
      improvement: string;
    }>;
    qualitativeResults: string[];
    clientFeedback: string;
  };
  targetAudience: string[];
  keyTakeaways: string[];
}

export default function CaseStudyGenerator({ userPreferences }: CaseStudyProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [caseStudyData, setCaseStudyData] = useState<CaseStudyData>({
    title: '',
    client: {
      name: '',
      industry: '',
      size: '',
      location: '',
      anonymize: true
    },
    challenge: {
      description: '',
      impact: '',
      urgency: 'medium',
      category: ''
    },
    solution: {
      approach: '',
      steps: [''],
      timeline: '',
      resources: ['']
    },
    results: {
      metrics: [{ metric: '', before: '', after: '', improvement: '' }],
      qualitativeResults: [''],
      clientFeedback: ''
    },
    targetAudience: [],
    keyTakeaways: ['']
  });
  const [generatedCaseStudy, setGeneratedCaseStudy] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const geminiService = new GeminiService();

  const steps = [
    'Client Information',
    'Challenge Definition',
    'Solution Approach',
    'Results & Metrics',
    'Target Audience',
    'Review & Generate'
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const updateCaseStudyData = (section: keyof CaseStudyData, data: any) => {
    setCaseStudyData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  const addArrayItem = (section: keyof CaseStudyData, field: string, item: any = '') => {
    setCaseStudyData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...(prev[section] as any)[field], item]
      }
    }));
  };

  const removeArrayItem = (section: keyof CaseStudyData, field: string, index: number) => {
    setCaseStudyData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: (prev[section] as any)[field].filter((_: any, i: number) => i !== index)
      }
    }));
  };

  const updateArrayItem = (section: keyof CaseStudyData, field: string, index: number, value: any) => {
    setCaseStudyData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: (prev[section] as any)[field].map((item: any, i: number) => 
          i === index ? value : item
        )
      }
    }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await geminiService.generateCaseStudy(caseStudyData);
      setGeneratedCaseStudy(response || '');
    } catch (error) {
      console.error('Error generating case study:', error);
      alert('Failed to generate case study. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };



  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ClientInformationStep
            data={caseStudyData.client}
            onChange={(data) => updateCaseStudyData('client', data)}
          />
        );
      case 1:
        return (
          <ChallengeDefinitionStep
            data={caseStudyData.challenge}
            onChange={(data) => updateCaseStudyData('challenge', data)}
          />
        );
      case 2:
        return (
          <SolutionApproachStep
            data={caseStudyData.solution}
            onChange={(data) => updateCaseStudyData('solution', data)}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
            updateArrayItem={updateArrayItem}
          />
        );
      case 3:
        return (
          <ResultsMetricsStep
            data={caseStudyData.results}
            onChange={(data) => updateCaseStudyData('results', data)}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
            updateArrayItem={updateArrayItem}
          />
        );
      case 4:
        return (
          <TargetAudienceStep
            data={caseStudyData}
            onChange={setCaseStudyData}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
            updateArrayItem={updateArrayItem}
          />
        );
      case 5:
        return (
          <ReviewGenerateStep
            data={caseStudyData}
            generatedCaseStudy={generatedCaseStudy}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm">
          {steps.map((step, index) => (
            <span
              key={index}
              className={`${
                index <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'
              }`}
            >
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {steps[currentStep]}
        </h2>
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <button
          onClick={handleNext}
          disabled={currentStep === steps.length - 1}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
}

// Step Components
function ClientInformationStep({ data, onChange }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Case Study Title</label>
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder="e.g., How We Helped XYZ Corp Save 30% on Tax Compliance"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="ABC Corporation"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
          <input
            type="text"
            value={data.industry}
            onChange={(e) => onChange({ ...data, industry: e.target.value })}
            placeholder="Manufacturing, IT, Healthcare, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
          <select
            value={data.size}
            onChange={(e) => onChange({ ...data, size: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="">Select size</option>
            <option value="startup">Startup (1-10 employees)</option>
            <option value="small">Small (11-50 employees)</option>
            <option value="medium">Medium (51-200 employees)</option>
            <option value="large">Large (201-1000 employees)</option>
            <option value="enterprise">Enterprise (1000+ employees)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <input
            type="text"
            value={data.location}
            onChange={(e) => onChange({ ...data, location: e.target.value })}
            placeholder="Mumbai, Delhi, Bangalore, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.anonymize}
            onChange={(e) => onChange({ ...data, anonymize: e.target.checked })}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">Anonymize client name in case study</span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          When checked, the client name will be replaced with a generic description
        </p>
      </div>
    </div>
  );
}

function ChallengeDefinitionStep({ data, onChange }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-black mb-2">Challenge Description</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Describe the main challenge or problem the client was facing..."
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black bg-white placeholder-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">Business Impact</label>
        <textarea
          value={data.impact}
          onChange={(e) => onChange({ ...data, impact: e.target.value })}
          placeholder="How was this challenge affecting the client's business? Include financial, operational, or strategic impacts..."
          className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black bg-white placeholder-gray-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-2">Urgency Level</label>
          <select
            value={data.urgency}
            onChange={(e) => onChange({ ...data, urgency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black bg-white"
          >
            <option value="low">Low - Could be addressed over time</option>
            <option value="medium">Medium - Needed timely resolution</option>
            <option value="high">High - Required immediate attention</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-2">Challenge Category</label>
          <select
            value={data.category}
            onChange={(e) => onChange({ ...data, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black bg-white"
          >
            <option value="">Select category</option>
            <option value="tax-compliance">Tax Compliance</option>
            <option value="audit">Audit & Assurance</option>
            <option value="financial-reporting">Financial Reporting</option>
            <option value="risk-management">Risk Management</option>
            <option value="process-optimization">Process Optimization</option>
            <option value="regulatory-compliance">Regulatory Compliance</option>
            <option value="cost-reduction">Cost Reduction</option>
            <option value="growth-strategy">Growth Strategy</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function SolutionApproachStep({ data, onChange, addArrayItem, removeArrayItem, updateArrayItem }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-black mb-2">Solution Approach</label>
        <textarea
          value={data.approach}
          onChange={(e) => onChange({ ...data, approach: e.target.value })}
          placeholder="Describe your overall approach and strategy to solve the challenge..."
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">Implementation Steps</label>
        {data.steps.map((step: string, index: number) => (
          <div key={index} className="flex gap-2 mb-2">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
              {index + 1}
            </span>
            <input
              type="text"
              value={step}
              onChange={(e) => updateArrayItem('solution', 'steps', index, e.target.value)}
              placeholder={`Step ${index + 1}`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
            />
            {data.steps.length > 1 && (
              <button
                onClick={() => removeArrayItem('solution', 'steps', index)}
                className="px-2 py-2 text-red-600 hover:bg-red-50 rounded"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => addArrayItem('solution', 'steps', '')}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          + Add Step
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-2">Timeline</label>
          <input
            type="text"
            value={data.timeline}
            onChange={(e) => onChange({ ...data, timeline: e.target.value })}
            placeholder="e.g., 3 months, 6 weeks, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">Resources Used</label>
        {data.resources.map((resource: string, index: number) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={resource}
              onChange={(e) => updateArrayItem('solution', 'resources', index, e.target.value)}
              placeholder="e.g., Team of 3 CAs, Specialized software, etc."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
            />
            {data.resources.length > 1 && (
              <button
                onClick={() => removeArrayItem('solution', 'resources', index)}
                className="px-2 py-2 text-red-600 hover:bg-red-50 rounded"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => addArrayItem('solution', 'resources', '')}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          + Add Resource
        </button>
      </div>
    </div>
  );
}

function ResultsMetricsStep({ data, onChange, addArrayItem, removeArrayItem, updateArrayItem }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-black mb-3">Quantitative Results</h4>
        {data.metrics.map((metric: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-4 gap-4 mb-2">
              <input
                type="text"
                value={metric.metric}
                onChange={(e) => updateArrayItem('results', 'metrics', index, { ...metric, metric: e.target.value })}
                placeholder="Metric name"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
              />
              <input
                type="text"
                value={metric.before}
                onChange={(e) => updateArrayItem('results', 'metrics', index, { ...metric, before: e.target.value })}
                placeholder="Before value"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
              />
              <input
                type="text"
                value={metric.after}
                onChange={(e) => updateArrayItem('results', 'metrics', index, { ...metric, after: e.target.value })}
                placeholder="After value"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
              />
              <input
                type="text"
                value={metric.improvement}
                onChange={(e) => updateArrayItem('results', 'metrics', index, { ...metric, improvement: e.target.value })}
                placeholder="% improvement"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
            {data.metrics.length > 1 && (
              <button
                onClick={() => removeArrayItem('results', 'metrics', index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove Metric
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => addArrayItem('results', 'metrics', { metric: '', before: '', after: '', improvement: '' })}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          + Add Metric
        </button>
      </div>

      <div>
        <h4 className="text-lg font-medium text-black mb-3">Qualitative Results</h4>
        {data.qualitativeResults.map((result: string, index: number) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={result}
              onChange={(e) => updateArrayItem('results', 'qualitativeResults', index, e.target.value)}
              placeholder="e.g., Improved team confidence, Better stakeholder relationships"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
            />
            {data.qualitativeResults.length > 1 && (
              <button
                onClick={() => removeArrayItem('results', 'qualitativeResults', index)}
                className="px-2 py-2 text-red-600 hover:bg-red-50 rounded"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => addArrayItem('results', 'qualitativeResults', '')}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          + Add Result
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">Client Feedback/Testimonial</label>
        <textarea
          value={data.clientFeedback}
          onChange={(e) => onChange({ ...data, clientFeedback: e.target.value })}
          placeholder="Include a quote from the client about the results or experience..."
          className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
        />
      </div>
    </div>
  );
}

function TargetAudienceStep({ data, onChange, addArrayItem, removeArrayItem, updateArrayItem }: any) {
  const audienceOptions = [
    'Fellow CAs and accounting professionals',
    'Business owners and entrepreneurs',
    'Corporate executives and CFOs',
    'Compliance officers and managers',
    'Students and young professionals',
    'Industry-specific professionals',
    'Government and regulatory bodies'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-black mb-2">Target Audience</label>
        <p className="text-sm text-black mb-3">
          Select who would be most interested in reading this case study
        </p>
        <div className="grid grid-cols-2 gap-2">
          {audienceOptions.map(option => (
            <label key={option} className="flex items-center">
              <input
                type="checkbox"
                checked={data.targetAudience.includes(option)}
                onChange={(e) => {
                  const newAudience = e.target.checked
                    ? [...data.targetAudience, option]
                    : data.targetAudience.filter((a: string) => a !== option);
                  onChange({ ...data, targetAudience: newAudience });
                }}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-black">{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">Key Takeaways</label>
        <p className="text-sm text-black mb-3">
          What are the main lessons or insights readers should gain from this case study?
        </p>
        {data.keyTakeaways.map((takeaway: string, index: number) => (
          <div key={index} className="flex gap-2 mb-2">
            <span className="flex-shrink-0 w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-medium">
              💡
            </span>
            <input
              type="text"
              value={takeaway}
              onChange={(e) => updateArrayItem('keyTakeaways', '', index, e.target.value)}
              placeholder="e.g., Proper planning can reduce compliance costs by 30%"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
            />
            {data.keyTakeaways.length > 1 && (
              <button
                onClick={() => {
                  const newTakeaways = data.keyTakeaways.filter((_: any, i: number) => i !== index);
                  onChange({ ...data, keyTakeaways: newTakeaways });
                }}
                className="px-2 py-2 text-red-600 hover:bg-red-50 rounded"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => onChange({ ...data, keyTakeaways: [...data.keyTakeaways, ''] })}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          + Add Takeaway
        </button>
      </div>
    </div>
  );
}

function ReviewGenerateStep({ data, generatedCaseStudy, isGenerating, onGenerate }: any) {
  const handleSave = () => {
    const saved = JSON.parse(localStorage.getItem('case_studies') || '[]');
    saved.push({
      id: Date.now().toString(),
      data,
      content: generatedCaseStudy,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('case_studies', JSON.stringify(saved));
    alert('Case study saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-black">Case Study Summary</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="text-black"><strong>Title:</strong> {data.title}</div>
          <div className="text-black"><strong>Client:</strong> {data.client.anonymize ? `[Anonymous ${data.client.industry} Company]` : data.client.name}</div>
          <div className="text-black"><strong>Challenge:</strong> {data.challenge.description.substring(0, 100)}...</div>
          <div className="text-black"><strong>Target Audience:</strong> {data.targetAudience.join(', ')}</div>
        </div>
      </div>

      <div>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isGenerating ? 'Generating Case Study...' : 'Generate Case Study'}
        </button>
      </div>

      {generatedCaseStudy && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-black">Generated Case Study</h3>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(generatedCaseStudy)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                Copy
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
              >
                Save
              </button>
            </div>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-6 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-black font-sans">
              {generatedCaseStudy}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}