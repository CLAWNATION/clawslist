# Mailchimp Setup Guide — Express Auto Repair

**Goal:** Capture leads from website and nurture them into customers  
**Lead Magnet:** "The Honest Mechanic's Used Car Checklist"  
**Setup Time:** 45 minutes  
**Monthly Cost:** Free tier (up to 500 contacts) or $13/month Essentials

---

## PHASE 1: ACCOUNT SETUP

### Step 1: Create Account
- [ ] Go to [mailchimp.com](https://mailchimp.com)
- [ ] Click "Sign Up Free"
- [ ] Enter:
  - Email: [your business email]
  - Username: expressauto_[city] (or similar)
  - Password: [strong password]
- [ ] Verify email address
- [ ] Complete profile:
  - Business name: Express Auto Repair
  - Website: expressauto.io
  - Address: [your business address]
  - Phone: [your phone number]

### Step 2: Choose Plan
- [ ] Select **Free Plan** (up to 500 contacts, 1,000 sends/month)
- [ ] Upgrade to **Essentials ($13/mo)** when you hit 500 contacts or need:
  - A/B testing
  - Custom branding
  - 24/7 support

---

## PHASE 2: AUDIENCE SETUP

### Create Audience
- [ ] Click "Audience" → "Create Audience"
- [ ] Fill in details:
  - **Audience name:** Express Auto Repair - Main List
  - **Default from email:** hello@expressauto.io (or your email)
  - **Default from name:** Express Auto Repair
  - **Reminder:** "You're receiving this because you downloaded our Used Car Checklist from expressauto.io"

### Required Fields
- [ ] Click "Settings" → "Audience fields and *|MERGE|* tags"
- [ ] Ensure these fields exist:
  - Email Address (required)
  - First Name (optional but recommended)
  - Last Name (optional)
  - Phone Number (add this - important for auto repair)

### Signup Form Setup
- [ ] Go to "Signup forms" → "Form builder"
- [ ] Select "Embedded forms"
- [ ] Style settings:
  - Width: 100% (responsive)
  - Show all fields: First name, Email, Phone
  - Make phone optional for higher conversion
  - Button text: "Get My Free Checklist"
- [ ] Copy the HTML embed code
- [ ] Paste into your website (see email-capture-form-copy.md for placement)

### Landing Page (Optional but Recommended)
- [ ] Go to "Landing Pages" → "Create Landing Page"
- [ ] Choose template: "Lead Generation"
- [ ] Customize:
  - Headline: "Don't Buy a Lemon - Get the Free 15-Point Used Car Checklist"
  - Body: Copy from email-capture-form-copy.md landing page section
  - Form fields: Email, First Name, Phone
  - Button: "Send Me the Checklist"
  - Image: Add checklist mockup or shop photo
- [ ] Set URL: mailchi.mp/expressauto/used-car-checklist
- [ ] Publish

---

## PHASE 3: AUTOMATION SETUP (Critical)

### Create Welcome Email (Single Email)
This sends immediately when someone subscribes.

- [ ] Go to "Automations" → "Create Automation"
- [ ] Select "Welcome new subscribers"
- [ ] Name it: "Used Car Checklist - Welcome"

**Email Settings:**
- From name: Express Auto Repair
- From email: hello@expressauto.io
- Subject: [Use from email-capture-form-copy.md welcome email section]
  - Option A: "Your Used Car Checklist is here 🚗"
  - Option B: "Don't buy a lemon (here's your checklist)"

**Email Content:**
```
Hi *|FNAME|*,

Thanks for downloading The Honest Mechanic's Used Car Checklist!

**Download your checklist:**
[LINK TO PDF - upload to Mailchimp or host on your site]

**Quick tips for using it:**
1. Print it before you go car shopping
2. Bring a flashlight and quarter (for tread depth)
3. Check off each item during the test drive
4. If you spot 3+ red flags, walk away

**Buying in [City]?**
If you want a professional pre-purchase inspection before you buy, 
we're here to help. No upsells, no pressure — just an honest assessment.

📞 Call: (XXX) XXX-XXXX
🌐 Book online: expressauto.io

Happy (smart) car hunting!

— The team at Express Auto Repair

---
P.S. Found a car you like? Text us the VIN and we'll run a quick 
background check for free: (XXX) XXX-XXXX
```

- [ ] Design the email:
  - Keep it simple (mostly text)
  - Add your logo at top
  - Make the download link a prominent button
  - Add social media links at bottom
- [ ] Test send to yourself
- [ ] Activate automation

### Create Follow-Up Sequence (Nurture Campaign)
5-email sequence over 30 days to build trust and drive bookings.

**Automation name:** "New Lead Nurture Sequence"
**Trigger:** Added to audience (not just welcome series)

#### Email 1: Welcome + Checklist (Day 0)
*(Already created above)*

#### Email 2: "The Worst Used Car We Ever Saw" (Day 3)
**Subject:** The worst used car we ever inspected (story)

**Body:**
```
Hi *|FNAME|*,

Last week, a customer brought us a 2015 Honda Civic they were about to buy.

Looked great. Clean Carfax. Low miles. Seller seemed nice.

We found:
• Frame damage hidden by fresh undercoating
• Odometer rolled back 40,000 miles
• Salvage title from another state

They walked away. Bought a different car the next week.

The $150 inspection saved them from a $12,000 mistake.

**The lesson:** Even "clean" cars can have hidden problems. That's why we 
created the checklist you downloaded.

If you're serious about a car, get it inspected. Not just by us — by any 
mechanic you trust. It's the best insurance you can buy.

📞 Questions? Call us: (XXX) XXX-XXXX

Stay safe out there,
[Your name]
Express Auto Repair
```

#### Email 3: "3 Things Your Check Engine Light Is Trying to Tell You" (Day 7)
**Subject:** 3 things your check engine light means (not all are expensive)

**Body:**
```
Hi *|FNAME|*,

The check engine light comes on. Your heart sinks.

"This is going to cost a fortune."

Not always. Here are the 3 most common causes:

**1. Loose gas cap ($0 fix)**
Yep. If your cap isn't tight, it triggers the light. Try tightening it 
and driving for a day. Light might go off on its own.

**2. O2 sensor ($150-250)**
This measures exhaust gases. Important for emissions and fuel economy. 
Not urgent, but don't ignore it for months.

**3. Catalytic converter ($800-2,000)**
This is the expensive one. But it's rare. Most lights are sensors, not 
cats.

**The rule:** Get it scanned. Know what you're dealing with. Don't panic.

We scan check engine lights for free. Just stop by.

📍 [Address]
📞 (XXX) XXX-XXXX

— [Your name]
```

#### Email 4: "How Often Should You Really Change Your Oil?" (Day 14)
**Subject:** How often to change your oil (it's not what you think)

**Body:**
```
Hi *|FNAME|*,

"Change your oil every 3,000 miles."

You've heard it. You've seen the sticker. But is it true?

**For modern cars: Probably not.**

Here's the real answer:

**Conventional oil:** 5,000-7,500 miles
**Synthetic oil:** 7,500-10,000 miles
**High-mileage oil:** 5,000 miles (for cars over 75k)

Check your owner's manual. Seriously. It's in there.

**Why the 3,000-mile myth persists:**
Oil change shops make money on frequency. The more you come in, the more 
upsells they can offer.

We're different. We want to see you less often, but for the right reasons.

**When to come in sooner:**
• Oil looks dirty (check the dipstick)
• Car burns oil (low on dipstick between changes)
• Short trips only (oil doesn't get hot enough to burn off moisture)
• Towing or heavy use

Questions about your specific car? Reply to this email or text us: 
(XXX) XXX-XXXX

— [Your name]
Express Auto Repair
```

#### Email 5: "Ready to Book? Here's How It Works" (Day 21)
**Subject:** Ready to get your car fixed? Here's how we work

**Body:**
```
Hi *|FNAME|*,

By now you know:
• How to inspect a used car (your checklist)
• What that check engine light might mean
• When to actually change your oil

You're basically a mechanic. Almost. 😉

**When you need the real thing, here's how we work:**

**1. No upsells, ever**
We tell you what's wrong, what it costs, and why. You decide what to fix.

**2. Free diagnostics**
Check engine light? Weird noise? Bring it in. We'll scan it and tell you 
what's up — no charge.

**3. Same-day service**
Most repairs are done the same day. Oil changes? 30 minutes. Brakes? 
A few hours.

**4. Warranty**
24 months/24,000 miles on everything we do. If something's not right, 
we make it right.

**Ready to book?**
📞 Call: (XXX) XXX-XXXX
🌐 Online: expressauto.io
📍 Stop by: [Address]

Walk-ins welcome. No appointment needed for most services.

Thanks for letting us into your inbox.

— [Your name]
Owner, Express Auto Repair

P.S. Reply to this email if you have questions. I read every one.
```

- [ ] Design each email (simple, text-heavy)
- [ ] Add your logo to each
- [ ] Include your contact info in every email
- [ ] Test the sequence with your own email
- [ ] Activate automation

---

## PHASE 4: INTEGRATIONS

### Website Integration
Add signup forms to:
- [ ] Homepage (exit-intent popup)
- [ ] Blog posts (inline at end)
- [ ] Footer (site-wide)
- [ ] Dedicated landing page

See email-capture-form-copy.md for exact copy.

### Google Business Profile
- [ ] Add signup link to GBP posts
- [ ] Pin post: "Free Used Car Checklist - download at [link]"
- [ ] Respond to Q&A with checklist link when relevant

### Social Media
- [ ] Pin post with checklist link on Instagram/Facebook
- [ ] Add to Linktree/bio link
- [ ] Share checklist tips weekly, link in bio

---

## PHASE 5: SEGMENTATION (Advanced)

As your list grows, segment by:

**Interest Level:**
- Downloaded checklist but didn't book (nurture)
- Downloaded and booked (VIP, different messaging)
- Opened no emails (re-engagement campaign)

**Service Interest:**
- Clicked brake-related links (brake promo)
- Clicked oil change content (maintenance focus)
- Clicked check engine content (diagnostic focus)

**Location:**
- In [City] (primary messaging)
- Outside [City] (DIY content only, no service promos)

---

## PHASE 6: ONGOING NEWSLETTER

After the nurture sequence, add subscribers to monthly newsletter.

**Content ideas:**
- Monthly car care tip
- Seasonal maintenance reminders
- Shop news (new equipment, team member)
- Customer spotlight (with permission)
- Special offers (subscribers only)

**Frequency:** 1-2 emails per month max

**Best send times:**
- Tuesday or Wednesday
- 10 AM or 2 PM
- Test with your audience

---

## METRICS TO TRACK

| Metric | Target | Where to Find |
|--------|--------|---------------|
| List growth rate | 10% monthly | Audience dashboard |
| Open rate | 20%+ | Campaign reports |
| Click rate | 3%+ | Campaign reports |
| Unsubscribe rate | <0.5% | Campaign reports |
| Conversions (bookings) | Track manually | Ask "how did you hear about us?" |

---

## TROUBLESHOOTING

**Low open rates?**
- Test different subject lines
- Check spam folder placement
- Clean list (remove non-openers after 6 months)

**Low signup rate?**
- Simplify form (email only)
- Move form above fold
- Add social proof ("Join 500+ local drivers")

**High unsubscribe rate?**
- Send less frequently
- More value, less promotion
- Segment better (don't send brake content to people who just got brakes)

---

## QUICK START CHECKLIST

**Today (30 min):**
- [ ] Create Mailchimp account
- [ ] Set up audience
- [ ] Create embedded signup form
- [ ] Add form to website

**This week (45 min):**
- [ ] Write welcome email
- [ ] Upload PDF checklist
- [ ] Test automation
- [ ] Activate

**Next week (60 min):**
- [ ] Write nurture sequence emails
- [ ] Schedule them
- [ ] Activate sequence

---

## NEXT STEPS

1. **Set up account** (today)
2. **Get first 10 subscribers** (this week)
3. **Send first newsletter** (within 30 days)
4. **Review metrics monthly**

---

**Pairs with:**
- email-capture-form-copy.md (form copy)
- lead-magnet-used-car-checklist.md (PDF content)
- google-business-profile-checklist.md (cross-promotion)

**Tools you'll need:**
- Mailchimp account
- PDF of checklist (lead-magnet-used-car-checklist.md designed)
- Website access (to embed forms)
