# Troubleshooting Development Server Issues

## Problem: Port 8080 Already in Use

If you see the error: `Error: listen EADDRINUSE: address already in use :::8080`

### Quick Fix Options:

#### Option 1: Use the clean start command (Recommended)
```bash
npm run dev:clean
```

#### Option 2: Use the start script
```bash
npm run dev:start
```

#### Option 3: Manually kill the port
```bash
npm run kill:8080
npm run dev
```

#### Option 4: Use PowerShell script directly
```powershell
powershell -ExecutionPolicy Bypass -File scripts/kill-port-8080.ps1
npm run dev
```

#### Option 5: Use a different port
```bash
npx next dev --port 3000
```

### Manual Process:

1. **Find the process using port 8080:**
   ```powershell
   netstat -ano | findstr :8080
   ```

2. **Kill the process:**
   ```powershell
   taskkill /PID <process_id> /F
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

## Problem: Server Starts But Localhost Doesn't Work

### Check if server is running:
```powershell
netstat -ano | findstr :8080
```

### Test if server is responding:
```powershell
Test-NetConnection -ComputerName localhost -Port 8080
```

### Common Issues:

1. **Browser Cache:**
   - Clear browser cache
   - Try incognito/private mode
   - Hard refresh (Ctrl+Shift+R or Ctrl+F5)

2. **Firewall:**
   - Check Windows Firewall settings
   - Allow Node.js through firewall

3. **Port Blocked:**
   - Try a different port: `npx next dev --port 3000`

4. **Environment Variables:**
   - Check if `.env.local` exists
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

5. **Compilation Errors:**
   - Check the terminal where `npm run dev` is running
   - Look for TypeScript or build errors
   - Fix any errors and restart the server

## Verify Server is Working:

1. **Check the terminal output:**
   - Look for: `✓ Ready in X ms`
   - Look for: `○ Local: http://localhost:8080`

2. **Test in browser:**
   - Open: http://localhost:8080
   - Check browser console (F12) for errors

3. **Test with curl (if available):**
   ```bash
   curl http://localhost:8080
   ```

## Still Having Issues?

1. **Check Node.js version:**
   ```bash
   node --version
   ```
   Should be Node.js 18+ for Next.js 15

2. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

4. **Check for multiple Node processes:**
   ```powershell
   Get-Process node
   ```
   Kill any unnecessary processes

