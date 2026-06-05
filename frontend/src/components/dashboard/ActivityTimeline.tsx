import React from 'react';
import { motion } from 'framer-motion';
import { History, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { useTasksHistory } from '../../lib/useApi';
export function ActivityTimeline() {
  const { taskHistory } = useTasksHistory();
  const recentHistory = taskHistory.slice(0, 10);
  return (
    <Card>
      <div className="flex items-center gap-2 mb-6">
        <History size={18} className="text-primary" />
        <h3 className="font-semibold text-text-primary">Recent Activity</h3>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border"></div>

        <div className="space-y-6">
          {recentHistory.map((item, index) =>
          <motion.div
            key={item.id}
            initial={{
              opacity: 0,
              x: -20
            }}
            animate={{
              opacity: 1,
              x: 0
            }}
            transition={{
              delay: index * 0.05
            }}
            className="relative pl-10 flex items-start gap-4">
            
              {/* Timeline dot */}
              <div className="absolute left-2.5 top-1 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-background border-2 border-primary z-10"></div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-text-primary">
                    {item.description}
                  </p>
                  <span className="text-xs text-text-secondary">
                    {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span className="font-mono">{item.id}</span>
                  <span>•</span>
                  <span>{item.operator}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    {item.status === 'Success' ?
                  <>
                        <CheckCircle2
                      size={12}
                      className="text-status-success" />
                    {' '}
                        Success
                      </> :

                  <>
                        <XCircle size={12} className="text-status-danger" />{' '}
                        Failed
                      </>
                  }
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Card>);

}