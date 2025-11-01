/**
 * CryptoShield - Main Protection SDK
 * Easy-to-integrate cryptographic protection for any software
 */

import { ProtectionConfig, TamperEvent, DebugEvent, IntegrityManifest } from './types';
import { CryptoUtils } from './crypto/crypto-utils';
import { IntegrityVerifier } from './integrity/integrity-verifier';
import { AntiTamper } from './protection/anti-tamper';
import { RuntimeProtector } from './protection/runtime-protector';
import { KeyManager } from './keymanager/key-manager';

export class CryptoShield {
  private config: ProtectionConfig;
  private integrityVerifier: IntegrityVerifier;
  private antiTamper: AntiTamper;
  private runtimeProtector: RuntimeProtector;
  private keyManager: KeyManager;
  private isInitialized: boolean = false;

  constructor(config: ProtectionConfig) {
    this.config = config;

    // Initialize components
    this.integrityVerifier = new IntegrityVerifier(config.onTamperDetected);
    this.antiTamper = new AntiTamper(config.onDebugDetected, config.onTamperDetected);
    this.runtimeProtector = new RuntimeProtector();

    // Initialize key manager with master key or generate one
    const masterKey = config.masterKey || CryptoUtils.generateKey();
    this.keyManager = new KeyManager(masterKey);
  }

  /**
   * Initialize protection system
   */
  async initialize(manifest?: IntegrityManifest): Promise<void> {
    if (this.isInitialized) {
      throw new Error('CryptoShield already initialized');
    }

    // Load integrity manifest if provided
    if (manifest && this.config.enableIntegrityCheck) {
      const isValid = this.integrityVerifier.loadManifest(manifest);
      if (!isValid) {
        throw new Error('Failed to load integrity manifest');
      }

      // Start continuous integrity monitoring
      const interval = this.config.integrityCheckInterval || 5000;
      this.integrityVerifier.startMonitoring(interval);
    }

    // Start anti-tampering protection
    if (this.config.enableAntiTamper || this.config.enableAntiDebug) {
      this.antiTamper.startMonitoring(3000);
    }

    this.isInitialized = true;
  }

  /**
   * Protect a function with all security layers
   */
  protectFunction<T extends (...args: any[]) => any>(
    func: T,
    functionName: string
  ): T {
    this.ensureInitialized();

    let protected = func;

    // Layer 1: Anti-tampering wrapper
    if (this.config.enableAntiTamper) {
      protected = this.antiTamper.protectFunction(protected, functionName);
    }

    // Layer 2: Runtime encryption
    if (this.config.enableMemoryEncryption) {
      const key = CryptoUtils.generateKey();
      protected = this.runtimeProtector.createProtectedFunction(
        protected,
        functionName,
        key
      );
    }

    return protected;
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data: string): string {
    this.ensureInitialized();

    const key = this.config.masterKey || CryptoUtils.generateKey();
    const encrypted = CryptoUtils.encrypt(data, key);

    return JSON.stringify(encrypted);
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData: string): string {
    this.ensureInitialized();

    const key = this.config.masterKey;
    if (!key) {
      throw new Error('Master key not configured');
    }

    const payload = JSON.parse(encryptedData);
    return CryptoUtils.decrypt(payload, key);
  }

  /**
   * Protect an entire module
   */
  async protectModule(moduleCode: string, moduleId: string): Promise<string> {
    this.ensureInitialized();

    // Generate encryption key for this module
    const key = await this.keyManager.generateKey(moduleId);

    // Encrypt the module
    const protectedModule = this.runtimeProtector.encryptModule(moduleId, moduleCode, key);

    return JSON.stringify(protectedModule);
  }

  /**
   * Load and execute a protected module
   */
  async loadProtectedModule(protectedModuleJson: string, moduleId: string): Promise<any> {
    this.ensureInitialized();

    const protectedModule = JSON.parse(protectedModuleJson);
    const key = await this.keyManager.getKey(moduleId);

    if (!key) {
      throw new Error('Module key not found');
    }

    const code = this.runtimeProtector.loadProtectedModule(protectedModule, key);

    // Execute in sandbox
    return this.runtimeProtector.executeProtectedCode(moduleId, protectedModule.code, key);
  }

  /**
   * Obfuscate code
   */
  obfuscateCode(code: string): string {
    return this.runtimeProtector.obfuscateCode(code);
  }

  /**
   * Create a sealed object that cannot be modified
   */
  sealObject<T extends object>(obj: T): T {
    this.ensureInitialized();
    return this.antiTamper.sealObject(obj);
  }

  /**
   * Verify file integrity
   */
  verifyFileIntegrity(filePath: string): boolean {
    if (!this.config.enableIntegrityCheck) {
      return true;
    }
    return this.integrityVerifier.verifyFile(filePath);
  }

  /**
   * Check if debugger is present
   */
  isDebuggerPresent(): boolean {
    return this.antiTamper.isDebuggerAttached();
  }

  /**
   * Generate integrity manifest for files
   */
  static async generateManifest(
    appId: string,
    version: string,
    filePaths: string[]
  ): Promise<{ manifest: IntegrityManifest; privateKey: string }> {
    const keyPair = CryptoUtils.generateKeyPair();

    const manifest = await IntegrityVerifier.generateManifest(
      appId,
      version,
      filePaths,
      keyPair.privateKey,
      keyPair.publicKey
    );

    return {
      manifest,
      privateKey: keyPair.privateKey,
    };
  }

  /**
   * Export protection configuration (for backup)
   */
  async exportConfig(password: string): Promise<string> {
    const configData = {
      appId: this.config.appId,
      manifest: this.integrityVerifier.getManifest(),
      keys: await this.keyManager.exportKeys(password),
    };

    const { payload, salt } = CryptoUtils.encryptWithPassword(
      JSON.stringify(configData),
      password
    );

    return JSON.stringify({ payload, salt });
  }

  /**
   * Import protection configuration
   */
  async importConfig(encryptedConfig: string, password: string): Promise<void> {
    const { payload, salt } = JSON.parse(encryptedConfig);
    const decrypted = CryptoUtils.decryptWithPassword(payload, password, salt);
    const configData = JSON.parse(decrypted);

    // Import keys
    await this.keyManager.importKeys(configData.keys, password);

    // Load manifest
    if (configData.manifest) {
      this.integrityVerifier.loadManifest(configData.manifest);
    }
  }

  /**
   * Shutdown protection system
   */
  shutdown(): void {
    this.integrityVerifier.stopMonitoring();
    this.antiTamper.stopMonitoring();
    this.runtimeProtector.clearCaches();
    this.keyManager.clearCache();
    this.isInitialized = false;
  }

  /**
   * Get protection status
   */
  getStatus(): {
    initialized: boolean;
    integrityEnabled: boolean;
    antiTamperEnabled: boolean;
    antiDebugEnabled: boolean;
    memoryEncryptionEnabled: boolean;
  } {
    return {
      initialized: this.isInitialized,
      integrityEnabled: this.config.enableIntegrityCheck,
      antiTamperEnabled: this.config.enableAntiTamper,
      antiDebugEnabled: this.config.enableAntiDebug,
      memoryEncryptionEnabled: this.config.enableMemoryEncryption,
    };
  }

  /**
   * Ensure system is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('CryptoShield not initialized. Call initialize() first.');
    }
  }

  /**
   * Create quick protection preset configurations
   */
  static createConfig(appId: string, level: 'basic' | 'standard' | 'maximum'): ProtectionConfig {
    const baseConfig: ProtectionConfig = {
      appId,
      enableIntegrityCheck: false,
      enableAntiDebug: false,
      enableAntiTamper: false,
      enableMemoryEncryption: false,
    };

    switch (level) {
      case 'basic':
        return {
          ...baseConfig,
          enableIntegrityCheck: true,
        };

      case 'standard':
        return {
          ...baseConfig,
          enableIntegrityCheck: true,
          enableAntiTamper: true,
        };

      case 'maximum':
        return {
          ...baseConfig,
          masterKey: CryptoUtils.generateKey(),
          enableIntegrityCheck: true,
          enableAntiDebug: true,
          enableAntiTamper: true,
          enableMemoryEncryption: true,
          integrityCheckInterval: 3000,
          onTamperDetected: (event: TamperEvent) => {
            console.error('[CRYPTOSHIELD] TAMPER DETECTED:', event);
            // In production: terminate application
            process.exit(1);
          },
          onDebugDetected: (event: DebugEvent) => {
            console.error('[CRYPTOSHIELD] DEBUGGER DETECTED:', event);
            // In production: terminate application
            process.exit(1);
          },
        };

      default:
        return baseConfig;
    }
  }
}

// Export utility classes for advanced usage
export { CryptoUtils } from './crypto/crypto-utils';
export { IntegrityVerifier } from './integrity/integrity-verifier';
export { AntiTamper } from './protection/anti-tamper';
export { RuntimeProtector } from './protection/runtime-protector';
export { KeyManager } from './keymanager/key-manager';

// Export types
export * from './types';
