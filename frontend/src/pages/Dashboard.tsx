import React from 'react';
import { Package, Activity, Zap, TrendingUp, Box } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar } from
'recharts';
import { useAuth } from '../contexts/AuthContext';
import { KPICard } from '../components/dashboard/KPICard';
import { CameraPreview } from '../components/dashboard/CameraPreview';
import { TaskQueue } from '../components/dashboard/TaskQueue';
import { ActivityTimeline } from '../components/dashboard/ActivityTimeline';
import { Card } from '../components/ui/Card';
import { useDashboardSummary, useInventory } from '../lib/useApi';
export function Dashboard() {
  const { user } = useAuth();
  const { throughputData, inventoryDistribution, dailySummary } = useDashboardSummary();
  const { inventoryData } = useInventory();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  // Calculate total inventory units
  const totalInventoryUnits = inventoryData.reduce((sum, item) => sum + (item.quantity || 0), 0);
  // Mock sparkline data removed
  const sparklineData1: any[] = [];
  const sparklineData2: any[] = [];
  const sparklineData3: any[] = [];
  const sparklineData4: any[] = [];
  const sparklineData5: any[] = [];
  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-premium dark:shadow-premium-dark">
          <p className="text-sm font-medium text-text-primary mb-1">{label}</p>
          {payload.map((entry: any, index: number) =>
          <p
            key={index}
            className="text-sm"
            style={{
              color: entry.color
            }}>
            
              {entry.name}: {entry.value}
            </p>
          )}
        </div>);

    }
    return null;
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold text-text-primary mb-1">
            Good morning, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-text-secondary">{today}</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          title="Total Items Sorted Today"
          value={dailySummary?.itemsSorted || 0}
          icon={Package}
          data={sparklineData1}
          delay={0.1} />
        
        <KPICard
          title="Active Tasks"
          value={dailySummary?.pendingTasks || 0}
          icon={Activity}
          data={sparklineData2}
          delay={0.2} />
        
        <KPICard
          title="Production Throughput (24h)"
          value={dailySummary?.throughput24h ?? dailySummary?.throughputPerHour ?? 0}
          suffix=" units"
          icon={Zap}
          data={sparklineData3}
          delay={0.3} />
        
        <KPICard
          title="Inventory Value"
          value={dailySummary?.inventoryValue || 0}
          prefix="Rs. "
          icon={TrendingUp}
          data={sparklineData4}
          delay={0.4} />
        
        <KPICard
          title="Total Inventory"
          value={totalInventoryUnits}
          suffix=" units"
          icon={Box}
          data={sparklineData5}
          delay={0.5} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Charts) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="font-semibold text-text-primary mb-6">
              Production Throughput (24h)
            </h3>
            <div className="h-72">
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
                      id="colorThroughput"
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
                    fillOpacity={1}
                    fill="url(#colorThroughput)" />
                  
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-text-primary mb-6">
              Inventory by Product Category
            </h3>
            <div className="h-72">
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
                    name="Stock"
                    fill="var(--chart-2)"
                    radius={[0, 4, 4, 0]}
                    barSize={24} />
                  
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6 flex flex-col">
          <div className="h-64">
            <CameraPreview />
          </div>
          <div className="flex-1 min-h-[300px]">
            <TaskQueue />
          </div>
        </div>
      </div>

      {/* Bottom Timeline */}
      <ActivityTimeline />
    </div>);

}