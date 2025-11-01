/**
 * CryptoShield Protection SDK
 * Enterprise-grade cryptographic protection against jailbreaking and reverse engineering
 *
 * @packageDocumentation
 */

export { CryptoShield } from './cryptoshield';
export { CryptoUtils } from './crypto/crypto-utils';
export { IntegrityVerifier } from './integrity/integrity-verifier';
export { AntiTamper } from './protection/anti-tamper';
export { RuntimeProtector } from './protection/runtime-protector';
export { KeyManager, FileSecureStorage, MemorySecureStorage } from './keymanager/key-manager';

export * from './types';

// Version
export const VERSION = '1.0.0';
