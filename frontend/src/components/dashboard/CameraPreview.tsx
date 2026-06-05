import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Maximize2, Camera } from 'lucide-react';
import { Card } from '../ui/Card';

const VISION_BASE = 'http://localhost:8001';

export function CameraPreview() {
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const check = () => {
      fetch(`${VISION_BASE}/status`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.data) {
            setIsRunning(Boolean(data.data.running));
          }
        })
        .catch(() => setIsRunning(false));
    };
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card noPadding className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex justify-between items-center bg-surface">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-primary" />
          <h3 className="font-semibold text-text-primary">Live Camera</h3>
        </div>
        <Link
          to="/camera"
          className="text-xs text-primary hover:text-primary-dark flex items-center gap-1 font-medium"
        >
          Open full view <Maximize2 size={12} />
        </Link>
      </div>

      <div className="relative flex-1 bg-black min-h-[200px] overflow-hidden">
        {isRunning ? (
          <img
            src={`${VISION_BASE}/video_feed`}
            alt="Live Camera Feed"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary/80 text-sm p-4 text-center">
            <Camera size={32} className="mb-2 opacity-40" />
            Camera off — enable on Camera page
          </div>
        )}
      </div>
    </Card>
  );
}
