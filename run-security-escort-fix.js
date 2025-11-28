import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Supabase configuration (read from environment)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runSecurityEscortFix() {
  console.log("🚀 Starting Security Escort Fix...");

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error(
        "❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars."
      );
      process.exit(1);
    }

    // Step 2: Create test client
    console.log("👤 Creating test client...");
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .upsert({
        id: "test-security-client-001",
        name: "VIP Security Transport Ltd",
        type: "organization",
        email: "security@viptransport.com",
        phone: "+1234567890",
        address: "123 Security Street, VIP City",
        contact: "John Security",
      })
      .select()
      .single();

    if (clientError) {
      console.error("❌ Error creating client:", clientError);
      return;
    }
    console.log("✅ Test client created:", client.name);

    // Step 3: Create test vehicles
    console.log("🚗 Creating test vehicles...");
    const vehicleData = [
      {
        id: "test-main-vehicle-001",
        make: "Mercedes",
        model: "S-Class",
        year: 2023,
        registration: "VIP-001",
        color: "Black",
        type: "armoured",
        status: "available",
        fuel_type: "petrol",
      },
      {
        id: "test-escort-vehicle-001",
        make: "BMW",
        model: "X5",
        year: 2023,
        registration: "ESC-001",
        color: "Black",
        type: "armoured",
        status: "available",
        fuel_type: "petrol",
      },
      {
        id: "test-escort-vehicle-002",
        make: "Audi",
        model: "Q7",
        year: 2023,
        registration: "ESC-002",
        color: "Black",
        type: "armoured",
        status: "available",
        fuel_type: "petrol",
      },
    ];

    const { data: vehicles, error: vehicleError } = await supabase
      .from("vehicles")
      .upsert(vehicleData)
      .select();

    if (vehicleError) {
      console.error("❌ Error creating vehicles:", vehicleError);
      return;
    }
    console.log("✅ Test vehicles created:", vehicles.length);

    // Step 4: Create test driver
    console.log("👨‍✈️ Creating test driver...");
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .upsert({
        id: "test-security-driver-001",
        name: "Michael Security",
        license_number: "SEC123456",
        phone: "+1234567891",
        contact: "mike@security.com",
        status: "active",
      })
      .select()
      .single();

    if (driverError) {
      console.error("❌ Error creating driver:", driverError);
      return;
    }
    console.log("✅ Test driver created:", driver.name);

    // Step 5: Create test trips with security escort
    console.log("🛡️ Creating security escort trips...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const tripData = [
      {
        id: "test-security-trip-001",
        client_id: client.id,
        vehicle_id: vehicles[0].id,
        driver_id: driver.id,
        date: tomorrowStr,
        time: "09:00:00",
        service_type: "airport_pickup",
        status: "scheduled",
        amount: 500.0,
        pickup_location: "International Airport Terminal 1",
        dropoff_location: "Downtown Hotel VIP",
        notes: "High-profile client requiring 2 security escorts",
        has_security_escort: true,
        escort_count: 2,
        escort_status: "not_assigned",
        vehicle_type: "armoured",
      },
      {
        id: "test-security-trip-002",
        client_id: client.id,
        vehicle_id: vehicles[0].id,
        driver_id: driver.id,
        date: new Date().toISOString().split("T")[0],
        time: "16:00:00",
        service_type: "one_way_transfer",
        status: "scheduled",
        amount: 300.0,
        pickup_location: "Corporate Headquarters",
        dropoff_location: "Private Residence",
        notes: "Executive transport with 1 escort partially assigned",
        has_security_escort: true,
        escort_count: 2,
        escort_status: "partially_assigned",
        vehicle_type: "armoured",
      },
    ];

    const { data: trips, error: tripError } = await supabase
      .from("trips")
      .upsert(tripData)
      .select();

    if (tripError) {
      console.error("❌ Error creating trips:", tripError);
      return;
    }
    console.log("✅ Security escort trips created:", trips.length);

    // Step 6: Update one trip with partial escort assignment
    console.log("🔄 Setting up partial escort assignment...");
    const { error: updateError } = await supabase
      .from("trips")
      .update({
        escort_vehicle_ids: [vehicles[1].id],
        escort_assigned_at: new Date().toISOString(),
      })
      .eq("id", "test-security-trip-002");

    if (updateError) {
      console.error("❌ Error updating trip escort assignment:", updateError);
    } else {
      console.log("✅ Partial escort assignment set up");
    }

    // Step 7: Verify the setup
    console.log("🔍 Verifying security escort setup...");
    const { data: verifyTrips, error: verifyError } = await supabase
      .from("trips")
      .select(
        `
        id,
        date,
        time,
        pickup_location,
        dropoff_location,
        has_security_escort,
        escort_count,
        escort_status,
        escort_vehicle_ids,
        clients:client_id(name),
        vehicles:vehicle_id(make, model, registration),
        drivers:driver_id(name)
      `
      )
      .eq("has_security_escort", true);

    if (verifyError) {
      console.error("❌ Error verifying setup:", verifyError);
      return;
    }

    console.log("\n🎉 Security Escort Setup Complete!");
    console.log("📊 Summary:");
    console.log(`   • Security escort trips created: ${verifyTrips.length}`);
    verifyTrips.forEach((trip) => {
      console.log(
        `   • Trip ${trip.id.substring(0, 8)}: ${trip.escort_status} (${
          trip.escort_count
        } escorts needed)`
      );
    });

    console.log("\n✨ Next steps:");
    console.log("   1. Open the dispatch page in your browser");
    console.log("   2. Look for trips with red security escort sections");
    console.log('   3. Click "Assign Escorts" to test the functionality');
    console.log("   4. Check browser console for debug logs");
  } catch (error) {
    console.error("💥 Unexpected error:", error);
  }
}

// Run the fix
runSecurityEscortFix();
