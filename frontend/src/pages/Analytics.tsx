import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Clock,
  CheckCircle2,
  ListChecks,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Trophy,
  Flame,
  Loader
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useAnalytics } from '../lib/useAnalytics';

const RANGES = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' }
];

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-lg shadow-premium dark:shadow-premium-dark">
        {label && <p className="text-sm font-medium text-text-primary mb-1">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            className="text-sm"
            style={{ color: entry.color || entry.fill }}
          >
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function Analytics() {
  const [selectedRange, setSelectedRange] = useState('today');
  const { data, loading, error } = useAnalytics(selectedRange);

  const summary = data?.summary || {
    tasksCompleted: 0,
    itemsSorted: 0,
    topProduct: 'N/A',
    peakHour: 'N/A',
    successRate: 0,
    failureRate: 0,
    totalTasks: 0
  };

  const charts = data?.charts || {
    throughputData: [],
    tasksByType: [],
    inventoryDistribution: []
  };

  const insights = data?.insights || [];

  const cardMotion = (i: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: i * 0.08 }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-text-primary mb-1">
            Analytics
          </h1>
          <p className="text-text-secondary">
            Real-time operational performance and production insights
          </p>
        </div>
        
        {/* Range Selector */}
        <div className="flex items-center gap-1 bg-surface border border-border rounded-full p-1">
          {RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setSelectedRange(range.value)}
              className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                selectedRange === range.value
                  ? 'text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {selectedRange === range.value && (
                <motion.div
                  layoutId="range-pill"
                  className="absolute inset-0 bg-primary rounded-full -z-10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800"
        >
          {error}
        </motion.div>
      )}

      {/* Daily Summary Card */}
      <motion.div {...cardMotion(0)}>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <TrendingUp size={20} />
              </div>
              <div>
                <h2 className="text-xl font-serif font-semibold text-text-primary">
                  Summary
                </h2>
                <p className="text-sm text-text-secondary">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            {loading && <Loader className="animate-spin text-primary" size={20} />}
          </div>

          {/* Summary Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: 'Tasks Completed',
                value: summary.tasksCompleted,
                icon: ListChecks
              },
              {
                label: 'Items Sorted',
                value: summary.itemsSorted,
                icon: TrendingUp
              },
              {
                label: 'Success Rate',
                value: `${summary.successRate}%`,
                icon: CheckCircle2
              },
              {
                label: 'Failure Rate',
                value: `${summary.failureRate}%`,
                icon: AlertTriangle
              }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="p-4 rounded-xl border border-border bg-surface"
              >
                <stat.icon size={18} className="text-primary mb-2" />
                <p className="text-xs text-text-secondary mb-1">{stat.label}</p>
                <p className="font-serif font-bold text-text-primary text-lg">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Extra Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-border">
            <div>
              <p className="text-xs text-text-secondary mb-1">Top Product</p>
              <p className="font-semibold text-text-primary">{summary.topProduct}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Peak Hour</p>
              <p className="font-semibold text-text-primary">{summary.peakHour}</p>
            </div>
          </div>

          {/* AI Insights */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-accent" />
              <h3 className="text-sm font-semibold text-text-primary">AI Insights</h3>
            </div>
            <ul className="space-y-2">
              {insights.length > 0 ? (
                insights.map((insight, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start gap-2 text-sm text-text-secondary"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                    {insight}
                  </motion.li>
                ))
              ) : (
                <p className="text-sm text-text-secondary">
                  No data available for this period
                </p>
              )}
            </ul>
          </div>
        </Card>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Throughput Trend */}
        <motion.div {...cardMotion(1)}>
          <Card>
            <h3 className="font-semibold text-text-primary mb-6">Throughput Trend</h3>
            <div className="h-64">
              {charts.throughputData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={charts.throughputData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="aThroughput" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--chart-grid)"
                    />
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="Units"
                      stroke="var(--chart-1)"
                      strokeWidth={3}
                      fill="url(#aThroughput)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-text-secondary">
                  No data available
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Tasks by Type */}
        <motion.div {...cardMotion(2)}>
          <Card>
            <h3 className="font-semibold text-text-primary mb-6">Tasks by Type</h3>
            <div className="h-64">
              {charts.tasksByType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts.tasksByType}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--chart-grid)"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--hover)' }} />
                    <Bar
                      dataKey="value"
                      name="Tasks"
                      fill="var(--chart-2)"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-text-secondary">
                  No data available
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Inventory Distribution */}
        <motion.div {...cardMotion(3)}>
          <Card>
            <h3 className="font-semibold text-text-primary mb-6">
              Inventory Distribution
            </h3>
            <div className="h-64">
              {charts.inventoryDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.inventoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {charts.inventoryDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-text-secondary">
                  No inventory data
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-primary mr-2" />
          <p className="text-text-secondary">Loading analytics...</p>
        </div>
      )}
    </div>
  );
}