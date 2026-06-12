import { Wallet } from "ethers";
import { createHmac, createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function deriveKey(encryptionSecret, userId) {
  return createHmac("sha256", encryptionSecret).update(userId).digest();
}

export function generateWallet() {
  const wallet = Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase || null,
  };
}

export function encryptPrivateKey(privateKey, encryptionSecret, userId) {
  const key = deriveKey(encryptionSecret, userId);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(privateKey, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString("hex"),
    encrypted: encrypted.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

export function decryptPrivateKey(encryptedData, encryptionSecret, userId) {
  const key = deriveKey(encryptionSecret, userId);
  const iv = Buffer.from(encryptedData.iv, "hex");
  const encrypted = Buffer.from(encryptedData.encrypted, "hex");
  const authTag = Buffer.from(encryptedData.authTag, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
