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
  intent: string;
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

async function fetchInventory(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/inventory`);
  if (!res.ok) throw new Error('Inventory unavailable');
  return res.json();
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

/**
 * Enhanced NLP-based voice command execution
 * Uses processNLP for flexible natural language understanding
 */
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
    }

    // Execute based on intent
    switch (nlpResult.intent) {
      case 'STORE': {
        const storeTaskId = await postTask(
          'Store',
          `Store ${nlpResult.entities.quantity} ${nlpResult.entities.product}`,
          nlpResult.entities.product,
          nlpResult.entities.quantity,
          'Store'
        );
        const reply = generateVoiceFeedback(nlpResult, true);
        return {
          parsed: baseParsed,
          reply,
          taskId: storeTaskId,
          toast: { type: 'success', message: `Stored ${nlpResult.entities.quantity} ${nlpResult.entities.product}` },
        };
      }

      case 'RETRIEVE': {
        // Check availability
        const productMatch = inventoryData.find(
          (item: any) => item.name.toLowerCase() === nlpResult.entities.product?.toLowerCase()
        );

        if (!productMatch) {
          const reply = generateVoiceFeedback(nlpResult, false, 'product not found');
          return {
            parsed: baseParsed,
            reply,
            toast: { type: 'error', message: `${nlpResult.entities.product} not found in inventory` },
          };
        }

        if (productMatch.stock < nlpResult.entities.quantity!) {
          const reply = generateVoiceFeedback(
            nlpResult,
            false,
            `insufficient stock - only ${productMatch.stock} available`
          );
          return {
            parsed: baseParsed,
            reply,
            toast: { type: 'error', message: `Insufficient stock. Available: ${productMatch.stock}` },
          };
        }

        const retrieveTaskId = await postTask(
          'Retrieve',
          `Retrieve ${nlpResult.entities.quantity} ${nlpResult.entities.product}`,
          nlpResult.entities.product,
          nlpResult.entities.quantity,
          'Retrieve'
        );

        const reply = generateVoiceFeedback(nlpResult, true);
        return {
          parsed: baseParsed,
          reply,
          taskId: retrieveTaskId,
          toast: { type: 'success', message: `Retrieving ${nlpResult.entities.quantity} ${nlpResult.entities.product}` },
        };
      }

      case 'INVENTORY_CHECK': {
        return {
          parsed: baseParsed,
          reply: `Checking inventory...`,
          toast: { type: 'info', message: 'Checking inventory...' },
        };
      }

      case 'TASK_STATUS': {
        return {
          parsed: baseParsed,
          reply: 'Displaying tasks...',
          toast: { type: 'info', message: 'Loading tasks...' },
        };
      }

      case 'ROBOT_STATUS': {
        return {
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
        };
      }

      case 'HELP': {
        return {
          parsed: baseParsed,
          reply: generateVoiceFeedback(nlpResult, true),
          toast: { type: 'info', message: 'Help displayed' },
        };
      }

      default: {
        return {
          parsed: baseParsed,
          reply: 'I did not understand that command. Try: "Store 5 Milk Chocolates", "Retrieve 10 Dark Chocolates", or "Camera on"',
          toast: { type: 'error', message: 'Command not recognized' },
        };
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Execution error';
    console.error('[Voice] Error executing NLP command:', error);
    return {
      parsed: { intent: 'unknown', rawText: rawText },
      reply: `Could not complete that command: ${msg}. Ensure backend (5000) and vision service (8001) are running.`,
      toast: { type: 'error', message: msg },
    };
  }
}
