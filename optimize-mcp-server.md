# Optimize MCP Server

A systematic approach to optimizing Model Context Protocol (MCP) servers based on real-world production experience.

## When to Use This Skill

Use this skill when:
- Building a new MCP server from scratch
- Optimizing an existing MCP server's performance
- Improving data accuracy and reliability
- Adding rate limiting and error handling
- Preparing an MCP server for production deployment

## Optimization Checklist

### Phase 1: Data Accuracy Analysis

**Goal**: Ensure all data is accurate and not estimated

<thinking>

I'm creating the skill content. Let me structure it based on the actual work we did:

1. Data accuracy (fixing download calculations, real quality scores)
2. Performance (parallel processing, batch processing)
3. Coverage (expanding packages, categories)
4. Reliability (error handling, rate limiting)
5. Documentation and publishing

I should make it actionable and based on real patterns from our work.

</thinking>

1. **Identify Estimated/Hardcoded Data**
   - Check for any calculations like `total = weekly * 10`
   - Look for hardcoded values (quality: 0.8, popularity: 0.7)
   - Find fake or placeholder data

2. **Replace with Real Data Sources**
   - Use official APIs (npm registry, download stats)
   - Fetch real-time quality scores from search APIs
   - Get accurate historical data for trending calculations

3. **Verify Data Integrity**
   - Compare output with official sources
   - Check that calculations make sense
   - Test edge cases (new packages, missing data)

### Phase 2: Performance Optimization

**Goal**: Make the server fast and efficient

1. **Identify Bottlenecks**
   - Find serial operations that could be parallel
   - Check for repeated API calls
   - Look for missing caches

2. **Implement Parallel Processing**
   ```typescript
   // Before: Serial processing (slow)
   for (const item of items) {
     await processItem(item);
   }
   
   // After: Parallel with batching (fast)
   const BATCH_SIZE = 15;
   for (let i = 0; i < items.length; i += BATCH_SIZE) {
     const batch = items.slice(i, i + BATCH_SIZE);
     await Promise.allSettled(batch.map(processItem));
     if (i + BATCH_SIZE < items.length) {
       await delay(500); // Rate limiting
     }
   }
   ```

3. **Add Intelligent Caching**
   - Different TTLs for different data types
   - Cache at multiple layers (API cache, database cache)
   - Implement cache invalidation strategies

### Phase 3: Coverage Expansion

**Goal**: Maximize usefulness with broad data coverage

1. **Expand Data Sets**
   - Research what data users actually need
   - Increase from minimal to comprehensive coverage
   - Example: 15 packages → 100+ packages

2. **Enhance Categorization**
   - Move from basic to detailed categories
   - Implement intelligent inference algorithms
   - Cover all major use cases

3. **Test Coverage**
   - Verify new data is accurate
   - Check that categories are assigned correctly
   - Ensure no major gaps

### Phase 4: Reliability Enhancement

**Goal**: Make the server production-ready

1. **Add Retry Logic**
   ```typescript
   async function retryWithBackoff<T>(
     fn: () => Promise<T>,
     retries: number = 3,
     delay: number = 1000
   ): Promise<T> {
     try {
       return await fn();
     } catch (error) {
       if (retries === 0) throw error;
       await new Promise(resolve => setTimeout(resolve, delay));
       return retryWithBackoff(fn, retries - 1, delay * 2);
     }
   }
   ```

2. **Implement Rate Limiting**
   - Batch processing to avoid API throttling
   - Add delays between batches
   - Respect API rate limits

3. **Error Handling & Statistics**
   - Categorize errors (NOT_FOUND vs NETWORK_ERROR)
   - Track success/failure statistics
   - Log useful debugging information

4. **Graceful Degradation**
   - Provide fallback strategies when data unavailable
   - Don't fail completely on partial errors
   - Return useful results even in degraded mode

### Phase 5: Background Automation

**Goal**: Keep data fresh without user intervention

1. **Implement Auto-Refresh**
   ```typescript
   // In server startup
   const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour
   setInterval(() => {
     refreshData().catch(console.error);
   }, REFRESH_INTERVAL);
   
   // Initial prewarming
   refreshData().catch(console.error);
   ```

2. **Add Data Cleanup**
   - Remove stale data automatically
   - Set appropriate retention periods
   - Clean up based on data type

### Phase 6: Documentation & Publishing

**Goal**: Make the server easy to use and discover

1. **Update Documentation**
   - Document all new features
   - Explain architecture decisions
   - Provide usage examples
   - Include performance metrics

2. **Version Management**
   - Follow semantic versioning
   - Document breaking changes
   - Provide migration guides

3. **Publishing Checklist**
   - Build and test locally
   - Update version in package.json
   - Update README (English + other languages)
   - Commit with descriptive message
   - Push to git
   - Publish to npm

## Common Patterns

### Pattern 1: Hybrid Architecture

Combine real-time API calls with intelligent caching:

- **Real-time**: Search, detail queries (always fresh)
- **Cached**: Rankings, trends (performance critical)
- **Auto-refresh**: Background updates to keep cache fresh

### Pattern 2: Multi-Layer Caching

Different TTLs for different needs:

- API response cache: 1 hour (reduce API calls)
- Database cache: 30 minutes (balance freshness vs performance)
- Registry selection: 6 hours (infrastructure-level)

### Pattern 3: Batch + Delay

Prevent rate limiting with controlled concurrency:

```typescript
const BATCH_SIZE = 15;
const BATCH_DELAY_MS = 500;

for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await Promise.allSettled(batch.map(process));
  
  if (i + BATCH_SIZE < items.length) {
    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
  }
}
```

### Pattern 4: Error Statistics

Track and report errors for debugging:

```typescript
let successCount = 0;
let failCount = 0;

// ... processing ...

catch (err: any) {
  failCount++;
  const errorType = err.response?.status === 404 ? 'NOT_FOUND' : 'NETWORK_ERROR';
  console.error(`[${errorType}] Failed: ${err.message}`);
}

// Final report
console.error(`Completed: ${successCount} succeeded, ${failCount} failed`);
```

## Real-World Example: npm-radar Optimizations

From 15 packages to production-ready with 100+ packages:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Packages | 15 | 117 | +680% |
| Categories | 3 | 20+ | +567% |
| Data Accuracy | Estimates | Real API | 100% |
| Refresh Speed | 100+ seconds | 2-3 seconds | 97% faster |
| Error Handling | Basic try-catch | Retry + Stats | Production-ready |
| Rate Limiting | None | Batch + Delay | Protected |

## Testing Strategy

1. **Build Test**: `npm run build` - must succeed
2. **Functional Test**: `npm test` - verify core functionality
3. **Load Test**: Test with force refresh to check rate limiting
4. **Integration Test**: Test in Claude Desktop with real usage

## Troubleshooting

**Problem**: API rate limiting (429 errors)
**Solution**: Add batch processing with delays, implement caching

**Problem**: Data seems stale
**Solution**: Reduce cache TTL, add force refresh parameter, implement background auto-refresh

**Problem**: Slow performance
**Solution**: Implement parallel processing, add caching layers

**Problem**: Inaccurate data
**Solution**: Check data sources, replace estimates with real API calls

## Next Steps After Optimization

1. Monitor production usage
2. Gather user feedback
3. Identify new optimization opportunities
4. Iterate and improve

## References

- Model Context Protocol: https://modelcontextprotocol.io
- npm API Documentation: https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
- Semantic Versioning: https://semver.org/
