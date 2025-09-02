# API Keys Management Guide

## 🚨 **Why API Keys Keep Going Missing**

The issue with API keys disappearing is common and happens for several reasons:

1. **Environment File Not Created**: `.env.local` file doesn't exist
2. **File Location Wrong**: File is in the wrong directory
3. **File Naming Issues**: Missing the dot prefix (`.env.local` not `env.local`)
4. **Server Not Restarted**: Environment variables only load on server startup
5. **File Permissions**: File can't be read by the application
6. **Git Ignore**: File might be accidentally committed and then removed

## 🛠️ **Solution: Centralized API Keys Management**

I've implemented a centralized solution that:

### **1. Centralized Configuration File**
- **Location**: `src/config/api-keys.ts`
- **Purpose**: Single source of truth for all API keys
- **Benefits**: Easy to maintain, validate, and debug

### **2. Fallback Mechanisms**
- **Hardcoded Fallbacks**: Keys are embedded as fallbacks
- **Environment Priority**: `.env.local` values override fallbacks
- **Validation**: Automatic checking for missing keys

### **3. Easy Import System**
```typescript
import { GOOGLE_MAPS_API_KEY, SUPABASE_URL } from '@/config/api-keys';
```

## 📁 **File Structure**

```
project-root/
├── .env.local                    # Your local environment variables
├── src/
│   └── config/
│       └── api-keys.ts          # Centralized API keys configuration
└── API_KEYS_MANAGEMENT.md       # This guide
```

## 🔧 **How to Use**

### **Option 1: Environment Variables (Recommended)**
1. Create `.env.local` in project root
2. Add your keys:
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```
3. Restart your development server

### **Option 2: Use Fallback Keys**
- If no `.env.local` file exists, the system uses hardcoded fallbacks
- This ensures the app works even without environment setup
- **Note**: Fallback keys are visible in code (not secure for production)

## 🚀 **Current Status**

✅ **Google Maps API Key**: Configured with fallback  
✅ **Supabase URL**: Configured with fallback  
✅ **Supabase Anon Key**: Configured with fallback  

## 🔍 **Troubleshooting**

### **Check if Keys are Loaded**
Open browser console and look for:
- ✅ `All API keys are configured` = Success
- ⚠️ `Missing API Keys: [list]` = Some keys missing

### **Common Issues & Solutions**

| Issue | Solution |
|-------|----------|
| "Google Maps API error: InvalidKeyMapError" | Check `.env.local` file exists and has `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| "Supabase client is not configured" | Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Keys work in dev but not production | Production needs environment variables set on hosting platform |

### **Debug Steps**
1. **Check file location**: `.env.local` must be in project root
2. **Verify file content**: No quotes, no extra spaces
3. **Restart server**: `npm run dev` after changes
4. **Check console**: Look for validation messages

## 🔒 **Security Best Practices**

### **Development**
- ✅ Use `.env.local` (already in `.gitignore`)
- ✅ Restart server after changes
- ✅ Test with fallback keys first

### **Production**
- ❌ Never commit API keys to Git
- ✅ Use hosting platform environment variables
- ✅ Rotate keys regularly
- ✅ Use least-privilege access

## 📝 **Adding New API Keys**

1. **Add to `.env.local`:**
   ```bash
   NEXT_PUBLIC_NEW_API_KEY=your_key_here
   ```

2. **Add to `src/config/api-keys.ts`:**
   ```typescript
   export const API_KEYS = {
     // ... existing keys
     NEW_API: process.env.NEXT_PUBLIC_NEW_API_KEY || 'fallback_key'
   };
   ```

3. **Update validation function:**
   ```typescript
   if (!API_KEYS.NEW_API || API_KEYS.NEW_API === '') {
     missingKeys.push('NEXT_PUBLIC_NEW_API_KEY');
   }
   ```

4. **Export for use:**
   ```typescript
   export const NEW_API_KEY = API_KEYS.NEW_API;
   ```

## 🎯 **Benefits of This System**

- **🔧 Easy Setup**: Just create `.env.local` file
- **🔄 Automatic Fallbacks**: App works even without environment setup
- **🔍 Clear Debugging**: Console shows exactly what's missing
- **📦 Centralized**: All keys in one place
- **🛡️ Secure**: No keys accidentally committed to Git
- **🚀 Reliable**: Consistent behavior across environments

## 🚀 **Next Steps**

1. **Restart your development server** to load the new configuration
2. **Check browser console** for API key validation messages
3. **Test the interest points feature** on the Dispatch page
4. **Run the database migration** in Supabase dashboard

Your API keys should now be properly managed and the Google Maps error should be resolved!
