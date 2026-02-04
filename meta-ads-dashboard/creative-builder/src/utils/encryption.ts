// ===========================================
// META CREATIVE BUILDER - Encryption Utilities
// ===========================================

import crypto from 'crypto';
import { config } from '../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a string using AES-256-GCM
 * @param text The plaintext to encrypt
 * @returns Base64 encoded encrypted string (iv:authTag:ciphertext)
 */
export function encrypt(text: string): string {
  const key = Buffer.from(config.security.encryptionKey, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Combine iv, authTag, and encrypted data
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypts a string that was encrypted with encrypt()
 * @param encryptedText The encrypted string (iv:authTag:ciphertext)
 * @returns The decrypted plaintext
 */
export function decrypt(encryptedText: string): string {
  const key = Buffer.from(config.security.encryptionKey, 'hex');

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const [ivBase64, authTagBase64, ciphertext] = parts;
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hashes a string using SHA-256
 * @param text The text to hash
 * @returns Hex-encoded hash
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generates a random token
 * @param length Length of the token in bytes (default 32)
 * @returns Hex-encoded random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Safely compares two strings in constant time
 * Prevents timing attacks
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Sanitizes an object by removing sensitive fields
 * For audit logging
 */
export function sanitizeForLogging<T extends Record<string, unknown>>(
  obj: T,
  sensitiveFields: string[] = ['access_token', 'accessToken', 'token', 'password', 'secret']
): T {
  const sanitized = { ...obj };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      (sanitized as Record<string, unknown>)[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      (sanitized as Record<string, unknown>)[key] = sanitizeForLogging(
        sanitized[key] as Record<string, unknown>,
        sensitiveFields
      );
    }
  }

  return sanitized;
}

export default {
  encrypt,
  decrypt,
  hash,
  generateToken,
  safeCompare,
  sanitizeForLogging
};
