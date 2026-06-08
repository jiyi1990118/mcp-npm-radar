import { selectFastestRegistry } from './utils/registry-selector.js';
import { searchPackages } from './api/npm.js';

async function test() {
  console.log('Testing npm-radar...\n');

  console.log('1. Testing registry selection...');
  const registry = await selectFastestRegistry();
  console.log(`✓ Selected registry: ${registry}\n`);

  console.log('2. Testing package search...');
  const results = await searchPackages('react', 5);
  console.log(`✓ Found ${results.objects?.length || 0} packages\n`);

  console.log('All tests passed!');
}

test().catch(console.error);
