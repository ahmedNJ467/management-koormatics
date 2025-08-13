// Debug script for security escort functionality
// Run this in the browser console on the dispatch page

async function createTestSecurityEscortTrip() {
  console.log("Creating test security escort trip...");

  // First, check if supabase is available
  if (typeof supabase === "undefined") {
    console.error(
      "Supabase client not found. Make sure you're on the app page."
    );
    return;
  }

  try {
    // Create test client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .upsert({
        id: "test-security-client-001",
        name: "VIP Security Client",
        type: "organization",
        email: "vip@security.test",
        phone: "+1234567890",
        address: "Security Street 123",
        contact: "Security Manager",
      })
      .select()
      .single();

    if (clientError) {
      console.error("Error creating client:", clientError);
      return;
    }

    console.log("Created client:", client);

    // Create test vehicles
    const vehicleData = [
      {
        id: "test-main-vehicle-001",
        make: "Mercedes",
        model: "S-Class",
        year: 2023,
        registration: "MAIN-001",
        color: "Black",
        type: "armoured",
        status: "active",
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
        status: "active",
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
        status: "active",
        fuel_type: "petrol",
      },
    ];

    const { data: vehicles, error: vehicleError } = await supabase
      .from("vehicles")
      .upsert(vehicleData)
      .select();

    if (vehicleError) {
      console.error("Error creating vehicles:", vehicleError);
      return;
    }

    console.log("Created vehicles:", vehicles);

    // Create test driver
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .upsert({
        id: "test-security-driver-001",
        name: "Security Driver",
        license_number: "SEC123456",
        phone: "+1234567891",
        status: "active",
        contact: "driver@security.test",
      })
      .select()
      .single();

    if (driverError) {
      console.error("Error creating driver:", driverError);
      return;
    }

    console.log("Created driver:", driver);

    // Create test trip with security escort
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({
        id: "test-security-trip-001",
        client_id: client.id,
        vehicle_id: vehicles[0].id,
        driver_id: driver.id,
        date: tomorrowStr,
        time: "10:00:00",
        service_type: "airport_pickup",
        status: "scheduled",
        amount: 500.0,
        pickup_location: "International Airport VIP Terminal",
        dropoff_location: "Government Building",
        notes: "High-security VIP transport requiring escort vehicles",
        has_security_escort: true,
        escort_count: 2,
        escort_status: "not_assigned",
        vehicle_type: "armoured",
      })
      .select()
      .single();

    if (tripError) {
      console.error("Error creating trip:", tripError);
      return;
    }

    console.log("Created security escort trip:", trip);

    // Verify the trip was created with security escort fields
    const { data: verifyTrip, error: verifyError } = await supabase
      .from("trips")
      .select(
        `
        *,
        clients:client_id(name, email, type),
        vehicles:vehicle_id(make, model, registration),
        drivers:driver_id(name, contact, avatar_url)
      `
      )
      .eq("id", trip.id)
      .single();

    if (verifyError) {
      console.error("Error verifying trip:", verifyError);
      return;
    }

    console.log("Verified trip with full data:", verifyTrip);
    console.log("Security escort details:", {
      has_security_escort: verifyTrip.has_security_escort,
      escort_count: verifyTrip.escort_count,
      escort_status: verifyTrip.escort_status,
      escort_vehicle_ids: verifyTrip.escort_vehicle_ids,
    });

    return verifyTrip;
  } catch (error) {
    console.error("Error in createTestSecurityEscortTrip:", error);
  }
}

async function checkSecurityEscortTrips() {
  console.log("Checking existing security escort trips...");

  const { data: trips, error } = await supabase
    .from("trips")
    .select(
      `
      *,
      clients:client_id(name, email, type),
      vehicles:vehicle_id(make, model, registration),
      drivers:driver_id(name, contact, avatar_url)
    `
    )
    .eq("has_security_escort", true);

  if (error) {
    console.error("Error fetching security escort trips:", error);
    return;
  }

  console.log("Found security escort trips:", trips);

  trips.forEach((trip) => {
    console.log(`Trip ${trip.id}:`, {
      has_security_escort: trip.has_security_escort,
      escort_count: trip.escort_count,
      escort_status: trip.escort_status,
      escort_vehicle_ids: trip.escort_vehicle_ids,
      client: trip.clients?.name,
      vehicle: trip.vehicles
        ? `${trip.vehicles.make} ${trip.vehicles.model}`
        : "No vehicle",
      driver: trip.drivers?.name || "No driver",
    });
  });

  return trips;
}

// Export functions to window for console access
window.createTestSecurityEscortTrip = createTestSecurityEscortTrip;
window.checkSecurityEscortTrips = checkSecurityEscortTrips;

console.log("Debug functions loaded. Use:");
console.log("- createTestSecurityEscortTrip() to create test data");
console.log("- checkSecurityEscortTrips() to check existing data");
