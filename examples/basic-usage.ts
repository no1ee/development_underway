/**
 * Basic Usage Example
 * Demonstrates simple integration of CryptoShield
 */

import { CryptoShield } from '../src';

async function basicExample() {
  console.log('=== CryptoShield Basic Usage Example ===\n');

  // Step 1: Create protection configuration
  console.log('1. Creating protection configuration...');
  const config = CryptoShield.createConfig('my-app', 'standard');

  // Step 2: Initialize CryptoShield
  console.log('2. Initializing CryptoShield...');
  const shield = new CryptoShield(config);
  await shield.initialize();

  // Step 3: Protect a function
  console.log('3. Protecting a sensitive function...');

  function calculateSecretValue(input: number): number {
    // This is sensitive business logic that should be protected
    const secret = 42;
    return input * secret + Math.random() * 100;
  }

  const protectedFunction = shield.protectFunction(calculateSecretValue, 'calculateSecretValue');

  // Step 4: Use the protected function
  console.log('4. Using protected function...');
  const result = protectedFunction(10);
  console.log(`   Result: ${result}\n`);

  // Step 5: Encrypt sensitive data
  console.log('5. Encrypting sensitive data...');
  const sensitiveData = JSON.stringify({
    apiKey: 'sk_live_abc123',
    secret: 'my-secret-value',
  });

  const encrypted = shield.encryptData(sensitiveData);
  console.log(`   Encrypted: ${encrypted.substring(0, 50)}...`);

  // Step 6: Decrypt data
  console.log('6. Decrypting data...');
  const decrypted = shield.decryptData(encrypted);
  console.log(`   Decrypted: ${decrypted}\n`);

  // Step 7: Create tamper-proof object
  console.log('7. Creating tamper-proof object...');
  const secureConfig = shield.sealObject({
    apiEndpoint: 'https://api.example.com',
    timeout: 5000,
  });

  console.log('   Secure config created');
  console.log('   Attempting to modify (should fail)...');

  try {
    (secureConfig as any).apiEndpoint = 'https://evil.com';
  } catch (error) {
    console.log('   ✓ Modification prevented!\n');
  }

  // Step 8: Check status
  console.log('8. Protection status:');
  const status = shield.getStatus();
  console.log('   Initialized:', status.initialized);
  console.log('   Integrity Check:', status.integrityEnabled);
  console.log('   Anti-Tamper:', status.antiTamperEnabled);
  console.log('   Anti-Debug:', status.antiDebugEnabled);
  console.log('   Memory Encryption:', status.memoryEncryptionEnabled);

  // Step 9: Cleanup
  console.log('\n9. Shutting down protection...');
  shield.shutdown();

  console.log('\n=== Example Complete ===');
}

// Run example
basicExample().catch(console.error);
