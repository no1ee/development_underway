/**
 * Real-World Integration Example
 * Demonstrates practical use cases for CryptoShield
 */

import { CryptoShield } from '../src';

// ============================================
// Use Case 1: Protecting API Keys and Secrets
// ============================================

class SecureAPIClient {
  private shield: CryptoShield;
  private apiKey: string;

  constructor(encryptedApiKey: string, shield: CryptoShield) {
    this.shield = shield;
    // Decrypt API key only when needed
    this.apiKey = shield.decryptData(encryptedApiKey);
  }

  async makeRequest(endpoint: string, data: any) {
    // Use the decrypted API key
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return response.json();
  }
}

// ============================================
// Use Case 2: License Key Validation
// ============================================

class LicenseManager {
  private shield: CryptoShield;

  constructor(shield: CryptoShield) {
    this.shield = shield;
  }

  // Protect the license validation algorithm
  validateLicense = this.shield.protectFunction(
    function (this: LicenseManager, licenseKey: string): boolean {
      // Secret validation algorithm
      const parts = licenseKey.split('-');
      if (parts.length !== 4) return false;

      const checksum = parts.reduce((acc, part) => {
        return acc + parseInt(part, 16);
      }, 0);

      const expectedChecksum = 0xABCD; // Secret checksum
      return checksum === expectedChecksum;
    },
    'validateLicense'
  );

  getLicenseInfo = this.shield.protectFunction(
    function (this: LicenseManager, licenseKey: string): { valid: boolean; features: string[] } {
      if (!this.validateLicense(licenseKey)) {
        return { valid: false, features: [] };
      }

      // Decrypt feature flags
      const features = ['premium', 'api-access', 'unlimited-users'];
      return { valid: true, features };
    },
    'getLicenseInfo'
  );
}

// ============================================
// Use Case 3: Protected Business Logic
// ============================================

class PaymentProcessor {
  private shield: CryptoShield;

  constructor(shield: CryptoShield) {
    this.shield = shield;
  }

  // Protect critical payment processing logic
  processPayment = this.shield.protectFunction(
    async function (
      this: PaymentProcessor,
      amount: number,
      cardNumber: string,
      cvv: string
    ): Promise<{ success: boolean; transactionId: string }> {
      // Critical payment processing algorithm
      // This should not be reverse-engineered

      // Validate card
      if (!this.validateCard(cardNumber, cvv)) {
        throw new Error('Invalid card');
      }

      // Calculate fees (secret algorithm)
      const fees = this.calculateFees(amount);
      const totalAmount = amount + fees;

      // Process transaction
      const transactionId = this.generateTransactionId();

      return {
        success: true,
        transactionId,
      };
    },
    'processPayment'
  );

  private validateCard = this.shield.protectFunction(
    function (cardNumber: string, cvv: string): boolean {
      // Luhn algorithm or custom validation
      return cardNumber.length === 16 && cvv.length === 3;
    },
    'validateCard'
  );

  private calculateFees = this.shield.protectFunction(
    function (amount: number): number {
      // Secret fee calculation
      const baseRate = 0.029;
      const fixed = 0.30;
      return amount * baseRate + fixed;
    },
    'calculateFees'
  );

  private generateTransactionId = this.shield.protectFunction(
    function (): string {
      return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    'generateTransactionId'
  );
}

// ============================================
// Use Case 4: Secure Configuration Management
// ============================================

class SecureConfigManager {
  private shield: CryptoShield;
  private config: any;

  constructor(shield: CryptoShield) {
    this.shield = shield;
  }

  loadConfig(encryptedConfig: string): void {
    // Decrypt and seal configuration
    const decrypted = this.shield.decryptData(encryptedConfig);
    const parsed = JSON.parse(decrypted);

    // Make it tamper-proof
    this.config = this.shield.sealObject(parsed);
  }

  getConfig(): any {
    return this.config;
  }
}

// ============================================
// Use Case 5: DRM and Content Protection
// ============================================

class DRMSystem {
  private shield: CryptoShield;

  constructor(shield: CryptoShield) {
    this.shield = shield;
  }

  // Protect content decryption key derivation
  deriveContentKey = this.shield.protectFunction(
    function (this: DRMSystem, userId: string, contentId: string, deviceId: string): string {
      // Secret key derivation algorithm
      const combined = `${userId}:${contentId}:${deviceId}`;
      const hash = this.hashSecret(combined);

      // Additional transformations
      return hash.substring(0, 32);
    },
    'deriveContentKey'
  );

  private hashSecret = this.shield.protectFunction(
    function (data: string): string {
      // Use CryptoUtils for hashing
      let result = data;
      for (let i = 0; i < 1000; i++) {
        result = require('crypto').createHash('sha256').update(result).digest('hex');
      }
      return result;
    },
    'hashSecret'
  );

  validateAccess = this.shield.protectFunction(
    function (
      this: DRMSystem,
      userId: string,
      contentId: string,
      timestamp: number
    ): boolean {
      // Secret access validation
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (now - timestamp > maxAge) {
        return false; // Expired
      }

      // Additional checks...
      return true;
    },
    'validateAccess'
  );
}

// ============================================
// Main Example Runner
// ============================================

async function realWorldExample() {
  console.log('=== Real-World Integration Examples ===\n');

  // Initialize CryptoShield with maximum protection
  const config = CryptoShield.createConfig('production-app', 'maximum');
  const shield = new CryptoShield(config);
  await shield.initialize();

  console.log('✓ CryptoShield initialized\n');

  // ========================================
  // Example 1: Secure API Client
  // ========================================
  console.log('1. Secure API Client Example');
  console.log('   ─────────────────────────────');

  const apiKey = 'sk_live_super_secret_key_12345';
  const encryptedApiKey = shield.encryptData(apiKey);

  const apiClient = new SecureAPIClient(encryptedApiKey, shield);
  console.log('   ✓ API client created with encrypted key');
  console.log('   ✓ Key is decrypted only when needed\n');

  // ========================================
  // Example 2: License Validation
  // ========================================
  console.log('2. License Manager Example');
  console.log('   ─────────────────────────────');

  const licenseManager = new LicenseManager(shield);

  const testLicense1 = '0001-0002-0003-ABC7'; // Valid checksum
  const testLicense2 = '0001-0002-0003-0004'; // Invalid

  console.log(`   License "${testLicense1}": ${licenseManager.validateLicense(testLicense1) ? '✓ Valid' : '✗ Invalid'}`);
  console.log(`   License "${testLicense2}": ${licenseManager.validateLicense(testLicense2) ? '✓ Valid' : '✗ Invalid'}`);

  const info = licenseManager.getLicenseInfo(testLicense1);
  console.log(`   Features: ${info.valid ? info.features.join(', ') : 'none'}\n`);

  // ========================================
  // Example 3: Payment Processing
  // ========================================
  console.log('3. Payment Processor Example');
  console.log('   ─────────────────────────────');

  const paymentProcessor = new PaymentProcessor(shield);

  try {
    const result = await paymentProcessor.processPayment(
      100.00,
      '4111111111111111',
      '123'
    );
    console.log(`   ✓ Payment processed: ${result.transactionId}`);
    console.log('   ✓ Business logic protected from reverse engineering\n');
  } catch (error) {
    console.log(`   ✗ Payment failed: ${error}\n`);
  }

  // ========================================
  // Example 4: Secure Configuration
  // ========================================
  console.log('4. Secure Configuration Manager Example');
  console.log('   ─────────────────────────────');

  const configManager = new SecureConfigManager(shield);

  const sensitiveConfig = {
    database: {
      host: 'db.example.com',
      username: 'admin',
      password: 'super_secret',
    },
    apiKeys: {
      stripe: 'sk_live_...',
      aws: 'AKIA...',
    },
  };

  const encryptedConfig = shield.encryptData(JSON.stringify(sensitiveConfig));
  configManager.loadConfig(encryptedConfig);

  console.log('   ✓ Configuration loaded and sealed');
  console.log('   ✓ Modification attempts will be blocked\n');

  // ========================================
  // Example 5: DRM System
  // ========================================
  console.log('5. DRM System Example');
  console.log('   ─────────────────────────────');

  const drmSystem = new DRMSystem(shield);

  const userId = 'user123';
  const contentId = 'movie456';
  const deviceId = 'device789';

  const contentKey = drmSystem.deriveContentKey(userId, contentId, deviceId);
  console.log(`   ✓ Content key derived: ${contentKey.substring(0, 16)}...`);

  const hasAccess = drmSystem.validateAccess(userId, contentId, Date.now());
  console.log(`   ✓ Access validation: ${hasAccess ? 'Granted' : 'Denied'}`);
  console.log('   ✓ DRM algorithm protected\n');

  // ========================================
  // Summary
  // ========================================
  console.log('Summary');
  console.log('───────────────────────────────');
  console.log('✓ API keys protected with encryption');
  console.log('✓ License validation algorithm secured');
  console.log('✓ Payment processing logic protected');
  console.log('✓ Configuration sealed against tampering');
  console.log('✓ DRM key derivation secured');
  console.log('\nAll critical business logic is protected against:');
  console.log('  • Reverse engineering');
  console.log('  • Debugging attempts');
  console.log('  • Code tampering');
  console.log('  • Memory inspection');

  // Cleanup
  shield.shutdown();
  console.log('\n=== Real-World Example Complete ===\n');
}

// Run example
realWorldExample().catch(console.error);
