/**
 * Core Cryptographic Utilities
 * Provides encryption, hashing, and signing primitives
 */

import * as crypto from 'crypto';
import { EncryptedPayload, KeyPair } from '../types';

export class CryptoUtils {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly AUTH_TAG_LENGTH = 16;
  private static readonly SALT_LENGTH = 32;
  private static readonly PBKDF2_ITERATIONS = 100000;

  /**
   * Generate a cryptographically secure random key
   */
  static generateKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }

  /**
   * Derive a key from a password using PBKDF2
   */
  static deriveKey(password: string, salt?: Buffer): { key: Buffer; salt: Buffer } {
    const actualSalt = salt || crypto.randomBytes(this.SALT_LENGTH);
    const key = crypto.pbkdf2Sync(
      password,
      actualSalt,
      this.PBKDF2_ITERATIONS,
      this.KEY_LENGTH,
      'sha256'
    );
    return { key, salt: actualSalt };
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  static encrypt(data: string, key: string): EncryptedPayload {
    const keyBuffer = Buffer.from(key, 'hex');
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, keyBuffer, iv);

    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
      data: encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: this.ALGORITHM,
      timestamp: Date.now(),
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static decrypt(payload: EncryptedPayload, key: string): string {
    const keyBuffer = Buffer.from(key, 'hex');
    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    const decipher = crypto.createDecipheriv(this.ALGORITHM, keyBuffer, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(payload.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Encrypt data with a password (derives key automatically)
   */
  static encryptWithPassword(data: string, password: string): { payload: EncryptedPayload; salt: string } {
    const { key, salt } = this.deriveKey(password);
    const payload = this.encrypt(data, key.toString('hex'));
    return {
      payload,
      salt: salt.toString('base64'),
    };
  }

  /**
   * Decrypt data with a password
   */
  static decryptWithPassword(payload: EncryptedPayload, password: string, salt: string): string {
    const saltBuffer = Buffer.from(salt, 'base64');
    const { key } = this.deriveKey(password, saltBuffer);
    return this.decrypt(payload, key.toString('hex'));
  }

  /**
   * Calculate SHA-256 hash
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Calculate SHA-512 hash
   */
  static hashStrong(data: string): string {
    return crypto.createHash('sha512').update(data).digest('hex');
  }

  /**
   * Calculate HMAC-SHA256
   */
  static hmac(data: string, key: string): string {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Generate RSA key pair for signing
   */
  static generateKeyPair(): KeyPair {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Sign data with RSA private key
   */
  static sign(data: string, privateKey: string): string {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    return sign.sign(privateKey, 'base64');
  }

  /**
   * Verify signature with RSA public key
   */
  static verify(data: string, signature: string, publicKey: string): boolean {
    try {
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(data);
      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a secure random token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  static secureCompare(a: string, b: string): boolean {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    if (bufferA.length !== bufferB.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufferA, bufferB);
  }

  /**
   * XOR two buffers (useful for obfuscation)
   */
  static xor(buffer1: Buffer, buffer2: Buffer): Buffer {
    const length = Math.min(buffer1.length, buffer2.length);
    const result = Buffer.alloc(length);

    for (let i = 0; i < length; i++) {
      result[i] = buffer1[i] ^ buffer2[i];
    }

    return result;
  }

  /**
   * Generate a checksum for code integrity
   */
  static checksum(code: string): string {
    // Normalize code (remove whitespace variations)
    const normalized = code.replace(/\s+/g, ' ').trim();
    return this.hash(normalized);
  }
}
