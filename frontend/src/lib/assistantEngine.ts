import { API_BASE, getAuthHeaders } from './api';
import { executeVoiceCommand, parseCommandIntent, executeNLPCommand } from './commandParser';
import { 
  processNLP, 
  generateChatbotResponse,
  type Product
} from './nlpEngine';

export interface AssistantReply {
  text: string;
}

const lowStockStatuses = ['Low Stock', 'Out of Stock'];

export async function getAssistantReply(rawInput: string): Promise<AssistantReply> {
  const input = rawInput.toLowerCase().trim();

  try {
    // Fetch inventory data for NLP processing
    const inventoryRes = await fetch(`${API_BASE}/inventory`);
    const inventoryData = await inventoryRes.json();
    const products: Product[] = inventoryData.map((item: any) => ({
      id: item.id || item.sku,
      name: item.name,
      quantity: item.stock || item.quantity || 0,
      category: item.category,
      sku: item.sku,
    }));

    // Process input through NLP engine
    const nlpResult = processNLP(rawInput, products);

    // Handle NLP-based intents
    if (nlpResult.suggestedAction) {
      switch (nlpResult.suggestedAction.type) {
        case 'CREATE_TASK': {
          const result = await executeNLPCommand(rawInput);
          return { text: result.reply };
        }

        case 'QUERY_INVENTORY': {
          if (nlpResult.entities.product) {
            const productMatch = inventoryData.find(
              (item: any) => item.name.toLowerCase() === nlpResult.entities.product?.toLowerCase()
            );
            if (productMatch) {
              return {
                text: `We have ${productMatch.stock} units of ${productMatch.name} in stock (${productMatch.status}).`,
              };
            }
            return {
              text: `${nlpResult.entities.product} not found in inventory.`,
            };
          }

          // General inventory check
          const low = inventoryData.filter((i: any) => lowStockStatuses.includes(i.status));
          if (low.length === 0) {
            return {
              text: 'Good news — all products are adequately stocked right now.',
            };
          }
          const list = low
            .map((i: any) => `• ${i.name}: ${i.stock} units (${i.status})`)
            .join('\n');
          return {
            text: `${low.length} item(s) need attention:\n${list}`,
          };
        }


        case 'SHOW_TASKS': {
          try {
            const tasksRes = await fetch(`${API_BASE}/tasks/active`);
            const activeTasks = await tasksRes.json();
            const active = activeTasks.filter((t: any) => t.status === 'Active').length;
            const queued = activeTasks.filter((t: any) => t.status === 'Queued').length;
            return {
              text: `Current Task Queue: ${activeTasks.length} total (${active} active, ${queued} queued)`,
            };
          } catch (error) {
            return { text: 'Unable to fetch task data.' };
          }
        }

        case 'HELP': {
          return {
            text: generateChatbotResponse(nlpResult),
          };
        }
      }
    }

    // Fallback response if no NLP action matched
    return {
      text: generateChatbotResponse(nlpResult),
    };
  } catch (error) {
    console.error('[Assistant] Error:', error);
    return {
      text: 'I encountered an issue processing your request. Please ensure the backend is running on port 5000.',
    };
  }
}

export const suggestedQuestions = [
  "Store 5 milk chocolates",
  'Retrieve 10 dark chocolates',
  'Show inventory',
  'Show my tasks',
  "Today's analytics",
];

