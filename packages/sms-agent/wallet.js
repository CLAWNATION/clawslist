import { CdpEvmWalletProvider } from "@coinbase/agentkit";
import { randomBytes } from "crypto";

const BASE_NETWORK = process.env.NODE_ENV === "production" ? "base-mainnet" : "base-sepolia";

export async function getCdpWalletProvider(userId) {
  return CdpEvmWalletProvider.configureWithWallet({
    apiKeyId: process.env.CDP_API_KEY_ID,
    apiKeySecret: process.env.CDP_API_KEY_SECRET,
    walletSecret: process.env.CDP_WALLET_SECRET,
    idempotencyKey: userId,
    networkId: BASE_NETWORK,
  });
}

// Signs a USDC transferWithAuthorization (EIP-3009) and retries the request with the payment.
// Called automatically when the server returns 402 with a PAYMENT-REQUIRED header.
export async function handleX402Payment(url, method, headers, walletProvider) {
  const res = await fetch(url, { method, headers });
  if (res.status !== 402) return res;

  const reqHeader =
    res.headers.get("x-payment-response") ||
    res.headers.get("payment-required");
  if (!reqHeader) throw new Error("402 with no payment requirements");

  const raw = JSON.parse(Buffer.from(reqHeader, "base64").toString("utf8"));
  const req = Array.isArray(raw) ? raw[0] : raw;

  const from = await walletProvider.getAddress();
  const nonce = `0x${randomBytes(32).toString("hex")}`;
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 300);

  const signature = await walletProvider.signTypedData({
    domain: {
      name: "USD Coin",
      version: "2",
      chainId: BASE_NETWORK === "base-mainnet" ? 8453 : 84532,
      verifyingContract: req.asset,
    },
    types: {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "TransferWithAuthorization",
    message: {
      from,
      to: req.payTo,
      value: BigInt(req.maxAmountRequired),
      validAfter: BigInt(0),
      validBefore,
      nonce,
    },
  });

  const payload = {
    x402Version: 1,
    scheme: "exact",
    network: req.network,
    payload: {
      signature,
      authorization: {
        from,
        to: req.payTo,
        value: req.maxAmountRequired,
        validAfter: "0",
        validBefore: String(validBefore),
        nonce,
      },
    },
  };

  return fetch(url, {
    method,
    headers: {
      ...headers,
      "X-Payment": Buffer.from(JSON.stringify(payload)).toString("base64"),
    },
  });
}
