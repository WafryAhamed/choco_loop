import { parseCommandIntent } from '../src/lib/commandParser';

type TestCase = {
  input: string;
  expectedIntent: string;
  expectedProduct?: string;
  expectedQuantity?: number;
};

const cases: TestCase[] = [
  {
    input: 'Pick 3 white chocolate',
    expectedIntent: 'pick',
    expectedProduct: 'White Chocolate',
    expectedQuantity: 3,
  },
  {
    input: 'Queue pick 10 dark chocolate',
    expectedIntent: 'pick',
    expectedProduct: 'Dark Chocolate',
    expectedQuantity: 10,
  },
  {
    input: 'How many milk chocolate left',
    expectedIntent: 'stock_count',
    expectedProduct: 'Milk Chocolate',
    expectedQuantity: undefined,
  },
  {
    input: 'Start the conveyor',
    expectedIntent: 'start_conveyor',
  },
  {
    input: 'Stop the camera',
    expectedIntent: 'stop_camera',
  },
];

let failures = 0;

for (const testCase of cases) {
  const result = parseCommandIntent(testCase.input);
  const passedIntent = result.intent === testCase.expectedIntent;
  const passedProduct = testCase.expectedProduct
    ? result.product === testCase.expectedProduct
    : true;
  const passedQuantity = testCase.expectedQuantity !== undefined
    ? result.quantity === testCase.expectedQuantity
    : true;

  const passed = passedIntent && passedProduct && passedQuantity;
  if (!passed) {
    failures += 1;
    console.error('FAILED: ', testCase.input);
    console.error('  expected=', testCase);
    console.error('  got     =', result);
  } else {
    console.log('PASS: ', testCase.input);
  }
}

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exit(1);
} else {
  console.log(`\nAll ${cases.length} tests passed.`);
}
