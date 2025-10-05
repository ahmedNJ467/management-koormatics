import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

serve(async (req) => {
  // Handle CORS preflight
  const origin = req.headers.get("origin");
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
    "https://kgmjttamzppmypwzargk.supabase.co",
  ];

  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : "*";

  const corsHeaders = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, Content-Type, Authorization, X-Client-Info, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  } as const;

  if (req.method === "OPTIONS") {
    return new Response("", {
      headers: corsHeaders,
      status: 204,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Initialize admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Service configuration is missing. Contact the administrator.");
    }
    
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { user_id, name = "Default API Key" } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate a secure API key
    const apiKey = `sk_${crypto.getRandomValues(new Uint8Array(32))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;

    // Set expiration date to 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Insert the API key into the database
    const { data, error } = await supabaseAdmin
      .from("user_api_keys")
      .insert({
        user_id,
        api_key: apiKey,
        name,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the activity
    await supabaseAdmin
      .from("user_activity_log")
      .insert({
        user_id,
        activity_type: "api_key_generated",
        description: `Generated new API key: ${name}`,
        metadata: { api_key_id: data.id },
      });

    return new Response(
      JSON.stringify({ 
        api_key: apiKey,
        id: data.id,
        name: data.name,
        expires_at: data.expires_at
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      }
    );
  } catch (err) {
    console.error("generate-api-key error", err);
    return new Response(
      JSON.stringify({ error: (err as any).message || String(err) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
