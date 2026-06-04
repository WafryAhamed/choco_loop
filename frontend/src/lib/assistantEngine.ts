import { parseCommand } from './commandParser';

export interface AssistantReply {
  text: string;
}

const lowStockStatuses = ['Low Stock', 'Out of Stock'];
const API_BASE = 'http://localhost:5000/api';

export async function getAssistantReply(rawInput: string): Promise<AssistantReply> {
  const input = rawInput.toLowerCase().trim();

  try {
    // Low stock query
    if (
      /(low|out of|running out|restock|need.*stock)/.test(input) &&
      /stock|inventory/.test(input)
    ) {
      const res = await fetch(`${API_BASE}/inventory`);
      const inventoryData = await res.json();
      const low = inventoryData.filter((i: any) => lowStockStatuses.includes(i.status));
      if (low.length === 0)
        return {
          text: 'Good news — every product is comfortably in stock right now.'
        };
      const list = low
        .map((i: any) => `• ${i.name} — ${i.stock} units (${i.status}, bin ${i.bin})`)
        .join('\n');
      return {
        text: `There ${low.length === 1 ? 'is' : 'are'} ${low.length} item${low.length === 1 ? '' : 's'} needing attention:\n${list}`
      };
    }

    // Daily summary
    if (/(summary|today|daily|recap|overview)/.test(input)) {
      const res = await fetch(`${API_BASE}/dashboard/summary`);
      const { dailySummary } = await res.json();
      return {
        text: `Today's summary:\n• ${dailySummary.tasksCompleted} tasks completed\n• ${dailySummary.successRate}% success rate\n• ${dailySummary.itemsSorted.toLocaleString()} items sorted\n• Avg cycle time ${dailySummary.avgCycleTime}\n• Peak hour ${dailySummary.peakHour} (${dailySummary.peakThroughput} units/hr)`
      };
    }

    // Active tasks
    if (/(active|queue|how many task|current task|running task)/.test(input)) {
      const res = await fetch(`${API_BASE}/tasks/active`);
      const activeTasks = await res.json();
      const active = activeTasks.filter((t: any) => t.status === 'Active').length;
      const queued = activeTasks.filter((t: any) => t.status === 'Queued').length;
      const waiting = activeTasks.filter((t: any) => t.status === 'Waiting').length;
      return {
        text: `There are ${activeTasks.length} tasks in the queue right now: ${active} active, ${queued} queued, and ${waiting} waiting on vision.`
      };
    }

    // Throughput
    if (/(throughput|production|units per hour|how fast|output)/.test(input)) {
      const res = await fetch(`${API_BASE}/dashboard/summary`);
      const { throughputData } = await res.json();
      const latest = throughputData[throughputData.length - 1];
      const peak = Math.max(...throughputData.map((d: any) => d.value));
      return {
        text: `Current throughput is ${latest.value} units/hr (as of ${latest.time}). Today's peak was ${peak} units/hr.`
      };
    }

    // System health
    if (
      /(health|status|online|vision service|database|mysql|esp32|hardware|service)/.test(
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

    // Greetings / help
    if (/(hello|hi|hey|help|what can you)/.test(input)) {
      return {
        text: `Hi! I'm the Cacao Assistant. I can report on stock levels, today's summary, active tasks, throughput, and system health — or queue robot tasks for you. Try "What's low on stock?" or "Move 12 dark chocolate to shelf A".`
      };
    }

    // Otherwise try the command parser (task creation)
    const result = parseCommand(rawInput);
    if (result.parsed.intent !== 'unknown') {
      return { text: result.reply };
    }

    return {
      text: `I'm not sure about that one. You can ask me about stock, today's summary, active tasks, throughput, or system health — or give me a task like "Pack 20 truffles at station 2".`
    };
  } catch (error) {
    console.error('Assistant Engine Error:', error);
    return {
      text: 'Sorry, I am having trouble connecting to the backend services right now.'
    };
  }
}

export const suggestedQuestions = [
  "What's low on stock?",
  "Show today's summary",
  'How many active tasks?',
  'Is the vision service online?',
  "What's current throughput?"
];