import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Camera as CameraIcon,
  Maximize,
  Video,
  Image as ImageIcon,
  Settings2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { toast } from 'sonner';
import { API_BASE, isApiReachable, markApiOffline, isFetchNetworkError } from '../lib/api';

const VISION_BASE = 'http://localhost:8001';

export function Camera() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraOk, setCameraOk] = useState(false);
  const [cameraType, setCameraType] = useState<'usb' | 'laptop' | 'unknown'>('unknown');
  const [lastError, setLastError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recentDetections, setRecentDetections] = useState<any[]>([]);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);

  // Auto-detect camera type and availability
  useEffect(() => {
    const detectCamera = async () => {
      try {
        // Check for user media constraints to detect available cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoCameras = devices.filter(d => d.kind === 'videoinput');
        
        if (videoCameras.length > 1) {
          setCameraType('usb'); // USB camera detected if more than one camera
          setCameraAvailable(true);
        } else if (videoCameras.length === 1) {
          setCameraType('laptop');
          setCameraAvailable(true);
        } else {
          setCameraType('unknown');
          setCameraAvailable(false);
          setLastError('No camera devices detected');
        }
      } catch (err) {
        console.warn('Camera detection error:', err);
        setCameraAvailable(false);
      }
    };

    detectCamera();

    // Listen for device changes (USB camera plugin/eject)
    navigator.mediaDevices.addEventListener('devicechange', detectCamera);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', detectCamera);
    };
  }, []);

  useEffect(() => {
    const pollStatus = () => {
      fetch(`${VISION_BASE}/status`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.data) {
            setIsCameraOn(Boolean(data.data.running));
            setCameraOk(Boolean(data.data.cameraOk));
            setLastError(data.data.lastError || null);
          }
        })
        .catch(() => {
          setLastError('Vision service unavailable on port 8001');
        });
    };
    pollStatus();
    const id = setInterval(pollStatus, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchDetections = async () => {
      if (!(await isApiReachable())) return;
      try {
        const res = await fetch(`${API_BASE}/vision/detections`);
        const data = await res.json();
        if (data?.success && data?.data) {
          setRecentDetections(data.data);
        }
      } catch (err) {
        if (isFetchNetworkError(err)) markApiOffline();
      }
    };

    fetchDetections();
    const interval = setInterval(fetchDetections, 1500);
    return () => clearInterval(interval);
  }, []);

  const toggleCamera = async () => {
    const wantOn = !isCameraOn;
    setIsCameraOn(wantOn);
    try {
      const res = await fetch(`${VISION_BASE}/${wantOn ? 'start' : 'stop'}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        setIsCameraOn(!wantOn);
        setLastError(data?.error || 'Camera request failed');
      } else {
        setLastError(null);
      }
    } catch {
      setIsCameraOn(!wantOn);
      setLastError('Vision service unreachable on port 8001');
    }
  };

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
        <div className="lg:col-span-3 space-y-6">
          <div
            className={`relative w-full aspect-video bg-black rounded-xl border-8 border-primary-dark shadow-premium-dark overflow-hidden group ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none border-none aspect-auto h-screen' : ''}`}
          >
            {isCameraOn ? (
              <img
                src={`${VISION_BASE}/video_feed`}
                alt="Live Camera Feed"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary bg-black/90">
                <CameraIcon size={48} className="mb-4 opacity-50" />
                <p className="text-xl font-medium">Camera Offline</p>
                <p className="text-sm opacity-75">Enable the master switch to start the feed</p>
              </div>
            )}

            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded text-sm text-white backdrop-blur-md border border-white/10">
                  {isCameraOn && (
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-2.5 h-2.5 rounded-full bg-status-danger"
                    />
                  )}
                  <span className="font-bold tracking-wider">
                    {isCameraOn ? 'LIVE' : 'OFF'}
                  </span>
                </div>
                <span className="text-white/90 font-mono text-sm bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                  Conveyor-Cam-01
                </span>
              </div>
              <div className="flex gap-3 text-white/80 font-mono text-xs bg-black/40 px-3 py-1.5 rounded backdrop-blur-sm border border-white/10">
                <span>{cameraOk ? '640×480' : 'No signal'}</span>
                <span>•</span>
                <span>{isCameraOn ? 'Vision active' : 'Stopped'}</span>
              </div>
            </div>

            {lastError && (
              <div className="absolute bottom-16 left-4 right-4 text-xs text-status-danger bg-black/70 px-3 py-2 rounded">
                {lastError}
              </div>
            )}

            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecording(!isRecording);
                    toast.info(
                      isRecording
                        ? 'Recording indicator off (clip storage not configured).'
                        : 'Recording indicator on — clip storage is not configured on this build.'
                    );
                  }}
                  className={`p-2 rounded-full backdrop-blur-md border transition-colors ${isRecording ? 'bg-status-danger/20 border-status-danger text-status-danger' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                  title="Toggle recording indicator"
                >
                  <Video size={20} />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-md transition-colors opacity-50 cursor-not-allowed"
                  title="Snapshot coming soon"
                >
                  <ImageIcon size={20} />
                </button>
              </div>
              <button
                type="button"
                className="p-2 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-md transition-colors"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize size={20} />
              </button>
            </div>
          </div>

          <Card>
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Settings2 size={18} className="text-primary" />
              Recent Detections
            </h3>
            {recentDetections.length === 0 ? (
              <p className="text-sm text-text-secondary">
                No detections yet. Start the camera and run the conveyor to record picks.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentDetections.map((det, i) => (
                  <div
                    key={`${det.time}-${det.object}-${i}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface"
                  >
                    <div className={`w-3 h-12 rounded-sm ${det.color}`} />
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
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <CameraIcon size={18} className="text-primary" />
              Camera Configuration
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-border bg-surface">
                <p className="text-xs text-text-secondary mb-1">Detected Camera</p>
                <p className="font-medium text-text-primary">
                  {cameraType === 'usb' && '📷 USB Camera (External)'}
                  {cameraType === 'laptop' && '💻 Built-in Camera (Laptop)'}
                  {cameraType === 'unknown' && '❓ No Camera Detected'}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {cameraAvailable === true && 'Camera device available'}
                  {cameraAvailable === false && 'Connect a USB camera or enable laptop camera in settings'}
                </p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface">
                <div>
                  <p className="font-medium text-text-primary">Master Switch</p>
                  <p className="text-xs text-text-secondary">Starts vision on port 8001</p>
                </div>
                <button
                  type="button"
                  onClick={toggleCamera}
                  disabled={cameraAvailable === false}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isCameraOn ? 'bg-status-success' : cameraAvailable === false ? 'bg-gray-400' : 'bg-status-danger'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isCameraOn ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-text-primary mb-4">Vision Service</h3>
            <p className="text-sm text-text-secondary">
              Detections are posted to the backend and update inventory automatically when
              colored blocks enter the pick zone.
            </p>
            <p className="text-xs text-text-secondary mt-3 font-mono">
              ESP32: configure IP in vision/stream_server.py
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
