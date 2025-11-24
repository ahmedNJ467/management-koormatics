#!/usr/bin/env node
/**
 * Bundle Analyzer Script
 * 
 * This script runs the Next.js bundle analyzer to help identify
 * large dependencies and optimize bundle sizes.
 * 
 * Usage:
 *   node scripts/analyze-bundle.js
 *   or
 *   npm run analyze
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('📊 Starting bundle analysis...\n');

try {
  // Set ANALYZE environment variable and run build
  process.env.ANALYZE = 'true';
  
  console.log('Building with bundle analyzer enabled...');
  console.log('This may take a few minutes...\n');
  
  execSync('npm run build', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      ANALYZE: 'true',
    },
  });
  
  console.log('\n✅ Bundle analysis complete!');
  console.log('📈 Check the browser window that opened to view the analysis.');
  console.log('💡 Look for large dependencies that can be optimized or lazy-loaded.\n');
} catch (error) {
  console.error('\n❌ Bundle analysis failed:', error.message);
  process.exit(1);
}

