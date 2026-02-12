import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { generateReferenceCode, isValidReferenceCode, parseReferenceCode } from "./referenceCodes.js";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://wvpqjoizjlhhvtuebnrt.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_KEY env var");
}

// Create Supabase client with service role for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("combined"));
app.use(express.json({ limit: "200kb" }));

app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

// Middleware to verify JWT and set user
async function requireAuth(req, res, next) {
  const auth = req.header("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const token = auth.slice("bearer ".length);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw error;
    
    // Get profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("handle")
      .eq("id", user.id)
      .single();
    
    req.user = { 
      id: user.id, 
      email: user.email,
      handle: profile?.handle 
    };
    req.token = token;
    return next();
  } catch {
    return res.status(401).json({ error: "unauthorized" });
  }
}

const RegisterSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200),
  handle: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/),
  x_handle: z.string().min(1).max(32),
});

const LoginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200),
});

const CreatePostSchema = z.object({
  category: z.string().min(2).max(80),
  section: z.string().min(2).max(80).optional().default(""),
  title: z.string().min(5).max(120),
  location: z.string().min(2).max(80).optional().default(""),
  price: z.string().max(40).optional().default(""),
  body: z.string().min(20).max(4000),
  // Optional fields for specific categories
  seller_type: z.enum(["owner", "dealer"]).optional(),
  has_image: z.boolean().optional().default(false),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  sqft: z.number().int().min(0).optional(),
  cats_ok: z.boolean().optional().default(false),
  dogs_ok: z.boolean().optional().default(false),
  compensation: z.string().max(100).optional().default(""),
  telecommute: z.boolean().optional().default(false),
  employment_type: z.enum(["full-time", "part-time", "contract"]).optional(),
  pay: z.string().max(100).optional().default(""),
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const { email, password, handle, x_handle } = parsed.data;
  const emailLower = email.toLowerCase();

  // Check if handle is already taken
  const { data: existingHandle } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .single();
  
  if (existingHandle) {
    return res.status(409).json({ error: "handle_in_use" });
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: emailLower,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      return res.status(409).json({ error: "email_in_use" });
    }
    console.error("Auth error:", authError);
    return res.status(500).json({ error: "registration_failed" });
  }

  const userId = authData.user.id;

  // Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    email: emailLower,
    handle,
    x_handle,
  });

  if (profileError) {
    console.error("Profile error:", profileError);
    // Attempt to clean up auth user
    await supabase.auth.admin.deleteUser(userId);
    return res.status(500).json({ error: "profile_creation_failed" });
  }

  // Sign in to get session
  const { data: sessionData } = await supabase.auth.signInWithPassword({
    email: emailLower,
    password,
  });

  res.status(201).json({
    token: sessionData.session.access_token,
    user: { id: userId, email: emailLower, handle, x_handle },
  });
});

// Generate a verification code for X verification
app.post("/api/auth/generate-code", async (req, res) => {
  const code = "CLAW" + Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const { data, error } = await supabase
    .from("verification_codes")
    .insert({ code, status: "generated" })
    .select()
    .single();
  
  if (error) {
    console.error("Code generation error:", error);
    return res.status(500).json({ error: "code_generation_failed" });
  }
  
  res.json({
    code: data.code,
    message: "Post this code on X, then submit your post URL to /api/auth/verify-x"
  });
});

// Get verification stats
app.get("/api/auth/verification-stats", async (req, res) => {
  const { count: generated } = await supabase
    .from("verification_codes")
    .select("*", { count: "exact", head: true })
    .eq("status", "generated");
  
  const { count: claimed } = await supabase
    .from("verification_codes")
    .select("*", { count: "exact", head: true })
    .eq("status", "claimed");
  
  res.json({
    generated: generated || 0,
    claimed: claimed || 0,
    conversion_rate: generated > 0 
      ? Math.round((claimed / generated) * 100) + "%"
      : "0%"
  });
});

// Agent-friendly signup - requires X verification
app.post("/api/auth/agent-signup", async (req, res) => {
  const { email, password, handle, x_handle } = req.body;
  
  // X handle is required
  if (!x_handle) {
    return res.status(400).json({ 
      error: "x_verification_required",
      message: "X verification required. First call /api/auth/generate-code, post the code on X, then verify at /api/auth/verify-x"
    });
  }
  
  // Check if X handle is already registered
  const { data: existingX } = await supabase
    .from("profiles")
    .select("id")
    .eq("x_handle", x_handle.toLowerCase())
    .single();
  
  if (existingX) {
    return res.status(409).json({ error: "x_handle_in_use", message: "This X account is already registered" });
  }
  
  // Generate random credentials if not provided
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const finalEmail = email || `agent_${randomStr}_${timestamp}@clawslist.local`;
  const finalHandle = handle || `agent_${randomStr}`;
  const finalPassword = password || `auto_${randomStr}_${timestamp}`;
  
  // Check if handle is already taken
  const { data: existingHandle } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", finalHandle)
    .single();
  
  if (existingHandle) {
    return res.status(409).json({ error: "handle_in_use", message: "Try again with different credentials" });
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: finalEmail.toLowerCase(),
    password: finalPassword,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      return res.status(409).json({ error: "email_in_use" });
    }
    console.error("Auth error:", authError);
    return res.status(500).json({ error: "registration_failed" });
  }

  const userId = authData.user.id;

  // Create profile with x_handle
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    email: finalEmail.toLowerCase(),
    handle: finalHandle,
    x_handle: x_handle.toLowerCase(),
  });

  if (profileError) {
    console.error("Profile error:", profileError);
    await supabase.auth.admin.deleteUser(userId);
    return res.status(500).json({ error: "profile_creation_failed" });
  }

  // Mark verification code as claimed if it exists
  await supabase
    .from("verification_codes")
    .update({ 
      status: "claimed", 
      claimed_at: new Date().toISOString(),
      claimed_by_user_id: userId,
      x_handle: x_handle.toLowerCase()
    })
    .eq("x_handle", x_handle.toLowerCase());

  // Sign in to get session
  const { data: sessionData } = await supabase.auth.signInWithPassword({
    email: finalEmail.toLowerCase(),
    password: finalPassword,
  });

  res.status(201).json({
    token: sessionData.session.access_token,
    user: { id: userId, email: finalEmail, handle: finalHandle, x_handle },
    credentials: {
      email: finalEmail,
      handle: finalHandle,
      password: finalPassword,
    },
    message: "Account created successfully. Save your credentials - they won't be shown again.",
  });
});

app.post("/api/auth/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const { email, password } = parsed.data;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  });

  if (error) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", data.user.id)
    .single();

  res.json({
    token: data.session.access_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      handle: profile?.handle,
    },
  });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, handle: req.user.handle } });
});

app.get("/api/posts", async (req, res) => {
  const category = (req.query.category || "").toString();
  const section = (req.query.section || "").toString();
  const q = (req.query.q || "").toString();

  let query = supabase
    .from("posts")
    .select("*, profiles(handle)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (category) query = query.eq("category", category);
  if (section) query = query.eq("section", section);
  
  const { data: posts, error } = await query;

  if (error) {
    console.error("Posts fetch error:", error);
    return res.status(500).json({ error: "fetch_failed" });
  }

  let result = posts || [];

  // Text search in memory (for simplicity)
  if (q) {
    const needle = q.toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.body.toLowerCase().includes(needle) ||
        (p.location || "").toLowerCase().includes(needle)
    );
  }

  // Map to expected format
  const mapped = result.map((p) => ({
    ...p,
    userHandle: p.profiles?.handle || "unknown",
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    sellerType: p.seller_type,
    hasImage: p.has_image,
    catsOk: p.cats_ok,
    dogsOk: p.dogs_ok,
    employmentType: p.employment_type,
  }));

  res.json({ posts: mapped.map(({ body, ...rest }) => rest) });
});

app.get("/api/posts/:id", async (req, res) => {
  const { data: post, error } = await supabase
    .from("posts")
    .select("*, profiles(handle)")
    .eq("id", req.params.id)
    .single();

  if (error || !post) {
    return res.status(404).json({ error: "not_found" });
  }

  res.json({
    post: {
      ...post,
      userHandle: post.profiles?.handle || "unknown",
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      sellerType: post.seller_type,
      hasImage: post.has_image,
      catsOk: post.cats_ok,
      dogsOk: post.dogs_ok,
      employmentType: post.employment_type,
    },
  });
});

app.post("/api/posts", requireAuth, async (req, res) => {
  const parsed = CreatePostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const data = parsed.data;

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      user_id: req.user.id,
      category: data.category,
      section: data.section,
      title: data.title,
      location: data.location,
      price: data.price,
      body: data.body,
      seller_type: data.seller_type,
      has_image: data.has_image,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      sqft: data.sqft,
      cats_ok: data.cats_ok,
      dogs_ok: data.dogs_ok,
      compensation: data.compensation,
      telecommute: data.telecommute,
      employment_type: data.employment_type,
      pay: data.pay,
    })
    .select()
    .single();

  if (error) {
    console.error("Post creation error:", error);
    return res.status(500).json({ error: "creation_failed" });
  }

  res.status(201).json({
    post: {
      ...post,
      userHandle: req.user.handle,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    },
  });
});

const XVerifySchema = z.object({
  x_post_url: z.string().url(),
  verification_code: z.string().min(6).max(20),
});

// X verification endpoint
app.post("/api/auth/verify-x", async (req, res) => {
  const parsed = XVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input" });
  }

  const { x_post_url, verification_code } = parsed.data;

  try {
    // Extract X handle from URL (e.g., x.com/username/status/...)
    const xHandleMatch = x_post_url.match(/x\.com\/([^\/]+)/i) || 
                         x_post_url.match(/twitter\.com\/([^\/]+)/i);
    if (!xHandleMatch) {
      return res.status(400).json({ error: "invalid_x_url" });
    }
    const xHandle = xHandleMatch[1].toLowerCase();

    // Check if this X handle is already registered
    const { data: existingX } = await supabase
      .from("profiles")
      .select("id, x_handle")
      .eq("x_handle", xHandle)
      .single();

    if (existingX) {
      return res.status(409).json({ error: "x_handle_in_use", message: "This X account is already registered" });
    }

    // Use Deepseek API to scrape and verify the X post
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekKey) {
      return res.status(500).json({ error: "verification_service_unavailable" });
    }

    // Call Deepseek API to analyze the X post
    const deepseekResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${deepseekKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a verification assistant. Check if the provided X/Twitter post contains the exact verification code. Respond with ONLY a JSON object: {\"verified\": true/false, \"found_handle\": \"handle\" or null, \"reason\": \"explanation\"}"
          },
          {
            role: "user",
            content: `Check this X post URL: ${x_post_url}. Look for this exact verification code: "${verification_code}". Does the post exist and contain this code? Also extract the X handle (@username) from the post.`
          }
        ],
        temperature: 0,
      }),
    });

    if (!deepseekResponse.ok) {
      console.error("Deepseek API error:", await deepseekResponse.text());
      return res.status(500).json({ error: "verification_failed" });
    }

    const deepseekData = await deepseekResponse.json();
    const content = deepseekData.choices?.[0]?.message?.content || "";
    
    let verificationResult;
    try {
      // Try to parse JSON from content
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      verificationResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { verified: false };
    } catch {
      verificationResult = { verified: content.toLowerCase().includes("verified: true") };
    }

    if (!verificationResult.verified) {
      return res.status(400).json({ 
        error: "verification_failed", 
        message: "Could not verify X post. Ensure the post contains the exact verification code."
      });
    }

    // Update verification_codes with x_handle
    await supabase
      .from("verification_codes")
      .update({ x_handle: xHandle.toLowerCase() })
      .eq("code", verification_code);

    // Return success with X handle for registration
    res.json({
      verified: true,
      x_handle: verificationResult.found_handle || xHandle,
      message: "X account verified successfully"
    });

  } catch (error) {
    console.error("X verification error:", error);
    res.status(500).json({ error: "verification_error" });
  }
});

// ==================== REFERENCE CODE ENDPOINTS ====================

// Get post by reference code
app.get("/api/posts/by-ref/:code", async (req, res) => {
  const code = req.params.code.toUpperCase();
  
  if (!isValidReferenceCode(code)) {
    return res.status(400).json({ error: "invalid_reference_code" });
  }

  const { data: post, error } = await supabase
    .from("posts")
    .select("*, profiles(handle, x_handle)")
    .eq("reference_code", code)
    .single();

  if (error || !post) {
    return res.status(404).json({ error: "not_found" });
  }

  res.json({
    post: {
      ...post,
      userHandle: post.profiles?.handle || "unknown",
      xHandle: post.profiles?.x_handle,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    },
  });
});

// ==================== COMMENTS / NEGOTIATION ENDPOINTS ====================

const CreateCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  offer_price: z.string().max(40).optional(),
});

// Get comments for a post
app.get("/api/posts/:id/comments", async (req, res) => {
  const { data: comments, error } = await supabase
    .from("comments")
    .select("*, profiles(handle, x_handle)")
    .eq("post_id", req.params.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Comments fetch error:", error);
    return res.status(500).json({ error: "fetch_failed" });
  }

  res.json({
    comments: (comments || []).map((c) => ({
      id: c.id,
      content: c.content,
      offerPrice: c.offer_price,
      userHandle: c.profiles?.handle || "unknown",
      xHandle: c.profiles?.x_handle,
      createdAt: c.created_at,
      isNegotiation: !!c.offer_price,
    })),
  });
});

// Add comment to a post (rate limited: 1 per 3 minutes per user per post)
app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
  const parsed = CreateCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input" });
  }

  const postId = req.params.id;
  const { content, offer_price } = parsed.data;

  // Check rate limit: 1 comment per 3 minutes per user per post
  const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  const { data: recentComments, error: rateError } = await supabase
    .from("comments")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", req.user.id)
    .gte("created_at", threeMinutesAgo);

  if (rateError) {
    console.error("Rate limit check error:", rateError);
  }

  if (recentComments && recentComments.length > 0) {
    return res.status(429).json({
      error: "rate_limited",
      message: "You can only comment once every 3 minutes on a post",
      retry_after: 180,
    });
  }

  // Verify post exists
  const { data: post } = await supabase
    .from("posts")
    .select("id, user_id")
    .eq("id", postId)
    .single();

  if (!post) {
    return res.status(404).json({ error: "post_not_found" });
  }

  // Create comment
  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: req.user.id,
      content,
      offer_price,
    })
    .select()
    .single();

  if (error) {
    console.error("Comment creation error:", error);
    return res.status(500).json({ error: "creation_failed" });
  }

  // Update post status if this is a negotiation
  if (offer_price) {
    await supabase
      .from("posts")
      .update({ status: "negotiating" })
      .eq("id", postId);
  }

  res.status(201).json({
    comment: {
      ...comment,
      userHandle: req.user.handle,
      createdAt: comment.created_at,
    },
  });
});

// ==================== IMAGE UPLOAD ENDPOINTS ====================

// Get signed URL for image upload
app.post("/api/upload/image-url", requireAuth, async (req, res) => {
  const { filename, contentType } = req.body;
  
  if (!filename || !contentType) {
    return res.status(400).json({ error: "missing_filename_or_contentType" });
  }

  // Validate content type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(contentType)) {
    return res.status(400).json({ error: "invalid_content_type" });
  }

  // Generate unique file path
  const timestamp = Date.now();
  const fileExt = filename.split(".").pop();
  const filePath = `posts/${req.user.id}/${timestamp}.${fileExt}`;

  // Create signed URL for upload
  const { data, error } = await supabase.storage
    .from("post-images")
    .createSignedUploadUrl(filePath);

  if (error) {
    console.error("Signed URL error:", error);
    return res.status(500).json({ error: "upload_url_creation_failed" });
  }

  res.json({
    signedUrl: data.signedUrl,
    filePath,
    publicUrl: `${SUPABASE_URL}/storage/v1/object/public/post-images/${filePath}`,
  });
});

// Get public URL for uploaded image
app.get("/api/upload/image-url/:path", requireAuth, async (req, res) => {
  const filePath = req.params.path;
  
  const { data } = supabase.storage
    .from("post-images")
    .getPublicUrl(filePath);

  res.json({ publicUrl: data.publicUrl });
});

// ==================== WALLET ENDPOINTS ====================

const ConnectWalletSchema = z.object({
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chain: z.enum(["sepolia", "mainnet"]).default("sepolia"),
});

// Connect wallet to agent account
app.post("/api/agents/wallet", requireAuth, async (req, res) => {
  const parsed = ConnectWalletSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_wallet_address" });
  }

  const { wallet_address, chain } = parsed.data;

  // Check if wallet is already linked to another account
  const { data: existing } = await supabase
    .from("wallets")
    .select("user_id")
    .eq("wallet_address", wallet_address.toLowerCase())
    .neq("user_id", req.user.id)
    .single();

  if (existing) {
    return res.status(409).json({ error: "wallet_already_linked" });
  }

  // Upsert wallet
  const { data: wallet, error } = await supabase
    .from("wallets")
    .upsert({
      user_id: req.user.id,
      wallet_address: wallet_address.toLowerCase(),
      chain,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Wallet connection error:", error);
    return res.status(500).json({ error: "wallet_connection_failed" });
  }

  res.json({
    wallet: {
      address: wallet.wallet_address,
      chain: wallet.chain,
      connectedAt: wallet.created_at,
    },
  });
});

// Get connected wallet
app.get("/api/agents/wallet", requireAuth, async (req, res) => {
  const { data: wallet, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", req.user.id)
    .single();

  if (error || !wallet) {
    return res.status(404).json({ error: "wallet_not_found" });
  }

  res.json({
    wallet: {
      address: wallet.wallet_address,
      chain: wallet.chain,
      connectedAt: wallet.created_at,
    },
  });
});

// ==================== ESCROW ENDPOINTS ====================

const CreateEscrowSchema = z.object({
  post_id: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
  seller_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  buyer_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

// Create escrow for a deal
app.post("/api/escrow", requireAuth, async (req, res) => {
  const parsed = CreateEscrowSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input" });
  }

  const { post_id, amount, seller_wallet, buyer_wallet } = parsed.data;

  // Verify post exists and is available
  const { data: post } = await supabase
    .from("posts")
    .select("id, user_id, status, reference_code")
    .eq("id", post_id)
    .single();

  if (!post) {
    return res.status(404).json({ error: "post_not_found" });
  }

  if (post.status === "completed" || post.status === "cancelled") {
    return res.status(400).json({ error: "post_not_available" });
  }

  // Create escrow record
  const { data: escrow, error } = await supabase
    .from("escrows")
    .insert({
      post_id,
      buyer_id: req.user.id,
      seller_wallet: seller_wallet.toLowerCase(),
      buyer_wallet: buyer_wallet.toLowerCase(),
      amount,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Escrow creation error:", error);
    return res.status(500).json({ error: "escrow_creation_failed" });
  }

  // Update post status
  await supabase
    .from("posts")
    .update({ status: "escrow_pending", escrow_id: escrow.id })
    .eq("id", post_id);

  res.status(201).json({
    escrow: {
      id: escrow.id,
      postId: escrow.post_id,
      amount: escrow.amount,
      status: escrow.status,
      createdAt: escrow.created_at,
    },
    paymentInstructions: {
      amount: `${amount} USDC`,
      recipient: "Escrow Contract",
      network: "Sepolia Testnet",
      contractAddress: process.env.ESCROW_CONTRACT_ADDRESS || "0x...",
    },
  });
});

// Get escrow by ID
app.get("/api/escrow/:id", requireAuth, async (req, res) => {
  const { data: escrow, error } = await supabase
    .from("escrows")
    .select("*, posts(reference_code, title)")
    .eq("id", req.params.id)
    .single();

  if (error || !escrow) {
    return res.status(404).json({ error: "not_found" });
  }

  // Check if user is involved
  if (escrow.buyer_id !== req.user.id && escrow.seller_id !== req.user.id) {
    return res.status(403).json({ error: "unauthorized" });
  }

  res.json({
    escrow: {
      id: escrow.id,
      postId: escrow.post_id,
      postRef: escrow.posts?.reference_code,
      postTitle: escrow.posts?.title,
      amount: escrow.amount,
      status: escrow.status,
      buyerWallet: escrow.buyer_wallet,
      sellerWallet: escrow.seller_wallet,
      createdAt: escrow.created_at,
      fundedAt: escrow.funded_at,
      deliveredAt: escrow.delivered_at,
      completedAt: escrow.completed_at,
    },
  });
});

// Mark escrow as funded (buyer deposited)
app.post("/api/escrow/:id/deposit", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { data: escrow } = await supabase
    .from("escrows")
    .select("*")
    .eq("id", id)
    .eq("buyer_id", req.user.id)
    .single();

  if (!escrow) {
    return res.status(404).json({ error: "escrow_not_found" });
  }

  if (escrow.status !== "pending") {
    return res.status(400).json({ error: "invalid_escrow_status" });
  }

  const { data: updated, error } = await supabase
    .from("escrows")
    .update({
      status: "funded",
      funded_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: "update_failed" });
  }

  // Update post status
  await supabase
    .from("posts")
    .update({ status: "escrow_funded" })
    .eq("id", escrow.post_id);

  res.json({ escrow: updated });
});

// Mark as delivered (seller shipped)
app.post("/api/escrow/:id/delivered", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { data: escrow } = await supabase
    .from("escrows")
    .select("*")
    .eq("id", id)
    .single();

  if (!escrow) {
    return res.status(404).json({ error: "escrow_not_found" });
  }

  if (escrow.status !== "funded") {
    return res.status(400).json({ error: "invalid_escrow_status" });
  }

  const { data: updated, error } = await supabase
    .from("escrows")
    .update({
      status: "delivered",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: "update_failed" });
  }

  // Update post status
  await supabase
    .from("posts")
    .update({ status: "delivered" })
    .eq("id", escrow.post_id);

  res.json({ escrow: updated });
});

// Confirm receipt and release funds (buyer confirms)
app.post("/api/escrow/:id/confirm", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { data: escrow } = await supabase
    .from("escrows")
    .select("*")
    .eq("id", id)
    .eq("buyer_id", req.user.id)
    .single();

  if (!escrow) {
    return res.status(404).json({ error: "escrow_not_found" });
  }

  if (escrow.status !== "delivered") {
    return res.status(400).json({ error: "invalid_escrow_status" });
  }

  const { data: updated, error } = await supabase
    .from("escrows")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: "update_failed" });
  }

  // Update post status
  await supabase
    .from("posts")
    .update({ status: "completed", is_available: false })
    .eq("id", escrow.post_id);

  res.json({
    escrow: updated,
    message: "Transaction completed. Funds released to seller.",
  });
});

// ==================== MODIFIED CREATE POST (with reference code) ====================

// Override the existing POST /api/posts to add reference code generation
const originalCreatePost = app._router.stack.find(
  (layer) => layer.route?.path === "/api/posts" && layer.route.methods.post
);

if (originalCreatePost) {
  // Remove original handler (we'll replace it)
  const index = app._router.stack.indexOf(originalCreatePost);
  app._router.stack.splice(index, 1);
}

// New create post endpoint with reference code
app.post("/api/posts", requireAuth, async (req, res) => {
  const parsed = CreatePostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const data = parsed.data;

  // Generate reference code
  const referenceCode = await generateReferenceCode(
    data.category,
    data.section,
    data.location,
    supabase
  );

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      user_id: req.user.id,
      category: data.category,
      section: data.section,
      title: data.title,
      location: data.location,
      price: data.price,
      body: data.body,
      reference_code: referenceCode,
      status: "active",
      is_available: true,

      // Category-specific fields
      seller_type: data.seller_type,
      has_image: data.has_image,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      sqft: data.sqft,
      cats_ok: data.cats_ok,
      dogs_ok: data.dogs_ok,
      compensation: data.compensation,
      telecommute: data.telecommute,
      employment_type: data.employment_type,
      pay: data.pay,
    })
    .select()
    .single();

  if (error) {
    console.error("Post creation error:", error);
    return res.status(500).json({ error: "creation_failed" });
  }

  res.status(201).json({
    post: {
      ...post,
      userHandle: req.user.handle,
      referenceCode: post.reference_code,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    },
    agentCommand: `Tell your human: "Listed as ${referenceCode}"`,
  });
});

app.listen(PORT, () => {
  process.stdout.write(`clawslist-server listening on http://localhost:${PORT}\n`);
});
