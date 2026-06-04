import { createClient } from "@supabase/supabase-js";

// We need the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// They might be in .env.local or hardcoded in client.ts
// Let's just read them from the environment or we can hardcode if needed
// Actually, let's just parse them from the Vite environment or process.env

// Let's read the .env files directly if needed.
import fs from "fs";
let envFile = "";
try {
  envFile = fs.readFileSync(".env.local", "utf-8");
} catch (e) {
  try {
    envFile = fs.readFileSync(".env", "utf-8");
  } catch (e) {}
}

const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const SUPABASE_URL = urlMatch ? urlMatch[1].trim() : process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = keyMatch ? keyMatch[1].trim() : process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase credentials!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log("Testing Login with deus*010...");
  let res = await supabase.auth.signInWithPassword({
    email: "marcosyuriaraujosouza@gmail.com",
    password: "deus*010",
  });
  console.log("Login res:", res.data, res.error);

  if (res.error) {
    console.log("Attempting SignUp with strong password...");
    let signupRes = await supabase.auth.signUp({
      email: "marcosyuriaraujosouza@gmail.com",
      password: "Logistica@2026Yuri!",
      options: { data: { full_name: "Marcos" } },
    });
    console.log("Signup res:", signupRes.data, signupRes.error);

    console.log("Attempting Login with strong password...");
    let res2 = await supabase.auth.signInWithPassword({
      email: "marcosyuriaraujosouza@gmail.com",
      password: "Logistica@2026Yuri!",
    });
    console.log("Login2 res:", res2.data, res2.error);
  }
}

run();
