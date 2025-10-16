'use client';

import React, { useState } from 'react';
import { Linkedin } from 'lucide-react';

export default function LinkedInDebugComponent() {
  const [testImage] = useState({
    id: 'test-123',
    url: 'https://via.placeholder.com/300x300/0077B5/FFFFFF?text=Test+Image',
    prompt: 'Test image for LinkedIn sharing',
    style: 'professional',
    size: '1080x1080',
    createdAt: new Date()
  });

  const handleShareToLinkedIn = (image: any) => {
    console.log('LinkedIn share function called with:', image);
    const postText = `🎨 AI-Generated Professional Image\n\n${image.prompt}\n\n#AI #ProfessionalImage #ContentCreation`;
    
    navigator.clipboard.writeText(image.url).then(() => {
      const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(postText)}`;
      window.open(linkedinUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
      alert('📋 Image URL copied! LinkedIn post composer opened - paste (Ctrl+V) the image URL in your post');
    }).catch(() => {
      const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(postText)}`;
      window.open(linkedinUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
      alert('LinkedIn opened! Please copy the image URL manually and add it to your post.');
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">LinkedIn Share Button Debug</h2>
      <p className="text-gray-600 mb-4">This is a test component to verify the LinkedIn share button is working.</p>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h3 className="font-semibold mb-2">Test Image:</h3>
        <img 
          src={testImage.url} 
          alt={testImage.prompt}
          className="w-32 h-32 object-cover rounded mb-2"
        />
        <p className="text-sm text-gray-600">{testImage.prompt}</p>
      </div>

      <div className="space-y-2">
        <div className="flex space-x-2">
          <button className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
            Download
          </button>
          <button className="flex-1 border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-50">
            Edit
          </button>
        </div>
        <button
          onClick={() => handleShareToLinkedIn(testImage)}
          className="w-full bg-[#0077B5] hover:bg-[#005885] text-white px-3 py-1 rounded text-sm transition-colors flex items-center justify-center gap-2"
          title="Share to LinkedIn"
        >
          <Linkedin className="w-4 h-4" />
          Share to LinkedIn
        </button>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Debug Info:</strong> If you can see this button and it works when clicked, 
          then the LinkedIn share functionality is working correctly. The issue might be 
          with browser caching or the ImageGenerator component not updating.
        </p>
      </div>
    </div>
  );
}
