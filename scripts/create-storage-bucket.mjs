import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || "https://rovbqnncmzltdyeeldxz.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!serviceKey) {
  console.error("Set SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

try {
  const { error } = await supabase.storage.createBucket("content-outputs", {
    public: true,
  });
  if (error) {
    if (error.message?.includes("already exists")) {
      console.log("Bucket content-outputs already exists");
    } else {
      throw error;
    }
  } else {
    console.log("Bucket content-outputs created successfully");
  }
} catch (err) {
  console.error("Failed:", err.message);
  process.exit(1);
}
