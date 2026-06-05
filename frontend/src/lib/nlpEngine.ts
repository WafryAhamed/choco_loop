/**
 * Enhanced NLP Engine for Voice Command Processing
 * Focus: STORE and RETRIEVE intents with fuzzy product matching
 */

// ============= TYPE DEFINITIONS =============

export type Intent = 
  | 'STORE' 
  | 'RETRIEVE' 
  | 'INVENTORY_CHECK' 
  | 'TASK_STATUS' 
  | 'ROBOT_STATUS'
  | 'HELP' 
  | 'UNKNOWN';

export interface NLPResult {
  intent: Intent;
  confidence: number;
  priority: number;
  isConversational: boolean;
  isEmergency: boolean;
  entities: {
    product?: string;
    quantity?: number;
    quantityWord?: string;
    taskType?: 'Store' | 'Retrieve';
    context?: string;
  };
  rawInput: string;
  normalizedInput: string;
  validationErrors: string[];
  suggestedAction?: {
    type: 'CREATE_TASK' | 'QUERY_INVENTORY' | 'SHOW_TASKS' | 'SHOW_ROBOTS' | 'HELP';
    params?: Record<string, any>;
  };
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  category?: string;
  sku?: string;
}

// ============= INTENT PATTERNS =============

const INTENT_PATTERNS = {
  STORE: [
    /\b(store|add|put|save|insert|register|stock|place|restock)\b/i,
    /\b(store|add|save|register|stock)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|hundred)/i,
    /\b(put).*\b(in inventory|to inventory|away)\b/i,
  ],
  RETRIEVE: [
    /\b(retrieve|get|bring|pick|fetch|collect|remove|take)\b/i,
    /\b(retrieve|get|bring|pick|fetch|collect)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|hundred)/i,
    /\b(need|require|want|must get)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|hundred)\s+(.+)/i,
  ],
  INVENTORY_CHECK: [
    /\b(show|check|display|view|open|list)\s+(inventory|stock)\b/i,
    /\b(inventory|stock)\s+(status|summary|report)\b/i,
    /\bhow\s+many.*\b(available|left|stock|remain)\b/i,
    /\b(available|current|total)\s+(inventory|stock|quantity)\b/i,
    /\b(check|show)\s+\w+\s+stock\b/i,
    /^(inventory|stock)$/i,
  ],
  TASK_STATUS: [
    /\b(show|display|view|open|list).*\b(task|tasks|pending|active|completed|failed|recent)\b/i,
    /\b(task|tasks)\s+(history|status|summary|list)\b/i,
  ],
  ROBOT_STATUS: [
    /\brobot\s+(status|health|battery)\b/i,
    /^robot\s+status$/i,
  ],
  HELP: [
    /\b(help|what can you do|commands|instructions|guide)\b/i,
    /^(help|\?)$/i,
  ],
};

// ============= QUANTITY WORD MAPPING =============

const QUANTITY_WORDS: Record<string, number> = {
  'one': 1, 'a': 1, 'an': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11,
  'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16,
  'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30,
  'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80,
  'ninety': 90, 'hundred': 100, 'thousand': 1000,
};

// ============= CHOCOLATE PRODUCT DATABASE =============

const CHOCOLATE_PRODUCTS = [
  {
    canonical: 'Milk Chocolate',
    aliases: ['milk', 'milk choc', 'milk choco', 'milk chocolate', 'milks'],
    skuPatterns: ['CHOC-MILK', 'MILK']
  },
  {
    canonical: 'Dark Chocolate',
    aliases: ['dark', 'dark choc', 'dark choco', 'dark chocolate', 'darks'],
    skuPatterns: ['CHOC-DARK', 'DARK']
  },
  {
    canonical: 'White Chocolate',
    aliases: ['white', 'white choc', 'white choco', 'white chocolate', 'whites'],
    skuPatterns: ['CHOC-WHT', 'WHITE']
  }
];

// ============= UTILITY FUNCTIONS =============

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

/**
 * Fuzzy match product name with inventory
 * Supports: Exact match, canonical alias matching, partial matching
 */
function matchProductName(input: string, availableProducts: Product[]): string | undefined {
  if (!input) return undefined;

  const normalized = normalizeText(input).toLowerCase();

  // 1. Try exact product name matches
  for (const product of availableProducts) {
    const productNorm = normalizeText(product.name).toLowerCase();
    if (productNorm === normalized) {
      return product.name;
    }
    if (product.sku && product.sku.toLowerCase() === normalized) {
      return product.name;
    }
  }

  // 2. Try canonical chocolate type aliases (e.g., "milk choc" → "Milk Chocolate")
  for (const choco of CHOCOLATE_PRODUCTS) {
    for (const alias of choco.aliases) {
      if (normalized.includes(alias)) {
        // Check if this chocolate type exists in inventory
        const found = availableProducts.find(p => 
          p.name.toLowerCase().includes(choco.canonical.toLowerCase())
        );
        if (found) {
          return found.name;
        }
        return choco.canonical;
      }
    }
  }

  // 3. Try word-based substring matching
  const inputWords = normalized.split(/\s+/).filter(w => w.length > 0);
  for (const product of availableProducts) {
    const productWords = normalizeText(product.name).split(/\s+/);
    const matchCount = inputWords.filter(word => 
      productWords.some(pword => pword.includes(word) || word.includes(pword))
    ).length;
    if (matchCount > 0) {
      return product.name;
    }
  }

  return undefined;
}

/**
 * Extract quantity from text (numeric or word-based)
 */
function extractQuantity(text: string): { quantity?: number; quantityWord?: string } {
  // Try numeric extraction first
  const numericMatch = text.match(/\b(\d+)\b/);
  if (numericMatch) {
    return { quantity: parseInt(numericMatch[1], 10) };
  }
  
  // Try word-based extraction
  const words = text.toLowerCase().split(/\s+/);
  for (const word of words) {
    if (QUANTITY_WORDS[word]) {
      return { quantity: QUANTITY_WORDS[word], quantityWord: word };
    }
  }
  
  return {};
}

/**
 * Classify intent from text
 */
function classifyIntent(text: string): { intent: Intent; confidence: number } {
  const normalized = text.toLowerCase();
  let bestMatch: { intent: Intent; confidence: number } = { intent: 'UNKNOWN', confidence: 0 };
  
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        const confidence = 0.95;
        if (confidence > bestMatch.confidence) {
          bestMatch = { intent: intent as Intent, confidence };
        }
      }
    }
  }
  
  return bestMatch.confidence > 0.5 ? bestMatch : { intent: 'UNKNOWN', confidence: 0 };
}

/**
 * Validate extracted entities
 */
function validateEntities(
  intent: Intent,
  entities: NLPResult['entities']
): string[] {
  const errors: string[] = [];
  
  if (intent === 'STORE' || intent === 'RETRIEVE') {
    if (!entities.product) {
      errors.push('Product name not identified');
    }
    if (!entities.quantity || entities.quantity < 1) {
      errors.push('Quantity not specified or invalid');
    } else if (entities.quantity > 10000) {
      errors.push('Quantity exceeds maximum limit (10,000)');
    }
  }
  
  return errors;
}

/**
 * Generate suggested action from NLP result
 */
function generateSuggestedAction(
  intent: Intent,
  entities: NLPResult['entities']
): NLPResult['suggestedAction'] | undefined {
  switch (intent) {
    case 'STORE':
    case 'RETRIEVE':
      return {
        type: 'CREATE_TASK',
        params: {
          taskType: intent === 'STORE' ? 'Store' : 'Retrieve',
          product: entities.product,
          quantity: entities.quantity,
        },
      };
    
    case 'INVENTORY_CHECK':
      return { type: 'QUERY_INVENTORY', params: { product: entities.product } };
    
    case 'TASK_STATUS':
      return { type: 'SHOW_TASKS', params: {} };
    
    case 'ROBOT_STATUS':
      return { type: 'SHOW_ROBOTS', params: {} };
    
    case 'HELP':
      return { type: 'HELP' };
    
    default:
      return undefined;
  }
}

// ============= MAIN EXPORTS =============

/**
 * Main NLP processing function
 */
export function processNLP(
  input: string,
  availableProducts: Product[] = []
): NLPResult {
  const rawInput = input;
  const normalizedInput = normalizeText(input);
  
  // Classify intent
  const { intent, confidence } = classifyIntent(input);
  
  // Extract entities based on intent
  const entities: NLPResult['entities'] = {};
  
  if (intent === 'STORE' || intent === 'RETRIEVE') {
    const quantity = extractQuantity(input);
    entities.quantity = quantity.quantity;
    entities.quantityWord = quantity.quantityWord;
    
    const productName = matchProductName(input, availableProducts);
    if (productName) {
      entities.product = productName;
    }
    
    entities.taskType = intent === 'STORE' ? 'Store' : 'Retrieve';
  }
  
  if (intent === 'INVENTORY_CHECK') {
    const productName = matchProductName(input, availableProducts);
    if (productName) {
      entities.product = productName;
    }
  }
  
  const validationErrors = validateEntities(intent, entities);
  const suggestedAction = generateSuggestedAction(intent, entities);
  
  return {
    intent,
    confidence,
    priority: (intent === 'RETRIEVE' || intent === 'STORE') ? 1 : 5,
    isConversational: false,
    isEmergency: false,
    entities,
    rawInput,
    normalizedInput,
    validationErrors,
    suggestedAction,
  };
}

/**
 * Generate voice feedback message based on NLP result
 */
export function generateVoiceFeedback(result: NLPResult, executionSuccess?: boolean, errorReason?: string): string {
  if (executionSuccess === false) {
    if (errorReason?.includes('not found')) {
      return `${result.entities.product} was not found in inventory.`;
    }
    if (errorReason?.includes('insufficient')) {
      return `Insufficient stock of ${result.entities.product}. Only ${errorReason.match(/\d+/)?.[0] || '0'} units available.`;
    }
    if (errorReason?.includes('busy')) {
      return `Robot is currently busy. Please try again in a moment.`;
    }
    return `Operation failed: ${errorReason || 'Unknown error'}`;
  }
  
  if (result.intent === 'STORE') {
    return `Successfully stored ${result.entities.quantity} ${result.entities.product}.`;
  }
  
  if (result.intent === 'RETRIEVE') {
    return `Successfully retrieved ${result.entities.quantity} ${result.entities.product}.`;
  }
  
  if (result.intent === 'INVENTORY_CHECK') {
    return `Checking ${result.entities.product || 'inventory'}...`;
  }
  
  if (result.intent === 'TASK_STATUS') {
    return `Displaying task history...`;
  }
  
  if (result.intent === 'ROBOT_STATUS') {
    return `Displaying robot status...`;
  }
  
  if (result.intent === 'HELP') {
    return `Here are some commands: Store 5 chocolates, Retrieve 10 items, Show inventory, Check stock, Show tasks.`;
  }
  
  return `I understood your command. Processing...`;
}

/**
 * Generate chatbot response based on NLP result
 */
export function generateChatbotResponse(result: NLPResult): string {
  if (result.validationErrors.length > 0) {
    return `I understood you want to ${result.intent.toLowerCase()}. However: ${result.validationErrors.join(', ')}`;
  }
  
  switch (result.intent) {
    case 'STORE':
      return `Storing ${result.entities.quantity} ${result.entities.product}...`;
    case 'RETRIEVE':
      return `Retrieving ${result.entities.quantity} ${result.entities.product}...`;
    case 'INVENTORY_CHECK':
      return `Checking ${result.entities.product || 'inventory'}...`;
    case 'TASK_STATUS':
      return 'Displaying current tasks...';
    case 'ROBOT_STATUS':
      return 'Checking robot status...';
    case 'HELP':
      return 'Available commands: Store, Retrieve, Check Inventory, Show Tasks, Robot Status, Help';
    default:
      return 'I did not understand that command.';
  }
}
