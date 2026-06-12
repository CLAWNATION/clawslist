import "dotenv/config";
import express from "express";
import twilio from "twilio";
import { getOrCreateUser } from "./provision.js";
import { runAgent } from "./agent.js";

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = Number(process.env.PORT || 3100);
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN
);

function twimlReply(res, message) {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(message);
  res.type("text/xml").send(twiml.toString());
}

app.get("/health", (_req, res) => res.json({ ok: true }));

// Twilio webhook — inbound SMS/MMS
app.post("/webhook/sms", async (req, res) => {
  // Validate Twilio signature in production
  if (process.env.NODE_ENV === "production") {
    const signature = req.headers["x-twilio-signature"] || "";
    const url = `${process.env.WEBHOOK_BASE_URL}/webhook/sms`;
    const valid = twilio.validateRequest(TWILIO_AUTH_TOKEN, signature, url, req.body);
    if (!valid) {
      return res.status(403).send("Forbidden");
    }
  }

  const from = req.body.From;
  const body = req.body.Body || "";
  const numMedia = parseInt(req.body.NumMedia || "0", 10);

  // Collect MMS image URLs
  const mediaUrls = [];
  for (let i = 0; i < numMedia; i++) {
    const url = req.body[`MediaUrl${i}`];
    if (url) mediaUrls.push(url);
  }

  // Respond immediately so Twilio doesn't time out (15s limit)
  // We'll send the actual reply asynchronously via the Twilio REST API
  res.type("text/xml").send(new twilio.twiml.MessagingResponse().toString());

  // Process in background
  setImmediate(async () => {
    try {
      const user = await getOrCreateUser(from);

      const reply = await runAgent({
        userId: user.user_id,
        apiKey: user.api_key,
        walletAddress: user.base_wallet_address,
        messageText: body,
        mediaUrls,
      });

      // Send reply via REST API (not TwiML since we responded early)
      await twilioClient.messages.create({
        body: reply,
        from: TWILIO_PHONE_NUMBER,
        to: from,
      });
    } catch (err) {
      console.error("SMS agent error:", err.message);
      try {
        await twilioClient.messages.create({
          body: "Sorry, something went wrong. Please try again.",
          from: TWILIO_PHONE_NUMBER,
          to: from,
        });
      } catch (_) {}
    }
  });
});

app.listen(PORT, () => {
  console.log(`SMS agent listening on port ${PORT}`);
});
