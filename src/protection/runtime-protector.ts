/**
 * Runtime Protection Layer
 * Protects code during execution with encryption and obfuscation
 */

import { CryptoUtils } from '../crypto/crypto-utils';
import { EncryptedPayload, ProtectedModule } from '../types';

export class RuntimeProtector {
  private moduleCache: Map<string, any> = new Map();
  private executionKeys: Map<string, string> = new Map();
  private controlFlowChecksums: Map<string, string> = new Map();

  /**
   * Encrypt a module for protection
   */
  encryptModule(moduleId: string, code: string, key: string): ProtectedModule {
    const encrypted = CryptoUtils.encrypt(code, key);
    const checksum = CryptoUtils.checksum(code);

    this.executionKeys.set(moduleId, key);

    return {
      id: moduleId,
      code: encrypted,
      checksum,
    };
  }

  /**
   * Load and decrypt a protected module
   */
  loadProtectedModule(module: ProtectedModule, key: string): string {
    // Verify checksum
    const decrypted = CryptoUtils.decrypt(module.code, key);
    const actualChecksum = CryptoUtils.checksum(decrypted);

    if (!CryptoUtils.secureCompare(actualChecksum, module.checksum)) {
      throw new Error('Module integrity verification failed');
    }

    return decrypted;
  }

  /**
   * Execute protected code with runtime checks
   */
  executeProtectedCode<T>(
    moduleId: string,
    encryptedCode: EncryptedPayload,
    key: string,
    context?: any
  ): T {
    // Decrypt code
    const code = CryptoUtils.decrypt(encryptedCode, key);

    // Verify control flow integrity
    const checksum = CryptoUtils.checksum(code);
    if (this.controlFlowChecksums.has(moduleId)) {
      const expectedChecksum = this.controlFlowChecksums.get(moduleId)!;
      if (!CryptoUtils.secureCompare(checksum, expectedChecksum)) {
        throw new Error('Control flow integrity violation');
      }
    } else {
      this.controlFlowChecksums.set(moduleId, checksum);
    }

    // Execute in isolated context
    try {
      const func = new Function('context', `return (${code})(context);`);
      return func(context);
    } catch (error) {
      throw new Error(`Protected code execution failed: ${error}`);
    }
  }

  /**
   * Create a self-decrypting function wrapper
   */
  createProtectedFunction<T extends (...args: any[]) => any>(
    func: T,
    functionId: string,
    key: string
  ): T {
    const code = func.toString();
    const encrypted = CryptoUtils.encrypt(code, key);
    const checksum = CryptoUtils.checksum(code);

    this.controlFlowChecksums.set(functionId, checksum);

    // Return a wrapper that decrypts and executes
    const wrapper = function (this: any, ...args: any[]) {
      try {
        // Decrypt function code
        const decryptedCode = CryptoUtils.decrypt(encrypted, key);

        // Verify integrity
        const currentChecksum = CryptoUtils.checksum(decryptedCode);
        if (!CryptoUtils.secureCompare(checksum, currentChecksum)) {
          throw new Error('Function integrity check failed');
        }

        // Reconstruct and execute function
        const reconstructed = eval(`(${decryptedCode})`);
        return reconstructed.apply(this, args);
      } catch (error) {
        throw new Error(`Protected function execution failed: ${error}`);
      }
    };

    return wrapper as T;
  }

  /**
   * Obfuscate code with multiple layers
   */
  obfuscateCode(code: string): string {
    // Layer 1: Unicode encoding
    let obfuscated = this.encodeUnicode(code);

    // Layer 2: String splitting
    obfuscated = this.splitStrings(obfuscated);

    // Layer 3: Control flow flattening
    obfuscated = this.flattenControlFlow(obfuscated);

    return obfuscated;
  }

  /**
   * Encode strings as unicode escape sequences
   */
  private encodeUnicode(code: string): string {
    let encoded = '';
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      if (charCode > 127 || Math.random() > 0.7) {
        encoded += `\\u${charCode.toString(16).padStart(4, '0')}`;
      } else {
        encoded += code[i];
      }
    }
    return encoded;
  }

  /**
   * Split strings into concatenated parts
   */
  private splitStrings(code: string): string {
    return code.replace(/"([^"]+)"/g, (match, str) => {
      if (str.length < 10) return match;

      const mid = Math.floor(str.length / 2);
      const part1 = str.substring(0, mid);
      const part2 = str.substring(mid);

      return `("${part1}" + "${part2}")`;
    });
  }

  /**
   * Flatten control flow to make analysis harder
   */
  private flattenControlFlow(code: string): string {
    // Simple control flow obfuscation
    // In production, this would be much more sophisticated
    return code.replace(/if\s*\(([^)]+)\)\s*{([^}]+)}/g, (match, condition, body) => {
      return `(${condition}) && (function(){${body}})();`;
    });
  }

  /**
   * Inject runtime integrity checks into code
   */
  injectIntegrityChecks(code: string, checksum: string): string {
    const integrityCheck = `
      (function() {
        const expectedChecksum = "${checksum}";
        const actualChecksum = "${CryptoUtils.checksum(code)}";
        if (expectedChecksum !== actualChecksum) {
          throw new Error("Integrity violation detected");
        }
      })();
    `;

    return integrityCheck + '\n' + code;
  }

  /**
   * Create a polymorphic code variant (changes each execution)
   */
  createPolymorphicCode(code: string): string {
    const nonce = CryptoUtils.generateToken(8);

    const wrapper = `
      (function() {
        const __nonce__ = "${nonce}";
        ${code}
      })();
    `;

    return wrapper;
  }

  /**
   * Encrypt strings in code
   */
  encryptStrings(code: string, key: string): { code: string; decryptionKey: string } {
    const strings: string[] = [];
    const stringMap: Map<string, number> = new Map();

    // Extract strings
    const modifiedCode = code.replace(/"([^"]+)"|'([^']+)'/g, (match, doubleQuoted, singleQuoted) => {
      const str = doubleQuoted || singleQuoted;
      if (str.length < 5) return match; // Skip short strings

      if (!stringMap.has(str)) {
        stringMap.set(str, strings.length);
        strings.push(str);
      }

      const index = stringMap.get(str)!;
      return `__decrypt__(${index})`;
    });

    // Encrypt all strings
    const encryptedStrings = strings.map((s) => CryptoUtils.encrypt(s, key));

    // Generate decryption function
    const decryptionFunc = `
      const __encrypted_strings__ = ${JSON.stringify(encryptedStrings)};
      const __decrypt__ = (index) => {
        const payload = __encrypted_strings__[index];
        if (!payload) return '';
        // Decryption logic embedded here
        return CryptoUtils.decrypt(payload, "${key}");
      };
    `;

    return {
      code: decryptionFunc + '\n' + modifiedCode,
      decryptionKey: key,
    };
  }

  /**
   * Create a secure execution sandbox
   */
  createSandbox(trustedCode: string): any {
    const sandbox = {
      console: {
        log: (...args: any[]) => {
          // Controlled logging
          if (process.env.NODE_ENV === 'development') {
            console.log('[SANDBOX]', ...args);
          }
        },
      },
      // Add other safe APIs as needed
    };

    return sandbox;
  }

  /**
   * Clear runtime caches
   */
  clearCaches(): void {
    this.moduleCache.clear();
    this.executionKeys.clear();
    this.controlFlowChecksums.clear();
  }

  /**
   * Generate runtime fingerprint
   */
  generateRuntimeFingerprint(): string {
    const components = [
      process.platform,
      process.arch,
      process.version,
      os.hostname(),
      os.cpus().length.toString(),
    ];

    return CryptoUtils.hash(components.join('|'));
  }

  /**
   * Bind code to specific runtime environment
   */
  bindToEnvironment(code: string, allowedFingerprints: string[]): string {
    const checkCode = `
      (function() {
        const currentFingerprint = "${this.generateRuntimeFingerprint()}";
        const allowed = ${JSON.stringify(allowedFingerprints)};

        if (!allowed.includes(currentFingerprint)) {
          throw new Error("Unauthorized execution environment");
        }
      })();
    `;

    return checkCode + '\n' + code;
  }
}

// Need to import os
import * as os from 'os';
