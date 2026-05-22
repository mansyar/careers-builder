import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_SECRET_PATH = path.join(process.cwd(), 'data', '.secret');
const SECRET_BYTE_LENGTH = 64;
const IV_LENGTH = 12; // GCM standard
const KEY_DERIVATION_BYTE_LENGTH = 32; // bytes to read from secret for key derivation

/**
 * Load the secret from disk or generate it if it doesn't exist.
 * The secret is a 64-byte random file stored at the given path.
 */
export function generateOrLoadSecret(secretFilePath: string = DEFAULT_SECRET_PATH): Buffer {
  if (!fs.existsSync(secretFilePath)) {
    const secret = crypto.randomBytes(SECRET_BYTE_LENGTH);
    fs.writeFileSync(secretFilePath, secret);
    return secret;
  }
  return fs.readFileSync(secretFilePath);
}

/**
 * Derive a 256-bit AES key from the secret using SHA-256 of the first 32 bytes.
 */
export function deriveKey(secret: Buffer): Buffer {
  return crypto
    .createHash('sha256')
    .update(secret.subarray(0, KEY_DERIVATION_BYTE_LENGTH))
    .digest();
}

/**
 * Read the secret from disk and derive the encryption key.
 */
function loadKey(secretFilePath: string = DEFAULT_SECRET_PATH): Buffer {
  const secret = generateOrLoadSecret(secretFilePath);
  return deriveKey(secret);
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * @param plaintext - The string to encrypt.
 * @param secretFilePath - Optional custom path to the secret file (for testing).
 * @returns An object containing the encrypted data (hex), IV (hex), and auth tag (hex).
 * @throws If the secret file cannot be read (descriptive error with recovery guidance).
 */
export function encrypt(
  plaintext: string,
  secretFilePath?: string,
): { encrypted: string; iv: string; tag: string } {
  let key: Buffer;
  try {
    key = loadKey(secretFilePath);
  } catch (err) {
    throw new Error(
      `Encryption failed: unable to read secret file at "${secretFilePath ?? DEFAULT_SECRET_PATH}". ` +
        'Please ensure the application is properly initialized by restarting it. ' +
        `Details: ${(err as Error).message}`,
    );
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encryptedBuffer = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    encrypted: encryptedBuffer.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

/**
 * Decrypt an AES-256-GCM encrypted string.
 *
 * @param encrypted - The encrypted data (hex string).
 * @param iv - The initialization vector (hex string).
 * @param tag - The authentication tag (hex string).
 * @param secretFilePath - Optional custom path to the secret file (for testing).
 * @returns The decrypted plaintext string.
 * @throws If authentication fails (tampered data) or the secret file cannot be read.
 */
export function decrypt(
  encrypted: string,
  iv: string,
  tag: string,
  secretFilePath?: string,
): string {
  let key: Buffer;
  try {
    key = loadKey(secretFilePath);
  } catch (err) {
    throw new Error(
      `Decryption failed: unable to read secret file at "${secretFilePath ?? DEFAULT_SECRET_PATH}". ` +
        'Please ensure the application is properly initialized by restarting it. ' +
        `Details: ${(err as Error).message}`,
    );
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  const decryptedBuffer = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'hex')),
    decipher.final(),
  ]);

  return decryptedBuffer.toString('utf8');
}
