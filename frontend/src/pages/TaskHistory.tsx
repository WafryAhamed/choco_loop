import React, { useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Activity } from
'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer } from
'recharts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

import { useTasksHistory } from '../lib/useApi';
export function TaskHistory() {
  const { taskHistory } = useTasksHistory();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const filteredHistory = taskHistory.filter((task) =>
  statusFilter === 'All' ? true : task.status === statusFilter
  );
  const successCount = taskHistory.filter((t) => t.status === 'Success').length;
  const failCount = taskHistory.length - successCount;
  const successRate = Math.round(successCount / taskHistory.length * 100);
  const pieData = [
  {
    name: 'Success',
    value: successCount
  },
  {
    name: 'Failed',
    value: failCount
  }];

  const COLORS = ['var(--success)', 'var(--danger)'];
  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-text-primary mb-1">
            Task History
          </h1>
          <p className="text-text-secondary">
            Audit log of all robotic arm operations.
          </p>
        </div>
      </div>

      {/* Top Section: Filters & Stats */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="flex flex-col justify-center">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Date Range"
                type="date"
                icon={<Calendar size={18} />}
                defaultValue={new Date().toISOString().split('T')[0]} />
              
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Status
              </label>
              <select
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}>
                
                <option value="All">All Statuses</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Task Type
              </label>
              <select className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                <option>All Types</option>
                <option>Place</option>
                <option>Retrieve</option>
              </select>
            </div>
            <Button variant="outline" className="h-[46px] px-6">
              Apply Filters
            </Button>
          </div>
        </Card>
      </div>

      {/* Main Table */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-border text-sm text-text-secondary">
                <th className="py-4 px-6 font-medium">Task ID</th>
                <th className="py-4 px-6 font-medium">Timestamp</th>
                <th className="py-4 px-6 font-medium">Description</th>
                <th className="py-4 px-6 font-medium">Robot</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((task) =>
              <Fragment key={task.id}>
                  <tr
                  className={`border-b border-border/50 hover:bg-hover/30 transition-colors cursor-pointer ${expandedRow === task.id ? 'bg-hover/20' : ''}`}
                  onClick={() => toggleRow(task.id)}>
                  
                    <td className="py-4 px-6 font-mono text-sm text-text-secondary">
                      {task.id}
                    </td>
                    <td className="py-4 px-6 text-sm text-text-primary">
                      {new Date(task.timestamp).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                    </td>
                    <td className="py-4 px-6 font-medium text-text-primary">
                      {task.description}
                    </td>
                    <td className="py-4 px-6 text-sm text-text-secondary">
                      {task.robotId}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {task.status === 'Success' ?
                      <CheckCircle2
                        size={16}
                        className="text-status-success" /> :


                      <XCircle size={16} className="text-status-danger" />
                      }
                        <span
                        className={`text-sm font-medium ${task.status === 'Success' ? 'text-status-success' : 'text-status-danger'}`}>
                        
                          {task.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right text-text-secondary">
                      {expandedRow === task.id ?
                    <ChevronUp size={20} className="inline" /> :

                    <ChevronDown size={20} className="inline" />
                    }
                    </td>
                  </tr>

                  {/* Expandable Details Row */}
                  <AnimatePresence>
                    {expandedRow === task.id &&
                  <tr>
                        <td colSpan={6} className="p-0 border-b border-border">
                          <motion.div
                        initial={{
                          height: 0,
                          opacity: 0
                        }}
                        animate={{
                          height: 'auto',
                          opacity: 1
                        }}
                        exit={{
                          height: 0,
                          opacity: 0
                        }}
                        transition={{
                          duration: 0.3,
                          ease: 'easeInOut'
                        }}
                        className="overflow-hidden bg-surface">
                        
                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-l-4 border-primary ml-6 my-4 bg-background rounded-r-lg">
                              <div>
                                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                                  Execution Details
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary">
                                      Duration:
                                    </span>{' '}
                                    <span className="font-medium">
                                      {task.duration}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary">
                                      Operator:
                                    </span>{' '}
                                    <span className="font-medium">
                                      {task.operator}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary">
                                      Vision Confidence:
                                    </span>{' '}
                                    <span className="font-medium text-primary">
                                      {task.confidence}%
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                                  Telemetry
                                </h4>
                                <div className="space-y-2 text-sm font-mono text-text-secondary">
                                  <div className="flex items-center gap-2">
                                    <Activity
                                  size={14}
                                  className="text-primary" />
                                {' '}
                                    J1: 45.2° J2: -12.4°
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Activity
                                  size={14}
                                  className="text-primary" />
                                {' '}
                                    J3: 88.1° J4: 0.0°
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Activity
                                  size={14}
                                  className="text-primary" />
                                {' '}
                                    Grip Force: 12.4N
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                                  Logs
                                </h4>
                                <div className="bg-black/90 text-green-400 p-3 rounded text-xs font-mono h-24 overflow-y-auto">
                                  <div>[00:00.00] Task received</div>
                                  <div>
                                    [00:00.12] Vision target acquired (
                                    {task.confidence}%)
                                  </div>
                                  <div>[00:00.45] Trajectory planned</div>
                                  <div>[00:01.20] Executing motion...</div>
                                  {task.status === 'Success' ?
                              <div className="text-green-400">
                                      [00:{task.duration}] Task completed
                                      successfully
                                    </div> :

                              <div className="text-red-400">
                                      [00:{task.duration}] ERR: Grip slip
                                      detected. Aborting.
                                    </div>
                              }
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                  }
                  </AnimatePresence>
                </Fragment>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border flex items-center text-sm text-text-secondary bg-surface relative h-16">
          <span className="absolute left-4">
            Showing 1 to {filteredHistory.length} of {taskHistory.length}{' '}
            entries
          </span>
          <div className="flex gap-2 justify-center w-full sm:-ml-12">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>);

}