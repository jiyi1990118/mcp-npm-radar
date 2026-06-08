#!/usr/bin/env node

import { searchPackages, getPackageInfo } from './api/npm.js';
import { getTrendingPackages, getTopPackages, getPackagesByCategory, getPackagesByDateRange, getWeeklyHot } from './db/queries.js';
import { getDownloadHistory } from './api/stats.js';
import { checkTypescriptSupport } from './api/typescript.js';
import { getPackageQualityScore } from './api/quality.js';

async function runTests() {
  console.log('🧪 Testing npm-radar MCP Tools\n');

  // Test 1: Database-based ranking tools
  console.log('📊 Test 1: get_top_packages');
  try {
    const top = await getTopPackages(5);
    console.log(`✅ Success: Found ${top.length} packages`);
    top.forEach((pkg: any, i: number) => {
      console.log(`   ${i + 1}. ${pkg.name} - ${pkg.downloads.toLocaleString()} downloads`);
    });
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }

  console.log('\n📈 Test 2: get_trending_packages');
  try {
    const trending = await getTrendingPackages(5);
    console.log(`✅ Success: Found ${trending.length} packages`);
    trending.forEach((pkg: any, i: number) => {
      const growth = pkg.downloads - (pkg.prev_downloads || 0);
      console.log(`   ${i + 1}. ${pkg.name} - Growth: +${growth.toLocaleString()}`);
    });
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }

  console.log('\n🔥 Test 3: get_weekly_hot');
  try {
    const hot = await getWeeklyHot(5);
    console.log(`✅ Success: Found ${hot.length} packages`);
    hot.forEach((pkg: any, i: number) => {
      console.log(`   ${i + 1}. ${pkg.name} - ${pkg.weekly_downloads.toLocaleString()} weekly downloads`);
    });
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }

  console.log('\n🏷️  Test 4: get_packages_by_category');
  try {
    const packages = await getPackagesByCategory('web-framework', 5);
    console.log(`✅ Success: Found ${packages.length} web-framework packages`);
    packages.forEach((pkg: any, i: number) => {
      console.log(`   ${i + 1}. ${pkg.name} - ${pkg.description?.substring(0, 50)}...`);
    });
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }

  console.log('\n📅 Test 5: get_packages_by_date_range');
  try {
    const start = new Date('2020-01-01').getTime();
    const end = new Date('2024-01-01').getTime();
    const packages = await getPackagesByDateRange(start, end, 5);
    console.log(`✅ Success: Found ${packages.length} packages from 2020-2024`);
    packages.forEach((pkg: any, i: number) => {
      const date = new Date(pkg.created_at).toISOString().split('T')[0];
      console.log(`   ${i + 1}. ${pkg.name} - Created: ${date}`);
    });
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }

  // Test 6: API-based tools
  console.log('\n🔍 Test 6: search_packages (API)');
  try {
    const results = await searchPackages('react', 3);
    const packages = results.objects?.slice(0, 3) || [];
    console.log(`✅ Success: Found ${packages.length} results for "react"`);
    packages.forEach((obj: any, i: number) => {
      console.log(`   ${i + 1}. ${obj.package.name} - ${obj.package.description?.substring(0, 50)}...`);
    });
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }

  console.log('\n📦 Test 7: get_package_detail (API)');
  try {
    const info = await getPackageInfo('express');
    console.log(`✅ Success: Got details for express`);
    console.log(`   Version: ${info['dist-tags']?.latest}`);
    console.log(`   Description: ${info.description}`);
    console.log(`   License: ${info.license}`);
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }

  console.log('\n📊 Test 8: get_download_history (API)');
  try {
    const history = await getDownloadHistory('axios', 'last-week');
    console.log(`✅ Success: Got download history for axios`);
    console.log(`   Period: ${history.period}`);
    console.log(`   Total downloads: ${history.totalDownloads.toLocaleString()}`);
    console.log(`   Avg daily: ${history.avgDailyDownloads.toLocaleString()}`);
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }

  console.log('\n🔷 Test 9: check_typescript_support (API)');
  try {
    const support = await checkTypescriptSupport('express');
    console.log(`✅ Success: Checked TypeScript support for express`);
    console.log(`   Built-in types: ${support.builtInTypes}`);
    console.log(`   DefinitelyTyped: ${support.definitelyTyped}`);
    console.log(`   Recommendation: ${support.recommendation}`);
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }

  console.log('\n⭐ Test 10: get_package_quality_score (API)');
  try {
    const quality = await getPackageQualityScore('axios');
    console.log(`✅ Success: Got quality score for axios`);
    console.log(`   Overall score: ${quality.overallScore}`);
    console.log(`   Rating: ${quality.rating}`);
    console.log(`   Popularity: ${quality.scores.popularity}, Maintenance: ${quality.scores.maintenance}, Quality: ${quality.scores.quality}`);
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }

  console.log('\n✅ All tests completed!');
}

runTests();
