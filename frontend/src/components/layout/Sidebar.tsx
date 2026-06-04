import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ListTodo,
  History,
  Video,
  Settings,
  LogOut,
  BarChart3,
  Coffee,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Assign Task', path: '/tasks/assign', icon: ListTodo },
    { name: 'Task History', path: '/tasks/history', icon: History },
    { name: 'Live Camera', path: '/camera', icon: Video },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col border-r border-border/10 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-sidebar">
              <Coffee size={20} className="text-white" />
            </div>
            <h1 className="text-sidebar-text font-serif font-bold text-xl tracking-wide">
              Cacao Control
            </h1>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden text-sidebar-text hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + '/');
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-colors z-10 ${isActive ? 'text-white' : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-sidebar-active rounded-lg -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/10">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-sidebar-hover flex items-center justify-center text-sidebar-text font-bold">
              {user?.name.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-sidebar-text truncate">{user?.role || 'Role'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sidebar-text hover:text-white hover:bg-sidebar-hover rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}