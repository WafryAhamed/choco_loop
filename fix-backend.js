const fs = require('fs');
const path = require('path');

const indexTs = path.join(__dirname, 'backend', 'index.ts');
let content = fs.readFileSync(indexTs, 'utf-8');

// The botched code starts around `app.post('/api/inventory/add', async (req, res) => {`
// And ends at `res.status(500).json({ success: false, error: 'Failed to add product' });\n  }\n});`
const startIdx = content.indexOf(`app.post('/api/inventory/add', async (req, res) => {`);
if (startIdx !== -1) {
  const endMarker = `res.status(500).json({ success: false, error: 'Failed to add product' });\r\n  }\r\n});`;
  let endIdx = content.indexOf(endMarker, startIdx);
  if (endIdx === -1) {
    // try with \n
    const endMarker2 = `res.status(500).json({ success: false, error: 'Failed to add product' });\n  }\n});`;
    endIdx = content.indexOf(endMarker2, startIdx);
    if (endIdx !== -1) endIdx += endMarker2.length;
  } else {
    endIdx += endMarker.length;
  }
  
  if (endIdx !== -1) {
    const fixedBlock = `app.post('/api/inventory/add', async (req, res) => {
  const { name, sku, category, quantity, location } = req.body;
  if (!name || !sku || !category) return res.status(400).json({ success: false, error: 'Name, SKU, and Category are required' });
  try {
    const [existing]: any = await db.query('SELECT id FROM inventory_items WHERE sku = ? LIMIT 1', [sku]);
    if (existing && existing.length > 0) return res.status(409).json({ success: false, error: 'Product with this SKU already exists' });
    const initialStatus = quantity === 0 ? 'Out of Stock' : quantity <= 200 ? 'Low Stock' : 'In Stock';
    const [result]: any = await db.query(
      \`INSERT INTO inventory_items (name, sku, category, quantity, capacity, location, status, created_at, updated_at) VALUES (?, ?, ?, ?, 1000, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)\`,
      [name, sku, category, quantity || 0, location || 'Unknown', initialStatus]
    );
    res.json({ success: true, message: 'Product added successfully', productId: result.insertId });
  } catch (error) {
    if ((error as any).code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, error: 'Product with this SKU already exists' });
    res.status(500).json({ success: false, error: 'Failed to add product' });
  }
});

app.post('/api/inventory/update-from-vision', async (req, res) => {
  const { item, color, action, timestamp, event_id, source } = req.body;
  try {
    const detectedAt = timestamp && !Number.isNaN(new Date(timestamp).getTime()) ? formatToMySQL(new Date(timestamp)) : formatToMySQL(new Date());
    await db.query(\`INSERT INTO vision_detections (item, color, action, event_id, source, detected_at) VALUES (?, ?, ?, ?, ?, ?)\`, [item, color, action || 'pick', event_id, source || 'vision', detectedAt]);
    let itemSku = color === 'blue' ? 'CHOC-MILK-01' : color === 'red' ? 'CHOC-DARK-01' : color === 'green' ? 'CHOC-WHT-01' : '';
    if (itemSku) {
      const [items]: any = await db.query('SELECT id, quantity FROM inventory_items WHERE sku = ? LIMIT 1', [itemSku]);
      if (items && items.length > 0) {
        const itemId = items[0].id;
        await db.query(\`UPDATE inventory_items SET quantity = quantity + 1, status = CASE WHEN quantity + 1 <= 0 THEN 'Out of Stock' WHEN quantity + 1 <= 200 THEN 'Low Stock' ELSE 'In Stock' END, updated_at = CURRENT_TIMESTAMP WHERE id = ?\`, [itemId]);
        const desc = \`Picked and sorted \${item || 'chocolate'} via vision system\`;
        const duration = \`\${Math.floor(Math.random() * 5) + 5}s\`;
        const [taskInsert]: any = await db.query(\`INSERT INTO tasks (task_type, description, item_id, quantity, status, progress, robot_id, operator, source, completed_at, confidence) VALUES ('Pick', ?, ?, 1, 'Success', 100, 'RBT-01', 'AI', 'vision', CURRENT_TIMESTAMP, ?)\`, [desc, itemId, Math.floor(Math.random() * 5) + 95]);
        await db.query(\`INSERT INTO task_logs (task_id, action, notes) VALUES (?, 'completed', 'Picked via vision system')\`, [taskInsert.insertId]);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY' || error.code === 'SQLITE_CONSTRAINT') return res.json({ success: true, message: 'Duplicate event ignored' });
    res.status(500).json({ error: 'Failed to record vision update' });
  }
});`;

    content = content.slice(0, startIdx) + fixedBlock + content.slice(endIdx);
    fs.writeFileSync(indexTs, content);
    console.log("Backend routes fixed.");
  }
}
