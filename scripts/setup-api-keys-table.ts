#!/usr/bin/env tsx

/**
 * Script to set up the api_keys table and insert Google Maps API key
 * Run with: npx tsx scripts/setup-api-keys-table.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kgmjttamzppmypwzargk.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnbWp0dGFtenBwbXlwd3phcmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MjY2MjYsImV4cCI6MjA1NTQwMjYyNn0.HMfRqxeKQSjRY2ydzyxuJoTqr06nTVjOmGp0TpXtYpk";

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupApiKeysTable() {
  try {
    console.log(
      "🔄 Setting up api_keys table and inserting Google Maps API key..."
    );

    // Step 1: Create the table if it doesn't exist
    console.log("📋 Step 1: Creating api_keys table...");
    const { error: createError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.api_keys (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          key_value TEXT UNIQUE NOT NULL,
          permissions JSONB DEFAULT '[]'::jsonb,
          is_active BOOLEAN DEFAULT true,
          expires_at TIMESTAMPTZ,
          created_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
      `,
    });

    if (createError) {
      console.log(
        "⚠️ Table creation error (may already exist):",
        createError.message
      );
    } else {
      console.log("✅ Table created successfully");
    }

    // Step 2: Add unique constraint on name field
    console.log("📋 Step 2: Adding unique constraint on name field...");
    const { error: constraintError } = await supabase.rpc("exec_sql", {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'api_keys_name_unique'
            ) THEN
                ALTER TABLE public.api_keys 
                ADD CONSTRAINT api_keys_name_unique 
                UNIQUE (name);
            END IF;
        END $$;
      `,
    });

    if (constraintError) {
      console.log(
        "⚠️ Constraint creation error (may already exist):",
        constraintError.message
      );
    } else {
      console.log("✅ Unique constraint added successfully");
    }

    // Step 3: Enable RLS
    console.log("📋 Step 3: Enabling Row Level Security...");
    const { error: rlsError } = await supabase.rpc("exec_sql", {
      sql: `ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;`,
    });

    if (rlsError) {
      console.log("⚠️ RLS error (may already be enabled):", rlsError.message);
    } else {
      console.log("✅ RLS enabled successfully");
    }

    // Step 4: Create RLS policies
    console.log("📋 Step 4: Creating RLS policies...");
    const { error: policyError } = await supabase.rpc("exec_sql", {
      sql: `
        DO $$
        BEGIN
            -- Drop existing policies if they exist
            DROP POLICY IF EXISTS "Users can view api keys" ON public.api_keys;
            DROP POLICY IF EXISTS "Users can create api keys" ON public.api_keys;
            DROP POLICY IF EXISTS "Users can update api keys" ON public.api_keys;
            DROP POLICY IF EXISTS "Users can delete api keys" ON public.api_keys;
            
            -- Create new policies
            CREATE POLICY "Users can view api keys" ON public.api_keys
                FOR SELECT USING (true);
            
            CREATE POLICY "Users can create api keys" ON public.api_keys
                FOR INSERT WITH CHECK (true);
            
            CREATE POLICY "Users can update api keys" ON public.api_keys
                FOR UPDATE USING (true);
            
            CREATE POLICY "Users can delete api keys" ON public.api_keys
                FOR DELETE USING (true);
        END $$;
      `,
    });

    if (policyError) {
      console.log(
        "⚠️ Policy creation error (may already exist):",
        policyError.message
      );
    } else {
      console.log("✅ RLS policies created successfully");
    }

    // Step 5: Insert Google Maps API key
    console.log("📋 Step 5: Inserting Google Maps API key...");

    // First, delete any existing entry
    await supabase.from("api_keys").delete().eq("name", "google_maps");

    // Then insert the new entry
    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        name: "google_maps",
        key_value: "AIzaSyB6wCOi9B8kcTLiwrE7KjV93882exWNKAY",
        permissions: ["maps", "geocoding", "places", "routing"],
        is_active: true,
        expires_at: null,
      })
      .select();

    if (error) {
      console.error("❌ Error inserting API key:", error);
      return;
    }

    console.log("✅ Google Maps API key successfully inserted!");
    console.log("📋 Details:", {
      name: data[0]?.name,
      is_active: data[0]?.is_active,
      permissions: data[0]?.permissions,
      created_at: data[0]?.created_at,
    });

    // Step 6: Test retrieval
    console.log("📋 Step 6: Testing API key retrieval...");
    const { data: retrievedKey, error: retrieveError } = await supabase
      .from("api_keys")
      .select("name, key_value, is_active")
      .eq("name", "google_maps")
      .single();

    if (retrieveError) {
      console.error("❌ Error retrieving API key:", retrieveError);
      return;
    }

    console.log("✅ API key retrieval test successful:", {
      name: retrievedKey.name,
      key_preview: retrievedKey.key_value.substring(0, 20) + "...",
      is_active: retrievedKey.is_active,
    });

    console.log(
      "\n🎉 Setup complete! Your Google Maps API key is now stored in the database."
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the script
setupApiKeysTable();
