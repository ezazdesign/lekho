import React from 'react';

const RightSidebar = () => {
  return (
    <div className="hidden lg:block w-80 h-screen sticky top-0 border-l border-gray-200 bg-white px-6 py-8">
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4 font-bengali text-lg">Trending on লেখো</h3>
        <div className="space-y-4">
          <div className="cursor-pointer group">
            <p className="text-xs text-gray-500 font-medium">Programming • Trending</p>
            <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">React 19 Hooks</p>
            <p className="text-xs text-gray-400 mt-1">1,204 posts</p>
          </div>
          <div className="cursor-pointer group">
            <p className="text-xs text-gray-500 font-medium">Literature • Trending</p>
            <p className="font-semibold text-gray-900 font-bengali group-hover:text-blue-600 transition-colors">হুমায়ূন আহমেদ</p>
            <p className="text-xs text-gray-400 mt-1">856 posts</p>
          </div>
          <div className="cursor-pointer group">
            <p className="text-xs text-gray-500 font-medium">Design • Trending</p>
            <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Minimalism in UI</p>
            <p className="text-xs text-gray-400 mt-1">432 posts</p>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <p className="text-xs text-gray-400 px-2 leading-relaxed">
          &copy; 2026 Lekho - Words that Connect.<br />
          Built for a noise-free experience.
        </p>
      </div>
    </div>
  );
};

export default RightSidebar;
