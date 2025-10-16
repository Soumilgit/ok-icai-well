// Test component to verify LinkedIn button visibility
'use client';

import React from 'react';
import { Linkedin } from 'lucide-react';

export default function LinkedInButtonTest() {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">LinkedIn Button Test</h3>
      <button
        onClick={() => {
          console.log('LinkedIn button clicked!');
          alert('LinkedIn button is working!');
        }}
        className="w-full bg-[#0077B5] hover:bg-[#005885] text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center gap-2"
        title="Share to LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
        Share to LinkedIn
      </button>
    </div>
  );
}
