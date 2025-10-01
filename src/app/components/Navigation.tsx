import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-black fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-white flex items-center">
              AccountantAI
              <span className="ml-1 w-0.5 h-6 bg-white animate-blink"></span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-400 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
              Features
            </Link>
            <Link href="/workflow" className="text-gray-400 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
              Workflow Builder
            </Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
              Dashboard
            </Link>
            <Link href="/about" className="text-gray-400 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
              How It Works
            </Link>
            <Link href="/beta-program" className="text-white px-3 py-2 text-sm font-medium transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="text-gray-400 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
              Success Stories
            </Link>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            <Link href="/sign-in" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up" className="bg-transparent text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white hover:text-black transition-colors border border-white">
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
