import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Camera as CameraIcon,
  Maximize,
  Video,
  Image as ImageIcon,
  Settings2,
  AlertCircle } from
'lucide-react';
import { Card } from '../components/ui/Card';
export function Camera() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [activeStream, setActiveStream] = useState('Conveyor-Cam-01');
  const [isRecording, setIsRecording] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8001/status')
      .then(res => res.json())
      .then(data => {
        if (data?.success && data?.data) {
          setIsCameraOn(data.data.running);
        }
      })
      .catch(e => console.error('Failed to fetch camera status', e));
  }, []);

  const toggleCamera = async () => {
    const newState = !isCameraOn;
    setIsCameraOn(newState);
    try {
      await fetch(`http://localhost:8001/${newState ? 'start' : 'stop'}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to toggle camera backend', error);
    }
  };
  const streams = [
  {
    id: 'Conveyor-Cam-01',
    name: 'Main Conveyor',
    status: 'Online'
  },
  {
    id: 'Sort-Bay-02',
    name: 'Sorting Bay',
    status: 'Online'
  },
  {
    id: 'Pack-Stat-03',
    name: 'Packing Station',
    status: 'Warning'
  }];

  const recentDetections = [
  {
    time: '10:42:15',
    object: 'Dark Chocolate Box',
    confidence: 98,
    color: 'bg-status-warning'
  },
  {
    time: '10:42:12',
    object: 'Milk Chocolate Box',
    confidence: 94,
    color: 'bg-status-success'
  },
  {
    time: '10:42:08',
    object: 'White Truffle Pack',
    confidence: 89,
    color: 'bg-status-info'
  },
  {
    time: '10:41:55',
    object: 'Unknown Object',
    confidence: 45,
    color: 'bg-status-danger'
  }];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-text-primary mb-1">
          Live Camera Feed
        </h1>
        <p className="text-text-secondary">
          Real-time vision system monitoring and object detection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Video Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Premium Video Container */}
          <div className={`relative w-full aspect-video bg-black rounded-xl border-8 border-primary-dark shadow-premium-dark overflow-hidden group ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none border-none aspect-auto h-screen' : ''}`}>
            {isCameraOn ? (
              <>
                <img 
                  src="http://localhost:8001/video_feed" 
                  alt="Live Camera Feed"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />

              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary bg-black/90">
                <CameraIcon size={48} className="mb-4 opacity-50" />
                <p className="text-xl font-medium">Camera Offline</p>
                <p className="text-sm opacity-75">Master switch is disabled</p>
              </div>
            )}

            {/* Top Overlay Info */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded text-sm text-white backdrop-blur-md border border-white/10">
                  <motion.div
                    animate={{
                      opacity: [1, 0.3, 1]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2
                    }}
                    className="w-2.5 h-2.5 rounded-full bg-status-danger" />
                  
                  <span className="font-bold tracking-wider">LIVE</span>
                </div>
                <span className="text-white/90 font-mono text-sm bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                  {activeStream}
                </span>
              </div>
              <div className="flex gap-3 text-white/80 font-mono text-xs bg-black/40 px-3 py-1.5 rounded backdrop-blur-sm border border-white/10">
                <span>1920x1080</span>
                <span>•</span>
                <span>30 FPS</span>
                <span>•</span>
                <span>2.4 Mbps</span>
              </div>
            </div>

            {/* Bottom Controls (Visible on hover) */}
            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`p-2 rounded-full backdrop-blur-md border transition-colors ${isRecording ? 'bg-status-danger/20 border-status-danger text-status-danger' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}>
                  
                  <Video size={20} />
                </button>
                <button className="p-2 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-md transition-colors">
                  <ImageIcon size={20} />
                </button>
              </div>
              <button className="p-2 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-md transition-colors" onClick={() => setIsFullscreen(!isFullscreen)}>
                <Maximize size={20} />
              </button>
            </div>
          </div>

          {/* Detection Log */}
          <Card>
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Settings2 size={18} className="text-primary" />
              Recent Detections
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentDetections.map((det, i) =>
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface">
                
                  <div className={`w-3 h-12 rounded-sm ${det.color}`}></div>
                  <div>
                    <p className="text-xs text-text-secondary font-mono mb-0.5">
                      {det.time}
                    </p>
                    <p className="text-sm font-medium text-text-primary truncate">
                      {det.object}
                    </p>
                    <p className="text-xs font-mono text-primary mt-0.5">
                      {det.confidence}% conf.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Sidebar Controls */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <CameraIcon size={18} className="text-primary" />
              Camera Power
            </h3>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface">
              <div>
                <p className="font-medium text-text-primary">Master Switch</p>
                <p className="text-xs text-text-secondary">Toggle all camera feeds</p>
              </div>
              <button
                onClick={toggleCamera}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isCameraOn ? 'bg-status-success' : 'bg-status-danger'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isCameraOn ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-text-primary mb-4">
              Vision Settings
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">
                    Confidence Threshold
                  </span>
                  <span className="font-medium text-text-primary">85%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="85"
                  className="w-full accent-primary" />
                
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Exposure</span>
                  <span className="font-medium text-text-primary">Auto</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="50"
                  className="w-full accent-primary" />
                
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-border text-primary focus:ring-primary" />
                  
                  <span className="text-sm text-text-primary">
                    Show Bounding Boxes
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-border text-primary focus:ring-primary" />
                  
                  <span className="text-sm text-text-primary">Show Labels</span>
                </label>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>);

}