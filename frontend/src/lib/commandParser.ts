import { API_BASE } from './api';
import { 
  processNLP, 
  generateVoiceFeedback, 
  generateChatbotResponse,
  type NLPResult,
  type Product
} from './nlpEngine';

const VISION_BASE = 'http://localhost:8001';

export interface ParsedCommand {
  intent:
    | 'pick'
    | 'sort'
    | 'pack'
    | 'move'
    | 'store'
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
  } else if (/\b(store|put away|restock|stock up|stock)\b/.test(text)) {
    intent = 'store';
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

async function fetchInventory(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/inventory`);
  if (!res.ok) throw new Error('Inventory unavailable');
  return res.json();
}

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

async function postTask(
  type: string,
  description: string,
  product?: string,
  quantity?: number,
  taskType?: string
): Promise<string | undefined> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      taskType: taskType || type,
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
  // Use the new NLP-based command execution
  return executeNLPCommand(rawText);
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

/**
 * Enhanced NLP-based voice command execution
 * Uses processNLP for flexible natural language understanding
 */
export async function executeNLPCommand(rawText: string): Promise<CommandResult> {
  try {
    // Fetch available products for fuzzy matching
    const inventoryData = await fetchInventory();
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

    // Validate NLP result
    if (nlpResult.validationErrors.length > 0 && nlpResult.intent !== 'UNKNOWN') {
      console.warn('[Voice] Validation errors:', nlpResult.validationErrors);
    }

    // Execute based on intent
    switch (nlpResult.intent) {
      case 'STORE': {
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
        const storeTaskId = await postTask(
          'Store',
          `Store ${nlpResult.entities.quantity} ${nlpResult.entities.product}`,
          nlpResult.entities.product,
          nlpResult.entities.quantity,
          'Store'
        );

        const reply = generateVoiceFeedback(nlpResult, true);
        return {
          parsed: { 
            intent: 'store', 
            rawText, 
            product: nlpResult.entities.product, 
            quantity: nlpResult.entities.quantity 
          },
          reply,
          taskId: storeTaskId,
          toast: { type: 'success', message: `Stored ${nlpResult.entities.quantity} ${nlpResult.entities.product}` },
        };
      }

      case 'RETRIEVE': {
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

        // Check availability
        const productMatch = inventoryData.find(
          (item: any) => item.name.toLowerCase() === nlpResult.entities.product?.toLowerCase()
        );

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
            reply,
            toast: { type: 'error', message: `${nlpResult.entities.product} not found in inventory` },
          };
        }

        if (productMatch.stock < nlpResult.entities.quantity) {
          const reply = generateVoiceFeedback(
            nlpResult,
            false,
            `insufficient stock - only ${productMatch.stock} available`
          );
          return {
            parsed: { 
              intent: 'pick', 
              rawText, 
              product: nlpResult.entities.product, 
              quantity: nlpResult.entities.quantity 
            },
            reply,
            toast: { type: 'error', message: `Insufficient stock. Available: ${productMatch.stock}` },
          };
        }

        // Create retrieve task
        const retrieveTaskId = await postTask(
          'Retrieve',
          `Retrieve ${nlpResult.entities.quantity} ${nlpResult.entities.product}`,
          nlpResult.entities.product,
          nlpResult.entities.quantity,
          'Retrieve'
        );

        const reply = generateVoiceFeedback(nlpResult, true);
        return {
          parsed: { 
            intent: 'pick', 
            rawText, 
            product: nlpResult.entities.product, 
            quantity: nlpResult.entities.quantity 
          },
          reply,
          taskId: retrieveTaskId,
          toast: { type: 'success', message: `Retrieving ${nlpResult.entities.quantity} ${nlpResult.entities.product}` },
        };
      }

      case 'INVENTORY_CHECK': {
        const reply = `Checking inventory${nlpResult.entities.product ? ` for ${nlpResult.entities.product}` : ''}...`;
        return {
          parsed: { intent: 'check_inventory', rawText },
          reply,
          toast: { type: 'info', message: 'Checking inventory...' },
        };
      }

      case 'TASK_STATUS': {
        return {
          parsed: { intent: 'active_tasks', rawText },
          reply: 'Displaying active tasks...',
          toast: { type: 'info', message: 'Loading tasks...' },
        };
      }

      case 'ROBOT_STATUS': {
        return {
          parsed: { intent: 'system_status', rawText },
          reply: 'Checking robot status...',
          toast: { type: 'info', message: 'Loading robot status...' },
        };
      }

      case 'HELP': {
        const reply = generateVoiceFeedback(nlpResult, true);
        return {
          parsed: { intent: 'unknown', rawText },
          reply,
          toast: { type: 'info', message: 'Help displayed' },
        };
      }

      default: {
        return {
          parsed: { intent: 'unknown', rawText },
          reply: 'I did not understand that command. Try: "Store 5 Milk Chocolates", "Retrieve 10 Dark Chocolates", or "Show inventory"',
          toast: { type: 'error', message: 'Command not recognized' },
        };
      }
    }
  } catch (error) {
    console.error('[Voice] Error executing NLP command:', error);
    return {
      parsed: { intent: 'unknown', rawText: rawText },
      reply: 'An error occurred processing your command. Please try again.',
      toast: { type: 'error', message: 'Execution error' },
    };
  }
}
