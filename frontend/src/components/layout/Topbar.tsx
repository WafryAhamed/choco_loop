import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  const mockNotifications = [
    { id: 1, text: 'Low inventory on Cacao Beans', time: '5m ago', unread: true },
    { id: 2, text: 'New task assigned to you', time: '1h ago', unread: true },
    { id: 3, text: 'System update completed', time: '2h ago', unread: false }
  ];

  const searchResults = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Inventory', path: '/inventory' },
    { name: 'Assign Task', path: '/tasks/assign' },
    { name: 'Task History', path: '/tasks/history' },
    { name: 'Camera', path: '/camera' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Settings', path: '/settings' },
  ].filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        document.getElementById('global-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const title = pathParts.length > 0 
    ? pathParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ') 
    : 'Dashboard';

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden text-text-secondary hover:text-text-primary"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-lg md:text-xl font-serif font-semibold text-text-primary truncate">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="relative" ref={searchRef}>
          <div className="hidden md:flex items-center relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input
              id="global-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search (Ctrl+K)"
              className="bg-background border border-border rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-48 lg:w-64"
            />
          </div>
          
          <button 
            className="md:hidden text-text-secondary"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search size={20} />
          </button>

          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 md:left-0 top-full mt-2 w-64 md:w-full bg-surface border border-border rounded-lg shadow-premium overflow-hidden z-50"
              >
                <div className="md:hidden p-2 border-b border-border">
                   <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {searchQuery ? (
                  searchResults.length > 0 ? (
                    <ul className="max-h-64 overflow-y-auto py-2">
                      {searchResults.map(result => (
                        <li key={result.path}>
                          <button
                            onClick={() => {
                              navigate(result.path);
                              setIsSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-hover text-sm text-text-primary"
                          >
                            {result.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-sm text-text-secondary text-center">No results found</div>
                  )
                ) : (
                  <div className="p-4 text-sm text-text-secondary text-center">Type to search</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={toggleTheme}
          className="relative w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:bg-hover transition-colors flex-shrink-0"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? 'dark' : 'light'}
              initial={{ y: -20, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 20, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {isDark ? <Moon size={20} /> : <Sun size={20} />}
            </motion.div>
          </AnimatePresence>
        </button>

        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:bg-hover transition-colors flex-shrink-0"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-status-danger rounded-full border-2 border-surface"></span>
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-premium overflow-hidden z-50 origin-top-right"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">Notifications</h3>
                  <button 
                    onClick={() => {
                      toast.success("All notifications marked as read");
                      setIsNotificationsOpen(false);
                    }}
                    className="text-xs text-primary hover:text-primary-dark"
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {mockNotifications.map(notification => (
                    <div 
                      key={notification.id}
                      className={`p-4 border-b border-border hover:bg-hover cursor-pointer transition-colors ${notification.unread ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notification.unread ? 'bg-primary' : 'bg-transparent'}`} />
                        <div>
                          <p className={`text-sm ${notification.unread ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                            {notification.text}
                          </p>
                          <p className="text-xs text-text-secondary mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}