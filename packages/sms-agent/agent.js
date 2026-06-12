import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CLAWSLIST_API_URL = process.env.CLAWSLIST_API_URL || "https://clawslist-server.railway.app";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function clawsApi(method, path, body, apiKey) {
  const res = await fetch(`${CLAWSLIST_API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
  return data;
}

async function downloadMmsImage(mediaUrl) {
  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const res = await fetch(mediaUrl, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!res.ok) throw new Error(`Failed to download MMS: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") || "image/jpeg";
  return { base64: Buffer.from(buffer).toString("base64"), contentType };
}

function buildTools(apiKey) {
  const wrap = (fn) => async (input) => {
    try {
      return JSON.stringify(await fn(input));
    } catch (e) {
      return JSON.stringify({ error: e.message });
    }
  };

  return {
    search_listings: wrap(({ query, category, min_price, max_price, limit }) =>
      clawsApi("GET", `/api/posts?${new URLSearchParams({
        ...(query && { q: query }),
        ...(category && { category }),
        ...(min_price && { min_price }),
        ...(max_price && { max_price }),
        limit: limit || 10,
      })}`, null, apiKey)
    ),
    get_listing: wrap(({ id }) => clawsApi("GET", `/api/posts/${id}`, null, apiKey)),
    upload_image: wrap(async ({ image_url }) => {
      return clawsApi("POST", "/api/upload/image-from-url", { image_url }, apiKey);
    }),
    create_listing: wrap((body) => clawsApi("POST", "/api/posts", body, apiKey)),
    make_offer: wrap(({ listing_id, amount, currency, message }) =>
      clawsApi("POST", `/api/posts/${listing_id}/offers`, { amount, currency, message }, apiKey)
    ),
    get_offers: wrap(({ listing_id }) =>
      clawsApi("GET", `/api/posts/${listing_id}/offers`, null, apiKey)
    ),
    get_my_listings: wrap(() => clawsApi("GET", "/api/posts/mine", null, apiKey)),
    get_inquiries: wrap(() => clawsApi("GET", "/api/inquiries", null, apiKey)),
    create_escrow: wrap(({ listing_id, offer_id, amount_usdc }) =>
      clawsApi("POST", "/api/escrows", { listing_id, offer_id, amount_usdc }, apiKey)
    ),
    confirm_receipt: wrap(({ escrow_id }) =>
      clawsApi("POST", `/api/escrows/${escrow_id}/confirm`, {}, apiKey)
    ),
  };
}

const TOOL_SCHEMAS = [
  {
    name: "search_listings",
    description: "Search marketplace listings by keyword, category, or price range",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string" },
        category: { type: "string" },
        min_price: { type: "number" },
        max_price: { type: "number" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "get_listing",
    description: "Get full details of a specific listing by ID",
    input_schema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "upload_image",
    description: "Upload an image from a URL to Clawslist storage. Returns the stored image URL.",
    input_schema: {
      type: "object",
      properties: { image_url: { type: "string" } },
      required: ["image_url"],
    },
  },
  {
    name: "create_listing",
    description: "Create a new marketplace listing on behalf of the user",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        category: { type: "string", description: "e.g. 'for sale', 'housing', 'jobs', 'services'" },
        section: { type: "string" },
        price: { type: "string", description: "e.g. '150' or '150 USDC'" },
        price_currency: { type: "string", default: "USDC" },
        body: { type: "string", description: "Full listing description (min 20 chars)" },
        location: { type: "string" },
        image_urls: { type: "array", items: { type: "string" } },
      },
      required: ["title", "category", "body"],
    },
  },
  {
    name: "make_offer",
    description: "Make a purchase offer on a listing",
    input_schema: {
      type: "object",
      properties: {
        listing_id: { type: "string" },
        amount: { type: "number" },
        currency: { type: "string", default: "USDC" },
        message: { type: "string" },
      },
      required: ["listing_id", "amount"],
    },
  },
  {
    name: "get_offers",
    description: "Get all offers on a specific listing",
    input_schema: {
      type: "object",
      properties: { listing_id: { type: "string" } },
      required: ["listing_id"],
    },
  },
  {
    name: "get_my_listings",
    description: "Get all listings created by the current user",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_inquiries",
    description: "Get all incoming inquiries and messages",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "create_escrow",
    description: "Create an escrow contract for a transaction",
    input_schema: {
      type: "object",
      properties: {
        listing_id: { type: "string" },
        offer_id: { type: "string" },
        amount_usdc: { type: "number" },
      },
      required: ["listing_id", "amount_usdc"],
    },
  },
  {
    name: "confirm_receipt",
    description: "Confirm receipt of goods to release escrow payment to seller",
    input_schema: {
      type: "object",
      properties: { escrow_id: { type: "string" } },
      required: ["escrow_id"],
    },
  },
];

async function loadHistory(userId) {
  const { data } = await supabase
    .from("sms_conversations")
    .select("role, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(40);
  return data || [];
}

async function saveMessage(userId, role, content) {
  await supabase.from("sms_conversations").insert({ user_id: userId, role, content });
}

async function pruneHistory(userId) {
  // Keep only the last 40 messages to avoid runaway history
  const { data } = await supabase
    .from("sms_conversations")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(40, 9999);
  if (data?.length) {
    await supabase
      .from("sms_conversations")
      .delete()
      .in("id", data.map((r) => r.id));
  }
}

export async function runAgent({ userId, apiKey, walletAddress, messageText, mediaUrls = [] }) {
  const tools = buildTools(apiKey);
  const history = await loadHistory(userId);

  // Build user content blocks — text + any MMS images
  const userContent = [];

  // Download and attach MMS images
  for (const url of mediaUrls) {
    try {
      const { base64, contentType } = await downloadMmsImage(url);
      userContent.push({
        type: "image",
        source: { type: "base64", media_type: contentType, data: base64 },
      });
    } catch (e) {
      console.error("Failed to download MMS image:", e.message);
    }
  }

  if (messageText?.trim()) {
    userContent.push({ type: "text", text: messageText });
  }

  const newUserMessage = { role: "user", content: userContent };
  await saveMessage(userId, "user", userContent);

  const messages = [...history, newUserMessage];

  const systemPrompt = `You are a helpful marketplace agent for Clawslist, an online classifieds platform.
You are acting on behalf of a user who communicates only via SMS text messages.

The user's Base wallet address is: ${walletAddress}

Your job:
- If the user sends a photo with a price: create a marketplace listing for them automatically. Extract title, category, and description from the image and their message. Upload the image first, then create the listing with image_urls.
- If the user describes something they want to buy: search listings and report back with options.
- If the user wants to make a deal: handle offers, escrow, and coordination.
- Keep replies SHORT and conversational — this is SMS, max ~160 chars when possible.
- Always confirm what you did and give the user actionable next steps.
- For new listings, tell the user the listing title and reference code.
- USDC is the preferred currency on Base Chain.

Always be proactive: if you see an image + price, just create the listing without asking.`;

  let finalReply = "";
  let currentMessages = messages;

  // Agentic loop
  for (let iteration = 0; iteration < 10; iteration++) {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOL_SCHEMAS,
      messages: currentMessages,
    });

    const assistantMessage = { role: "assistant", content: response.content };
    currentMessages = [...currentMessages, assistantMessage];

    if (response.stop_reason === "end_turn") {
      finalReply = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      break;
    }

    if (response.stop_reason === "tool_use") {
      const toolResults = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        const fn = tools[block.name];
        const result = fn ? await fn(block.input) : JSON.stringify({ error: "unknown_tool" });
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }
      currentMessages = [
        ...currentMessages,
        { role: "user", content: toolResults },
      ];
      continue;
    }

    // Unexpected stop reason
    break;
  }

  // Save the final assistant reply to history
  if (finalReply) {
    await saveMessage(userId, "assistant", [{ type: "text", text: finalReply }]);
  }

  await pruneHistory(userId);

  return finalReply || "Done.";
}
