import { API_BASE } from './api';
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
import { 
  processNLP, 
  generateVoiceFeedback, 
  generateChatbotResponse,
  type NLPResult,
  type Product
} from './nlpEngine';
<<<<<<< HEAD
=======
>>>>>>> fix-camera
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6

const VISION_BASE = 'http://localhost:8001';

export interface ParsedCommand {
<<<<<<< HEAD
  intent: string;
=======
  intent:
    | 'pick'
    | 'sort'
    | 'pack'
    | 'move'
<<<<<<< HEAD
=======
    | 'store'
>>>>>>> fix-camera
    | 'check_inventory'
    | 'stock_count'
    | 'pause'
    | 'resume_robot'
    | 'start_station'
    | 'start_conveyor'
    | 'stop_conveyor'
    | 'start_camera'
    | 'stop_camera'
    | 'system_status'
    | 'active_tasks'
    | 'unknown';
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
  product?: string;
  destination?: string;
  quantity?: number;
  station?: string;
  rawText: string;
}

export interface CommandResult {
  parsed: ParsedCommand;
  reply: string;
  taskId?: string;
  toast: { type: 'success' | 'info' | 'error'; message: string };
}

<<<<<<< HEAD
=======
const CHOCOLATE_TYPES = [
  { match: ['dark', 'dark chocolate'], label: 'Dark Chocolate' },
  { match: ['milk', 'milk chocolate'], label: 'Milk Chocolate' },
  { match: ['white', 'white chocolate'], label: 'White Chocolate' },
  { match: ['truffle', 'truffles'], label: 'Truffle' },
  { match: ['premium', 'assorted', 'collection'], label: 'Premium Assorted' },
  { match: ['blue', 'blue box'], label: 'Blue Box' },
];

function detectProduct(text: string): string | undefined {
  for (const type of CHOCOLATE_TYPES) {
    if (type.match.some((m) => text.includes(m))) return type.label;
  }
  return undefined;
}

function detectDestination(text: string): string | undefined {
  const shelfMatch = text.match(/(?:shelf|bin|rack)\s+([a-z](?:-?\d+)?)/i);
  if (shelfMatch) {
    const target = shelfMatch[0].replace(/\s+/g, ' ').trim();
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
  return undefined;
}

function detectQuantity(text: string): number | undefined {
  const numMatch = text.match(/\b(\d+)\b/);
  if (numMatch) return parseInt(numMatch[1], 10);
  const words: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    ten: 10,
    twelve: 12,
    twenty: 20,
    fifty: 50,
  };
  for (const [word, val] of Object.entries(words)) {
    if (text.includes(word)) return val;
  }
  return undefined;
}

function detectStation(text: string): string | undefined {
  const stationMatch = text.match(/(?:station|line)\s+(\d+)/i);
  if (stationMatch) return `Station ${stationMatch[1]}`;
  return undefined;
}

/** Intent detection only — no fabricated warehouse replies. */
export function parseCommandIntent(rawText: string): ParsedCommand {
  const text = rawText.toLowerCase().trim();
  const product = detectProduct(text);
  const destination = detectDestination(text);
  const quantity = detectQuantity(text);
  const station = detectStation(text);

  let intent: ParsedCommand['intent'] = 'unknown';

  if (/\b(system status|status report|how is the system|warehouse status)\b/.test(text)) {
    intent = 'system_status';
  } else if (
    /\b(active tasks?|show tasks?|task queue|current tasks?|what tasks?)\b/.test(text)
  ) {
    intent = 'active_tasks';
  } else if (
    (/\b(how many|how much|left|remaining|count)\b/.test(text) ||
      /\bwhat'?s in stock\b/.test(text)) &&
    product
  ) {
    intent = 'stock_count';
  } else if (
    /\b(check|show|inventory|stock levels?|what'?s in stock)\b/.test(text) &&
    !/\b(task|robot|camera|conveyor)\b/.test(text)
  ) {
    intent = 'check_inventory';
  } else if (/\b(camera|feed|vision)\b/.test(text) && /\b(stop|off|disable|shut)\b/.test(text)) {
    intent = 'stop_camera';
  } else if (/\b(camera|feed|vision)\b/.test(text) && /\b(start|on|enable|open)\b/.test(text)) {
    intent = 'start_camera';
  } else if (/\b(conveyor|belt)\b/.test(text) && /\b(stop|halt|pause)\b/.test(text)) {
    intent = 'stop_conveyor';
  } else if (/\b(conveyor|belt)\b/.test(text) && /\b(start|run|begin|resume)\b/.test(text)) {
    intent = 'start_conveyor';
  } else if (/\b(resume|unpause|continue)\b/.test(text) && /\b(robot|arm)\b/.test(text)) {
    intent = 'resume_robot';
  } else if (/\b(pause|stop|halt|hold)\b/.test(text) && /\b(robot|arm)\b/.test(text)) {
    intent = 'pause';
  } else if (/\b(start|begin|run|resume)\b/.test(text) && station) {
    intent = 'start_station';
  } else if (/\b(move|transfer|relocate)\b/.test(text)) {
    intent = 'move';
<<<<<<< HEAD
=======
  } else if (/\b(store|put away|restock|stock up|stock)\b/.test(text)) {
    intent = 'store';
>>>>>>> fix-camera
  } else if (/\b(queue\s+pick|pick\s+\d+|pick|grab|retrieve|get)\b/.test(text)) {
    intent = 'pick';
  } else if (/\b(sort|organize|separate)\b/.test(text)) {
    intent = 'sort';
  } else if (/\b(pack|package|box up|wrap)\b/.test(text)) {
    intent = 'pack';
  }

  return {
    intent,
    product,
    destination,
    quantity,
    station,
    rawText,
  };
}

>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
async function fetchInventory(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/inventory`);
  if (!res.ok) throw new Error('Inventory unavailable');
  return res.json();
}

<<<<<<< HEAD
=======
async function fetchActiveTasks(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/tasks/active`);
  if (!res.ok) throw new Error('Tasks unavailable');
  return res.json();
}

async function fetchSystemHealth(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  if (!res.ok) throw new Error('Dashboard unavailable');
  const data = await res.json();
  return data.systemHealth || [];
}

<<<<<<< HEAD
=======
function findInventoryItem(items: any[], product?: string): any | undefined {
  if (!product) return undefined;
  const normalized = product.toLowerCase();
  return items.find(
    (item) =>
      item.name?.toLowerCase().includes(normalized) ||
      item.category?.toLowerCase().includes(normalized) ||
      item.sku?.toLowerCase() === normalized ||
      item.sku?.toLowerCase().includes(normalized)
  );
}

>>>>>>> fix-camera
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
async function postTask(
  type: string,
  description: string,
  product?: string,
<<<<<<< HEAD
  quantity?: number,
  taskType?: string
=======
<<<<<<< HEAD
  quantity?: number
=======
  quantity?: number,
  taskType?: string
>>>>>>> fix-camera
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
): Promise<string | undefined> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
<<<<<<< HEAD
      taskType: taskType || type,
=======
<<<<<<< HEAD
=======
      taskType: taskType || type,
>>>>>>> fix-camera
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
      description,
      product,
      quantity: quantity ?? 12,
      source: 'voice',
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Task create failed');
  return data.taskId;
}

async function visionCamera(on: boolean): Promise<void> {
  const res = await fetch(`${VISION_BASE}/${on ? 'start' : 'stop'}`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok || data?.success === false) {
    throw new Error(data?.error || 'Vision service error');
  }
}

<<<<<<< HEAD
=======
function formatInventorySummary(items: any[]): string {
  if (items.length === 0) return 'No inventory records found.';
  const lines = items
    .slice(0, 8)
    .map((i) => `• ${i.name}: ${i.stock} units (${i.status}, ${i.bin})`);
  const more = items.length > 8 ? `\n…and ${items.length - 8} more SKUs.` : '';
  return `Current stock (${items.length} SKUs):\n${lines.join('\n')}${more}`;
}

/** Run parsed intent against real backend / vision services. */
export async function executeVoiceCommand(rawText: string): Promise<CommandResult> {
<<<<<<< HEAD
  const parsed = parseCommandIntent(rawText);
  const qty = parsed.quantity ?? 12;

  try {
    switch (parsed.intent) {
      case 'stock_count': {
        const items = await fetchInventory();
        const match = items.find(
          (i) =>
            i.name?.toLowerCase().includes(parsed.product!.toLowerCase()) ||
            i.category?.toLowerCase().includes(parsed.product!.toLowerCase())
        );
        if (!match) {
          return {
            parsed,
            reply: `No inventory row found for "${parsed.product}". Check the Inventory page for exact product names.`,
            toast: { type: 'info', message: 'Product not found' },
          };
        }
        return {
          parsed,
          reply: `${match.name}: ${match.stock} units in stock (${match.status}, bin ${match.bin}).`,
          toast: { type: 'info', message: 'Stock lookup' },
        };
      }

      case 'check_inventory': {
        const items = await fetchInventory();
        const low = items.filter((i) => i.status === 'Low Stock' || i.status === 'Out of Stock');
        const reply =
          low.length > 0
            ? `${low.length} item(s) need attention:\n${low
                .map((i) => `• ${i.name}: ${i.stock} units (${i.status})`)
                .join('\n')}`
            : formatInventorySummary(items);
        return {
          parsed,
          reply,
          toast: { type: 'info', message: 'Inventory report' },
        };
      }

      case 'active_tasks': {
        const tasks = await fetchActiveTasks();
        const active = tasks.filter((t) => t.status === 'Active').length;
        const queued = tasks.filter((t) => t.status === 'Queued').length;
        const waiting = tasks.filter((t) => t.status === 'Waiting').length;
        const list =
          tasks.length > 0
            ? '\n' +
              tasks
                .slice(0, 5)
                .map((t) => `• ${t.id}: ${t.type || 'Task'} — ${t.status} (${t.progress ?? 0}%)`)
                .join('\n')
            : '';
        return {
          parsed,
          reply: `${tasks.length} tasks in queue: ${active} active, ${queued} queued, ${waiting} waiting.${list}`,
          toast: { type: 'info', message: 'Active tasks' },
        };
      }

      case 'system_status': {
        const health = await fetchSystemHealth();
        const summary = health
          .map((s: any) => `• ${s.service}: ${s.status} (${s.ping})`)
          .join('\n');
        return {
          parsed,
          reply: summary ? `System status:\n${summary}` : 'System health data is unavailable.',
          toast: { type: 'info', message: 'System status' },
        };
      }

      case 'stop_camera': {
        await visionCamera(false);
        return {
          parsed,
          reply: 'Vision camera stopped on port 8001.',
          toast: { type: 'success', message: 'Camera stopped' },
        };
      }

      case 'start_camera': {
        await visionCamera(true);
        return {
          parsed,
          reply: 'Vision camera started — open the Camera page for the live feed.',
          toast: { type: 'success', message: 'Camera started' },
        };
      }

      case 'start_conveyor': {
        await postTask('Conveyor', 'Start conveyor belt', undefined, undefined);
        return {
          parsed,
          reply: 'Conveyor start queued for the line controller.',
          toast: { type: 'success', message: 'Conveyor start queued' },
        };
      }

      case 'stop_conveyor': {
        await postTask('Conveyor', 'Stop conveyor belt', undefined, undefined);
        return {
          parsed,
          reply: 'Conveyor stop queued — belt will halt when the current cycle finishes.',
          toast: { type: 'success', message: 'Conveyor stop queued' },
        };
      }

      case 'pause': {
        await postTask('Pause', 'Pause robotic arm — operator voice command');
        return {
          parsed,
          reply: 'Pause command queued. Active arm cycles will hold after the current step.',
          toast: { type: 'info', message: 'Robot pause queued' },
        };
      }

      case 'resume_robot': {
        await postTask('Resume', 'Resume robotic arm — operator voice command');
        return {
          parsed,
          reply: 'Resume command queued. The arm will accept new tasks from the queue.',
          toast: { type: 'success', message: 'Robot resume queued' },
        };
      }

      case 'move':
      case 'pick':
      case 'sort':
      case 'pack':
      case 'start_station': {
        const type =
          parsed.intent === 'start_station'
            ? 'Station'
            : parsed.intent.charAt(0).toUpperCase() + parsed.intent.slice(1);
        const desc = `${type} ${qty} ${parsed.product || 'units'}${
          parsed.destination ? ` → ${parsed.destination}` : ''
        }${parsed.station ? ` at ${parsed.station}` : ''}`;
        await postTask(type, desc, parsed.product, qty);
        return {
          parsed,
          reply: `Queued: ${desc}. Check Task History for progress.`,
          toast: { type: 'success', message: `${type} task queued` },
        };
      }

      default:
        return {
          parsed,
          reply:
            'Command not recognized. Try "Queue pick 10 dark chocolate", "What\'s in stock", "Stop the camera", "Start the conveyor", "Show active tasks", or "System status".',
          toast: { type: 'error', message: 'Command not recognized' },
        };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Request failed';
    return {
      parsed,
      reply: `Could not complete that command: ${msg}. Ensure the backend (port 5000) and vision service (port 8001) are running.`,
      toast: { type: 'error', message: msg },
    };
  }
=======
  // Use the new NLP-based command execution
  return executeNLPCommand(rawText);
>>>>>>> fix-camera
}

/** @deprecated Use parseCommandIntent + executeVoiceCommand */
export function parseCommand(rawText: string): CommandResult {
  const parsed = parseCommandIntent(rawText);
  return {
    parsed,
    reply: 'Use executeVoiceCommand() for live warehouse actions.',
    toast: { type: 'info', message: 'Parsing only' },
  };
}
<<<<<<< HEAD
=======

>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
/**
 * Enhanced NLP-based voice command execution
 * Uses processNLP for flexible natural language understanding
 */
<<<<<<< HEAD
export async function executeVoiceCommand(rawText: string): Promise<CommandResult> {
  return executeNLPCommand(rawText);
}

/** @deprecated Use executeVoiceCommand */
export function parseCommandIntent(rawText: string): ParsedCommand {
  return { intent: 'unknown', rawText };
}

/**
 * Core command execution using NLP
 */
export async function executeNLPCommand(rawText: string): Promise<CommandResult> {
  try {
    // Fetch available products for fuzzy matching
    let inventoryData: any[] = [];
    try {
      inventoryData = await fetchInventory();
    } catch (e) {
      console.warn('Inventory fetch failed, proceeding without products', e);
    }
    
=======
export async function executeNLPCommand(rawText: string): Promise<CommandResult> {
  try {
    // Fetch available products for fuzzy matching
    const inventoryData = await fetchInventory();
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
    const products: Product[] = inventoryData.map((item: any) => ({
      id: item.id || item.sku,
      name: item.name,
      quantity: item.stock || item.quantity || 0,
      category: item.category,
      sku: item.sku,
    }));

    // Process input through NLP engine
    const nlpResult = processNLP(rawText, products);

    // Log NLP result for debugging
    console.log('[Voice] NLP Result:', {
      intent: nlpResult.intent,
      product: nlpResult.entities.product,
      quantity: nlpResult.entities.quantity,
      errors: nlpResult.validationErrors
    });

<<<<<<< HEAD
    const baseParsed: ParsedCommand = {
      intent: nlpResult.intent.toLowerCase(),
      rawText,
      product: nlpResult.entities.product,
      quantity: nlpResult.entities.quantity
    };

    // Validate NLP result
    if (nlpResult.validationErrors.length > 0 && nlpResult.intent !== 'UNKNOWN') {
      return {
        parsed: baseParsed,
        reply: `Cannot execute command: ${nlpResult.validationErrors.join(', ')}`,
        toast: { type: 'error', message: nlpResult.validationErrors[0] || 'Missing information' },
      };
=======
    // Validate NLP result
    if (nlpResult.validationErrors.length > 0 && nlpResult.intent !== 'UNKNOWN') {
      console.warn('[Voice] Validation errors:', nlpResult.validationErrors);
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
    }

    // Execute based on intent
    switch (nlpResult.intent) {
      case 'STORE': {
<<<<<<< HEAD
=======
        if (nlpResult.validationErrors.length > 0) {
          return {
            parsed: { intent: 'store', rawText },
            reply: `Cannot store items: ${nlpResult.validationErrors.join(', ')}. Please specify a product and quantity.`,
            toast: { type: 'error', message: nlpResult.validationErrors[0] || 'Missing information' },
          };
        }

        if (!nlpResult.entities.product || !nlpResult.entities.quantity) {
          return {
            parsed: { intent: 'store', rawText },
            reply: 'I need a product name and quantity to store items. For example: "Store 5 Milk Chocolates"',
            toast: { type: 'error', message: 'Invalid store command' },
          };
        }

        // Create store task
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
        const storeTaskId = await postTask(
          'Store',
          `Store ${nlpResult.entities.quantity} ${nlpResult.entities.product}`,
          nlpResult.entities.product,
          nlpResult.entities.quantity,
          'Store'
        );
<<<<<<< HEAD
        const reply = generateVoiceFeedback(nlpResult, true);
        return {
          parsed: baseParsed,
=======

        const reply = generateVoiceFeedback(nlpResult, true);
        return {
          parsed: { 
            intent: 'store', 
            rawText, 
            product: nlpResult.entities.product, 
            quantity: nlpResult.entities.quantity 
          },
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
          reply,
          taskId: storeTaskId,
          toast: { type: 'success', message: `Stored ${nlpResult.entities.quantity} ${nlpResult.entities.product}` },
        };
      }

      case 'RETRIEVE': {
<<<<<<< HEAD
=======
        if (nlpResult.validationErrors.length > 0) {
          return {
            parsed: { intent: 'pick', rawText },
            reply: `Cannot retrieve items: ${nlpResult.validationErrors.join(', ')}. Please specify a product and quantity.`,
            toast: { type: 'error', message: nlpResult.validationErrors[0] || 'Missing information' },
          };
        }

        if (!nlpResult.entities.product || !nlpResult.entities.quantity) {
          return {
            parsed: { intent: 'pick', rawText },
            reply: 'I need a product name and quantity to retrieve items. For example: "Retrieve 5 Milk Chocolates"',
            toast: { type: 'error', message: 'Invalid retrieve command' },
          };
        }

>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
        // Check availability
        const productMatch = inventoryData.find(
          (item: any) => item.name.toLowerCase() === nlpResult.entities.product?.toLowerCase()
        );

<<<<<<< HEAD
        if (!productMatch) {
          const reply = generateVoiceFeedback(nlpResult, false, 'product not found');
          return {
            parsed: baseParsed,
=======
        console.log('[Voice] Product match for retrieve:', {
          requested: nlpResult.entities.product,
          found: productMatch?.name,
          availableStock: productMatch?.stock
        });

        if (!productMatch) {
          const reply = generateVoiceFeedback(nlpResult, false, 'product not found');
          return {
            parsed: { 
              intent: 'pick', 
              rawText, 
              product: nlpResult.entities.product, 
              quantity: nlpResult.entities.quantity 
            },
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
            reply,
            toast: { type: 'error', message: `${nlpResult.entities.product} not found in inventory` },
          };
        }

<<<<<<< HEAD
        if (productMatch.stock < nlpResult.entities.quantity!) {
=======
        if (productMatch.stock < nlpResult.entities.quantity) {
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
          const reply = generateVoiceFeedback(
            nlpResult,
            false,
            `insufficient stock - only ${productMatch.stock} available`
          );
          return {
<<<<<<< HEAD
            parsed: baseParsed,
=======
            parsed: { 
              intent: 'pick', 
              rawText, 
              product: nlpResult.entities.product, 
              quantity: nlpResult.entities.quantity 
            },
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
            reply,
            toast: { type: 'error', message: `Insufficient stock. Available: ${productMatch.stock}` },
          };
        }

<<<<<<< HEAD
=======
        // Create retrieve task
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
        const retrieveTaskId = await postTask(
          'Retrieve',
          `Retrieve ${nlpResult.entities.quantity} ${nlpResult.entities.product}`,
          nlpResult.entities.product,
          nlpResult.entities.quantity,
          'Retrieve'
        );

        const reply = generateVoiceFeedback(nlpResult, true);
        return {
<<<<<<< HEAD
          parsed: baseParsed,
=======
          parsed: { 
            intent: 'pick', 
            rawText, 
            product: nlpResult.entities.product, 
            quantity: nlpResult.entities.quantity 
          },
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
          reply,
          taskId: retrieveTaskId,
          toast: { type: 'success', message: `Retrieving ${nlpResult.entities.quantity} ${nlpResult.entities.product}` },
        };
      }

      case 'INVENTORY_CHECK': {
<<<<<<< HEAD
        return {
          parsed: baseParsed,
          reply: `Checking inventory...`,
=======
        const reply = `Checking inventory${nlpResult.entities.product ? ` for ${nlpResult.entities.product}` : ''}...`;
        return {
          parsed: { intent: 'check_inventory', rawText },
          reply,
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
          toast: { type: 'info', message: 'Checking inventory...' },
        };
      }

      case 'TASK_STATUS': {
        return {
<<<<<<< HEAD
          parsed: baseParsed,
          reply: 'Displaying tasks...',
=======
          parsed: { intent: 'active_tasks', rawText },
          reply: 'Displaying active tasks...',
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
          toast: { type: 'info', message: 'Loading tasks...' },
        };
      }

      case 'ROBOT_STATUS': {
        return {
<<<<<<< HEAD
          parsed: baseParsed,
          reply: 'Checking system status...',
          toast: { type: 'info', message: 'Loading status...' },
        };
      }

      case 'CAMERA_ON': {
        await visionCamera(true);
        return {
          parsed: baseParsed,
          reply: generateVoiceFeedback(nlpResult, true),
          toast: { type: 'success', message: 'Camera started' },
        };
      }

      case 'CAMERA_OFF': {
        await visionCamera(false);
        return {
          parsed: baseParsed,
          reply: generateVoiceFeedback(nlpResult, true),
          toast: { type: 'success', message: 'Camera stopped' },
        };
      }

      case 'CONVEYOR_START': {
        await postTask('Conveyor', 'Start conveyor belt', undefined, undefined);
        return {
          parsed: baseParsed,
          reply: generateVoiceFeedback(nlpResult, true),
          toast: { type: 'success', message: 'Conveyor start queued' },
        };
      }

      case 'CONVEYOR_STOP': {
        await postTask('Conveyor', 'Stop conveyor belt', undefined, undefined);
        return {
          parsed: baseParsed,
          reply: generateVoiceFeedback(nlpResult, true),
          toast: { type: 'success', message: 'Conveyor stop queued' },
        };
      }

      case 'PAUSE_ROBOT': {
        await postTask('Pause', 'Pause robotic arm — operator voice command');
        return {
          parsed: baseParsed,
          reply: generateVoiceFeedback(nlpResult, true),
          toast: { type: 'info', message: 'Robot pause queued' },
        };
      }

      case 'RESUME_ROBOT': {
        await postTask('Resume', 'Resume robotic arm — operator voice command');
        return {
          parsed: baseParsed,
          reply: generateVoiceFeedback(nlpResult, true),
          toast: { type: 'success', message: 'Robot resume queued' },
=======
          parsed: { intent: 'system_status', rawText },
          reply: 'Checking robot status...',
          toast: { type: 'info', message: 'Loading robot status...' },
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
        };
      }

      case 'HELP': {
<<<<<<< HEAD
        return {
          parsed: baseParsed,
          reply: generateVoiceFeedback(nlpResult, true),
=======
        const reply = generateVoiceFeedback(nlpResult, true);
        return {
          parsed: { intent: 'unknown', rawText },
          reply,
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
          toast: { type: 'info', message: 'Help displayed' },
        };
      }

      default: {
        return {
<<<<<<< HEAD
          parsed: baseParsed,
          reply: 'I did not understand that command. Try: "Store 5 Milk Chocolates", "Retrieve 10 Dark Chocolates", or "Camera on"',
=======
          parsed: { intent: 'unknown', rawText },
          reply: 'I did not understand that command. Try: "Store 5 Milk Chocolates", "Retrieve 10 Dark Chocolates", or "Show inventory"',
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
          toast: { type: 'error', message: 'Command not recognized' },
        };
      }
    }
  } catch (error) {
<<<<<<< HEAD
    const msg = error instanceof Error ? error.message : 'Execution error';
    console.error('[Voice] Error executing NLP command:', error);
    return {
      parsed: { intent: 'unknown', rawText: rawText },
      reply: `Could not complete that command: ${msg}. Ensure backend (5000) and vision service (8001) are running.`,
      toast: { type: 'error', message: msg },
    };
  }
}
=======
    console.error('[Voice] Error executing NLP command:', error);
    return {
      parsed: { intent: 'unknown', rawText: rawText },
      reply: 'An error occurred processing your command. Please try again.',
      toast: { type: 'error', message: 'Execution error' },
    };
  }
}
>>>>>>> fix-camera
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
