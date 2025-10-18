// Centralized API Keys Configuration
// This file centralizes all API keys with database-first approach and fallback mechanisms

// Avoid top-level import of ApiKeyService to prevent circular dependency
// It will be dynamically imported within getApiKeyFromDatabase

// Cache for API keys to avoid repeated database calls
const apiKeyCache = new Map<string, string>();
const cacheExpiry = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to get API key from database with caching
async function getApiKeyFromDatabase(keyName: string): Promise<string | null> {
  const now = Date.now();
  const cachedKey = apiKeyCache.get(keyName);
  const cachedExpiry = cacheExpiry.get(keyName);

  // Return cached key if it's still valid
  if (cachedKey && cachedExpiry && now < cachedExpiry) {
    return cachedKey;
  }

  try {
    const { ApiKeyService } = await import("@/lib/services/api-key-service");
    const keyValue = await ApiKeyService.getApiKeyByName(keyName);
    if (keyValue) {
      // Cache the key
      apiKeyCache.set(keyName, keyValue);
      cacheExpiry.set(keyName, now + CACHE_DURATION);
    }
    return keyValue;
  } catch (error) {
    console.error(`Error fetching ${keyName} from database:`, error);
    return null;
  }
}

// Google Maps API Key - Database first, then environment, then fallback
export const getGoogleMapsApiKey = async (): Promise<string> => {
  // Do NOT fetch from DB for google_maps; use env or fallback only
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
    "AIzaSyB6wCOi9B8kcTLiwrE7KjV93882exWNKAY"
  );
};

export const API_KEYS = {
  // Google Maps API Key function
  GOOGLE_MAPS: getGoogleMapsApiKey,

  // Supabase Configuration (these should remain as environment variables for security)
  SUPABASE: {
    URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://kgmjttamzppmypwzargk.supabase.co",
    ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnbWp0dGFtenBwbXlwd3phcmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MjY2MjYsImV4cCI6MjA1NTQwMjYyNn0.HMfRqxeKQSjRY2ydzyxuJoTqr06nTVjOmGp0TpXtYpk",
  },
};

// Validation function to check if all required keys are present
export const validateAPIKeys = async () => {
  const missingKeys: string[] = [];

  const googleMapsKey = await getGoogleMapsApiKey();
  if (!googleMapsKey || googleMapsKey === "") {
    missingKeys.push(
      "Google Maps API Key (database or NEXT_PUBLIC_GOOGLE_MAPS_KEY)"
    );
  }

  if (!API_KEYS.SUPABASE.URL || API_KEYS.SUPABASE.URL === "") {
    missingKeys.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!API_KEYS.SUPABASE.ANON_KEY || API_KEYS.SUPABASE.ANON_KEY === "") {
    missingKeys.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (missingKeys.length > 0) {
    console.warn("⚠️ Missing API Keys:", missingKeys.join(", "));
    console.warn("Please check your database or .env.local file");
    return false;
  }

  console.log("✅ All API keys are configured");
  return true;
};

// Export individual keys for easy access
export const SUPABASE_URL = API_KEYS.SUPABASE.URL;
export const SUPABASE_ANON_KEY = API_KEYS.SUPABASE.ANON_KEY;

// Legacy synchronous export for backward compatibility
export const GOOGLE_MAPS_API_KEY = "AIzaSyB6wCOi9B8kcTLiwrE7KjV93882exWNKAY";
