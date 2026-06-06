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
<<<<<<< HEAD
        {label &&
        <p className="text-sm font-medium text-text-primary mb-1">{label}</p>
        }
        {payload.map((entry: any, index: number) =>
        <p
          key={index}
          className="text-sm"
          style={{
            color: entry.color || entry.fill
          }}>
          
            {entry.name}: {entry.value}
          </p>
        )}
      </div>);

  }
  return null;
}
const sparkline = () => [];
export function Analytics() {
  const { 
    throughputData = [], 
    inventoryDistribution = [], 
    dailySummary = {
      tasksCompleted: 0,
      successRate: 0,
      errorRate: 0,
      avgCycleTime: '0s',
      itemsSorted: 0,
      topProduct: '',
      peakHour: '',
      peakThroughput: 0,
      insights: []
    }
  } = useDashboardSummary();

  const tasksByType: any[] = [];
  
  const operatorBreakdown: any[] = [];
  
  const successOverTime: any[] = [];

  const [range, setRange] = useState('Today');
  const operatorColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];
  const cardMotion = (i: number) => ({
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0
    },
    transition: {
      duration: 0.4,
      delay: i * 0.08
    }
  });
=======
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

>>>>>>> fix-camera
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-text-primary mb-1">
            Analytics
          </h1>
          <p className="text-text-secondary">
<<<<<<< HEAD
            Operational performance and production insights.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-surface border border-border rounded-full p-1">
          {ranges.map((r) =>
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${range === r ? 'text-white' : 'text-text-secondary hover:text-text-primary'}`}>
            
              {range === r &&
            <motion.div
              layoutId="range-pill"
              className="absolute inset-0 bg-primary rounded-full -z-10"
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30
              }} />

            }
              {r}
            </button>
          )}
        </div>
      </div>

=======
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

>>>>>>> fix-camera
      {/* Daily Summary Card */}
      <motion.div {...cardMotion(0)}>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
<<<<<<< HEAD
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-semibold text-text-primary">
                Daily Summary
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {[
            {
              label: 'Tasks Completed',
              value: dailySummary?.tasksCompleted || 0,
              icon: ListChecks
            },
            {
              label: 'Items Sorted',
              value: (dailySummary?.itemsSorted || 0).toLocaleString(),
              icon: TrendingUp
            },
            {
              label: 'Top Product',
              value: dailySummary?.topProduct || 'N/A',
              icon: Trophy,
              small: true
            },
            {
              label: 'Peak Hour',
              value: dailySummary?.peakHour || 'N/A',
              icon: Flame
            }].
            map((stat, i) =>
            <motion.div
              key={stat.label}
              initial={{
                opacity: 0,
                y: 10
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: 0.1 + i * 0.05
              }}
              className="p-4 rounded-xl border border-border bg-surface">
              
                <stat.icon size={18} className="text-primary mb-2" />
                <p className="text-xs text-text-secondary mb-1">{stat.label}</p>
                <p
                className={`font-serif font-bold text-text-primary ${stat.small ? 'text-sm leading-tight' : 'text-xl'}`}>
                
                  {stat.value}
                </p>
              </motion.div>
            )}
=======
          
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
>>>>>>> fix-camera
          </div>

          {/* AI Insights */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-accent" />
<<<<<<< HEAD
              <h3 className="text-sm font-semibold text-text-primary">
                AI Insights
              </h3>
            </div>
            <ul className="space-y-2">
              {(dailySummary?.insights || []).map((insight: any, i: number) =>
              <motion.li
                key={i}
                initial={{
                  opacity: 0,
                  x: -10
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                transition={{
                  delay: 0.3 + i * 0.1
                }}
                className="flex items-start gap-2 text-sm text-text-secondary">
                
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                  {insight}
                </motion.li>
=======
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
>>>>>>> fix-camera
              )}
            </ul>
          </div>
        </Card>
      </motion.div>

<<<<<<< HEAD
      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard
          title="Tasks Today"
          value={dailySummary?.tasksCompleted || 0}
          icon={ListChecks}
          data={sparkline()}
          delay={0.2} />
      </div>

=======
>>>>>>> fix-camera
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Throughput Trend */}
        <motion.div {...cardMotion(1)}>
          <Card>
<<<<<<< HEAD
            <h3 className="font-semibold text-text-primary mb-6">
              Throughput Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={throughputData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0
                  }}>
                  
                  <defs>
                    <linearGradient
                      id="aThroughput"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1">
                      
                      <stop
                        offset="5%"
                        stopColor="var(--chart-1)"
                        stopOpacity={0.3} />
                      
                      <stop
                        offset="95%"
                        stopColor="var(--chart-1)"
                        stopOpacity={0} />
                      
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--chart-grid)" />
                  
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'var(--text-secondary)',
                      fontSize: 12
                    }} />
                  
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'var(--text-secondary)',
                      fontSize: 12
                    }} />
                  
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Units"
                    stroke="var(--chart-1)"
                    strokeWidth={3}
                    fill="url(#aThroughput)" />
                  
                </AreaChart>
              </ResponsiveContainer>
=======
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
>>>>>>> fix-camera
            </div>
          </Card>
        </motion.div>

        {/* Tasks by Type */}
        <motion.div {...cardMotion(2)}>
          <Card>
<<<<<<< HEAD
            <h3 className="font-semibold text-text-primary mb-6">
              Tasks by Type
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tasksByType}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0
                  }}>
                  
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--chart-grid)" />
                  
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'var(--text-secondary)',
                      fontSize: 12
                    }} />
                  
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'var(--text-secondary)',
                      fontSize: 12
                    }} />
                  
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      fill: 'var(--hover)'
                    }} />
                  
                  <Bar
                    dataKey="count"
                    name="Tasks"
                    fill="var(--chart-2)"
                    radius={[4, 4, 0, 0]}
                    barSize={40} />
                  
                </BarChart>
              </ResponsiveContainer>
=======
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
>>>>>>> fix-camera
            </div>
          </Card>
        </motion.div>

<<<<<<< HEAD
        {/* Success vs Failed Over Time */}
        <motion.div {...cardMotion(3)}>
          <Card>
            <h3 className="font-semibold text-text-primary mb-6">
              Success vs Failed
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={successOverTime}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0
                  }}>
                  
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--chart-grid)" />
                  
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'var(--text-secondary)',
                      fontSize: 12
                    }} />
                  
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'var(--text-secondary)',
                      fontSize: 12
                    }} />
                  
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)'
                    }} />
                  
                  <Line
                    type="monotone"
                    dataKey="success"
                    name="Success"
                    stroke="var(--success)"
                    strokeWidth={3}
                    dot={false} />
                  
                  <Line
                    type="monotone"
                    dataKey="failed"
                    name="Failed"
                    stroke="var(--danger)"
                    strokeWidth={3}
                    dot={false} />
                  
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Operator Breakdown */}
        <motion.div {...cardMotion(4)}>
          <Card>
            <h3 className="font-semibold text-text-primary mb-6">
              Operator Breakdown
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={operatorBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none">
                    
                    {operatorBreakdown.map((entry, index) =>
                    <Cell
                      key={index}
                      fill={operatorColors[index % operatorColors.length]} />

                    )}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)'
                    }} />
                  
                </PieChart>
              </ResponsiveContainer>
=======
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
>>>>>>> fix-camera
            </div>
          </Card>
        </motion.div>
      </div>

<<<<<<< HEAD
      {/* Stock by Category full width */}
      <motion.div {...cardMotion(5)}>
        <Card>
          <h3 className="font-semibold text-text-primary mb-6">
            Stock by Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={inventoryDistribution}
                layout="vertical"
                margin={{
                  top: 0,
                  right: 10,
                  left: 0,
                  bottom: 0
                }}>
                
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="var(--chart-grid)" />
                
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: 'var(--text-secondary)',
                    fontSize: 12
                  }} />
                
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: 'var(--text-secondary)',
                    fontSize: 12
                  }}
                  width={80} />
                
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    fill: 'var(--hover)'
                  }} />
                
                <Bar
                  dataKey="value"
                  name="Units"
                  fill="var(--chart-3)"
                  radius={[0, 4, 4, 0]}
                  barSize={24} />
                
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>
    </div>);

=======
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-primary mr-2" />
          <p className="text-text-secondary">Loading analytics...</p>
        </div>
      )}
    </div>
  );
>>>>>>> fix-camera
}