'use client';

import React, { useState, useEffect } from 'react';
import { ImageGenerationService, ImageGenerationRequest, GeneratedImage } from '@/lib/image-generation';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<'professional' | 'modern' | 'minimalist' | 'infographic' | 'social-media'>('professional');
  const [size, setSize] = useState<'1080x1080' | '1200x630' | '800x600' | '1920x1080' | '1328x1328' | '1664x928' | '928x1664' | '1472x1140' | '1140x1472' | '1584x1056' | '1056x1584'>('1080x1080');
  const [theme, setTheme] = useState('');
  const [language, setLanguage] = useState<'en' | 'zh'>('en');
  const [branding, setBranding] = useState({
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    logoUrl: '',
    fontStyle: 'Arial'
  });
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [savedImages, setSavedImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery' | 'templates'>('generate');
  const [selectedContentType, setSelectedContentType] = useState('general');
  const [presetPrompts, setPresetPrompts] = useState<string[]>([]);

  const imageService = new ImageGenerationService();

  // CA-specific themes
  const caThemes = [
    'Tax Planning and Compliance',
    'Financial Audit and Assurance',
    'Business Advisory Services',
    'Corporate Finance',
    'Risk Management',
    'Digital Accounting',
    'GST and Indirect Taxes',
    'Investment Advisory',
    'Business Valuation',
    'Regulatory Compliance'
  ];

  // Content type specific prompts
  const contentTypes = {
    'tax-planning': 'Tax Planning and Advisory',
    'audit': 'Audit and Assurance',
    'financial-advisory': 'Financial Advisory Services',
    'compliance': 'Regulatory Compliance',
    'general': 'General Accounting Services'
  };

  useEffect(() => {
    loadSavedImages();
    updatePresetPrompts();
  }, [selectedContentType]);

  const loadSavedImages = async () => {
    try {
      const saved = await imageService.getSavedImages();
      setSavedImages(saved);
    } catch (error) {
      console.error('Error loading saved images:', error);
    }
  };

  const updatePresetPrompts = () => {
    const prompts = imageService.generateCASpecificPrompts('accounting', selectedContentType);
    setPresetPrompts(prompts);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const request: ImageGenerationRequest = {
        prompt: prompt.trim(),
        style,
        size,
        theme: theme || caThemes[0],
        language,
        branding
      };

      const image = await imageService.generateImage(request);
      setGeneratedImages(prev => [image, ...prev]);
      
      // Auto-save generated image
      await imageService.saveImage(image);
      await loadSavedImages();
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVariations = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const variations = await imageService.generateTemplateVariations(prompt.trim(), 3);
      setGeneratedImages(prev => [...variations, ...prev]);
      
      // Save all variations
      for (const variation of variations) {
        await imageService.saveImage(variation);
      }
      await loadSavedImages();
    } catch (error) {
      console.error('Error generating variations:', error);
      alert('Failed to generate variations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      await imageService.downloadImage(image);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  const handleUsePreset = (presetPrompt: string) => {
    setPrompt(presetPrompt);
  };

  const clearGenerated = () => {
    generatedImages.forEach(img => {
      if (img.url.startsWith('blob:')) {
        URL.revokeObjectURL(img.url);
      }
    });
    setGeneratedImages([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Image Generator</h1>
        <p className="text-gray-600">Create professional images for your accounting and finance content</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'generate', label: 'Generate', icon: '🎨' },
              { id: 'gallery', label: 'Gallery', icon: '🖼️' },
              { id: 'templates', label: 'Templates', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content Type
                    </label>
                    <select
                      value={selectedContentType}
                      onChange={(e) => setSelectedContentType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      {Object.entries(contentTypes).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image Description
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the image you want to create..."
                      className="w-full h-24 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                      maxLength={500}
                    />
                    <div className="text-xs text-gray-500 mt-1">{prompt.length}/500 characters</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Style
                      </label>
                      <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value as any)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      >
                        <option value="professional">Professional</option>
                        <option value="modern">Modern</option>
                        <option value="minimalist">Minimalist</option>
                        <option value="infographic">Infographic</option>
                        <option value="social-media">Social Media</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Size
                      </label>
                      <select
                        value={size}
                        onChange={(e) => setSize(e.target.value as any)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      >
                        <optgroup label="Standard Sizes">
                          <option value="1080x1080">Square (1080×1080)</option>
                          <option value="1200x630">Facebook/LinkedIn (1200×630)</option>
                          <option value="800x600">Standard (800×600)</option>
                          <option value="1920x1080">Widescreen (1920×1080)</option>
                        </optgroup>
                        <optgroup label="Qwen-Image Optimized">
                          <option value="1328x1328">Square HD (1328×1328)</option>
                          <option value="1664x928">Wide HD (1664×928)</option>
                          <option value="928x1664">Portrait HD (928×1664)</option>
                          <option value="1472x1140">Landscape Pro (1472×1140)</option>
                          <option value="1140x1472">Portrait Pro (1140×1472)</option>
                          <option value="1584x1056">Wide Pro (1584×1056)</option>
                          <option value="1056x1584">Tall Pro (1056×1584)</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme
                    </label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="">Select a theme...</option>
                      {caThemes.map((themeOption) => (
                        <option key={themeOption} value={themeOption}>{themeOption}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'en' | 'zh')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="en">English (Better for Qwen-Image)</option>
                      <option value="zh">中文 (Chinese Text Rendering)</option>
                    </select>
                  </div>

                  {/* Branding Options */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Brand Colors</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Primary Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={branding.primaryColor}
                            onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="w-8 h-8 rounded border"
                          />
                          <input
                            type="text"
                            value={branding.primaryColor}
                            onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="flex-1 text-xs border rounded px-2 py-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Secondary Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={branding.secondaryColor}
                            onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="w-8 h-8 rounded border"
                          />
                          <input
                            type="text"
                            value={branding.secondaryColor}
                            onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="flex-1 text-xs border rounded px-2 py-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Generation Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={handleGenerate}
                      disabled={loading || !prompt.trim()}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Generating...' : 'Generate Image'}
                    </button>
                    <button
                      onClick={handleGenerateVariations}
                      disabled={loading || !prompt.trim()}
                      className="flex-1 border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      Generate 3 Variations
                    </button>
                  </div>
                </div>

                {/* Preset Prompts */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Start Prompts</h3>
                  <div className="space-y-2">
                    {presetPrompts.map((presetPrompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleUsePreset(presetPrompt)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                      >
                        <div className="text-sm text-gray-900">{presetPrompt}</div>
                      </button>
                    ))}
                  </div>

                  {/* Style Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Style Preview</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium">Professional</div>
                        <div className="text-gray-600">Clean, corporate, business-appropriate</div>
                      </div>
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium">Modern</div>
                        <div className="text-gray-600">Contemporary, sleek, minimalist</div>
                      </div>
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium">Infographic</div>
                        <div className="text-gray-600">Data visualization, charts, informative</div>
                      </div>
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium">Social Media</div>
                        <div className="text-gray-600">Engaging, eye-catching, optimized</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generated Images */}
              {generatedImages.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Generated Images</h3>
                    <button
                      onClick={clearGenerated}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedImages.map((image) => (
                      <div key={image.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="aspect-square">
                          <img
                            src={image.url}
                            alt={image.prompt}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <div className="text-sm text-gray-600 mb-2 line-clamp-2">{image.prompt}</div>
                          <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                            <span>{image.style}</span>
                            <span>{image.size}</span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDownload(image)}
                              className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            >
                              Download
                            </button>
                            <button className="flex-1 border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-50">
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Saved Images</h3>
                <button
                  onClick={loadSavedImages}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Refresh
                </button>
              </div>

              {savedImages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📷</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No saved images</h3>
                  <p className="text-gray-600">Generate some images to see them here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {savedImages.map((image) => (
                    <div key={image.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-square">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <div className="text-sm text-gray-600 mb-2 line-clamp-2">{image.prompt}</div>
                        <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                          <span>{image.style}</span>
                          <span>{image.createdAt.toLocaleDateString()}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDownload(image)}
                            className="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                          >
                            Download
                          </button>
                          <button className="flex-1 border border-gray-300 px-2 py-1 rounded text-xs hover:bg-gray-50">
                            Use
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">CA-Specific Templates</h3>
                <p className="text-gray-600 mb-6">Pre-designed prompts for common CA content needs</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(contentTypes).map(([key, label]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">{label}</h4>
                    <div className="space-y-2">
                      {imageService.generateCASpecificPrompts('accounting', key).map((template, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedContentType(key);
                            setPrompt(template);
                            setActiveTab('generate');
                          }}
                          className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          <div className="text-sm text-gray-900">{template}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Template Categories */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-3">Popular Use Cases</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded p-3">
                    <div className="font-medium text-gray-900 mb-1">Social Media Posts</div>
                    <div className="text-sm text-gray-600">Professional quote cards, tips, announcements</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="font-medium text-gray-900 mb-1">Blog Headers</div>
                    <div className="text-sm text-gray-600">Article banners, featured images</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="font-medium text-gray-900 mb-1">Presentations</div>
                    <div className="text-sm text-gray-600">Title slides, section dividers</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="font-medium text-gray-900 mb-1">Marketing Materials</div>
                    <div className="text-sm text-gray-600">Flyers, brochures, advertisements</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="font-medium text-gray-900 mb-1">Infographics</div>
                    <div className="text-sm text-gray-600">Data visualization, process flows</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="font-medium text-gray-900 mb-1">Website Graphics</div>
                    <div className="text-sm text-gray-600">Hero images, service illustrations</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;