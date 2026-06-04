export const inventoryData = [
{
  id: '1',
  sku: 'CHOC-MILK-01',
  name: 'Classic Milk Chocolate Box',
  category: 'Milk',
  stock: 1250,
  capacity: 2000,
  bin: 'Colombo',
  status: 'In Stock',
  lastUpdated: '10 mins ago'
},
{
  id: '2',
  sku: 'CHOC-DARK-85',
  name: '85% Dark Cocoa Premium',
  category: 'Dark',
  stock: 420,
  capacity: 1000,
  bin: 'Kandy',
  status: 'Low Stock',
  lastUpdated: '1 hour ago'
},
{
  id: '3',
  sku: 'CHOC-WHT-TRF',
  name: 'White Chocolate Truffles',
  category: 'Truffle',
  stock: 890,
  capacity: 1500,
  bin: 'Galle',
  status: 'In Stock',
  lastUpdated: '2 hours ago'
},
{
  id: '4',
  sku: 'CHOC-ASST-PR',
  name: 'Premium Assorted Collection',
  category: 'Assorted',
  stock: 150,
  capacity: 500,
  bin: 'Jaffna',
  status: 'Low Stock',
  lastUpdated: '5 mins ago'
},
{
  id: '5',
  sku: 'CHOC-DRK-TRF',
  name: 'Dark Chocolate Truffles',
  category: 'Truffle',
  stock: 0,
  capacity: 800,
  bin: 'Negombo',
  status: 'Out of Stock',
  lastUpdated: '1 day ago'
},
{
  id: '6',
  sku: 'CHOC-MILK-ALM',
  name: 'Milk Chocolate Almond',
  category: 'Milk',
  stock: 1800,
  capacity: 2000,
  bin: 'Trincomalee',
  status: 'In Stock',
  lastUpdated: '30 mins ago'
},
{
  id: '7',
  sku: 'CHOC-WHT-MAC',
  name: 'White Macadamia Nut',
  category: 'White',
  stock: 600,
  capacity: 1000,
  bin: 'Matara',
  status: 'In Stock',
  lastUpdated: '4 hours ago'
},
{
  id: '8',
  sku: 'CHOC-DARK-70',
  name: '70% Dark Cocoa Standard',
  category: 'Dark',
  stock: 1100,
  capacity: 1500,
  bin: 'Anuradhapura',
  status: 'In Stock',
  lastUpdated: '15 mins ago'
},
{
  id: '9',
  sku: 'CHOC-CAR-SEA',
  name: 'Sea Salt Caramel Squares',
  category: 'Assorted',
  stock: 320,
  capacity: 1200,
  bin: 'Ratnapura',
  status: 'Low Stock',
  lastUpdated: '20 mins ago'
},
{
  id: '10',
  sku: 'CHOC-MILK-HAZ',
  name: 'Hazelnut Milk Praline',
  category: 'Milk',
  stock: 950,
  capacity: 1000,
  bin: 'Kurunegala',
  status: 'In Stock',
  lastUpdated: '1 hour ago'
},
{
  id: '11',
  sku: 'CHOC-DARK-MNT',
  name: 'Dark Chocolate Mint',
  category: 'Dark',
  stock: 50,
  capacity: 800,
  bin: 'Nuwara Eliya',
  status: 'Low Stock',
  lastUpdated: '10 mins ago'
},
{
  id: '12',
  sku: 'CHOC-WHT-RSP',
  name: 'White Raspberry Swirl',
  category: 'White',
  stock: 780,
  capacity: 1000,
  bin: 'Badulla',
  status: 'In Stock',
  lastUpdated: '3 hours ago'
}];

export const activeTasks = [
{
  id: 'T-1042',
  description: 'Picking Blue Box → Colombo',
  status: 'Active',
  progress: 65,
  type: 'Pick'
},
{
  id: 'T-1043',
  description: 'Sorting Dark Chocolate',
  status: 'Queued',
  progress: 0,
  type: 'Sort'
},
{
  id: 'T-1044',
  description: 'Packaging Truffle Collection',
  status: 'Queued',
  progress: 0,
  type: 'Pack'
},
{
  id: 'T-1045',
  description: 'Waiting for vision confirmation',
  status: 'Waiting',
  progress: 0,
  type: 'System'
},
{
  id: 'T-1046',
  description: 'Picking White Box → Galle',
  status: 'Queued',
  progress: 0,
  type: 'Pick'
}];

export const taskHistory = Array.from({ length: 25 }).map((_, i) => {
  const isSuccess = Math.random() > 0.15;
  const types = ['Pick', 'Sort', 'Pack', 'Move'];
  const operators = ['Auto', 'AI', 'Manual'];
  const products = [
  'Dark Chocolate 85%',
  'Milk Chocolate Box',
  'White Truffles',
  'Assorted Premium'];
  
  const locations = ['Colombo', 'Kandy', 'Galle', 'Jaffna'];

  return {
    id: `H-${9000 - i}`,
    timestamp: new Date(Date.now() - i * 1000 * 60 * 15).toISOString(),
    description: `${types[i % 4]} ${products[i % 4]} → ${locations[i % 4]}`,
    robotId: `RBT-0${i % 3 + 1}`,
    duration: `${Math.floor(Math.random() * 40 + 10)}s`,
    status: isSuccess ? 'Success' : 'Failed',
    operator: operators[i % 3],
    confidence: isSuccess ?
    Math.floor(Math.random() * 10 + 90) :
    Math.floor(Math.random() * 30 + 40)
  };
});

export const throughputData = [
{ time: '08:00', value: 120 },
{ time: '09:00', value: 250 },
{ time: '10:00', value: 380 },
{ time: '11:00', value: 410 },
{ time: '12:00', value: 390 },
{ time: '13:00', value: 450 },
{ time: '14:00', value: 520 },
{ time: '15:00', value: 480 },
{ time: '16:00', value: 310 }];

export const inventoryDistribution = [
{ name: 'Milk', value: 4000 },
{ name: 'Dark', value: 1570 },
{ name: 'White', value: 1380 },
{ name: 'Truffle', value: 890 },
{ name: 'Assorted', value: 470 }];

export const systemHealth = [
{
  service: 'Vision Service',
  status: 'online',
  uptime: '99.9%',
  ping: '12ms'
},
{ service: 'MySQL Database', status: 'online', uptime: '99.9%', ping: '8ms' },
{
  service: 'ESP32 Controller',
  status: 'busy',
  uptime: '98.5%',
  ping: '45ms'
},
{ service: 'AI Assistant', status: 'idle', uptime: '100%', ping: '150ms' }];

// ---- Derived analytics helpers ----

// Count tasks by type from history
export const tasksByType = ['Pick', 'Sort', 'Pack', 'Move'].map((type) => ({
  name: type,
  count: taskHistory.filter((t) => t.description.startsWith(type)).length
}));

// Operator breakdown
export const operatorBreakdown = ['Auto', 'AI', 'Manual'].map((op) => ({
  name: op,
  value: taskHistory.filter((t) => t.operator === op).length
}));

// Success vs failed over the last several time buckets
export const successOverTime = (() => {
  const buckets = ['08:00', '10:00', '12:00', '14:00', '16:00'];
  return buckets.map((time, i) => {
    const base = 8 + i * 2;
    const failed = Math.max(0, Math.round(Math.random() * 2));
    return { time, success: base - failed, failed };
  });
})();

const successTasks = taskHistory.filter((t) => t.status === 'Success').length;
const totalTasks = taskHistory.length;

export const dailySummary = {
  tasksCompleted: totalTasks,
  successRate: Math.round(successTasks / totalTasks * 100),
  errorRate: Math.round((totalTasks - successTasks) / totalTasks * 100),
  avgCycleTime: '28s',
  itemsSorted: 12450,
  topProduct: 'Milk Chocolate Box',
  peakHour: '14:00',
  peakThroughput: Math.max(...throughputData.map((d) => d.value)),
  insights: [
  'Dark Chocolate Mint is critically low (50 units) — restock recommended before next shift.',
  'Throughput peaked at 14:00 with 520 units/hr, 18% above the daily average.',
  'AI-assisted tasks completed 12% faster than manual assignments today.']
};