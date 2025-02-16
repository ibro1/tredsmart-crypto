import { PublicKey } from "@solana/web3.js";

export async function verifySignature(
  publicKey: string,
  encodedSignature: string,
  message: string
): Promise<boolean> {
  try {
    const key = new PublicKey(publicKey);
    const signature = Uint8Array.from(JSON.parse(encodedSignature));
    const encodedMessage = new TextEncoder().encode(message);
    return key.verify(encodedMessage, signature);
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}