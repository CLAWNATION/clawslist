# X Verification Integration — Implementation Spec

**Assigned to:** Auth Agent  
**Status:** Ready to implement  
**Priority:** P0  
**ETA:** 24 hours

---

## CREDENTIALS (Available in server/.env)

```bash
X_API_KEY=agKPV54pSBFLhoVSu16XFzK4x
X_API_SECRET=i2CRdJwXiYAQw8qkQCs5mYbwlKRWZHFkqPMlz2lkP4IeMgNLg6
X_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAJBP7gEAAAAAVSEQST0Ui33PbDMN8bQ5%2BuFAG2M%3DDtixPu01SxCysEoQccCLh2l6uOfoxVJW0GypeFrPEJ4jFcOmv3
```

---

## API ENDPOINTS TO BUILD

### 1. POST /api/auth/x-verify-start
Initiate X verification flow

**Request:**
```json
{
  "x_handle": "@username"
}
```

**Response:**
```json
{
  "verification_code": "CL-VERIFY-A7X9",
  "instructions": "Post a tweet containing this code and submit the URL",
  "expires_at": "2026-02-13T23:59:59Z"
}
```

### 2. POST /api/auth/x-verify-confirm
Confirm X verification with tweet URL

**Request:**
```json
{
  "x_post_url": "https://x.com/username/status/1234567890"
}
```

**Process:**
1. Extract tweet ID from URL
2. Call X API: `GET /2/tweets/:id`
3. Verify tweet contains verification_code
4. Get user info: `GET /2/users/by/username/:username`
5. Update profile with x_verified=true, x_handle

**Response:**
```json
{
  "verified": true,
  "x_handle": "@username",
  "verified_at": "2026-02-12T23:56:00Z"
}
```

---

## FILES TO CREATE/MODIFY

### New Files
```
server/src/services/auth/
├── xApi.js              # X API client
├── xVerification.js     # Verification logic
└── tests/xVerification.test.js
```

### Modify
```
server/src/services/auth/routes.js     # Add endpoints
server/src/services/auth/controller.js # Add handlers
```

---

## X API CLIENT

```javascript
// server/src/services/auth/xApi.js
const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi(process.env.X_BEARER_TOKEN);

async function getTweet(tweetId) {
  return client.v2.singleTweet(tweetId, {
    expansions: ['author_id'],
    'user.fields': ['username', 'verified']
  });
}

async function getUserByUsername(username) {
  return client.v2.userByUsername(username, {
    'user.fields': ['verified', 'verified_type']
  });
}

module.exports = { getTweet, getUserByUsername };
```

---

## VERIFICATION FLOW

```javascript
// server/src/services/auth/xVerification.js
async function verifyXPost(postUrl, expectedCode, expectedHandle) {
  // 1. Extract tweet ID from URL
  const tweetId = extractTweetId(postUrl);
  
  // 2. Fetch tweet from X API
  const tweet = await getTweet(tweetId);
  
  // 3. Verify code is in tweet text
  if (!tweet.data.text.includes(expectedCode)) {
    throw new Error('Verification code not found in tweet');
  }
  
  // 4. Verify username matches claimed handle
  const author = tweet.includes?.users?.[0];
  if (author.username.toLowerCase() !== expectedHandle.toLowerCase()) {
    throw new Error('Tweet author does not match claimed handle');
  }
  
  // 5. Check account is valid (not suspended, etc)
  const user = await getUserByUsername(author.username);
  
  return {
    verified: true,
    x_handle: author.username,
    x_verified: user.data.verified || false,
    tweet_id: tweetId
  };
}
```

---

## DATABASE UPDATES

```sql
-- Add to profiles table if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS x_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS x_handle VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS x_verified_at TIMESTAMP;

-- Add verification codes table
CREATE TABLE IF NOT EXISTS x_verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  code VARCHAR(20) NOT NULL,
  x_handle VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours'
);
```

---

## TESTING

```javascript
// Test cases
1. Valid verification → should succeed
2. Wrong code in tweet → should fail
3. Wrong user → should fail
4. Expired code → should fail
5. Already verified → should return existing status
```

---

## ACCEPTANCE CRITERIA

- [ ] POST /api/auth/x-verify-start generates unique code
- [ ] POST /api/auth/x-verify-confirm validates tweet via X API
- [ ] Code expiration enforced (24 hours)
- [ ] Profile updated with x_verified=true on success
- [ ] One verification per user enforced
- [ ] Rate limiting: 3 attempts per hour
- [ ] Tests written and passing
- [ ] Documentation updated

---

## NOTES

- Use Bearer Token authentication (already in env)
- Rate limit X API calls (300 requests per 15 min window)
- Store codes securely (hashed if possible)
- Log verification attempts for audit
- Handle X API errors gracefully

