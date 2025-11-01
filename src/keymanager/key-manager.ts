/**
 * Secure Key Management System
 * Handles encryption keys with secure storage
 */

import { CryptoUtils } from '../crypto/crypto-utils';
import { SecureStorage } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class KeyManager {
  private storage: SecureStorage;
  private masterKey: string;
  private keyCache: Map<string, { key: string; expiry: number }> = new Map();
  private readonly KEY_EXPIRY_MS = 3600000; // 1 hour

  constructor(masterKey: string, storage?: SecureStorage) {
    this.masterKey = masterKey;
    this.storage = storage || new FileSecureStorage(masterKey);
  }

  /**
   * Store a key securely
   */
  async storeKey(keyId: string, key: string, metadata?: Record<string, any>): Promise<void> {
    const keyData = JSON.stringify({
      key,
      metadata,
      timestamp: Date.now(),
    });

    // Encrypt key with master key
    const encrypted = CryptoUtils.encrypt(keyData, this.masterKey);

    await this.storage.set(keyId, JSON.stringify(encrypted));

    // Add to cache
    this.keyCache.set(keyId, {
      key,
      expiry: Date.now() + this.KEY_EXPIRY_MS,
    });
  }

  /**
   * Retrieve a key securely
   */
  async getKey(keyId: string): Promise<string | null> {
    // Check cache first
    const cached = this.keyCache.get(keyId);
    if (cached && cached.expiry > Date.now()) {
      return cached.key;
    }

    // Retrieve from storage
    const encryptedData = await this.storage.get(keyId);
    if (!encryptedData) {
      return null;
    }

    try {
      const encrypted = JSON.parse(encryptedData);
      const decrypted = CryptoUtils.decrypt(encrypted, this.masterKey);
      const keyData = JSON.parse(decrypted);

      // Update cache
      this.keyCache.set(keyId, {
        key: keyData.key,
        expiry: Date.now() + this.KEY_EXPIRY_MS,
      });

      return keyData.key;
    } catch (error) {
      console.error('Failed to decrypt key:', error);
      return null;
    }
  }

  /**
   * Delete a key
   */
  async deleteKey(keyId: string): Promise<void> {
    await this.storage.delete(keyId);
    this.keyCache.delete(keyId);
  }

  /**
   * Rotate master key
   */
  async rotateMasterKey(newMasterKey: string): Promise<void> {
    // This is a critical operation - re-encrypt all keys with new master key
    const keyIds = Array.from(this.keyCache.keys());

    for (const keyId of keyIds) {
      const key = await this.getKey(keyId);
      if (key) {
        // Decrypt with old key
        const oldEncryptedData = await this.storage.get(keyId);
        if (oldEncryptedData) {
          const oldEncrypted = JSON.parse(oldEncryptedData);
          const decrypted = CryptoUtils.decrypt(oldEncrypted, this.masterKey);

          // Re-encrypt with new key
          const newEncrypted = CryptoUtils.encrypt(decrypted, newMasterKey);
          await this.storage.set(keyId, JSON.stringify(newEncrypted));
        }
      }
    }

    this.masterKey = newMasterKey;
    this.keyCache.clear();
  }

  /**
   * Generate and store a new key
   */
  async generateKey(keyId: string, metadata?: Record<string, any>): Promise<string> {
    const key = CryptoUtils.generateKey();
    await this.storeKey(keyId, key, metadata);
    return key;
  }

  /**
   * Clear key cache (for security)
   */
  clearCache(): void {
    this.keyCache.clear();
  }

  /**
   * Export encrypted key bundle (for backup)
   */
  async exportKeys(password: string): Promise<string> {
    const keys: Record<string, any> = {};

    for (const [keyId, cached] of this.keyCache.entries()) {
      const keyData = await this.storage.get(keyId);
      if (keyData) {
        keys[keyId] = JSON.parse(keyData);
      }
    }

    const bundle = JSON.stringify(keys);
    const { payload, salt } = CryptoUtils.encryptWithPassword(bundle, password);

    return JSON.stringify({ payload, salt });
  }

  /**
   * Import encrypted key bundle
   */
  async importKeys(encryptedBundle: string, password: string): Promise<void> {
    const { payload, salt } = JSON.parse(encryptedBundle);
    const decrypted = CryptoUtils.decryptWithPassword(payload, password, salt);
    const keys = JSON.parse(decrypted);

    for (const [keyId, keyData] of Object.entries(keys)) {
      await this.storage.set(keyId, JSON.stringify(keyData));
    }

    this.keyCache.clear();
  }
}

/**
 * File-based secure storage implementation
 */
export class FileSecureStorage implements SecureStorage {
  private storageDir: string;
  private encryptionKey: string;

  constructor(encryptionKey: string, storageDir?: string) {
    this.encryptionKey = encryptionKey;
    this.storageDir = storageDir || path.join(os.homedir(), '.cryptoshield', 'keys');

    // Create storage directory if it doesn't exist
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true, mode: 0o700 });
    }
  }

  async set(key: string, value: string): Promise<void> {
    const filePath = this.getFilePath(key);

    // Encrypt value before storing
    const encrypted = CryptoUtils.encrypt(value, this.encryptionKey);

    fs.writeFileSync(filePath, JSON.stringify(encrypted), { mode: 0o600 });
  }

  async get(key: string): Promise<string | null> {
    const filePath = this.getFilePath(key);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const encrypted = JSON.parse(data);
      return CryptoUtils.decrypt(encrypted, this.encryptionKey);
    } catch (error) {
      console.error('Failed to read key:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async clear(): Promise<void> {
    if (fs.existsSync(this.storageDir)) {
      const files = fs.readdirSync(this.storageDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.storageDir, file));
      }
    }
  }

  private getFilePath(key: string): string {
    const safeKey = CryptoUtils.hash(key);
    return path.join(this.storageDir, `${safeKey}.key`);
  }
}

/**
 * Memory-based secure storage (volatile)
 */
export class MemorySecureStorage implements SecureStorage {
  private storage: Map<string, string> = new Map();
  private encryptionKey: string;

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  async set(key: string, value: string): Promise<void> {
    const encrypted = CryptoUtils.encrypt(value, this.encryptionKey);
    this.storage.set(key, JSON.stringify(encrypted));
  }

  async get(key: string): Promise<string | null> {
    const data = this.storage.get(key);
    if (!data) {
      return null;
    }

    try {
      const encrypted = JSON.parse(data);
      return CryptoUtils.decrypt(encrypted, this.encryptionKey);
    } catch (error) {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}
