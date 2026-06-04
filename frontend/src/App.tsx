import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedLayout } from './components/layout/ProtectedLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { TaskAssign } from './pages/TaskAssign';
import { TaskHistory } from './pages/TaskHistory';
import { Camera } from './pages/Camera';
import { Settings } from './pages/Settings';
import { Analytics } from './pages/Analytics';
import { Chatbot } from './components/ai/Chatbot';
import { useScreenInit } from './useScreenInit';
function AppRoutes() {
  useScreenInit(); // Required for Magic Patterns orchestration
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/tasks/assign" element={<TaskAssign />} />
        <Route path="/tasks/history" element={<TaskHistory />} />
        <Route path="/camera" element={<Camera />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>);

}
export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Chatbot />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>);

}