import React from 'react';
import { motion } from 'framer-motion';
import { ListTodo } from 'lucide-react';
import { Card } from '../ui/Card';
import { StatusPill } from '../ui/StatusPill';
import { useTasksActive } from '../../lib/useApi';
export function TaskQueue() {
  const { activeTasks } = useTasksActive();
  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <ListTodo size={18} className="text-primary" />
        <h3 className="font-semibold text-text-primary">Task Queue</h3>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-2">
        {activeTasks.map((task, index) =>
        <motion.div
          key={task.id}
          initial={{
            opacity: 0,
            y: 10
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: index * 0.1
          }}
          className="p-3 rounded-lg border border-border bg-background">
          
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-mono text-text-secondary">
                  {task.id}
                </span>
                <p className="text-sm font-medium text-text-primary mt-0.5">
                  {task.description}
                </p>
              </div>
              <StatusPill status={task.status} />
            </div>

            {task.status === 'Active' &&
          <div className="mt-3">

                <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                  <motion.div
                className="bg-primary h-1.5 rounded-full"
                initial={{
                  width: 0
                }}
                animate={{
                  width: `${task.progress}%`
                }}
                transition={{
                  duration: 1,
                  ease: 'easeOut'
                }} />
              
                </div>
              </div>
          }
          </motion.div>
        )}
      </div>
    </Card>);

}