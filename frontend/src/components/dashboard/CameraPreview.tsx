import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Maximize2, Camera } from 'lucide-react';
import { Card } from '../ui/Card';
export function CameraPreview() {
  return (
    <Card noPadding className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex justify-between items-center bg-surface">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-primary" />
          <h3 className="font-semibold text-text-primary">Live Camera</h3>
        </div>
        <Link
          to="/camera"
          className="text-xs text-primary hover:text-primary-dark flex items-center gap-1 font-medium">
          
          Open full view <Maximize2 size={12} />
        </Link>
      </div>

      <div className="relative flex-1 bg-black min-h-[200px] overflow-hidden">
        <img 
          src="http://localhost:8001/video_feed" 
          alt="Live Camera Feed"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    </Card>);

}