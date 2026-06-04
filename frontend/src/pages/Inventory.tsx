import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Plus, AlertTriangle, X } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend } from
'recharts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusPill } from '../components/ui/StatusPill';
import { useInventory, useDashboardSummary } from '../lib/useApi';
export function Inventory() {
  const { inventoryData, loading } = useInventory();
  const { inventoryDistribution } = useDashboardSummary();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  if (loading) return <div>Loading...</div>;
  // Summary Stats
  const totalSKUs = inventoryData.length;
  const inStock = inventoryData.filter((i) => i.status === 'In Stock').length;
  const lowStock = inventoryData.filter((i) => i.status === 'Low Stock').length;
  const outOfStock = inventoryData.filter(
    (i) => i.status === 'Out of Stock'
  ).length;
  const lowStockItems = inventoryData.filter(
    (i) => i.status === 'Low Stock' || i.status === 'Out of Stock'
  );

  const handleExport = () => {
    if (!inventoryData || inventoryData.length === 0) return;
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Stock', 'Capacity', 'Location', 'Status'];
    const rows = inventoryData.map(item => [
      item.id,
      `"${item.name}"`,
      item.sku,
      item.category,
      item.stock,
      item.capacity,
      `"${item.bin}"`,
      item.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // Colors for Pie Chart
  const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--accent)',
  'var(--primary-dark)'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-premium dark:shadow-premium-dark">
          <p className="text-sm font-medium text-text-primary">
            {payload[0].name}: {payload[0].value} units
          </p>
        </div>);

    }
    return null;
  };
  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-text-primary mb-1">
            Inventory
          </h1>
          <p className="text-text-secondary">
            Manage and monitor chocolate stock levels.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" className="hidden sm:flex gap-2" onClick={handleExport}>
            <Download size={18} /> Export
          </Button>
          <Button className="flex gap-2 w-full sm:w-auto" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} /> Add Product
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
        {
          label: 'Total SKUs',
          value: totalSKUs,
          color: 'text-text-primary'
        },
        {
          label: 'In Stock',
          value: inStock,
          color: 'text-status-success'
        },
        {
          label: 'Low Stock',
          value: lowStock,
          color: 'text-status-warning'
        },
        {
          label: 'Out of Stock',
          value: outOfStock,
          color: 'text-status-danger'
        }].
        map((stat, i) =>
        <Card key={i} className="p-4">
            <p className="text-sm text-text-secondary mb-1">{stat.label}</p>
            <p className={`text-2xl font-serif font-bold ${stat.color}`}>
              {stat.value}
            </p>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search products..."
                  icon={<Search size={18} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} />
                
              </div>
              <Button variant="outline" className="flex gap-2 w-full sm:w-auto">
                <Filter size={18} /> Category
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-sm text-text-secondary">
                    <th className="pb-3 font-medium px-2">Product</th>
                    <th className="pb-3 font-medium px-2">SKU</th>
                    <th className="pb-3 font-medium px-2">Stock Level</th>
                    <th className="pb-3 font-medium px-2">Location</th>
                    <th className="pb-3 font-medium px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.map((item, index) => {
                    const stockPercent = item.stock / item.capacity * 100;
                    let progressColor = 'bg-status-success';
                    if (stockPercent < 20) progressColor = 'bg-status-danger';else
                    if (stockPercent < 50)
                    progressColor = 'bg-status-warning';
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{
                          opacity: 0,
                          y: 10
                        }}
                        animate={{
                          opacity: 1,
                          y: 0
                        }}
                        transition={{
                          delay: index * 0.05
                        }}
                        className="border-b border-border/50 hover:bg-hover/50 transition-colors group">
                        
                        <td className="py-4 px-2">
                          <p className="font-medium text-text-primary">
                            {item.name}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {item.category}
                          </p>
                        </td>
                        <td className="py-4 px-2 text-sm font-mono text-text-secondary">
                          {item.sku}
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-text-primary">
                              {item.stock}
                            </span>
                            <span className="text-xs text-text-secondary">
                              / {item.capacity}
                            </span>
                          </div>
                          <div className="w-24 h-1.5 bg-surface rounded-full overflow-hidden">
                            <div
                              className={`h-full ${progressColor}`}
                              style={{
                                width: `${stockPercent}%`
                              }}>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-sm text-text-secondary">
                          {item.bin}
                        </td>
                        <td className="py-4 px-2">
                          <StatusPill status={item.status} />
                        </td>
                      </motion.tr>);

                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Col: Charts & Alerts */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-text-primary mb-6">
              Stock Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none">
                    
                    {inventoryDistribution.map((_entry: any, index: number) =>
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]} />

                    )}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
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

          <Card>
            <div className="flex items-center gap-2 mb-4 text-status-warning">
              <AlertTriangle size={18} />
              <h3 className="font-semibold text-text-primary">
                Action Required
              </h3>
            </div>
            <div className="space-y-3">
              {lowStockItems.map((item) =>
              <div
                key={item.id}
                className="flex justify-between items-center p-3 rounded-lg border border-border bg-background">
                
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {item.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Bin: {item.bin}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                    className={`text-sm font-bold ${item.stock === 0 ? 'text-status-danger' : 'text-status-warning'}`}>
                    
                      {item.stock} left
                    </p>
                    <button className="text-xs text-primary hover:underline mt-1">
                      Restock
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-border rounded-xl shadow-premium w-full max-w-md overflow-hidden"
          >
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="font-serif font-semibold text-text-primary text-lg">Add New Product</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <Input label="Product Name" placeholder="e.g. Milk Chocolate" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="SKU" placeholder="e.g. CHOC-01" />
                <Input label="Category" placeholder="e.g. Milk" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Initial Stock" type="number" placeholder="0" />
                <Input label="Location (Bin)" placeholder="e.g. Colombo" />
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-3 bg-background/50">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsAddModalOpen(false)}>Save Product</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>);

}