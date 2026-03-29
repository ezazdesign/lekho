import React from 'react';
import { HardDrive, ExternalLink } from 'lucide-react';

const DriveLinkCard = ({ url }) => {
  if (!url) return null;

  return (
    <div className="mt-3 flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
      <div className="flex items-center space-x-3 overflow-hidden">
        <div className="bg-blue-100 p-2 rounded-lg shrink-0">
          <HardDrive className="w-5 h-5 text-blue-600" />
        </div>
        <div className="truncate">
          <p className="text-sm font-semibold text-gray-900 truncate">External Media Attached</p>
          <p className="text-xs text-gray-500 truncate">Google Drive Link</p>
        </div>
      </div>
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="shrink-0 ml-4 flex items-center text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full transition-colors"
      >
        Open in Drive
        <ExternalLink className="w-3 h-3 ml-1.5" />
      </a>
    </div>
  );
};

export default DriveLinkCard;
