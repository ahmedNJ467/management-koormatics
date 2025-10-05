// Script to create admin user
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://kgmjttamzppmypwzargk.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnbWp0dGFtenBwbXlwd3phcmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxNzQ4MDAsImV4cCI6MjA0OTc1MDgwMH0.YourAnonKey";

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  try {
    const { data, error } = await supabase.functions.invoke(
      "create-admin-user",
      {
        body: {
          email: "admin@koormatics.com",
          password: "Admin123!",
          full_name: "Super Administrator",
        },
      }
    );

    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Admin user created successfully:", data);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

createAdminUser();
