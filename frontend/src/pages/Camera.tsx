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
const CAMERA_MODE_STORAGE_KEY = 'choco_camera_mode';
type CameraMode = 'internal' | 'external' | 'off';

export function Camera() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraOk, setCameraOk] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recentDetections, setRecentDetections] = useState<any[]>([]);
  const [selectedCameraMode, setSelectedCameraMode] = useState<CameraMode>('external');
  const [isApplyingCameraMode, setIsApplyingCameraMode] = useState(false);

  const getCameraIndexForMode = (mode: CameraMode) => {
    if (mode === 'internal') return 0;
    if (mode === 'external') return 1;
    return null;
  };

  const getCameraStatusLabel = () => {
    if (selectedCameraMode === 'internal') return 'Internal Camera Active';
    if (selectedCameraMode === 'external') return 'External Camera Active';
    return 'Camera OFF';
  };

  const stopVisionCamera = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${VISION_BASE}/stop`, {
      method: 'POST',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || 'Failed to stop camera');
    }
  };

  const startVisionCamera = async (mode: CameraMode) => {
    const cameraIndex = getCameraIndexForMode(mode);
    if (cameraIndex === null) {
      throw new Error('Invalid camera mode');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${VISION_BASE}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ camera_index: cameraIndex }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await res.json().catch(() => null);
    if (!res.ok || data?.success === false) {
      throw new Error(data?.error || 'Failed to start camera');
    }
  };

  const applyCameraMode = async (mode: CameraMode) => {
    setSelectedCameraMode(mode);
    window.localStorage.setItem(CAMERA_MODE_STORAGE_KEY, mode);
    setIsApplyingCameraMode(true);
    setLastError(null);

    if (mode === 'off') {
      try {
        await stopVisionCamera();
        setIsCameraOn(false);
        setCameraOk(false);
      } catch (err: any) {
        setLastError(err?.message || 'Failed to stop camera');
      } finally {
        setIsApplyingCameraMode(false);
      }
      return;
    }

    try {
      await stopVisionCamera();
    } catch (err: any) {
      setLastError(err?.message || 'Failed to stop previous camera');
      setIsCameraOn(false);
      setCameraOk(false);
      setIsApplyingCameraMode(false);
      return;
    }

    try {
      await startVisionCamera(mode);
      setIsCameraOn(true);
      setCameraOk(true);
      setLastError(null);
    } catch (err: any) {
      setIsCameraOn(false);
      setCameraOk(false);
      setLastError(err?.message || 'Failed to start camera');
    } finally {
      setIsApplyingCameraMode(false);
    }
  };

  // Auto-start camera when page loads
  useEffect(() => {
    const savedMode = window.localStorage.getItem(CAMERA_MODE_STORAGE_KEY) as CameraMode | null;
    const initialMode: CameraMode = savedMode === 'internal' || savedMode === 'external' || savedMode === 'off' ? savedMode : 'external';
    setSelectedCameraMode(initialMode);

    const autoStartCamera = async () => {
      console.log('[Camera] Auto-starting camera using last selected mode...', initialMode);
      await applyCameraMode(initialMode);
    };

    autoStartCamera();
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
    // Camera is now auto-managed by backend
    // This function kept for emergency manual control if needed
    const wantOn = !isCameraOn;
    setIsCameraOn(wantOn);
    console.log(`[Camera] Manual toggle camera ${wantOn ? 'ON' : 'OFF'}...`);
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch(`${VISION_BASE}/${wantOn ? 'start' : 'stop'}`, {
        method: 'POST',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        setIsCameraOn(!wantOn);
        setLastError(data?.error || `Camera ${wantOn ? 'start' : 'stop'} failed`);
      } else {
        setLastError(null);
      }
    } catch (err: any) {
      setIsCameraOn(!wantOn);
      const errMsg = err?.name === 'AbortError' ? 'Request timeout' : 'Vision service unreachable';
      setLastError(errMsg);
    }
  };

  const takeScreenshot = async () => {
    if (!isCameraOn) {
      toast.error('Camera is not running');
      return;
    }
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch(`${VISION_BASE}/screenshot`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      if (!res.ok) {
        throw new Error('Failed to capture screenshot');
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `screenshot_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Screenshot saved');
    } catch (err: any) {
      const errMsg = err?.name === 'AbortError' ? 'Request timeout' : err?.message || 'Screenshot failed';
      toast.error(errMsg);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.success('Recording started');
    } else {
      toast.success('Recording saved');
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
                <p className="text-xl font-medium">Camera Starting...</p>
                <p className="text-sm opacity-75">Waiting for external USB camera</p>
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
                {isCameraOn && cameraOk && (
                  <span className="text-sm text-green-300 bg-black/40 px-3 py-1 rounded ml-3 font-medium">
                    {selectedCameraMode === 'internal'
                      ? 'Internal Camera Active (Index 0)'
                      : 'External Camera Active (Index 1)'}
                  </span>
                )}
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
                  className={`p-2 rounded-full backdrop-blur-md border transition-colors ${isCameraOn ? 'bg-status-success/20 border-status-success text-status-success' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                  onClick={toggleCamera}
                  title={isCameraOn ? 'Stop camera' : 'Start camera'}
                >
                  <CameraIcon size={20} />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-md transition-colors"
                  title="Take screenshot"
                  onClick={takeScreenshot}
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

          <div className="mt-4 rounded-3xl border border-border bg-surface p-4">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: 'internal', label: 'Internal Camera' },
                  { key: 'external', label: 'External Camera' },
                  { key: 'off', label: 'Camera OFF' },
                ] as Array<{ key: CameraMode; label: string }>
              ).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  disabled={isApplyingCameraMode}
                  onClick={() => applyCameraMode(option.key)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors border ${selectedCameraMode === option.key ? 'bg-primary text-white border-primary' : 'bg-white/5 text-text-secondary border-white/10 hover:bg-white/10'} ${isApplyingCameraMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-3 text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">Status:</span> {getCameraStatusLabel()}
              {isApplyingCameraMode && <span className="ml-2 text-xs text-text-secondary">(Applying selection...)</span>}
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
        </div>
      </div>
    </div>
  );
}
