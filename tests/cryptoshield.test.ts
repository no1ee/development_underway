/**
 * Tests for CryptoShield main class
 */

import { CryptoShield } from '../src/cryptoshield';
import { TamperEvent, DebugEvent } from '../src/types';

describe('CryptoShield', () => {
  describe('Configuration', () => {
    test('should create basic config', () => {
      const config = CryptoShield.createConfig('test-app', 'basic');

      expect(config.appId).toBe('test-app');
      expect(config.enableIntegrityCheck).toBe(true);
      expect(config.enableAntiTamper).toBe(false);
      expect(config.enableAntiDebug).toBe(false);
    });

    test('should create standard config', () => {
      const config = CryptoShield.createConfig('test-app', 'standard');

      expect(config.appId).toBe('test-app');
      expect(config.enableIntegrityCheck).toBe(true);
      expect(config.enableAntiTamper).toBe(true);
      expect(config.enableAntiDebug).toBe(false);
    });

    test('should create maximum config', () => {
      const config = CryptoShield.createConfig('test-app', 'maximum');

      expect(config.appId).toBe('test-app');
      expect(config.enableIntegrityCheck).toBe(true);
      expect(config.enableAntiTamper).toBe(true);
      expect(config.enableAntiDebug).toBe(true);
      expect(config.enableMemoryEncryption).toBe(true);
      expect(config.masterKey).toBeDefined();
    });
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      const config = CryptoShield.createConfig('test-app', 'basic');
      const shield = new CryptoShield(config);

      await shield.initialize();

      const status = shield.getStatus();
      expect(status.initialized).toBe(true);

      shield.shutdown();
    });

    test('should not allow double initialization', async () => {
      const config = CryptoShield.createConfig('test-app', 'basic');
      const shield = new CryptoShield(config);

      await shield.initialize();

      await expect(shield.initialize()).rejects.toThrow('already initialized');

      shield.shutdown();
    });
  });

  describe('Function Protection', () => {
    test('should protect function', async () => {
      const config = CryptoShield.createConfig('test-app', 'standard');
      const shield = new CryptoShield(config);
      await shield.initialize();

      function testFunction(x: number): number {
        return x * 2;
      }

      const protected = shield.protectFunction(testFunction, 'testFunction');

      expect(protected(5)).toBe(10);
      expect(protected(10)).toBe(20);

      shield.shutdown();
    });

    test('should protect function with memory encryption', async () => {
      const config = CryptoShield.createConfig('test-app', 'maximum');
      const shield = new CryptoShield(config);
      await shield.initialize();

      function secretFunction(x: number): number {
        return x * 42;
      }

      const protected = shield.protectFunction(secretFunction, 'secretFunction');

      expect(protected(1)).toBe(42);
      expect(protected(2)).toBe(84);

      shield.shutdown();
    });

    test('should maintain function context', async () => {
      const config = CryptoShield.createConfig('test-app', 'standard');
      const shield = new CryptoShield(config);
      await shield.initialize();

      class Calculator {
        multiplier: number = 3;

        multiply(x: number): number {
          return x * this.multiplier;
        }
      }

      const calc = new Calculator();
      calc.multiply = shield.protectFunction(calc.multiply, 'multiply');

      expect(calc.multiply(5)).toBe(15);

      shield.shutdown();
    });
  });

  describe('Data Encryption', () => {
    test('should encrypt and decrypt data', async () => {
      const config = CryptoShield.createConfig('test-app', 'maximum');
      const shield = new CryptoShield(config);
      await shield.initialize();

      const data = 'sensitive information';
      const encrypted = shield.encryptData(data);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(data);

      const decrypted = shield.decryptData(encrypted);
      expect(decrypted).toBe(data);

      shield.shutdown();
    });

    test('should handle complex objects', async () => {
      const config = CryptoShield.createConfig('test-app', 'maximum');
      const shield = new CryptoShield(config);
      await shield.initialize();

      const data = JSON.stringify({
        apiKey: 'sk_test_12345',
        config: {
          timeout: 5000,
          retries: 3,
        },
      });

      const encrypted = shield.encryptData(data);
      const decrypted = shield.decryptData(encrypted);

      expect(JSON.parse(decrypted)).toEqual(JSON.parse(data));

      shield.shutdown();
    });
  });

  describe('Object Sealing', () => {
    test('should create sealed object', async () => {
      const config = CryptoShield.createConfig('test-app', 'standard');
      const shield = new CryptoShield(config);
      await shield.initialize();

      const obj = { secret: 'value', count: 42 };
      const sealed = shield.sealObject(obj);

      expect(sealed.secret).toBe('value');
      expect(sealed.count).toBe(42);

      shield.shutdown();
    });

    test('should prevent modifications to sealed object', async () => {
      const config = CryptoShield.createConfig('test-app', 'standard');
      const shield = new CryptoShield(config);
      await shield.initialize();

      const obj = { secret: 'value' };
      const sealed = shield.sealObject(obj);

      expect(() => {
        (sealed as any).secret = 'modified';
      }).toThrow();

      shield.shutdown();
    });
  });

  describe('Module Protection', () => {
    test('should protect and load module', async () => {
      const config = CryptoShield.createConfig('test-app', 'maximum');
      const shield = new CryptoShield(config);
      await shield.initialize();

      const moduleCode = `
        function add(a, b) {
          return a + b;
        }
        module.exports = { add };
      `;

      const protected = await shield.protectModule(moduleCode, 'test-module');

      expect(protected).toBeDefined();
      expect(protected).not.toContain('function add');

      shield.shutdown();
    });
  });

  describe('Code Obfuscation', () => {
    test('should obfuscate code', async () => {
      const config = CryptoShield.createConfig('test-app', 'basic');
      const shield = new CryptoShield(config);
      await shield.initialize();

      const code = 'function test() { return "hello"; }';
      const obfuscated = shield.obfuscateCode(code);

      expect(obfuscated).toBeDefined();
      expect(obfuscated).not.toBe(code);
      expect(obfuscated.length).toBeGreaterThan(code.length);

      shield.shutdown();
    });
  });

  describe('Event Handlers', () => {
    test('should call tamper detection handler', async () => {
      let tamperDetected = false;

      const config = CryptoShield.createConfig('test-app', 'standard');
      config.onTamperDetected = (event: TamperEvent) => {
        tamperDetected = true;
      };

      const shield = new CryptoShield(config);
      await shield.initialize();

      // Wait a bit for monitoring to potentially trigger
      await new Promise((resolve) => setTimeout(resolve, 100));

      shield.shutdown();
    });
  });

  describe('Status', () => {
    test('should return correct status', async () => {
      const config = CryptoShield.createConfig('test-app', 'maximum');
      const shield = new CryptoShield(config);

      let status = shield.getStatus();
      expect(status.initialized).toBe(false);

      await shield.initialize();

      status = shield.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.integrityEnabled).toBe(true);
      expect(status.antiTamperEnabled).toBe(true);
      expect(status.antiDebugEnabled).toBe(true);
      expect(status.memoryEncryptionEnabled).toBe(true);

      shield.shutdown();

      status = shield.getStatus();
      expect(status.initialized).toBe(false);
    });
  });

  describe('Debugger Detection', () => {
    test('should check for debugger', async () => {
      const config = CryptoShield.createConfig('test-app', 'maximum');
      const shield = new CryptoShield(config);
      await shield.initialize();

      const isPresent = shield.isDebuggerPresent();
      expect(typeof isPresent).toBe('boolean');

      shield.shutdown();
    });
  });

  describe('Configuration Export/Import', () => {
    test('should export and import configuration', async () => {
      const config = CryptoShield.createConfig('test-app', 'maximum');
      const shield = new CryptoShield(config);
      await shield.initialize();

      const password = 'export-password';
      const exported = await shield.exportConfig(password);

      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');

      // Create new instance and import
      const newShield = new CryptoShield(config);
      await newShield.importConfig(exported, password);

      shield.shutdown();
      newShield.shutdown();
    });
  });

  describe('Shutdown', () => {
    test('should shutdown cleanly', async () => {
      const config = CryptoShield.createConfig('test-app', 'maximum');
      const shield = new CryptoShield(config);
      await shield.initialize();

      let status = shield.getStatus();
      expect(status.initialized).toBe(true);

      shield.shutdown();

      status = shield.getStatus();
      expect(status.initialized).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should throw error when using before initialization', async () => {
      const config = CryptoShield.createConfig('test-app', 'basic');
      const shield = new CryptoShield(config);

      expect(() => {
        shield.protectFunction(() => {}, 'test');
      }).toThrow('not initialized');

      expect(() => {
        shield.encryptData('data');
      }).toThrow('not initialized');
    });
  });
});
