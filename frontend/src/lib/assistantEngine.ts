import { API_BASE, getAuthHeaders } from './api';
<<<<<<< HEAD
import { executeVoiceCommand, parseCommandIntent } from './commandParser';
=======
import { executeVoiceCommand, parseCommandIntent, executeNLPCommand } from './commandParser';
import { 
  processNLP, 
  generateChatbotResponse,
  type Product
} from './nlpEngine';
>>>>>>> fix-camera

export interface AssistantReply {
  text: string;
}

const lowStockStatuses = ['Low Stock', 'Out of Stock'];

export async function getAssistantReply(rawInput: string): Promise<AssistantReply> {
  const input = rawInput.toLowerCase().trim();

  try {
<<<<<<< HEAD
    const voiceIntents = [
      'pick',
      'sort',
      'pack',
      'move',
      'check_inventory',
      'stock_count',
      'pause',
      'resume_robot',
      'start_station',
      'start_conveyor',
      'stop_conveyor',
      'start_camera',
      'stop_camera',
      'system_status',
      'active_tasks',
    ];
    const parsed = parseCommandIntent(rawInput);
    if (voiceIntents.includes(parsed.intent)) {
      const result = await executeVoiceCommand(rawInput);
      return { text: result.reply };
    }

    if (
      /\b(low|out of|running out|restock|need.*stock)\b/.test(input) &&
      /\b(stock|inventory)\b/.test(input)
    ) {
      const res = await fetch(`${API_BASE}/inventory`);
      const inventoryData = await res.json();
      const low = inventoryData.filter((i: any) => lowStockStatuses.includes(i.status));
      if (low.length === 0) {
        return {
          text: 'Good news — every product is comfortably in stock right now.',
        };
      }
      const list = low
        .map((i: any) => `• ${i.name} — ${i.stock} units (${i.status}, bin ${i.bin})`)
        .join('\n');
      return {
        text: `There ${low.length === 1 ? 'is' : 'are'} ${low.length} item${low.length === 1 ? '' : 's'} needing attention:\n${list}`,
      };
    }

    if (/\b(summary|today|daily|recap|overview)\b/.test(input)) {
      const res = await fetch(`${API_BASE}/dashboard/summary`);
      const { dailySummary } = await res.json();
      return {
        text: `Today's summary:\n• ${dailySummary.tasksCompleted} tasks completed\n• ${dailySummary.successRate}% success rate\n• ${dailySummary.itemsSorted.toLocaleString()} items sorted\n• Avg cycle time ${dailySummary.avgCycleTime}\n• Peak hour ${dailySummary.peakHour} (${dailySummary.peakThroughput} units/hr)`,
      };
    }

    if (/\b(active|queue|how many task|current task|running task)\b/.test(input)) {
      const res = await fetch(`${API_BASE}/tasks/active`);
      const activeTasks = await res.json();
      const active = activeTasks.filter((t: any) => t.status === 'Active').length;
      const queued = activeTasks.filter((t: any) => t.status === 'Queued').length;
      const waiting = activeTasks.filter((t: any) => t.status === 'Waiting').length;
      return {
        text: `There are ${activeTasks.length} tasks in the queue right now: ${active} active, ${queued} queued, and ${waiting} waiting on vision.`,
      };
    }

    if (/\b(throughput|production|units per hour|how fast|output)\b/.test(input)) {
      const res = await fetch(`${API_BASE}/dashboard/summary`);
      const { throughputData } = await res.json();
      const latest = throughputData[throughputData.length - 1];
      const peak = Math.max(...throughputData.map((d: any) => d.value));
      return {
        text: `Current throughput is ${latest.value} units/hr (as of ${latest.time}). Today's peak was ${peak} units/hr.`,
      };
    }

    if (
      /\b(health|status|online|vision service|database|mysql|esp32|hardware|service)\b/.test(
        input
      )
    ) {
      const res = await fetch(`${API_BASE}/dashboard/summary`);
      const { systemHealth } = await res.json();
      const summary = systemHealth
        .map((s: any) => `• ${s.service}: ${s.status} (${s.ping})`)
        .join('\n');
      return { text: `System health:\n${summary}` };
    }

    if (/\b(hello|hi|hey|help)\b/.test(input) || input.includes('what can you')) {
      return {
        text: `Hi! I'm the Cacao Assistant. Ask about stock, today's summary, active tasks, throughput, or system health — or say warehouse commands like "Start the conveyor" or "Queue pick 10 dark chocolate".`,
      };
    }

    try {
      const aiRes = await fetch(`${API_BASE}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ message: rawInput }),
      });
      const aiData = await aiRes.json();
      if (aiData.success && aiData.text) return { text: aiData.text };
    } catch (_e) {
      console.error('AI fallback error:', _e);
    }

    return {
      text: `I'm not sure about that. Try "What's low on stock?", "Show active tasks", "System status", or "Queue pick 10 milk chocolate".`,
    };
  } catch (error) {
    console.error('Assistant Engine Error:', error);
    return {
      text: 'Sorry, I am having trouble connecting to the backend services right now.',
=======
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
>>>>>>> fix-camera
    };
  }
}

export const suggestedQuestions = [
<<<<<<< HEAD
  "What's low on stock?",
  'Show active tasks',
  'System status',
  'Start the conveyor',
  'How many milk chocolate left?',
];
=======
  "Store 5 milk chocolates",
  'Retrieve 10 dark chocolates',
  'Show inventory',
  'Show my tasks',
  "Today's analytics",
];

>>>>>>> fix-camera
