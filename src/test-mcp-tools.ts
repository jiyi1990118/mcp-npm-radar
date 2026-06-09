#!/usr/bin/env node

// Simple validation test for all MCP tools
import { searchPackages, getPackageInfo } from './api/npm.js';
import { comparePackages, getBundleSize } from './api/compare.js';
import { getPackageVulnerabilities, findAlternatives } from './api/security.js';
import { getRelatedPackages } from './api/related.js';
import { getDownloadHistory } from './api/stats.js';
import { checkTypescriptSupport } from './api/typescript.js';
import { getPackageQualityScore } from './api/quality.js';
import { getPackageReadme } from './api/readme.js';
import { getTrendingPackages, getTopPackages, getWeeklyHot, getPackagesByCategory, getPackagesByDateRange } from './db/queries.js';

async function testAllTools() {
  console.log('🧪 Testing All 15 MCP Tools\n');
  let passed = 0;
  let failed = 0;

  // Test 1: search_packages
  console.log('1️⃣  search_packages');
  try {
    await searchPackages('react', 3);
    console.log('   ✅ OK\n');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED:', (e as Error).message, '\n');
    failed++;
  }

  // Test 2: get_package_detail
  console.log('2️⃣  get_package_detail');
  try {
    await getPackageInfo('express');
    console.log('   ✅ OK\n');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED:', (e as Error).message, '\n');
    failed++;
  }

  // Test 3: get_trending_packages
  console.log('3️⃣  get_trending_packages');
  try {
    await getTrendingPackages(5);
    console.log('   ✅ OK\n');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED:', (e as Error).message, '\n');
    failed++;
  }

  // Test 4: get_top_packages
  console.log('4️⃣  get_top_packages');
  try {
    await getTopPackages(5);
    console.log('   ✅ OK\n');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED:', (e as Error).message, '\n');
    failed++;
  }

  // Test 5: get_weekly_hot
  console.log('5️⃣  get_weekly_hot');
  try {
    await getWeeklyHot(5);
    console.log('   ✅ OK\n');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED:', (e as Error).message, '\n');
    failed++;
  }

  // Test 6: get_packages_by_category
  console.log('6️⃣  get_packages_by_category');
  try {
    await getPackagesByCategory('web-framework', 5);
    console.log('   ✅ OK\n');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED:', (e as Error).message, '\n');
    failed++;
  }

  // Test 7: get_packages_by_date_range
  console.log('7️⃣  get_packages_by_date_range');
  try {
    await getPackagesByDateRange(new Date('2020-01-01').getTime(), new Date('2024-01-01').getTime(), 5);
    console.log('   ✅ OK\n');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED:', (e as Error).message, '\n');
    failed++;
  }

  // Test 8: compare_packages
  console.log('8️⃣  compare_packages');
  try {
    await comparePackages(['react', 'vue']);
    console.log('   ✅ OK\n');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED:', (e as Error).message, '\n');
    failed++;
  }

  // Test 9: get_bundle_size
  console.log('9️⃣  get_bundle_size');
  try {
    await getBundleSize('axios');
    console.log('   ✅ OK\n');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED:', (e as Error).message, '\n');
    failed++;
  }

  // Test 10: get_package_vulnerabilities
  console.log('🔟 get_package_vulnerabilities');
  try {
    await getPackageVulnerabilities('express');
    console.log('   ✅ OK\n');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED:', (e as Error).message, '\n');
    failed++;
  }

  // Test 11: find_alternatives
  console.log('1️⃣1️⃣ find_alternatives');
  try {
    await findAlternatives('moment');
    console.log('   ✅ OK\n');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED:', (e as Error).message, '\n');
    failed++;
  }

  // Test 12: get_related_packages
  console.log('1️⃣2️⃣ get_related_packages');
  try {
    await getRelatedPackages('react', 5);
    console.log('   ✅ OK\n');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED:', (e as Error).message, '\n');
    failed++;
  }

  // Test 13: get_download_history
  console.log('1️⃣3️⃣ get_download_history');
  try {
    await getDownloadHistory('axios', 'last-week');
    console.log('   ✅ OK\n');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED:', (e as Error).message, '\n');
    failed++;
  }

  // Test 14: check_typescript_support
  console.log('1️⃣4️⃣ check_typescript_support');
  try {
    await checkTypescriptSupport('express');
    console.log('   ✅ OK\n');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED:', (e as Error).message, '\n');
    failed++;
  }

  // Test 15: get_package_quality_score
  console.log('1️⃣5️⃣ get_package_quality_score');
  try {
    await getPackageQualityScore('axios');
    console.log('   ✅ OK\n');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED:', (e as Error).message, '\n');
    failed++;
  }

  // Test 16: get_package_readme
  console.log('1️⃣6️⃣ get_package_readme');
  try {
    const readme = await getPackageReadme('axios');
    if (readme.hasReadme && readme.readme.length > 0) {
      console.log('   ✅ OK\n');
      passed++;
    } else {
      throw new Error('No README content');
    }
  } catch (e) {
    console.log('   ❌ FAILED:', (e as Error).message, '\n');
    failed++;
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of 16 tools`);
  if (failed === 0) {
    console.log('✅ All MCP tools are working correctly!');
  }
}

testAllTools();
