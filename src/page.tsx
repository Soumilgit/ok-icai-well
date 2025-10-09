'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';

export default function Home() {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const fullText = 'CA Authority';

  // Typewriter effect for beta benefits
  const [benefitText, setBenefitText] = useState('');
  const [isDeletingBenefit, setIsDeletingBenefit] = useState(false);
  const [benefitIndex, setBenefitIndex] = useState(0);
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovering, setSidebarHovering] = useState(false);

  const benefitTexts = useMemo(() => [
    'Exclusive discounted pricing',
    'Input into feature roadmap',
    'First access before public launch'
  ], []);

  // Set client flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!isClient) return;
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing phase
        if (displayText.length < fullText.length) {
          setDisplayText(fullText.slice(0, displayText.length + 1));
        } else {
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting phase
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          // Reset for next cycle
          setIsDeleting(false);
        }
      }
    }, isDeleting ? 100 : 150); // Faster deletion, slower typing

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, fullText, isClient]);

  // Typewriter effect for beta benefits
  useEffect(() => {
    if (!isClient) return;
    
    const timeout = setTimeout(() => {
      const currentBenefit = benefitTexts[benefitIndex];
      
      if (!isDeletingBenefit) {
        // Typing phase
        if (benefitText.length < currentBenefit.length) {
          setBenefitText(currentBenefit.slice(0, benefitText.length + 1));
        } else {
          // Pause before deleting
          setTimeout(() => setIsDeletingBenefit(true), 2000);
        }
      } else {
        // Deleting phase
        if (benefitText.length > 0) {
          setBenefitText(benefitText.slice(0, -1));
        } else {
          // Move to next benefit
          setIsDeletingBenefit(false);
          setBenefitIndex((prev) => (prev + 1) % benefitTexts.length);
        }
      }
    }, isDeletingBenefit ? 50 : 100); // Faster deletion, slower typing

    return () => clearTimeout(timeout);
  }, [benefitText, isDeletingBenefit, benefitIndex, benefitTexts, isClient]);
  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      {/* Background Blur Glass Effect when sidebar is open */}
      {(sidebarOpen || sidebarHovering) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-all duration-300" />
      )}
      
      {/* Sidebar Component */}
      <Sidebar 
        isOpen={sidebarOpen || sidebarHovering} 
        onClose={() => setSidebarOpen(false)}
        onHoverChange={setSidebarHovering}
        variant="homepage"
      />
      
      {/* Hero Section */}
      <section className="bg-black text-white pt-32 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <nav className="text-xs text-gray-400">
              <span>Solutions</span>
              <span className="mx-2">&gt;</span>
              <span>Professional Services</span>
              <span className="mx-2">&gt;</span>
                  <span className="text-white">
                    {isClient ? displayText : 'CA Authority'}
                    {isClient && <span className="ml-1 w-0.5 h-3 bg-white animate-blink inline-block"></span>}
                  </span>
            </nav>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl">
            <h1 className="text-2xl md:text-4xl font-medium text-white mb-4 leading-tight tracking-tight">
              Stand Out on LinkedIn in Just 15 Minutes a Day
            </h1>
            
            <p className="text-base text-gray-300 mb-6 leading-relaxed max-w-3xl">
              The first AI-powered content engine built exclusively for Chartered Accountants & Finance Leaders. Generate engaging posts, build your personal brand, and attract high-value clients automatically.
            </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-12">
                <a href="/sign-in" className="bg-transparent text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-white hover:text-black transition-colors border border-white text-center">
                  Sign In to Dashboard
                </a>
                <a href="/sign-up" className="bg-transparent text-gray-300 px-6 py-3 rounded-full text-sm font-semibold hover:text-white transition-colors border border-gray-600 text-center">
                  Start Free Trial
                </a>
              </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Image src="/avatar.jpg" alt="Avatar" width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                <span>Trusted by 500+ CAs</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Updated: 2 days ago</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span>Features: 15+</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <span>Users: 2.1K</span>
              </div>
            </div>
          </div>

          {/* 2x2 Image Grid */}
              <div className="grid grid-cols-2 gap-6 w-full max-w-6xl mx-auto mt-16">
                <div className="aspect-square">
                  <Image src="/mugen-1.png" alt="Mugen Template 1" width={400} height={400} className="w-full h-full object-cover rounded-lg" />
                </div>
                <div className="aspect-square">
                  <Image src="/mugen-2.jpg" alt="Mugen Template 2" width={400} height={400} className="w-full h-full object-cover rounded-lg" />
                </div>
                <div className="aspect-square">
                  <Image src="/mugen-3.jpg" alt="Mugen Template 3" width={400} height={400} className="w-full h-full object-cover rounded-lg" />
                </div>
                <div className="aspect-square">
                  <Image src="/mugen-4.jpg" alt="Mugen Template 4" width={400} height={400} className="w-full h-full object-cover rounded-lg" />
                </div>
              </div>
        </div>
      </section>


      {/* Problem Section */}
      <section id="content-section" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Question with bullet */}
            <div className="flex items-start">
              <div className="w-2 h-2 bg-white rounded-full mt-3 mr-4 flex-shrink-0"></div>
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-white leading-tight">
                  Why Most CAs
                  <br />
                  Struggle on LinkedIn
                </h2>
              </div>
            </div>

            {/* Right side - Description */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-white text-lg leading-relaxed">
                    Don&apos;t know what to write.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-white text-lg leading-relaxed">
                    Afraid of ICAI flagging.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-white text-lg leading-relaxed">
                    No time to post.
                  </p>
                </div>
              </div>
              
              {/* Highlight statement */}
              <div className="pt-4 border-t border-gray-800">
                <p className="text-white text-xl font-medium italic">
                  &ldquo;Silence in 2025 = Invisibility.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution-section" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <p className="text-gray-500 text-sm uppercase tracking-wide">Solution</p>
          </div>
          <div className="text-center mb-16">
            <h2 className="text-white" style={{fontSize: '16px'}}>
              AI-Powered Content That Works
            </h2>
            <p className="mt-3 max-w-md mx-auto text-gray-400 md:mt-5 md:max-w-3xl" style={{fontSize: '14px'}}>
              Our AI understands accounting industry trends, compliance updates, and client pain points. Generate engaging posts, thought leadership content, and client education materials in minutes.
            </p>
          </div>

          {/* Separator Line */}
          <div className="border-t border-gray-800 mb-16"></div>

          {/* Main Solution Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Heading with bullet */}
            <div className="flex items-start">
              <div className="w-2 h-2 bg-white rounded-full mt-3 mr-4 flex-shrink-0"></div>
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-white leading-tight">
                  The First AI Content
                  <br />
                  Engine Built for CAs & Finance Leaders
                </h2>
              </div>
            </div>

            {/* Right side - Description and Features */}
            <div className="space-y-6">
              <p className="text-white text-lg leading-relaxed">
                Transform your LinkedIn presence with the world&apos;s first AI-powered content engine designed exclusively for Chartered Accountants and Finance Leaders. Generate professional, engaging content that builds your authority and attracts high-value clients.
              </p>
              
              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                  </div>
                  <p className="text-white text-sm">Curated Financial News Feed</p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                  </div>
                  <p className="text-white text-sm">AI Writing Assistant in Your Voice</p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                  </div>
                  <p className="text-white text-sm">ICAI Compliance Checker</p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                  </div>
                  <p className="text-white text-sm">Content Repurposing</p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                  </div>
                  <p className="text-white text-sm">Case Study Creator</p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                  </div>
                  <p className="text-white text-sm">Target Audience Selector</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Matters Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white text-left">Why It Matters</h2>
          </div>
          
          {/* Feature List */}
          <div className="space-y-0 max-w-lg">
            <div className="flex items-center justify-between py-4 border-b border-gray-800 cursor-pointer">
              <span className="text-white text-lg">Visibility = Credibility = Clients</span>
              <span className="text-white text-xl">+</span>
            </div>
            
            <div className="flex items-center justify-between py-4 border-b border-gray-800 cursor-pointer">
              <span className="text-white text-lg">Build Authority as Thought Leader</span>
              <span className="text-white text-xl">+</span>
            </div>
            
            <div className="flex items-center justify-between py-4 border-b border-gray-800 cursor-pointer">
              <span className="text-white text-lg">Win Credibility with Peers</span>
              <span className="text-white text-xl">+</span>
            </div>
            
            <div className="flex items-center justify-between py-4 border-b border-gray-800 cursor-pointer">
              <span className="text-white text-lg">Attract Clients Organically</span>
              <span className="text-white text-xl">+</span>
            </div>
            
            <div className="flex items-center justify-between py-4 border-b border-gray-800 cursor-pointer">
              <span className="text-white text-lg">LinkedIn Before Credentials</span>
              <span className="text-white text-xl">+</span>
            </div>
            
            <div className="flex items-center justify-between py-4 cursor-pointer">
              <span className="text-white text-lg">Silence = Invisibility</span>
              <span className="text-white text-xl">+</span>
            </div>
          </div>
        </div>
      </section>

      {/* Credibility Section */}
      <section className="py-24 bg-black relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20"></div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            {/* Avatar with enhanced styling */}
            <div className="mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-30 scale-110"></div>
        <Image
                  src="/647a571d951cf02b2826ad76_headshot justing.webp" 
                  alt="Twinkle Dixit" 
                  width={144}
                  height={144}
                  className="relative w-36 h-36 rounded-full mx-auto object-cover border-4 border-white/20 shadow-2xl"
                />
              </div>
            </div>
            
            {/* Enhanced Title */}
            <div className="mb-12">
              <div className="inline-block px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
                <p className="text-blue-400 text-sm font-medium tracking-wide uppercase">
                  My founding story
                </p>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight">
                Built by a Chartered Accountant,
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  for Chartered Accountants
                </span>
              </h2>
            </div>
            
            {/* Enhanced Bio */}
            <div className="text-center max-w-4xl mx-auto">
              <p className="text-gray-200 text-lg leading-relaxed mb-6">
                As a Chartered Accountant with over 15 years of experience, I&apos;ve witnessed firsthand the challenges my peers face in building their personal brands and attracting high-value clients.
              </p>
              <p className="text-gray-200 text-lg leading-relaxed mb-6">
                After successfully building two companies and raising significant venture capital, I realized that most CAs struggle with LinkedIn content creation, compliance concerns, and time management.
              </p>
              <p className="text-blue-400 text-lg leading-relaxed mb-6 font-semibold">
                That&apos;s when I decided to create CA Authority.
              </p>
              <p className="text-gray-200 text-lg leading-relaxed">
                A platform built specifically for Chartered Accountants, by someone who understands the unique challenges, compliance requirements, and professional standards of our industry. <span className="text-white font-semibold">Because every CA deserves to build a personal brand that attracts the clients they truly want.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Separator Line */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-gray-800"></div>
      </div>

      {/* Beta Program Invitation Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Heading */}
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-normal text-white leading-tight mb-8">
              We built CA Authority to help
              <br />
              Chartered Accountants work
              <br />
              smarter, faster, and better.
            </h2>
          </div>

          {/* Beta Program Benefits */}
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full mr-3 flex-shrink-0"></div>
                <p className="text-white text-lg">
                  {isClient ? benefitText : 'Exclusive discounted pricing'}
                  {isClient && <span className="ml-1 w-0.5 h-4 bg-white animate-blink inline-block"></span>}
                </p>
              </div>
            </div>
            
            {/* Scarcity reminder */}
            <div className="pt-4 border-t border-gray-700">
              <p className="text-white text-xl font-medium italic">
                &ldquo;When the 50 seats are gone, doors close.&rdquo;
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Final CTA Section */}
      <section className="pt-20 bg-black relative overflow-hidden min-h-screen flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex-1 flex flex-col justify-center">
          <div className="text-center">
            <h2 className="text-2xl md:text-4xl font-normal text-white mb-6 leading-tight">
              Be One of the 50 Who
              <br />
              Redefine Visibility in 2025
            </h2>
            <p className="text-lg text-white mb-8 max-w-2xl mx-auto">
              Join the exclusive group of Chartered Accountants
              <br />
              who are building their personal brand with AI.
            </p>
            
            {/* Small Learn More button */}
            <div className="mb-12">
              <button className="bg-black text-white px-8 py-3 rounded-full text-sm font-medium border border-white hover:bg-white hover:text-black transition-colors">
                Learn More
              </button>
            </div>
            
            {/* Hand image */}
            <div className="flex justify-center items-center">
            <Image
                src="/hand.jpg" 
                alt="Hand" 
                width={558}
                height={420}
                style={{
                  width: '558px',
                  aspectRatio: 'auto 558 / 420',
                  height: '420px',
                  overflowClipMargin: 'content-box',
                  overflow: 'clip',
                  maxWidth: '100%'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}