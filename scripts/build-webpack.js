#!/usr/bin/env node

/**
 * Alternative build script using webpack directly to bypass Next.js EPERM issues
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔧 Starting webpack-based build process...");

// Function to safely remove directories
function safeRemoveDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      console.log(`🧹 Cleaning ${dirPath}...`);
      execSync(`rmdir /s /q "${dirPath}"`, { stdio: "inherit" });
    } catch (error) {
      console.warn(`⚠️  Could not remove ${dirPath}:`, error.message);
    }
  }
}

// Function to create directory if it doesn't exist
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Clean up build directories
console.log("🧹 Cleaning build directories...");
safeRemoveDir(".next");
safeRemoveDir(".next-build");
safeRemoveDir("out");

// Ensure build directory exists
ensureDir(".next-build");

// Set environment variables
process.env.NODE_OPTIONS = "--max-old-space-size=8192";
process.env.NEXT_TELEMETRY_DISABLED = "1";
process.env.NODE_ENV = "production";

console.log("🚀 Starting webpack build...");

try {
  // Try to build using webpack directly
  console.log("Attempting webpack build...");
  execSync("npx webpack --mode=production", {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_OPTIONS: "--max-old-space-size=8192",
    },
  });

  console.log("✅ Webpack build completed successfully!");
  process.exit(0);
} catch (error) {
  console.error("❌ Webpack build failed:", error.message);

  // Fallback: Try Next.js build with different options
  console.log("🔄 Trying Next.js build with webpack fallback...");

  try {
    execSync("npx next build --no-lint", {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_OPTIONS: "--max-old-space-size=8192",
      },
    });

    console.log("✅ Next.js build completed successfully!");
    process.exit(0);
  } catch (fallbackError) {
    console.error("❌ All build methods failed:", fallbackError.message);
    process.exit(1);
  }
}
