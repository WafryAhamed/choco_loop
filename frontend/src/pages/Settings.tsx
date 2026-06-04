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
  Upload } from
'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const tabs = [
  {
    id: 'profile',
    label: 'Profile',
    icon: User
  },
  {
    id: 'system',
    label: 'System',
    icon: SettingsIcon
  },
  {
    id: 'camera',
    label: 'Camera',
    icon: Camera
  },
  {
    id: 'hardware',
    label: 'Hardware',
    icon: Cpu
  },
  {
    id: 'ai',
    label: 'AI Assistant',
    icon: Bot
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell
  }];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Settings saved successfully');
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
              {activeTab === 'profile' &&
              <motion.div
                key="profile"
                initial={{
                  opacity: 0,
                  x: 20
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                exit={{
                  opacity: 0,
                  x: -20
                }}
                transition={{
                  duration: 0.2
                }}>
                
                  <h2 className="text-xl font-serif font-semibold text-text-primary mb-6">
                    Profile Settings
                  </h2>

                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold border-2 border-primary/20">
                      {user?.name.charAt(0)}
                    </div>
                    <div>
                      <Button variant="outline" className="mb-2 flex gap-2">
                        <Upload size={16} /> Upload Avatar
                      </Button>
                      <p className="text-xs text-text-secondary">
                        JPG, GIF or PNG. Max size of 800K
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSave} className="space-y-6 max-w-md">
                    <Input label="Full Name" defaultValue={user?.name} />
                    <Input
                    label="Email Address"
                    type="email"
                    defaultValue={user?.email} />
                  
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        Role
                      </label>
                      <select 
                        className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" 
                        defaultValue={user?.role || 'admin'}
                      >
                        <option value="admin">Admin</option>
                        <option value="operator">Operator</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <h3 className="text-sm font-medium text-text-primary mb-4">
                        Change Password
                      </h3>
                      <div className="space-y-4">
                        <Input label="Current Password" type="password" />
                        <Input label="New Password" type="password" />
                      </div>
                    </div>

                    <Button type="submit">Save Changes</Button>
                  </form>
                </motion.div>
              }

              {activeTab === 'system' &&
              <motion.div
                key="system"
                initial={{
                  opacity: 0,
                  x: 20
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                exit={{
                  opacity: 0,
                  x: -20
                }}
                transition={{
                  duration: 0.2
                }}>
                
                  <h2 className="text-xl font-serif font-semibold text-text-primary mb-6">
                    System Preferences
                  </h2>

                  <div className="space-y-8 max-w-md">
                    <div>
                      <h3 className="text-sm font-medium text-text-primary mb-3">
                        Theme Appearance
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                      {
                        id: 'day',
                        label: 'Day',
                        icon: Sun
                      },
                      {
                        id: 'night',
                        label: 'Night',
                        icon: Moon
                      },
                      {
                        id: 'system',
                        label: 'System',
                        icon: Monitor
                      }].
                      map((t) =>
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id as any)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === t.id ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-surface text-text-secondary hover:border-primary/50'}`}>
                        
                            <t.icon size={24} />
                            <span className="text-sm font-medium">
                              {t.label}
                            </span>
                          </button>
                      )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        Language
                      </label>
                      <select className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                        <option>English (US)</option>
                        <option>French</option>
                        <option>German</option>
                        <option>Spanish</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        Timezone
                      </label>
                      <select className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                        <option>Pacific Time (US & Canada)</option>
                        <option>Eastern Time (US & Canada)</option>
                        <option>Central European Time</option>
                      </select>
                    </div>

                    <Button onClick={handleSave}>Save Preferences</Button>
                  </div>
                </motion.div>
              }

              {/* Placeholder for other tabs */}
              {[
              'camera',
              'hardware',
              'ai',
              'security',
              'notifications'].
              includes(activeTab) &&
              <motion.div
                key="placeholder"
                initial={{
                  opacity: 0,
                  x: 20
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                exit={{
                  opacity: 0,
                  x: -20
                }}
                transition={{
                  duration: 0.2
                }}
                className="h-full flex flex-col items-center justify-center text-text-secondary py-20">
                
                  <SettingsIcon size={48} className="mb-4 opacity-20" />
                  <p>
                    Settings for {activeTab} will be available in the next
                    update.
                  </p>
                </motion.div>
              }
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>);

}