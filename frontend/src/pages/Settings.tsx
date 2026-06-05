import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings as SettingsIcon,
  Camera,
  Cpu,
  Bot,
  Shield,
  Bell,
  Moon,
  Sun,
  Monitor,
  Upload,
  Wifi,
  Usb,
  Zap,
  Play,
  Volume2,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Save } from
'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { API_BASE, getAuthHeaders } from '../lib/api';

// ─── Reusable Toggle Switch ─────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">{label}</span>
      <button
        role="switch"
        type="button"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${checked ? 'bg-primary' : 'bg-border'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </label>
  );
}

// ─── Reusable Slider ────────────────────────────────────────────────────────
function Slider({ value, onChange, min = 0, max = 100, step = 1, label, unit = '' }:
  { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label: string; unit?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-secondary">{label}</label>
        <span className="text-sm font-mono text-primary font-semibold">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-border accent-primary"
      />
    </div>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5 pb-3 border-b border-border">
      <h3 className="text-lg font-serif font-semibold text-text-primary">{title}</h3>
      {description && <p className="text-xs text-text-secondary mt-1">{description}</p>}
    </div>
  );
}

// ─── Motion wrapper ─────────────────────────────────────────────────────────
const panelMotion = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.2 },
};

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  // ── Camera State ──
  const [cameraIp, setCameraIp] = useState('192.168.1.100');
  const [cameraIndex, setCameraIndex] = useState(1);
  const [cropTop, setCropTop] = useState(0);
  const [cropBottom, setCropBottom] = useState(480);
  const [cropLeft, setCropLeft] = useState(0);
  const [cropRight, setCropRight] = useState(640);
  const [detectionColors, setDetectionColors] = useState({ red: true, blue: true, green: true, yellow: false });
  const [cameraAutoConnect, setCameraAutoConnect] = useState(true);
  const [cameraResolution, setCameraResolution] = useState('640x480');

  // ── Hardware State ──
  const [connectionType, setConnectionType] = useState<'serial' | 'wifi'>('wifi');
  const [robotSpeed, setRobotSpeed] = useState(75);
  const [simulationMode, setSimulationMode] = useState(false);
  const [serialPort, setSerialPort] = useState('COM3');
  const [wifiIp, setWifiIp] = useState('10.20.255.136');
  const [armAcceleration, setArmAcceleration] = useState(50);
  const [gripperForce, setGripperForce] = useState(60);

  // ── AI State ──
  const [aiModel, setAiModel] = useState('nvidia/nemotron-3-super-120b-a12b:free');
  const [temperature, setTemperature] = useState(0.7);
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [contextMemory, setContextMemory] = useState(true);
  const [maxTokens, setMaxTokens] = useState(500);

  // ── Security State ──
  const [usersList, setUsersList] = useState<any[]>([]);
  const [showPasswords, setShowPasswords] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(60);

  // ── Add User & Reset Password Dialogs ──
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('operator');
  const [resetUserId, setResetUserId] = useState('');
  const [resetUserPassword, setResetUserPassword] = useState('');

  // ── Notifications State ──
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [emailAddress, setEmailAddress] = useState('');
  const [taskComplete, setTaskComplete] = useState(true);
  const [lowStock, setLowStock] = useState(true);
  const [robotError, setRobotError] = useState(true);
  const [visionDetection, setVisionDetection] = useState(false);
  const [alertVolume, setAlertVolume] = useState(80);

  // ── Fetch settings and users on mount ──
  React.useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`${API_BASE}/settings`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success && data.settings) {
          const s = data.settings;
          if (s.camera_ip) setCameraIp(s.camera_ip);
          if (s.camera_index) setCameraIndex(Number(s.camera_index));
          if (s.camera_resolution) setCameraResolution(s.camera_resolution);
          if (s.camera_auto_connect) setCameraAutoConnect(s.camera_auto_connect === 'true');
          if (s.crop_top) setCropTop(Number(s.crop_top));
          if (s.crop_bottom) setCropBottom(Number(s.crop_bottom));
          if (s.crop_left) setCropLeft(Number(s.crop_left));
          if (s.crop_right) setCropRight(Number(s.crop_right));
          if (s.detection_colors) {
            try {
              setDetectionColors(JSON.parse(s.detection_colors));
            } catch (e) {}
          }
          if (s.connection_type) setConnectionType(s.connection_type as any);
          if (s.robot_speed) setRobotSpeed(Number(s.robot_speed));
          if (s.simulation_mode) setSimulationMode(s.simulation_mode === 'true');
          if (s.serial_port) setSerialPort(s.serial_port);
          if (s.wifi_ip) setWifiIp(s.wifi_ip);
          if (s.arm_acceleration) setArmAcceleration(Number(s.arm_acceleration));
          if (s.gripper_force) setGripperForce(Number(s.gripper_force));
          if (s.ai_model) setAiModel(s.ai_model);
          if (s.temperature) setTemperature(Number(s.temperature));
          if (s.max_tokens) setMaxTokens(Number(s.max_tokens));
          if (s.context_memory) setContextMemory(s.context_memory === 'true');
          if (s.tts_enabled) setTtsEnabled(s.tts_enabled === 'true');
          if (s.tts_speed) setTtsSpeed(Number(s.tts_speed));
          if (s.sound_alerts) setSoundAlerts(s.sound_alerts === 'true');
          if (s.email_alerts) setEmailAlerts(s.email_alerts === 'true');
          if (s.desktop_notifications) setDesktopNotifications(s.desktop_notifications === 'true');
          if (s.email_address) setEmailAddress(s.email_address);
          if (s.task_complete) setTaskComplete(s.task_complete === 'true');
          if (s.low_stock) setLowStock(s.low_stock === 'true');
          if (s.robot_error) setRobotError(s.robot_error === 'true');
          if (s.vision_detection) setVisionDetection(s.vision_detection === 'true');
          if (s.alert_volume) setAlertVolume(Number(s.alert_volume));
        }
      } catch (err) {
        console.error('Failed to load settings from API:', err);
      }
    }

    async function loadUsers() {
      try {
        const res = await fetch(`${API_BASE}/users`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success && data.data) {
          setUsersList(data.data);
        }
      } catch (err) {
        console.error('Failed to load users from API:', err);
      }
    }

    loadSettings();
    loadUsers();
  }, []);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'system', label: 'System', icon: SettingsIcon },
    { id: 'camera', label: 'Camera', icon: Camera },
    { id: 'hardware', label: 'Hardware', icon: Cpu },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const handleSave = async (section: string) => {
    const settingsPayload = {
      camera_ip: cameraIp,
      camera_index: String(cameraIndex),
      camera_resolution: cameraResolution,
      camera_auto_connect: String(cameraAutoConnect),
      crop_top: String(cropTop),
      crop_bottom: String(cropBottom),
      crop_left: String(cropLeft),
      crop_right: String(cropRight),
      detection_colors: JSON.stringify(detectionColors),
      connection_type: connectionType,
      robot_speed: String(robotSpeed),
      simulation_mode: String(simulationMode),
      serial_port: serialPort,
      wifi_ip: wifiIp,
      arm_acceleration: String(armAcceleration),
      gripper_force: String(gripperForce),
      ai_model: aiModel,
      temperature: String(temperature),
      max_tokens: String(maxTokens),
      context_memory: String(contextMemory),
      tts_enabled: String(ttsEnabled),
      tts_speed: String(ttsSpeed),
      sound_alerts: String(soundAlerts),
      email_alerts: String(emailAlerts),
      desktop_notifications: String(desktopNotifications),
      email_address: emailAddress,
      task_complete: String(taskComplete),
      low_stock: String(lowStock),
      robot_error: String(robotError),
      vision_detection: String(visionDetection),
      alert_volume: String(alertVolume),
    };

    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(settingsPayload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${section} settings saved successfully`);
      } else {
        toast.error(`Failed to save settings: ${data.error}`);
      }
    } catch (err) {
      toast.error('Network error saving settings');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User added successfully');
        setIsAddUserOpen(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        // Refresh users list
        const res2 = await fetch(`${API_BASE}/users`, {
          headers: getAuthHeaders(),
        });
        const data2 = await res2.json();
        if (data2.success) setUsersList(data2.data);
      } else {
        toast.error(data.error || 'Failed to add user');
      }
    } catch (err) {
      toast.error('Network error adding user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User removed successfully');
        setUsersList(prev => prev.filter(u => u.id !== userId));
      } else {
        toast.error('Failed to remove user');
      }
    } catch (err) {
      toast.error('Network error deleting user');
    }
  };

  const handleResetPassword = async () => {
    if (!resetUserId || !resetUserPassword) {
      toast.error('Please select a user and enter a new password');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/users/${resetUserId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ password: resetUserPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password reset successfully');
        setResetUserPassword('');
      } else {
        toast.error('Failed to reset password');
      }
    } catch (err) {
      toast.error('Network error resetting password');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-text-primary mb-1">
          Settings
        </h1>
        <p className="text-text-secondary">
          Manage your account and system preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <Card noPadding className="overflow-hidden">
            <nav className="flex flex-col p-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors relative ${isActive ? 'text-primary' : 'text-text-secondary hover:bg-hover hover:text-text-primary'}`}>
                    
                    {isActive &&
                    <motion.div
                      layoutId="settings-active-tab"
                      className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30
                      }} />
                    }
                    <tab.icon size={18} />
                    {tab.label}
                  </button>);
              })}
            </nav>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <Card className="min-h-[500px]">
            <AnimatePresence mode="wait">

              {/* ═══════════════ PROFILE ═══════════════ */}
              {activeTab === 'profile' &&
              <motion.div key="profile" {...panelMotion}>
                <h2 className="text-xl font-serif font-semibold text-text-primary mb-6">
                  Profile Settings
                </h2>
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold border-2 border-primary/20">
                    {user?.name.charAt(0)}
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mb-2 flex gap-2"
                      onClick={() =>
                        toast.info('Avatar upload is not configured — profile name and email are stored in your login session.')
                      }>
                      <Upload size={16} /> Upload Avatar
                    </Button>
                    <p className="text-xs text-text-secondary">
                      JPG, GIF or PNG. Max size of 800K
                    </p>
                  </div>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSave('Profile'); }} className="space-y-6 max-w-md">
                  <Input label="Full Name" defaultValue={user?.name} />
                  <Input label="Email Address" type="email" defaultValue={user?.email} />
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Role</label>
                    <select className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" defaultValue={user?.role || 'admin'}>
                      <option value="admin">Admin</option>
                      <option value="operator">Operator</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-medium text-text-primary mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <Input label="Current Password" type="password" />
                      <Input label="New Password" type="password" />
                    </div>
                  </div>
                  <Button type="submit">Save Changes</Button>
                </form>
              </motion.div>
              }

              {/* ═══════════════ SYSTEM ═══════════════ */}
              {activeTab === 'system' &&
              <motion.div key="system" {...panelMotion}>
                <h2 className="text-xl font-serif font-semibold text-text-primary mb-6">
                  System Preferences
                </h2>
                <div className="space-y-8 max-w-md">
                  <div>
                    <h3 className="text-sm font-medium text-text-primary mb-3">Theme Appearance</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'day', label: 'Day', icon: Sun },
                        { id: 'night', label: 'Night', icon: Moon },
                        { id: 'system', label: 'System', icon: Monitor },
                      ].map((t) =>
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id as any)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === t.id ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-surface text-text-secondary hover:border-primary/50'}`}>
                          <t.icon size={24} />
                          <span className="text-sm font-medium">{t.label}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Language</label>
                    <select className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>English (US)</option>
                      <option>French</option>
                      <option>German</option>
                      <option>Spanish</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Timezone</label>
                    <select className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>Pacific Time (US & Canada)</option>
                      <option>Eastern Time (US & Canada)</option>
                      <option>Central European Time</option>
                      <option>Asia/Kolkata (IST)</option>
                    </select>
                  </div>
                  <Button onClick={() => handleSave('System')}>Save Preferences</Button>
                </div>
              </motion.div>
              }

              {/* ═══════════════ CAMERA ═══════════════ */}
              {activeTab === 'camera' &&
              <motion.div key="camera" {...panelMotion}>
                <SectionHeader title="Camera Configuration" description="Configure camera source, resolution, crop ROI and detection color filters." />
                <div className="space-y-8 max-w-lg">
                  {/* Connection */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2"><Camera size={16} /> Camera Source</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">IP Address</label>
                        <input value={cameraIp} onChange={(e) => setCameraIp(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="192.168.1.100" />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">Camera Index</label>
                        <select value={cameraIndex} onChange={(e) => setCameraIndex(Number(e.target.value))} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value={0}>0 — Built-in Webcam</option>
                          <option value={1}>1 — External USB (Primary)</option>
                          <option value={2}>2 — External USB (Secondary)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">Resolution</label>
                        <select value={cameraResolution} onChange={(e) => setCameraResolution(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                          <option>320x240</option>
                          <option>640x480</option>
                          <option>1280x720</option>
                          <option>1920x1080</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <Toggle checked={cameraAutoConnect} onChange={setCameraAutoConnect} label="Auto-connect on startup" />
                      </div>
                    </div>
                  </div>

                  {/* Crop ROI */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-text-primary">Crop Region of Interest (ROI)</h4>
                    <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Slider label="Top" value={cropTop} onChange={setCropTop} min={0} max={480} unit="px" />
                        <Slider label="Bottom" value={cropBottom} onChange={setCropBottom} min={0} max={480} unit="px" />
                        <Slider label="Left" value={cropLeft} onChange={setCropLeft} min={0} max={640} unit="px" />
                        <Slider label="Right" value={cropRight} onChange={setCropRight} min={0} max={640} unit="px" />
                      </div>
                      <p className="text-[11px] text-text-secondary text-center">
                        Preview: {cropRight - cropLeft}×{cropBottom - cropTop} px
                      </p>
                    </div>
                  </div>

                  {/* Detection Colors */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-text-primary">Detection Color Filters</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(detectionColors).map(([color, enabled]) => (
                        <div key={color} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${enabled ? 'border-primary bg-primary/5' : 'border-border bg-surface'}`}
                          onClick={() => setDetectionColors(prev => ({ ...prev, [color]: !prev[color as keyof typeof prev] }))}>
                          <div className={`w-5 h-5 rounded-full border-2 ${
                            color === 'red' ? 'bg-red-500 border-red-600' :
                            color === 'blue' ? 'bg-blue-500 border-blue-600' :
                            color === 'green' ? 'bg-green-500 border-green-600' :
                            'bg-yellow-500 border-yellow-600'
                          }`} />
                          <span className="text-sm font-medium text-text-primary capitalize">{color}</span>
                          <div className={`ml-auto w-4 h-4 rounded border-2 flex items-center justify-center ${enabled ? 'bg-primary border-primary' : 'border-border'}`}>
                            {enabled && <span className="text-white text-[10px]">✓</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={() => handleSave('Camera')} className="flex items-center gap-2">
                    <Save size={16} /> Save Camera Settings
                  </Button>
                </div>
              </motion.div>
              }

              {/* ═══════════════ HARDWARE ═══════════════ */}
              {activeTab === 'hardware' &&
              <motion.div key="hardware" {...panelMotion}>
                <SectionHeader title="Hardware Configuration" description="Robotic arm connection, speed tuning, and simulation mode." />
                <div className="space-y-8 max-w-lg">

                  {/* Connection Type */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2"><Zap size={16} /> Connection Type</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'serial', label: 'Serial (USB)', icon: Usb, desc: 'Direct USB cable connection' },
                        { id: 'wifi', label: 'Wi-Fi', icon: Wifi, desc: 'Over local network' },
                      ].map((opt) => (
                        <button key={opt.id} onClick={() => setConnectionType(opt.id as any)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${connectionType === opt.id ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-surface text-text-secondary hover:border-primary/50'}`}>
                          <opt.icon size={24} />
                          <span className="text-sm font-semibold">{opt.label}</span>
                          <span className="text-[11px] opacity-60">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Connection Details */}
                  <div className="space-y-3">
                    {connectionType === 'serial' ? (
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">Serial Port</label>
                        <input value={serialPort} onChange={(e) => setSerialPort(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="COM3" />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">Robot Arm IP</label>
                        <input value={wifiIp} onChange={(e) => setWifiIp(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="10.20.255.136" />
                      </div>
                    )}
                  </div>

                  {/* Speed Tuning */}
                  <div className="space-y-4 bg-surface border border-border rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2"><Play size={16} /> Motion Settings</h4>
                    <Slider label="Arm Speed" value={robotSpeed} onChange={setRobotSpeed} min={10} max={100} unit="%" />
                    <Slider label="Acceleration" value={armAcceleration} onChange={setArmAcceleration} min={10} max={100} unit="%" />
                    <Slider label="Gripper Force" value={gripperForce} onChange={setGripperForce} min={10} max={100} unit="%" />
                  </div>

                  {/* Simulation */}
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <Toggle checked={simulationMode} onChange={setSimulationMode} label="Simulation Mode" />
                    <p className="text-xs text-text-secondary mt-2">
                      When enabled, robot commands are simulated locally without sending signals to the physical arm. Useful for development and testing.
                    </p>
                  </div>

                  <Button onClick={() => handleSave('Hardware')} className="flex items-center gap-2">
                    <Save size={16} /> Save Hardware Settings
                  </Button>
                </div>
              </motion.div>
              }

              {/* ═══════════════ AI ASSISTANT ═══════════════ */}
              {activeTab === 'ai' &&
              <motion.div key="ai" {...panelMotion}>
                <SectionHeader title="AI Assistant" description="Configure the AI model, response parameters, and voice synthesis." />
                <div className="space-y-8 max-w-lg">
                  {/* Model Selection */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2"><Bot size={16} /> Model Configuration</h4>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">AI Model</label>
                      <select value={aiModel} onChange={(e) => setAiModel(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="nvidia/nemotron-3-super-120b-a12b:free">Nvidia Nemotron 3 Super (Free)</option>
                        <option value="meta-llama/llama-3.1-8b-instruct:free">Llama 3.1 8B (Free)</option>
                        <option value="google/gemma-2-9b-it:free">Gemma 2 9B (Free)</option>
                        <option value="mistralai/mistral-7b-instruct:free">Mistral 7B (Free)</option>
                      </select>
                    </div>
                    <Slider label="Temperature" value={temperature} onChange={setTemperature} min={0} max={2} step={0.1} />
                    <Slider label="Max Tokens" value={maxTokens} onChange={setMaxTokens} min={100} max={2000} step={50} />
                    <Toggle checked={contextMemory} onChange={setContextMemory} label="Enable conversation memory" />
                  </div>

                  {/* TTS */}
                  <div className="space-y-4 bg-surface border border-border rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2"><Volume2 size={16} /> Text-to-Speech</h4>
                    <Toggle checked={ttsEnabled} onChange={setTtsEnabled} label="Enable voice responses" />
                    <Slider label="Speech Rate" value={ttsSpeed} onChange={setTtsSpeed} min={0.5} max={2} step={0.1} unit="x" />
                  </div>

                  <Button onClick={() => handleSave('AI Assistant')} className="flex items-center gap-2">
                    <Save size={16} /> Save AI Settings
                  </Button>
                </div>
              </motion.div>
              }

              {/* ═══════════════ SECURITY ═══════════════ */}
              {activeTab === 'security' &&
              <motion.div key="security" {...panelMotion}>
                <SectionHeader title="Security Settings" description="Manage user accounts, authentication, and access control." />
                <div className="space-y-8 max-w-2xl">

                  {/* User Accounts Table */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2"><Shield size={16} /> User Accounts</h4>
                      <Button variant="outline" onClick={() => setIsAddUserOpen(true)} className="flex items-center gap-1 text-xs py-1.5 px-3">
                        <Plus size={14} /> Add User
                      </Button>
                    </div>

                    {isAddUserOpen && (
                      <form onSubmit={handleAddUser} className="bg-surface border border-border rounded-xl p-4 space-y-4 max-w-md">
                        <h4 className="text-sm font-semibold text-text-primary">Add New User Account</h4>
                        <div className="space-y-2">
                          <label className="block text-xs text-text-secondary">Full Name</label>
                          <input value={newUserName} onChange={e => setNewUserName(e.target.value)} required className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs text-text-secondary">Email Address</label>
                          <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="john@chocoloop.com" />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs text-text-secondary">Password</label>
                          <input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••" />
                        </div>
                        <div>
                          <label className="block text-xs text-text-secondary mb-1">Role</label>
                          <select className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                            <option value="admin">Admin</option>
                            <option value="operator">Operator</option>
                          </select>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button type="submit">Create User</Button>
                          <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
                        </div>
                      </form>
                    )}

                    <div className="overflow-hidden rounded-xl border border-border">
                      <table className="w-full">
                        <thead className="bg-surface">
                          <tr>
                            <th className="text-left text-xs font-semibold text-text-secondary py-3 px-4">Name</th>
                            <th className="text-left text-xs font-semibold text-text-secondary py-3 px-4">Email</th>
                            <th className="text-left text-xs font-semibold text-text-secondary py-3 px-4">Role</th>
                            <th className="text-left text-xs font-semibold text-text-secondary py-3 px-4">Status</th>
                            <th className="text-right text-xs font-semibold text-text-secondary py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersList.map((u) => (
                            <tr key={u.id} className="border-t border-border hover:bg-hover/50 transition-colors">
                              <td className="py-3 px-4 text-sm text-text-primary font-medium">{u.name}</td>
                              <td className="py-3 px-4 text-sm text-text-secondary">{u.email}</td>
                              <td className="py-3 px-4">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                  u.role === 'Admin' ? 'bg-primary/10 text-primary' :
                                  u.role === 'Operator' ? 'bg-blue-500/10 text-blue-500' :
                                  'bg-border text-text-secondary'
                                }`}>{u.role}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`flex items-center gap-1.5 text-xs ${u.active ? 'text-green-500' : 'text-text-secondary'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-green-500' : 'bg-border'}`} />
                                  {u.active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button onClick={() => handleDeleteUser(u.id)} className="text-text-secondary hover:text-red-500 transition-colors p-1" title="Remove user">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Auth Settings */}
                  <div className="space-y-4 bg-surface border border-border rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-text-primary">Authentication</h4>
                    <Toggle checked={twoFactor} onChange={setTwoFactor} label="Require two-factor authentication" />
                    <Toggle checked={showPasswords} onChange={setShowPasswords} label="Show password fields in user management" />
                    <Slider label="Session Timeout" value={sessionTimeout} onChange={setSessionTimeout} min={5} max={1440} unit=" min" />
                  </div>

                  {/* Password Reset */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      {showPasswords ? <Eye size={16} /> : <EyeOff size={16} />}
                      Reset User Password
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">Select User</label>
                        <select value={resetUserId} onChange={(e) => setResetUserId(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="">-- Select User --</option>
                          {usersList.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">New Password</label>
                        <input value={resetUserPassword} onChange={(e) => setResetUserPassword(e.target.value)} type={showPasswords ? 'text' : 'password'} placeholder="Enter new password" className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleResetPassword} className="text-sm">Reset Password</Button>
                  </div>

                  <Button onClick={() => handleSave('Security')} className="flex items-center gap-2">
                    <Save size={16} /> Save Security Settings
                  </Button>
                </div>
              </motion.div>
              }

              {/* ═══════════════ NOTIFICATIONS ═══════════════ */}
              {activeTab === 'notifications' &&
              <motion.div key="notifications" {...panelMotion}>
                <SectionHeader title="Notification Preferences" description="Control how and when you receive alerts about system events." />
                <div className="space-y-8 max-w-lg">

                  {/* Channels */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2"><Bell size={16} /> Notification Channels</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'sound', label: 'Sound', icon: Volume2, checked: soundAlerts, onChange: setSoundAlerts },
                        { id: 'email', label: 'Email', icon: Mail, checked: emailAlerts, onChange: setEmailAlerts },
                        { id: 'desktop', label: 'Desktop', icon: Smartphone, checked: desktopNotifications, onChange: setDesktopNotifications },
                      ].map((ch) => (
                        <button key={ch.id} onClick={() => ch.onChange(!ch.checked)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${ch.checked ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-surface text-text-secondary hover:border-primary/50'}`}>
                          <ch.icon size={24} />
                          <span className="text-sm font-semibold">{ch.label}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ch.checked ? 'bg-primary text-white' : 'bg-border text-text-secondary'}`}>
                            {ch.checked ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Email config */}
                  {emailAlerts && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                      <label className="block text-xs text-text-secondary">Notification Email Address</label>
                      <input value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} placeholder="alerts@yourcompany.com" className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" />
                    </motion.div>
                  )}

                  {/* Sound volume */}
                  {soundAlerts && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <Slider label="Alert Volume" value={alertVolume} onChange={setAlertVolume} min={0} max={100} unit="%" />
                    </motion.div>
                  )}

                  {/* Event Types */}
                  <div className="space-y-3 bg-surface border border-border rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-text-primary">Event Types</h4>
                    <div className="space-y-3">
                      <Toggle checked={taskComplete} onChange={setTaskComplete} label="Task completed" />
                      <Toggle checked={lowStock} onChange={setLowStock} label="Low stock alert" />
                      <Toggle checked={robotError} onChange={setRobotError} label="Robot error / failure" />
                      <Toggle checked={visionDetection} onChange={setVisionDetection} label="New vision detection" />
                    </div>
                  </div>

                  <Button onClick={() => handleSave('Notifications')} className="flex items-center gap-2">
                    <Save size={16} /> Save Notification Settings
                  </Button>
                </div>
              </motion.div>
              }

            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>);
}