/**
 * Tests for CryptoUtils
 */

import { CryptoUtils } from '../src/crypto/crypto-utils';

describe('CryptoUtils', () => {
  describe('Key Generation', () => {
    test('should generate a valid key', () => {
      const key = CryptoUtils.generateKey();
      expect(key).toBeDefined();
      expect(key.length).toBe(64); // 32 bytes = 64 hex characters
    });

    test('should generate unique keys', () => {
      const key1 = CryptoUtils.generateKey();
      const key2 = CryptoUtils.generateKey();
      expect(key1).not.toBe(key2);
    });

    test('should derive key from password', () => {
      const password = 'test-password';
      const { key, salt } = CryptoUtils.deriveKey(password);

      expect(key).toBeDefined();
      expect(key.length).toBe(32); // 32 bytes
      expect(salt).toBeDefined();
      expect(salt.length).toBe(32);
    });

    test('should derive same key with same password and salt', () => {
      const password = 'test-password';
      const { key: key1, salt } = CryptoUtils.deriveKey(password);
      const { key: key2 } = CryptoUtils.deriveKey(password, salt);

      expect(key1.toString('hex')).toBe(key2.toString('hex'));
    });
  });

  describe('Encryption/Decryption', () => {
    test('should encrypt and decrypt data', () => {
      const data = 'sensitive information';
      const key = CryptoUtils.generateKey();

      const encrypted = CryptoUtils.encrypt(data, key);
      expect(encrypted.data).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();

      const decrypted = CryptoUtils.decrypt(encrypted, key);
      expect(decrypted).toBe(data);
    });

    test('should fail decryption with wrong key', () => {
      const data = 'sensitive information';
      const key1 = CryptoUtils.generateKey();
      const key2 = CryptoUtils.generateKey();

      const encrypted = CryptoUtils.encrypt(data, key1);

      expect(() => {
        CryptoUtils.decrypt(encrypted, key2);
      }).toThrow();
    });

    test('should detect tampering', () => {
      const data = 'sensitive information';
      const key = CryptoUtils.generateKey();

      const encrypted = CryptoUtils.encrypt(data, key);

      // Tamper with encrypted data
      encrypted.data = encrypted.data.substring(0, encrypted.data.length - 1) + 'X';

      expect(() => {
        CryptoUtils.decrypt(encrypted, key);
      }).toThrow();
    });

    test('should encrypt and decrypt with password', () => {
      const data = 'sensitive data';
      const password = 'my-password';

      const { payload, salt } = CryptoUtils.encryptWithPassword(data, password);
      const decrypted = CryptoUtils.decryptWithPassword(payload, password, salt);

      expect(decrypted).toBe(data);
    });
  });

  describe('Hashing', () => {
    test('should generate SHA-256 hash', () => {
      const data = 'test data';
      const hash = CryptoUtils.hash(data);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // SHA-256 = 64 hex chars
    });

    test('should generate same hash for same input', () => {
      const data = 'test data';
      const hash1 = CryptoUtils.hash(data);
      const hash2 = CryptoUtils.hash(data);

      expect(hash1).toBe(hash2);
    });

    test('should generate different hash for different input', () => {
      const hash1 = CryptoUtils.hash('data1');
      const hash2 = CryptoUtils.hash('data2');

      expect(hash1).not.toBe(hash2);
    });

    test('should generate SHA-512 hash', () => {
      const data = 'test data';
      const hash = CryptoUtils.hashStrong(data);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(128); // SHA-512 = 128 hex chars
    });

    test('should generate HMAC', () => {
      const data = 'test data';
      const key = 'secret-key';
      const hmac = CryptoUtils.hmac(data, key);

      expect(hmac).toBeDefined();
      expect(hmac.length).toBe(64);
    });

    test('should generate different HMAC with different keys', () => {
      const data = 'test data';
      const hmac1 = CryptoUtils.hmac(data, 'key1');
      const hmac2 = CryptoUtils.hmac(data, 'key2');

      expect(hmac1).not.toBe(hmac2);
    });
  });

  describe('Digital Signatures', () => {
    test('should generate key pair', () => {
      const keyPair = CryptoUtils.generateKeyPair();

      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY');
      expect(keyPair.privateKey).toContain('BEGIN PRIVATE KEY');
    });

    test('should sign and verify data', () => {
      const data = 'important message';
      const keyPair = CryptoUtils.generateKeyPair();

      const signature = CryptoUtils.sign(data, keyPair.privateKey);
      expect(signature).toBeDefined();

      const isValid = CryptoUtils.verify(data, signature, keyPair.publicKey);
      expect(isValid).toBe(true);
    });

    test('should fail verification with tampered data', () => {
      const data = 'important message';
      const keyPair = CryptoUtils.generateKeyPair();

      const signature = CryptoUtils.sign(data, keyPair.privateKey);

      const isValid = CryptoUtils.verify('tampered message', signature, keyPair.publicKey);
      expect(isValid).toBe(false);
    });

    test('should fail verification with wrong public key', () => {
      const data = 'important message';
      const keyPair1 = CryptoUtils.generateKeyPair();
      const keyPair2 = CryptoUtils.generateKeyPair();

      const signature = CryptoUtils.sign(data, keyPair1.privateKey);

      const isValid = CryptoUtils.verify(data, signature, keyPair2.publicKey);
      expect(isValid).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    test('should generate secure random token', () => {
      const token = CryptoUtils.generateToken();
      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    test('should generate token of specified length', () => {
      const token = CryptoUtils.generateToken(16);
      expect(token.length).toBe(32); // 16 bytes = 32 hex chars
    });

    test('should perform secure comparison', () => {
      const str1 = 'secret-value';
      const str2 = 'secret-value';
      const str3 = 'different-value';

      expect(CryptoUtils.secureCompare(str1, str2)).toBe(true);
      expect(CryptoUtils.secureCompare(str1, str3)).toBe(false);
    });

    test('should XOR buffers', () => {
      const buf1 = Buffer.from('hello');
      const buf2 = Buffer.from('world');

      const result = CryptoUtils.xor(buf1, buf2);
      expect(result).toBeDefined();
      expect(result.length).toBe(5);

      // XOR twice should return original
      const original = CryptoUtils.xor(result, buf2);
      expect(original.toString()).toBe('hello');
    });

    test('should generate checksum', () => {
      const code = 'function test() { return 42; }';
      const checksum = CryptoUtils.checksum(code);

      expect(checksum).toBeDefined();
      expect(checksum.length).toBe(64);
    });

    test('should generate same checksum for normalized code', () => {
      const code1 = 'function test() { return 42; }';
      const code2 = 'function   test()  {  return  42;  }';

      const checksum1 = CryptoUtils.checksum(code1);
      const checksum2 = CryptoUtils.checksum(code2);

      expect(checksum1).toBe(checksum2);
    });
  });
});
