#!/usr/bin/env node

if (process.env.CI === "true") {
  console.log("Skipping husky in CI environment");
  process.exit(0);
} else {
  const { execSync } = require("child_process");
  try {
    execSync("husky install", { stdio: "inherit" });
  } catch (error) {
    console.log("Husky not available, skipping...");
    process.exit(0);
  }
}
