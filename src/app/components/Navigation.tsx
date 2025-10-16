'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { usePathname, useSearchParams } from 'next/navigation';

function NavigationContent() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn } = useUser();
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const getLinkClass = (path: string) => {
    const baseClass = "px-2 xl:px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap";
    const activeClass = "text-white";
    const inactiveClass = "text-gray-300 hover:text-white";
    return `${baseClass} ${isActive(path) ? activeClass : inactiveClass}`;
  };

  const getMobileLinkClass = (path: string) => {
    const baseClass = "block px-3 py-2 text-sm font-semibold transition-colors";
    const activeClass = "text-white bg-gray-800";
    const inactiveClass = "text-gray-300 hover:text-white";
    return `${baseClass} ${isActive(path) ? activeClass : inactiveClass}`;
  };

  return (
    <nav className="bg-black fixed top-0 left-0 right-0 z-50 shadow-lg">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Always clickable to home */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="text-2xl font-black text-white flex items-center hover:text-gray-300 transition-colors tracking-wide">
              CaAuthority
              <span className="ml-1 w-0.5 h-6 bg-white animate-blink"></span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-4 flex-1 justify-center">
            <Link href="/" className={getLinkClass('/')}>
              Home
            </Link>
            <Link href="/workflow-builder" className={getLinkClass('/workflow-builder')}>
              Workflow Builder
            </Link>
            <Link href="/dashboard" className={getLinkClass('/dashboard')}>
              Dashboard
            </Link>
            <Link href="/content-writer" className={getLinkClass('/content-writer')}>
              Content Writer
            </Link>
            <Link href="/content-pipeline" className={getLinkClass('/content-pipeline')}>
              Content Pipeline
            </Link>
            <Link href="/how-it-works" className={getLinkClass('/how-it-works')}>
              How It Works
            </Link>
            <Link href="/pricing" className={getLinkClass('/pricing')}>
              Pricing
            </Link>
          </div>

          {/* Desktop Right side buttons */}
          <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
            {isSignedIn ? (
              <div className="flex items-center space-x-3">
                <Link href="/dashboard" className="bg-transparent border border-white text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-white hover:text-black transition-colors whitespace-nowrap">
                  Go to Dashboard
                </Link>
                <SignOutButton>
                  <button className="text-gray-300 hover:text-white text-sm font-semibold transition-colors whitespace-nowrap">
                    Sign Out
                  </button>
                </SignOutButton>
              </div>
            ) : (
              <>
                <Link href="/sign-in" className="text-gray-300 hover:text-white text-sm font-semibold transition-colors whitespace-nowrap">
                  Sign In
                </Link>
                <Link href="/sign-up" className="bg-transparent text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-white hover:text-black transition-colors border border-white whitespace-nowrap">
                  Start Free Trial
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger menu button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-400 hover:text-white focus:outline-none focus:text-white transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black border-t border-gray-700">
              <Link
                href="/"
                className={getMobileLinkClass('/')}
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/workflow-builder"
                className={getMobileLinkClass('/workflow-builder')}
                onClick={() => setIsOpen(false)}
              >
                Workflow Builder
              </Link>
              <Link
                href="/dashboard"
                className={getMobileLinkClass('/dashboard')}
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/content-writer"
                className={getMobileLinkClass('/content-writer')}
                onClick={() => setIsOpen(false)}
              >
                Content Writer
              </Link>
              <Link
                href="/content-pipeline"
                className={getMobileLinkClass('/content-pipeline')}
                onClick={() => setIsOpen(false)}
              >
                Content Pipeline
              </Link>
              <Link
                href="/how-it-works"
                className={getMobileLinkClass('/how-it-works')}
                onClick={() => setIsOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="/pricing"
                className={getMobileLinkClass('/pricing')}
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              
              {/* Mobile Auth Section */}
              <div className="pt-4 border-t border-gray-700">
                {isSignedIn ? (
                  <div className="space-y-2">
                    <Link
                      href="/dashboard"
                      className="block mx-3 my-2 px-4 py-2 bg-transparent border border-white text-white rounded-full text-sm font-bold hover:bg-white hover:text-black transition-colors text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Go to Dashboard
                    </Link>
                    <SignOutButton>
                      <button 
                        className="block px-3 py-2 text-gray-300 hover:text-white text-sm font-semibold transition-colors w-full text-left"
                        onClick={() => setIsOpen(false)}
                      >
                        Sign Out
                      </button>
                    </SignOutButton>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/sign-in"
                      className="block px-3 py-2 text-gray-300 hover:text-white text-sm font-semibold transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      className="block mx-3 my-2 px-4 py-2 bg-transparent text-white rounded-full text-sm font-bold hover:bg-white hover:text-black transition-colors border border-white text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Start Free Trial
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default function Navigation() {
  return (
    <Suspense fallback={<div className="bg-black fixed top-0 left-0 right-0 z-50 h-16"></div>}>
      <NavigationContent />
    </Suspense>
  );
}
