# Windows Build Fix Guide

## Problem

The build process fails with `uncaughtException [Error: kill EPERM]` on Windows systems, particularly when using OneDrive.

## Root Causes

1. **OneDrive File Locking**: OneDrive sync can lock files during build
2. **Windows File System**: Windows handles file operations differently than Unix systems
3. **Node.js Process Management**: Windows process termination can cause EPERM errors
4. **Memory Constraints**: Large builds can exhaust memory on Windows

## Solutions Implemented

### 1. Custom Build Directory

- Changed build directory from `.next` to `.next-build`
- Added to `.gitignore` to prevent OneDrive sync issues

### 2. Multiple Build Scripts

- `npm run build:windows` - Node.js script with error handling
- `npm run build:ps` - PowerShell script with Windows optimizations
- `npm run build:bat` - Batch file with process cleanup
- `npm run build:safe` - Simple clean + build
- `npm run build:clean` - Full clean + build

### 3. Environment Optimizations

- Increased Node.js memory limit to 4GB
- Disabled Next.js telemetry
- Disabled React strict mode to reduce memory usage

### 4. Process Management

- Kill existing Node.js processes before build
- Proper error handling and cleanup
- Timeout handling for stuck processes

## Usage Instructions

### Option 1: Ultimate Windows Build (Most Comprehensive)

```bash
npm run build:ultimate
```

### Option 2: WSL Build (Recommended if WSL is available)

```bash
npm run build:wsl
```

### Option 3: Docker Build (If Docker is available)

```bash
npm run build:docker
```

### Option 4: Webpack Build (Alternative approach)

```bash
npm run build:webpack
```

### Option 5: Standard Windows Build

```bash
npm run build:bat
```

### Option 6: PowerShell Build

```bash
npm run build:ps
```

### Option 7: Node.js Build

```bash
npm run build:windows
```

### Option 8: Manual cleanup + build

```bash
npm run build:clean
```

## Additional Windows-Specific Fixes

### If OneDrive is causing issues:

1. Pause OneDrive sync temporarily
2. Move project outside OneDrive folder
3. Add build directories to OneDrive exclusion list

### If antivirus is interfering:

1. Add project folder to antivirus exclusions
2. Temporarily disable real-time scanning

### If memory issues persist:

1. Close other applications
2. Increase virtual memory
3. Use `npm run build:windows` (includes memory optimization)

## Troubleshooting

### Still getting EPERM errors?

1. Run as Administrator
2. Check if any IDE/editor has files open
3. Restart Windows
4. Check Windows Event Viewer for system errors

### Build succeeds but deployment fails?

1. Check file permissions
2. Verify all files are properly built
3. Test locally with `npm start`

## Success Indicators

- Build completes without EPERM errors
- `.next-build` directory is created
- No TypeScript compilation errors
- All pages are successfully generated
