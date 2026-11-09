const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase configuration in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Clearly identified test records
const TEST_PROPERTIES = [
  {
    title: "[TEST] 4 Marla Modern House in Sialkot",
    description: "Newly built 4 marla residential house in Sialkot with modern fixtures and spacious living areas.",
    property_type: "villas", // mapped category for houses & villas
    listing_type: "sale",
    price: 4500000, // 45 Lakh (< 50 Lakh)
    area_value: 4,
    area_unit: "Marla",
    bedroom: 3,
    bathroom: 3,
    location: "Sialkot, Cantt",
    address: "Street 4, Cantt, Sialkot",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80"],
  },
  {
    title: "[TEST] 4 Marla Rental House in Sialkot",
    description: "Well-maintained 4 marla house available for family rent in Sialkot with dedicated parking.",
    property_type: "villas",
    listing_type: "rent",
    price: 35000, // PKR 35,000 / month
    area_value: 4,
    area_unit: "Marla",
    bedroom: 3,
    bathroom: 2,
    location: "Sialkot, Model Town",
    address: "Model Town, Sialkot",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80"],
  },
  {
    title: "[TEST] 5 Marla Residential Plot in Lahore",
    description: "Prime residential plot ready for construction in Lahore DHA Phase 6.",
    property_type: "plots",
    listing_type: "sale",
    price: 6500000,
    area_value: 5,
    area_unit: "Marla",
    bedroom: 0,
    bathroom: 0,
    location: "Lahore, DHA Phase 6",
    address: "Sector B, DHA Phase 6, Lahore",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"],
  }
];

async function seed() {
  console.log("=== Seeding Clearly Identified Test Records into Supabase ===");
  const { data, error } = await supabase.from("properties").insert(TEST_PROPERTIES).select("id, title, location, price");
  if (error) {
    console.error("Seeding error:", error.message);
  } else {
    console.log(`Successfully seeded ${data.length} test records:`);
    data.forEach(p => console.log(` - [${p.id}] ${p.title} (${p.location}) - PKR ${p.price.toLocaleString()}`));
  }
}

async function cleanup() {
  console.log("=== Cleaning Up Test Records from Supabase ===");
  const { data, error } = await supabase.from("properties").delete().ilike("title", "%[TEST]%").select("id, title");
  if (error) {
    console.error("Cleanup error:", error.message);
  } else {
    console.log(`Successfully removed ${data.length} test records.`);
  }
}

const action = process.argv[2];
if (action === "--cleanup") {
  cleanup();
} else if (action === "--seed") {
  seed();
} else {
  console.log("Usage: node seed_test_properties.js [--seed | --cleanup]");
}
