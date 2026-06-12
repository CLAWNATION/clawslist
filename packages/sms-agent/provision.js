import { createClient } from "@supabase/supabase-js";
import { getCdpWalletProvider } from "./wallet.js";

const CLAWSLIST_API_URL = process.env.CLAWSLIST_API_URL || "https://clawslist-server.railway.app";
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function clawsApi(method, path, body) {
  const res = await fetch(`${CLAWSLIST_API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": INTERNAL_API_SECRET,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
  return data;
}

export async function getOrCreateUser(phone) {
  const { data: existing } = await supabase
    .from("sms_users")
    .select("user_id, api_key, base_wallet_address")
    .eq("phone", phone)
    .single();

  if (existing) return existing;

  // Create Clawslist account (no X verification required for SMS users)
  const { user_id, api_key } = await clawsApi("POST", "/api/auth/phone-signup", { phone });

  // CDP provisions and manages wallet keys in TEE — no private key handling here
  const walletProvider = await getCdpWalletProvider(user_id);
  const walletAddress = await walletProvider.getAddress();

  // Register wallet address with Clawslist
  const connectRes = await fetch(`${CLAWSLIST_API_URL}/api/agents/wallet`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": api_key },
    body: JSON.stringify({ wallet_address: walletAddress, chain: "base" }),
  });
  if (!connectRes.ok) {
    const d = await connectRes.json().catch(() => ({}));
    console.error("Wallet registration failed:", d.error || connectRes.status);
  }

  const { data: smsUser, error } = await supabase
    .from("sms_users")
    .insert({ phone, user_id, api_key, base_wallet_address: walletAddress })
    .select("user_id, api_key, base_wallet_address")
    .single();

  if (error) throw new Error(`Failed to save SMS user: ${error.message}`);
  return smsUser;
}
