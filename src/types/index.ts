/**
 * CryptoShield Protection SDK Types
 * Comprehensive type definitions for cryptographic protection
 */

export interface ProtectionConfig {
  /** Unique application identifier */
  appId: string;

  /** Master encryption key (should be stored securely) */
  masterKey?: string;

  /** Enable code integrity verification */
  enableIntegrityCheck: boolean;

  /** Enable anti-debugging protection */
  enableAntiDebug: boolean;

  /** Enable anti-tampering protection */
  enableAntiTamper: boolean;

  /** Enable runtime memory encryption */
  enableMemoryEncryption: boolean;

  /** Custom integrity check interval (ms) */
  integrityCheckInterval?: number;

  /** Callback when tampering is detected */
  onTamperDetected?: (event: TamperEvent) => void;

  /** Callback when debugger is detected */
  onDebugDetected?: (event: DebugEvent) => void;
}

export interface TamperEvent {
  type: 'integrity_violation' | 'signature_mismatch' | 'checksum_failure' | 'memory_corruption';
  timestamp: number;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DebugEvent {
  type: 'debugger_attached' | 'breakpoint_detected' | 'profiler_detected';
  timestamp: number;
  details: string;
}

export interface EncryptedPayload {
  /** Encrypted data (base64) */
  data: string;

  /** Initialization vector (base64) */
  iv: string;

  /** Authentication tag for GCM mode (base64) */
  authTag: string;

  /** Algorithm used */
  algorithm: string;

  /** Timestamp of encryption */
  timestamp: number;
}

export interface IntegrityManifest {
  /** Application ID */
  appId: string;

  /** Version of the protected code */
  version: string;

  /** File checksums (SHA-256) */
  checksums: Record<string, string>;

  /** RSA signature of the manifest */
  signature: string;

  /** Public key for verification */
  publicKey: string;

  /** Timestamp */
  timestamp: number;
}

export interface ProtectedModule {
  /** Module identifier */
  id: string;

  /** Encrypted module code */
  code: EncryptedPayload;

  /** Module checksum */
  checksum: string;

  /** Dependencies */
  dependencies?: string[];
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface SecureStorage {
  /** Store encrypted value */
  set(key: string, value: string): Promise<void>;

  /** Retrieve and decrypt value */
  get(key: string): Promise<string | null>;

  /** Delete value */
  delete(key: string): Promise<void>;

  /** Clear all values */
  clear(): Promise<void>;
}
