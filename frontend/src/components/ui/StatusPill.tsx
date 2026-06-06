import React from 'react';
type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
interface StatusPillProps {
  status: string;
  type?: StatusType;
  className?: string;
}
export function StatusPill({ status, type, className = '' }: StatusPillProps) {
  // Auto-determine type based on status text if not provided
  let determinedType: StatusType = type || 'neutral';
  if (!type) {
    const s = status.toLowerCase();
    if (s.includes('success') || s.includes('online') || s.includes('in stock'))
    determinedType = 'success';else
    if (s.includes('warning') || s.includes('low') || s.includes('busy'))
    determinedType = 'warning';else
    if (
    s.includes('fail') ||
    s.includes('error') ||
    s.includes('offline') ||
    s.includes('out'))

    determinedType = 'danger';else
    if (s.includes('active') || s.includes('idle')) determinedType = 'info';
  }
  const typeStyles = {
    success:
    'bg-status-success/10 text-status-success border-status-success/20',
    warning:
    'bg-status-warning/10 text-status-warning border-status-warning/20',
    danger: 'bg-status-danger/10 text-status-danger border-status-danger/20',
    info: 'bg-status-info/10 text-status-info border-status-info/20',
    neutral:
    'bg-status-neutral/10 text-status-neutral border-status-neutral/20'
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeStyles[determinedType]} ${className}`}>
      
      {status}
    </span>);

}