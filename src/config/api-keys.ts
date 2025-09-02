// Centralized API Keys Configuration
// This file centralizes all API keys and provides fallback mechanisms

export const API_KEYS = {
  // Google Maps API Key
  GOOGLE_MAPS:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
    "AIzaSyB6wCOi9B8kcTLiwrE7KjV93882exWN",

  // Supabase Configuration
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
export const validateAPIKeys = () => {
  const missingKeys: string[] = [];

  if (!API_KEYS.GOOGLE_MAPS || API_KEYS.GOOGLE_MAPS === "") {
    missingKeys.push("NEXT_PUBLIC_GOOGLE_MAPS_KEY");
  }

  if (!API_KEYS.SUPABASE.URL || API_KEYS.SUPABASE.URL === "") {
    missingKeys.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!API_KEYS.SUPABASE.ANON_KEY || API_KEYS.SUPABASE.ANON_KEY === "") {
    missingKeys.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (missingKeys.length > 0) {
    console.warn("⚠️ Missing API Keys:", missingKeys.join(", "));
    console.warn("Please check your .env.local file");
    return false;
  }

  console.log("✅ All API keys are configured");
  return true;
};

// Export individual keys for easy access
export const GOOGLE_MAPS_API_KEY = API_KEYS.GOOGLE_MAPS;
export const SUPABASE_URL = API_KEYS.SUPABASE.URL;
export const SUPABASE_ANON_KEY = API_KEYS.SUPABASE.ANON_KEY;
