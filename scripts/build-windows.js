#!/usr/bin/env node

/**
 * Windows-specific build script to handle EPERM errors
 * This script implements several strategies to avoid Windows file locking issues
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔧 Starting Windows-optimized build process...");

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

// Set environment variables for Windows
process.env.NODE_OPTIONS = "--max-old-space-size=4096";
process.env.NEXT_TELEMETRY_DISABLED = "1";

console.log("🚀 Starting Next.js build with Windows optimizations...");

// Run the build with error handling
const buildProcess = spawn("npx", ["next", "build"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS: "--max-old-space-size=4096",
    NEXT_TELEMETRY_DISABLED: "1",
  },
});

buildProcess.on("close", (code) => {
  if (code === 0) {
    console.log("✅ Build completed successfully!");
    process.exit(0);
  } else {
    console.error(`❌ Build failed with exit code ${code}`);
    process.exit(code);
  }
});

buildProcess.on("error", (error) => {
  console.error("❌ Build process error:", error);
  process.exit(1);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Build interrupted by user");
  buildProcess.kill("SIGINT");
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Build terminated");
  buildProcess.kill("SIGTERM");
  process.exit(1);
});
