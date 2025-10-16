'use client';

import { useState, useEffect, useRef } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'dashboard' | 'homepage';
  onHoverChange?: (isHovering: boolean) => void;
}

export default function Sidebar({ isOpen, onClose, variant = 'homepage', onHoverChange }: SidebarProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isManuallyClosed, setIsManuallyClosed] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const manualCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const accountantAIText = 'AccountantAI';

  // Typewriter effect for AccountantAI
  useEffect(() => {
    const typewriterSpeed = isDeleting ? 50 : 100;
    
    typewriterTimeoutRef.current = setTimeout(() => {
      if (!isDeleting && typewriterIndex < accountantAIText.length) {
        setTypewriterText(accountantAIText.substring(0, typewriterIndex + 1));
        setTypewriterIndex(typewriterIndex + 1);
      } else if (isDeleting && typewriterIndex > 0) {
        setTypewriterText(accountantAIText.substring(0, typewriterIndex - 1));
        setTypewriterIndex(typewriterIndex - 1);
      } else if (typewriterIndex === accountantAIText.length) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && typewriterIndex === 0) {
        setIsDeleting(false);
      }
    }, typewriterSpeed);

    return () => {
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
      }
    };
  }, [typewriterIndex, isDeleting, accountantAIText]);

  const dashboardWorkflows = [
    {
      title: 'Google Sheets',
      items: [
        { label: 'Draft Content Review', action: 'draft-review' },
        { label: 'Audit Checklist', action: 'audit-checklist' },
        { label: 'Analytics Dashboard', action: 'analytics' },
      ]
    },
    {
      title: 'Email Automation',
      items: [
        { label: 'Stakeholder Notifications', action: 'stakeholder-notifications' },
        { label: 'Executive Summaries', action: 'executive-summaries' },
        { label: 'Alert Management', action: 'alert-management' },
      ]
    },
    {
      title: 'Workflows',
      items: [
        { label: 'News to Content to Email', action: 'zapier-pipeline' },
        { label: 'Compliance Workflow', action: 'audit-workflow' },
        { label: 'Reporting Pipeline', action: 'reporting-workflow' },
      ]
    }
  ];

  const homepageWorkflows = [
    {
      title: 'Quick Start',
      items: [
        { label: 'Generate Your First Article', action: 'generate-article' },
        { label: 'Try Exam Generator', action: 'exam-generator' },
        { label: 'View Content Samples', action: 'content-samples' },
        { label: 'Setup Automation', action: 'setup-automation' },
      ]
    },
    {
      title: 'Learn More',
      items: [
        { label: 'How It Works', action: 'how-it-works' },
        { label: 'Watch Demo', action: 'watch-demo' },
        { label: 'Feature Guide', action: 'feature-guide' },
        { label: 'Best Practices', action: 'best-practices' },
      ]
    },
    {
      title: 'Integrations',
      items: [
        { label: 'Google Sheets', action: 'google-sheets' },
        { label: 'Email Marketing', action: 'email-marketing' },
        { label: 'Slack', action: 'slack' },
        { label: 'Mobile App', action: 'mobile-app' },
      ]
    },
    {
      title: 'For CA Firms',
      items: [
        { label: 'Team Management', action: 'team-management' },
        { label: 'Advanced Analytics', action: 'advanced-analytics' },
        { label: 'Enterprise Security', action: 'enterprise-security' },
        { label: 'Custom Training', action: 'custom-training' },
      ]
    }
  ];

  const workflows = variant === 'dashboard' ? dashboardWorkflows : homepageWorkflows;

  // Hover detection for sidebar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Clear any existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      // Check if mouse is in the left edge trigger zone (first 32px from left)
      const isInTriggerZone = e.clientX <= 32;
      
      if (isInTriggerZone && !isOpen) {
        // Mouse is in trigger zone, show sidebar
        setIsHovering(true);
        setIsManuallyClosed(false); // Reset manual close state when hovering
        onHoverChange?.(true);
      } else if (!isInTriggerZone && isOpen && !isHovering) {
        // Mouse left trigger zone and sidebar is open but not hovering over it
        hoverTimeoutRef.current = setTimeout(() => {
          setIsHovering(false);
          onHoverChange?.(false);
        }, 300); // Small delay to prevent flickering
      }
    };

    const handleMouseLeave = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovering(false);
        onHoverChange?.(false);
      }, 300);
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    
    if (sidebarRef.current) {
      sidebarRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (sidebarRef.current) {
        sidebarRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (manualCloseTimeoutRef.current) {
        clearTimeout(manualCloseTimeoutRef.current);
      }
    };
  }, [isOpen, isHovering, isManuallyClosed, onHoverChange]);

  const handleItemClick = (action: string) => {
    setSelectedWorkflow(action);
    
    // Handle different actions based on variant
    if (variant === 'homepage') {
      switch (action) {
        case 'generate-article':
          window.location.href = '/dashboard?tab=content';
          break;
        case 'exam-generator':
          window.location.href = '/dashboard?tab=exam-gen';
          break;
        case 'content-samples':
          window.location.href = '/dashboard?tab=content';
          break;
        case 'setup-automation':
          window.location.href = '/dashboard?tab=automation';
          break;
        case 'how-it-works':
          // Scroll to how it works section
          const howItWorksSection = document.getElementById('solution-section');
          if (howItWorksSection) {
            howItWorksSection.scrollIntoView({ behavior: 'smooth' });
          }
          break;
        case 'watch-demo':
          alert('Demo video coming soon!');
          break;
        case 'feature-guide':
          alert('Feature guide coming soon!');
          break;
        case 'best-practices':
          alert('Best practices guide coming soon!');
          break;
        case 'google-sheets':
          alert('Google Sheets integration coming soon!');
          break;
        case 'email-marketing':
          alert('Email marketing integration coming soon!');
          break;
        case 'slack':
          alert('Slack integration coming soon!');
          break;
        case 'mobile-app':
          alert('Mobile app coming soon!');
          break;
        case 'team-management':
          alert('Team management features coming soon!');
          break;
        case 'advanced-analytics':
          alert('Advanced analytics coming soon!');
          break;
        case 'enterprise-security':
          alert('Enterprise security features coming soon!');
          break;
        case 'custom-training':
          alert('Custom training options coming soon!');
          break;
        default:
          console.log(`Homepage action: ${action}`);
      }
    } else {
      // Dashboard actions
      console.log(`Dashboard action: ${action}`);
    }
  };

  return (
    <>
      {/* Left Edge Trigger Zone with Visual Indicator */}
      <div 
        className="fixed inset-y-0 left-0 z-40 w-8 h-full group cursor-pointer"
        onClick={() => {
          setIsManuallyClosed(false);
          setIsHovering(true);
          onHoverChange?.(true);
        }}
      >
        {/* Subtle indicator line */}
        <div className={`absolute top-1/2 left-0 w-1 h-16 rounded-r-full transform -translate-y-1/2 transition-all duration-300 ${
          isManuallyClosed 
            ? 'bg-blue-400/40 opacity-60 group-hover:opacity-100' 
            : 'bg-white/20 opacity-0 group-hover:opacity-100'
        }`} />
        
        {/* Hover hint text */}
        <div className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white/60 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
          {isManuallyClosed ? 'Click to reopen' : 'Hover for menu'}
        </div>
        
        {/* Manual close indicator */}
        {isManuallyClosed && (
          <div className="absolute top-4 left-2 w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
        )}
      </div>
      
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-black/20 backdrop-blur-lg border-r border-white/20 transform transition-all duration-300 ease-out ${
          (isOpen || isHovering) && !isManuallyClosed
            ? 'translate-x-0 opacity-100' 
            : '-translate-x-full opacity-0'
        }`}
        onMouseEnter={() => {
          setIsHovering(true);
          setIsManuallyClosed(false); // Reset manual close state when hovering
          onHoverChange?.(true);
        }}
        onMouseLeave={() => {
          setIsHovering(false);
          onHoverChange?.(false);
        }}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-walsheim)' }}>
                {variant === 'dashboard' ? 'Workflows' : (
                  <span className="flex items-center">
                    <span className="text-white">{typewriterText}</span>
                    <span className="w-0.5 h-6 bg-white animate-blink ml-1"></span>
                  </span>
                )}
              </h2>
              <button
                onClick={() => {
                  onClose();
                  setIsHovering(false);
                  setIsManuallyClosed(true);
                  onHoverChange?.(false);
                  
                  // Reset manual close state after 2 seconds
                  if (manualCloseTimeoutRef.current) {
                    clearTimeout(manualCloseTimeoutRef.current);
                  }
                  manualCloseTimeoutRef.current = setTimeout(() => {
                    setIsManuallyClosed(false);
                  }, 2000);
                }}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                title="Close sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-6" style={{ fontFamily: 'var(--font-walsheim)' }}>
            <div className="space-y-8">
              {workflows.map((workflow, index) => (
                <div key={index} className="space-y-4">
                  <h3 className="font-bold text-white text-lg border-b border-white/20 pb-2">{workflow.title}</h3>
                  <div className="space-y-1">
                    {workflow.items.map((item, itemIndex) => (
                      <button
                        key={itemIndex}
                        onClick={() => handleItemClick(item.action)}
                        className="w-full text-left p-3 text-sm text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 hover:translate-x-2"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}