'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Navigation from './app/components/Navigation';
import Footer from './app/components/Footer';
import Sidebar from './Sidebar';
import ChatInterface from './components/ChatInterface';

export default function Home() {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const fullText = 'CA Authority';

  // Typewriter effect for beta benefits
  const [benefitText, setBenefitText] = useState('');
  const [isDeletingBenefit, setIsDeletingBenefit] = useState(false);
  const [benefitIndex, setBenefitIndex] = useState(0);
  
  const benefits = [
    'Automated Content Generation',
    'LinkedIn Post Automation',
    'SEO-Optimized Articles',
    'Compliance Checking',
    'Tax Updates & News',
    'Professional Networking'
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Typewriter effect for main title
  useEffect(() => {
    if (!isClient) return;
    
    const timeout = setTimeout(() => {
      if (!isDeleting && displayText.length < fullText.length) {
          setDisplayText(fullText.slice(0, displayText.length + 1));
      } else if (isDeleting && displayText.length > 0) {
        setDisplayText(displayText.slice(0, -1));
      } else if (displayText.length === fullText.length && !isDeleting) {
          setTimeout(() => setIsDeleting(true), 2000);
      } else if (displayText.length === 0 && isDeleting) {
          setIsDeleting(false);
      }
    }, isDeleting ? 100 : 200);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, isClient]);

  // Typewriter effect for benefits
  useEffect(() => {
    if (!isClient) return;
    
    const timeout = setTimeout(() => {
      const currentBenefit = benefits[benefitIndex];
      if (!isDeletingBenefit && benefitText.length < currentBenefit.length) {
          setBenefitText(currentBenefit.slice(0, benefitText.length + 1));
      } else if (isDeletingBenefit && benefitText.length > 0) {
        setBenefitText(benefitText.slice(0, -1));
      } else if (benefitText.length === currentBenefit.length && !isDeletingBenefit) {
          setTimeout(() => setIsDeletingBenefit(true), 2000);
      } else if (benefitText.length === 0 && isDeletingBenefit) {
          setIsDeletingBenefit(false);
        setBenefitIndex((prev) => (prev + 1) % benefits.length);
      }
    }, isDeletingBenefit ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [benefitText, isDeletingBenefit, benefitIndex, isClient]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <Navigation />
      
      <main className="pt-20">
      {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-8">
              {displayText}
              <span className="animate-pulse">|</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-12">
              The Future of CA Practice Management
            </p>
            
            <div className="text-lg text-blue-200 mb-8 h-8">
              {benefitText}
              <span className="animate-pulse">|</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
                Get Started
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
                Learn More
              </button>
          </div>
        </div>
      </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose CA Authority?</h2>
            <p className="text-xl text-blue-100">Revolutionary tools for modern CA practices</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold text-white mb-4">AI-Powered Content</h3>
              <p className="text-blue-100">Generate professional content automatically with our advanced AI system</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-white mb-4">Analytics & Insights</h3>
              <p className="text-blue-100">Track performance and optimize your content strategy</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold text-white mb-4">Secure & Compliant</h3>
              <p className="text-blue-100">Built with security and compliance in mind</p>
          </div>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
}
