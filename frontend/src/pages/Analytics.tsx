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
  ResponsiveContainer } from
'recharts';
import {
  Clock,
  CheckCircle2,
  ListChecks,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Trophy,
  Flame } from
'lucide-react';
import { Card } from '../components/ui/Card';
import { KPICard } from '../components/dashboard/KPICard';
import { useDashboardSummary } from '../lib/useApi';

const ranges = ['Today', '7d', '30d'];
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-lg shadow-premium dark:shadow-premium-dark">
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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-text-primary mb-1">
            Analytics
          </h1>
          <p className="text-text-secondary">
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

      {/* Daily Summary Card */}
      <motion.div {...cardMotion(0)}>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
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
          </div>

          {/* AI Insights */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-accent" />
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
              )}
            </ul>
          </div>
        </Card>
      </motion.div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard
          title="Tasks Today"
          value={dailySummary?.tasksCompleted || 0}
          icon={ListChecks}
          data={sparkline()}
          delay={0.2} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Throughput Trend */}
        <motion.div {...cardMotion(1)}>
          <Card>
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
            </div>
          </Card>
        </motion.div>

        {/* Tasks by Type */}
        <motion.div {...cardMotion(2)}>
          <Card>
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
            </div>
          </Card>
        </motion.div>

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
            </div>
          </Card>
        </motion.div>
      </div>

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

}