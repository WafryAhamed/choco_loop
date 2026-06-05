import React from 'react';
import { Activity } from 'lucide-react';
import { Card } from '../ui/Card';
import { useDashboardSummary } from '../../lib/useApi';
export function SystemHealth() {
  const { systemHealth = [] } = useDashboardSummary();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-status-success';
      case 'idle':
        return 'bg-status-info';
      case 'busy':
        return 'bg-status-warning';
      case 'error':
        return 'bg-status-danger';
      default:
        return 'bg-status-neutral';
    }
  };
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-primary" />
        <h3 className="font-semibold text-text-primary">System Health</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {systemHealth.map((sys: any) =>
        <div
          key={sys.service}
          className="p-3 rounded-lg bg-background border border-border">
          
            <div className="flex items-center gap-2 mb-2">
              <div
              className={`w-2 h-2 rounded-full ${getStatusColor(sys.status)}`} />
            
              <span className="text-sm font-medium text-text-primary truncate">
                {sys.service}
              </span>
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>{sys.uptime}</span>
              <span>{sys.ping}</span>
            </div>
          </div>
        )}
      </div>
    </Card>);

}