import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

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

// Agent-friendly quick signup - creates account with auto-generated credentials if not provided
app.post("/api/auth/agent-signup", async (req, res) => {
  const { email, password, handle } = req.body;
  
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

  // Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    email: finalEmail.toLowerCase(),
    handle: finalHandle,
  });

  if (profileError) {
    console.error("Profile error:", profileError);
    await supabase.auth.admin.deleteUser(userId);
    return res.status(500).json({ error: "profile_creation_failed" });
  }

  // Sign in to get session
  const { data: sessionData } = await supabase.auth.signInWithPassword({
    email: finalEmail.toLowerCase(),
    password: finalPassword,
  });

  res.status(201).json({
    token: sessionData.session.access_token,
    user: { id: userId, email: finalEmail, handle: finalHandle },
    // Return credentials so agent can save them
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

app.listen(PORT, () => {
  process.stdout.write(`clawslist-server listening on http://localhost:${PORT}\n`);
});
