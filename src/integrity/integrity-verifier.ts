/**
 * Code Integrity Verification System
 * Verifies that code has not been tampered with
 */

import { CryptoUtils } from '../crypto/crypto-utils';
import { IntegrityManifest, TamperEvent } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class IntegrityVerifier {
  private manifest: IntegrityManifest | null = null;
  private checksumCache: Map<string, string> = new Map();
  private verificationInterval: NodeJS.Timeout | null = null;
  private onTamperDetected?: (event: TamperEvent) => void;

  constructor(onTamperDetected?: (event: TamperEvent) => void) {
    this.onTamperDetected = onTamperDetected;
  }

  /**
   * Generate integrity manifest for files
   */
  static async generateManifest(
    appId: string,
    version: string,
    filePaths: string[],
    privateKey: string,
    publicKey: string
  ): Promise<IntegrityManifest> {
    const checksums: Record<string, string> = {};

    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        checksums[filePath] = CryptoUtils.checksum(content);
      }
    }

    const manifestData = JSON.stringify({
      appId,
      version,
      checksums,
      timestamp: Date.now(),
    });

    const signature = CryptoUtils.sign(manifestData, privateKey);

    return {
      appId,
      version,
      checksums,
      signature,
      publicKey,
      timestamp: Date.now(),
    };
  }

  /**
   * Load and verify integrity manifest
   */
  loadManifest(manifest: IntegrityManifest): boolean {
    // Verify manifest signature
    const manifestData = JSON.stringify({
      appId: manifest.appId,
      version: manifest.version,
      checksums: manifest.checksums,
      timestamp: manifest.timestamp,
    });

    const isValid = CryptoUtils.verify(manifestData, manifest.signature, manifest.publicKey);

    if (!isValid) {
      this.reportTamper({
        type: 'signature_mismatch',
        timestamp: Date.now(),
        details: 'Integrity manifest signature verification failed',
        severity: 'critical',
      });
      return false;
    }

    this.manifest = manifest;
    return true;
  }

  /**
   * Verify file integrity against manifest
   */
  verifyFile(filePath: string): boolean {
    if (!this.manifest) {
      throw new Error('No manifest loaded');
    }

    const expectedChecksum = this.manifest.checksums[filePath];
    if (!expectedChecksum) {
      return true; // File not in manifest, skip verification
    }

    // Check cache first
    if (this.checksumCache.has(filePath)) {
      const cachedChecksum = this.checksumCache.get(filePath)!;
      if (cachedChecksum !== expectedChecksum) {
        this.reportTamper({
          type: 'checksum_failure',
          timestamp: Date.now(),
          details: `File integrity check failed: ${filePath}`,
          severity: 'high',
        });
        return false;
      }
      return true;
    }

    // Calculate and verify checksum
    if (!fs.existsSync(filePath)) {
      this.reportTamper({
        type: 'integrity_violation',
        timestamp: Date.now(),
        details: `Protected file missing: ${filePath}`,
        severity: 'critical',
      });
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const actualChecksum = CryptoUtils.checksum(content);

    this.checksumCache.set(filePath, actualChecksum);

    if (!CryptoUtils.secureCompare(actualChecksum, expectedChecksum)) {
      this.reportTamper({
        type: 'checksum_failure',
        timestamp: Date.now(),
        details: `File checksum mismatch: ${filePath}`,
        severity: 'high',
      });
      return false;
    }

    return true;
  }

  /**
   * Verify all files in manifest
   */
  verifyAll(): boolean {
    if (!this.manifest) {
      throw new Error('No manifest loaded');
    }

    let allValid = true;
    for (const filePath of Object.keys(this.manifest.checksums)) {
      if (!this.verifyFile(filePath)) {
        allValid = false;
      }
    }

    return allValid;
  }

  /**
   * Verify runtime code integrity
   */
  verifyRuntimeCode(functionName: string, functionCode: string): boolean {
    const checksum = CryptoUtils.checksum(functionCode);
    const cacheKey = `runtime:${functionName}`;

    if (this.checksumCache.has(cacheKey)) {
      const expectedChecksum = this.checksumCache.get(cacheKey)!;
      if (!CryptoUtils.secureCompare(checksum, expectedChecksum)) {
        this.reportTamper({
          type: 'memory_corruption',
          timestamp: Date.now(),
          details: `Runtime code modified: ${functionName}`,
          severity: 'critical',
        });
        return false;
      }
    } else {
      this.checksumCache.set(cacheKey, checksum);
    }

    return true;
  }

  /**
   * Start continuous integrity monitoring
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.verificationInterval) {
      return; // Already monitoring
    }

    this.verificationInterval = setInterval(() => {
      this.verifyAll();
    }, intervalMs);
  }

  /**
   * Stop integrity monitoring
   */
  stopMonitoring(): void {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
      this.verificationInterval = null;
    }
  }

  /**
   * Clear checksum cache
   */
  clearCache(): void {
    this.checksumCache.clear();
  }

  /**
   * Report tampering event
   */
  private reportTamper(event: TamperEvent): void {
    if (this.onTamperDetected) {
      this.onTamperDetected(event);
    }
  }

  /**
   * Get manifest info
   */
  getManifest(): IntegrityManifest | null {
    return this.manifest;
  }
}
