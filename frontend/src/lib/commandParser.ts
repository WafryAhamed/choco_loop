export interface ParsedCommand {
  intent:
  'pick' |
  'sort' |
  'pack' |
  'move' |
  'check_inventory' |
  'pause' |
  'start_station' |
  'unknown';
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
  toast: {type: 'success' | 'info' | 'error';message: string;};
}

const CHOCOLATE_TYPES = [
{ match: ['dark', 'dark chocolate'], label: 'Dark Chocolate' },
{ match: ['milk', 'milk chocolate'], label: 'Milk Chocolate' },
{ match: ['white', 'white chocolate'], label: 'White Chocolate' },
{ match: ['truffle', 'truffles'], label: 'Truffle' },
{ match: ['premium', 'assorted', 'collection'], label: 'Premium Assorted' },
{ match: ['blue', 'blue box'], label: 'Blue Box' }];


function detectProduct(text: string): string | undefined {
  for (const type of CHOCOLATE_TYPES) {
    if (type.match.some((m) => text.includes(m))) return type.label;
  }
  return undefined;
}

function detectDestination(text: string): string | undefined {
  // matches "shelf a", "bin a-01", "to bin c", "shelf 2"
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
    fifty: 50
  };
  for (const [word, val] of Object.entries(words)) {
    if (text.includes(word)) return val;
  }
  return undefined;
}

function detectStation(text: string): string | undefined {
  const stationMatch = text.match(/station\s+(\d+)/i);
  if (stationMatch) return `Station ${stationMatch[1]}`;
  return undefined;
}

let taskCounter = 1048;

export function parseCommand(rawText: string): CommandResult {
  const text = rawText.toLowerCase().trim();
  const product = detectProduct(text);
  const destination = detectDestination(text);
  const quantity = detectQuantity(text) ?? 12;
  const station = detectStation(text);

  const eta = `${Math.floor(Math.random() * 3) + 1}m ${Math.floor(
    Math.random() * 59
  ).
  toString().
  padStart(2, '0')}s`;

  // Determine intent
  let intent: ParsedCommand['intent'] = 'unknown';
  if (/\b(pause|stop|halt|hold)\b/.test(text)) intent = 'pause';else
  if (/\b(check|show|how much|inventory|stock|level)\b/.test(text))
  intent = 'check_inventory';else
  if (/\b(start|begin|run|resume)\b/.test(text) && station)
  intent = 'start_station';else
  if (/\b(move|transfer|relocate)\b/.test(text)) intent = 'move';else
  if (/\b(pick|grab|retrieve|get)\b/.test(text)) intent = 'pick';else
  if (/\b(sort|organize|separate)\b/.test(text)) intent = 'sort';else
  if (/\b(pack|package|box up|wrap)\b/.test(text)) intent = 'pack';

  const parsed: ParsedCommand = {
    intent,
    product,
    destination,
    quantity,
    station,
    rawText
  };
  const taskId = `T-${taskCounter++}`;

  switch (intent) {
    case 'move':
      return {
        parsed,
        taskId,
        reply: `Task queued: Move ${quantity} ${product ?? 'units'} → ${destination ?? 'destination bin'}. ETA ${eta}.`,
        toast: { type: 'success', message: `Move task ${taskId} queued` }
      };
    case 'pick':
      return {
        parsed,
        taskId,
        reply: `Task queued: Pick ${quantity} ${product ?? 'units'}${destination ? ` → ${destination}` : ''}. ETA ${eta}.`,
        toast: { type: 'success', message: `Pick task ${taskId} queued` }
      };
    case 'sort':
      return {
        parsed,
        taskId,
        reply: `Task queued: Sort ${product ?? 'incoming items'} by category. ETA ${eta}.`,
        toast: { type: 'success', message: `Sort task ${taskId} queued` }
      };
    case 'pack':
      return {
        parsed,
        taskId,
        reply: `Task queued: Pack ${quantity} ${product ?? 'units'}${station ? ` at ${station}` : ''}. ETA ${eta}.`,
        toast: { type: 'success', message: `Pack task ${taskId} queued` }
      };
    case 'check_inventory':
      return {
        parsed,
        reply: `Checking inventory${product ? ` for ${product}` : ''}… I can show current stock levels on the Inventory page, or ask me 'What's low on stock?'.`,
        toast: { type: 'info', message: 'Inventory lookup' }
      };
    case 'pause':
      return {
        parsed,
        reply: `Robot arm paused. All active tasks are on hold until resumed. Say 'resume station' to continue.`,
        toast: { type: 'info', message: 'Robot arm paused' }
      };
    case 'start_station':
      return {
        parsed,
        taskId,
        reply: `Starting ${station ?? 'the station'}. Packing line is now active. ETA to first output ${eta}.`,
        toast: { type: 'success', message: `${station ?? 'Station'} started` }
      };
    default:
      return {
        parsed,
        reply: `I didn't quite catch a clear command. Try things like "Move 12 dark chocolate to shelf A", "Pick milk boxes to bin C", "Start packing station 2", or "Pause robot arm".`,
        toast: { type: 'error', message: 'Command not recognized' }
      };
  }
}