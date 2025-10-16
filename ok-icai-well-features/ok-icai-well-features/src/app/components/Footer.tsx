import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-4 pb-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Footer Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-2 text-sm">Resources</h3>
            <ul className="space-y-0.5">
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Desktop app</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Marketplace</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Community</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Developers</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Wallpapers</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Meetups</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-2 text-sm">Company</h3>
            <ul className="space-y-0.5">
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Security</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Careers</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Report</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Status</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Legal</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Blog</Link></li>
            </ul>
          </div>

          {/* Creators */}
          <div>
            <h3 className="text-white font-semibold mb-2 text-sm">Creators</h3>
            <ul className="space-y-0.5">
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Program</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Payouts</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Experts</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Awards</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Events</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Brand</Link></li>
            </ul>
          </div>

          {/* Compare */}
          <div>
            <h3 className="text-white font-semibold mb-2 text-sm">Compare</h3>
            <ul className="space-y-0.5">
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Squarespace</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Wordpress</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Unbounce</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Webflow</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Figma</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Wix</Link></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-white font-semibold mb-2 text-sm">Solutions</h3>
            <ul className="space-y-0.5">
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Figma to HTML</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Website builder</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Portfolio maker</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Landing pages</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">UI/UX design</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">No-code</Link></li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h3 className="text-white font-semibold mb-2 text-sm">Socials</h3>
            <ul className="space-y-0.5">
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Instagram</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">X Twitter</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">YouTube</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">LinkedIn</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Threads</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">TikTok</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-3">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 AccountantAI. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
