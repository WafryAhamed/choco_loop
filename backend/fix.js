import * as fs from 'fs';
import * as path from 'path';

const indexPath = path.join(process.cwd(), 'index.ts');
let content = fs.readFileSync(indexPath, 'utf-8');

// 1. Remove duplicate app.post('/api/inventory/add', ...) and the conflict marker before the vision endpoint
content = content.replace(/>>>>>>> fix-camera\s+app\.post\('\/api\/inventory\/update-from-vision/g, "app.post('/api/inventory/update-from-vision");

const addEndpoint = `app.post('/api/inventory/add', async (req, res) => {`;
const firstIdx = content.indexOf(addEndpoint);
if (firstIdx !== -1) {
  const secondIdx = content.indexOf(addEndpoint, firstIdx + 1);
  if (secondIdx !== -1) {
    const endIdx = content.indexOf("});", secondIdx);
    if (endIdx !== -1) {
      content = content.slice(0, secondIdx) + content.slice(endIdx + 4);
    }
  }
}

// 2. Remove the other >>>>>>> fix-camera marker
content = content.replace(/>>>>>>> fix-camera\r?\n/g, "");

// 3. Add the new /api/analytics endpoint right before `setInterval(processTaskQueue, 3000);`
const analyticsEndpoint = `
// -----------------------------------------------------------------------------
// ANALYTICS ENDPOINT
// -----------------------------------------------------------------------------
app.get('/api/analytics', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const range = (req.query.range as string) || 'today';
    
    // Determine date range
    let dateFilter = 'CURDATE()';
    let dateRangeText = 'Today';
    
    if (range === '7d') {
      dateFilter = 'DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      dateRangeText = 'Last 7 Days';
    } else if (range === '30d') {
      dateFilter = 'DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
      dateRangeText = 'Last 30 Days';
    }

    // --- Summary Stats ---
    const [tasksCompletedRows]: any = await db.query(\`
      SELECT COUNT(*) as count FROM tasks 
      WHERE status = 'Success' AND completed_at >= \${dateFilter}
    \`);
    
    const [itemsSortedRows]: any = await db.query(\`
      SELECT COUNT(*) as count FROM vision_detections 
      WHERE detected_at >= \${dateFilter}
    \`);
    
    const [taskStatsRows]: any = await db.query(\`
      SELECT 
        COUNT(*) as totalTasks,
        SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) as successTasks
      FROM tasks
      WHERE status IN ('Success', 'Failed') AND created_at >= \${dateFilter}
    \`);
    
    const total = taskStatsRows[0]?.totalTasks || 0;
    const success = taskStatsRows[0]?.successTasks || 0;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 100;
    const failureRate = total > 0 ? Math.round(((total - success) / total) * 100) : 0;
    
    const [topProductRows]: any = await db.query(\`
      SELECT item, COUNT(*) as cnt FROM vision_detections
      WHERE detected_at >= \${dateFilter}
      GROUP BY item ORDER BY cnt DESC LIMIT 1
    \`);
    const topProduct = topProductRows[0]?.item || 'N/A';
    
    const [peakRows]: any = await db.query(\`
      SELECT HOUR(detected_at) as hr, COUNT(*) as cnt FROM vision_detections
      WHERE detected_at >= \${dateFilter}
      GROUP BY HOUR(detected_at) ORDER BY cnt DESC LIMIT 1
    \`);
    const peakHour = peakRows[0]?.hr != null 
      ? \`\${String(peakRows[0].hr).padStart(2, '0')}:00\` 
      : 'N/A';

    // --- Charts ---
    // Throughput Trend
    const [throughputRows]: any = await db.query(\`
      SELECT 
        DATE_FORMAT(detected_at, '%H:00') as time,
        COUNT(*) as value
      FROM vision_detections
      WHERE detected_at >= \${dateFilter}
      GROUP BY HOUR(detected_at)
      ORDER BY HOUR(detected_at)
    \`);
    
    // Tasks by Type
    const [taskTypeRows]: any = await db.query(\`
      SELECT task_type as name, COUNT(*) as value
      FROM tasks
      WHERE created_at >= \${dateFilter}
      GROUP BY task_type
    \`);
    
    // Inventory Distribution
    const [distributionRows]: any = await db.query(\`
      SELECT category as name, SUM(quantity) as value 
      FROM inventory_items 
      GROUP BY category
    \`);

    // --- Insights ---
    const insights: string[] = [];
    if (itemsSortedRows[0]?.count > 0) {
      insights.push(\`Processed \${itemsSortedRows[0].count} items during this period.\`);
    }
    if (topProduct !== 'N/A') {
      insights.push(\`\${topProduct} was the most handled item.\`);
    }
    if (failureRate > 5) {
      insights.push(\`Error rate is at \${failureRate}%, consider reviewing failed tasks.\`);
    }

    res.json({
      success: true,
      range,
      dateRange: dateRangeText,
      summary: {
        tasksCompleted: tasksCompletedRows[0]?.count || 0,
        itemsSorted: itemsSortedRows[0]?.count || 0,
        topProduct,
        peakHour,
        successRate,
        failureRate,
        totalTasks: total
      },
      charts: {
        throughputData: throughputRows,
        tasksByType: taskTypeRows,
        inventoryDistribution: distributionRows
      },
      insights: insights.length > 0 ? insights : ['No significant insights available for this period.']
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.sendError(500, 'Failed to fetch analytics data');
  }
});
`;

if (content.indexOf("app.get('/api/analytics'") === -1) {
  const insertTarget = 'setInterval(processTaskQueue, 3000);';
  const insertIdx = content.lastIndexOf(insertTarget);
  if (insertIdx !== -1) {
    content = content.slice(0, insertIdx) + analyticsEndpoint + "\n" + content.slice(insertIdx);
  } else {
    // Fallback: append before startServer()
    const fallbackTarget = 'const startServer = async () => {';
    const fallbackIdx = content.indexOf(fallbackTarget);
    if (fallbackIdx !== -1) {
      content = content.slice(0, fallbackIdx) + analyticsEndpoint + "\n" + content.slice(fallbackIdx);
    }
  }
}

fs.writeFileSync(indexPath, content, 'utf-8');
// Compile to index.js as well just to be safe
try {
  const tsCompilerPath = path.join(process.cwd(), 'node_modules', '.bin', 'tsc');
  if (fs.existsSync(tsCompilerPath)) {
    console.log('TS compilation skipped, directly fixed index.ts');
  }
} catch (e) {}

console.log('Fixed index.ts successfully');
