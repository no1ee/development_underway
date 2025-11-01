/**
 * Advanced Protection Example
 * Demonstrates integrity verification, module protection, and threat handling
 */

import { CryptoShield, TamperEvent, DebugEvent, ProtectionConfig } from '../src';
import * as fs from 'fs';
import * as path from 'path';

async function advancedExample() {
  console.log('=== CryptoShield Advanced Protection Example ===\n');

  // Step 1: Generate integrity manifest for application files
  console.log('1. Generating integrity manifest...');

  const filesToProtect = [
    path.join(__dirname, '../examples/basic-usage.ts'),
    path.join(__dirname, '../examples/advanced-protection.ts'),
  ];

  const { manifest, privateKey } = await CryptoShield.generateManifest(
    'advanced-app',
    '1.0.0',
    filesToProtect
  );

  console.log(`   Protected ${Object.keys(manifest.checksums).length} files`);
  console.log(`   Manifest signature: ${manifest.signature.substring(0, 40)}...\n`);

  // Step 2: Create custom configuration with event handlers
  console.log('2. Setting up advanced configuration...');

  const config: ProtectionConfig = {
    appId: 'advanced-app',
    masterKey: undefined, // Will be generated
    enableIntegrityCheck: true,
    enableAntiDebug: true,
    enableAntiTamper: true,
    enableMemoryEncryption: true,
    integrityCheckInterval: 5000,

    onTamperDetected: (event: TamperEvent) => {
      console.error('\n⚠️  SECURITY ALERT: Tampering detected!');
      console.error(`   Type: ${event.type}`);
      console.error(`   Severity: ${event.severity}`);
      console.error(`   Details: ${event.details}`);
      console.error(`   Timestamp: ${new Date(event.timestamp).toISOString()}`);

      if (event.severity === 'critical') {
        console.error('\n🛑 CRITICAL THREAT: Terminating application...\n');
        // In production: process.exit(1);
      }
    },

    onDebugDetected: (event: DebugEvent) => {
      console.warn('\n⚠️  DEBUGGER ALERT!');
      console.warn(`   Type: ${event.type}`);
      console.warn(`   Details: ${event.details}`);
      console.warn(`   Timestamp: ${new Date(event.timestamp).toISOString()}\n`);
    },
  };

  // Step 3: Initialize with manifest
  console.log('3. Initializing CryptoShield with integrity manifest...');
  const shield = new CryptoShield(config);
  await shield.initialize(manifest);
  console.log('   ✓ Protection active\n');

  // Step 4: Protect a module
  console.log('4. Protecting a sensitive module...');

  const moduleCode = `
    function processLicenseKey(key) {
      // Super secret algorithm
      const parts = key.split('-');
      const validation = parts.reduce((acc, part) => {
        return acc + part.charCodeAt(0);
      }, 0);
      return validation % 997 === 0;
    }

    function generateToken(seed) {
      // Secret token generation
      const timestamp = Date.now();
      return (seed * timestamp) % 1000000;
    }

    module.exports = { processLicenseKey, generateToken };
  `;

  const protectedModule = await shield.protectModule(moduleCode, 'license-module');
  console.log(`   Module encrypted: ${protectedModule.substring(0, 60)}...`);

  // Save protected module
  const modulePath = path.join(__dirname, 'protected-module.enc');
  fs.writeFileSync(modulePath, protectedModule);
  console.log(`   Saved to: ${modulePath}\n`);

  // Step 5: Load and use protected module
  console.log('5. Loading protected module...');
  const loadedModule = await shield.loadProtectedModule(protectedModule, 'license-module');
  console.log('   ✓ Module loaded and decrypted\n');

  // Step 6: Verify file integrity
  console.log('6. Verifying file integrity...');
  for (const filePath of filesToProtect) {
    const isValid = shield.verifyFileIntegrity(filePath);
    console.log(`   ${path.basename(filePath)}: ${isValid ? '✓ Valid' : '✗ Tampered'}`);
  }
  console.log();

  // Step 7: Demonstrate obfuscation
  console.log('7. Obfuscating code...');

  const originalCode = `
    function secretAlgorithm(input) {
      const magic = 42;
      return input * magic;
    }
  `;

  const obfuscated = shield.obfuscateCode(originalCode);
  console.log('   Original:', originalCode.replace(/\n/g, '').trim());
  console.log('   Obfuscated:', obfuscated.substring(0, 80) + '...\n');

  // Step 8: Check for debugger
  console.log('8. Security checks...');
  const debuggerPresent = shield.isDebuggerPresent();
  console.log(`   Debugger present: ${debuggerPresent ? '⚠️  YES' : '✓ NO'}`);

  // Step 9: Export configuration for backup
  console.log('\n9. Exporting configuration...');
  const backupPassword = 'super-secure-backup-password';
  const exportedConfig = await shield.exportConfig(backupPassword);
  console.log(`   Config exported: ${exportedConfig.substring(0, 60)}...`);

  const backupPath = path.join(__dirname, 'config-backup.enc');
  fs.writeFileSync(backupPath, exportedConfig);
  console.log(`   Saved to: ${backupPath}\n`);

  // Step 10: Demonstrate import (in a new instance)
  console.log('10. Testing configuration import...');
  const newShield = new CryptoShield(config);
  await newShield.importConfig(exportedConfig, backupPassword);
  console.log('    ✓ Configuration imported successfully\n');

  // Step 11: Simulate tamper detection
  console.log('11. Simulating tamper detection...');
  console.log('    (Attempting to access sealed object)...');

  const sealedObject = shield.sealObject({ secret: 'value' });
  try {
    (sealedObject as any).secret = 'hacked';
  } catch (error) {
    console.log('    ✓ Tamper attempt blocked\n');
  }

  // Step 12: Get protection status
  console.log('12. Final protection status:');
  const status = shield.getStatus();
  console.log('    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`    Initialized:         ${status.initialized ? '✓' : '✗'}`);
  console.log(`    Integrity Check:     ${status.integrityEnabled ? '✓' : '✗'}`);
  console.log(`    Anti-Tamper:         ${status.antiTamperEnabled ? '✓' : '✗'}`);
  console.log(`    Anti-Debug:          ${status.antiDebugEnabled ? '✓' : '✗'}`);
  console.log(`    Memory Encryption:   ${status.memoryEncryptionEnabled ? '✓' : '✗'}`);
  console.log('    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 13: Cleanup
  console.log('13. Shutting down...');
  shield.shutdown();
  newShield.shutdown();

  // Clean up temporary files
  if (fs.existsSync(modulePath)) fs.unlinkSync(modulePath);
  if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);

  console.log('    ✓ Protection disabled');
  console.log('\n=== Advanced Example Complete ===\n');
}

// Run example
advancedExample().catch(console.error);
