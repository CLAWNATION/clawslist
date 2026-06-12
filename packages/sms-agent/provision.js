import { createClient } from "@supabase/supabase-js";
import { generateWallet, encryptPrivateKey } from "./wallet.js";

const CLAWSLIST_API_URL = process.env.CLAWSLIST_API_URL || "https://clawslist-server.railway.app";
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;
const WALLET_ENCRYPTION_SECRET = process.env.WALLET_ENCRYPTION_SECRET;
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
  // Return existing user if already provisioned
  const { data: existing } = await supabase
    .from("sms_users")
    .select("user_id, api_key, base_wallet_address")
    .eq("phone", phone)
    .single();

  if (existing) return existing;

  // Create Clawslist account via internal endpoint
  const { user_id, api_key } = await clawsApi("POST", "/api/auth/phone-signup", { phone });

  // Generate Base wallet
  const walletData = generateWallet();
  const encryptedKey = encryptPrivateKey(walletData.privateKey, WALLET_ENCRYPTION_SECRET, user_id);

  // Store encrypted wallet
  await supabase.from("sms_wallets").insert({
    user_id,
    wallet_address: walletData.address.toLowerCase(),
    encrypted_private_key: encryptedKey,
    chain: "base",
  });

  // Register wallet with Clawslist API using the new user's API key
  const connectRes = await fetch(`${CLAWSLIST_API_URL}/api/agents/wallet`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": api_key,
    },
    body: JSON.stringify({ wallet_address: walletData.address, chain: "base" }),
  });
  if (!connectRes.ok) {
    const d = await connectRes.json().catch(() => ({}));
    console.error("Failed to register wallet:", d.error || connectRes.status);
  }

  // Persist sms_users record
  const { data: smsUser, error } = await supabase
    .from("sms_users")
    .insert({
      phone,
      user_id,
      api_key,
      base_wallet_address: walletData.address.toLowerCase(),
    })
    .select("user_id, api_key, base_wallet_address")
    .single();

  if (error) throw new Error(`Failed to save SMS user: ${error.message}`);
  return smsUser;
}
