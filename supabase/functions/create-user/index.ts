import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, Content-Type, Authorization, X-Client-Info, X-Requested-With",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body received:", requestBody);
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, password, role_slug, full_name } = requestBody;

    // Validate required fields
    if (!email || !password || !role_slug) {
      console.log("Missing required fields:", {
        email: !!email,
        password: !!password,
        role_slug: !!role_slug,
        emailValue: email,
        passwordLength: password ? password.length : 0,
        roleSlugValue: role_slug,
      });
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: {
            email: !!email,
            password: !!password,
            role_slug: !!role_slug,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create user in auth
    console.log("Attempting to create auth user...");
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || email,
          role_slug: role_slug,
        },
      });

    if (authError) {
      console.error("Auth user creation failed:", authError);
      return new Response(
        JSON.stringify({ error: `Auth error: ${authError.message}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!authData.user) {
      console.error("No user data returned from auth creation");
      return new Response(JSON.stringify({ error: "Failed to create user" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Auth user created successfully:", authData.user.id);

    // Assign role (handle existing roles gracefully)
    console.log("Attempting to assign role:", role_slug);
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role_slug: role_slug,
      })
      .select()
      .single();

    if (roleError) {
      // Check if it's a duplicate key error (user already has this role)
      if (roleError.code === "23505") {
        console.log("User already has this role, continuing...");
      } else {
        console.error("Role assignment failed:", roleError);
        return new Response(
          JSON.stringify({ error: `Role error: ${roleError.message}` }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    } else {
      console.log("Role assigned successfully");
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        email: email,
        role_slug: role_slug,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Server error: ${error.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
