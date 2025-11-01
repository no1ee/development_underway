# CryptoShield Protection SDK

Enterprise-grade cryptographic protection system that any software provider can plug in to prevent jailbreaking and reverse engineering.

## Features

- **Multi-Layer Encryption**: AES-256-GCM encryption for code and data
- **Code Integrity Verification**: Runtime checksums and cryptographic signatures
- **Anti-Tampering Protection**: Detects code modifications and memory corruption
- **Anti-Debugging**: Detects debuggers and profiling tools
- **Secure Key Management**: Hardware-backed storage with automatic key rotation
- **Runtime Protection**: Memory encryption and control flow integrity
- **Code Obfuscation**: Multiple obfuscation layers for additional security
- **Easy Integration**: Simple plugin API for any application

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CryptoShield SDK                         │
├─────────────────────────────────────────────────────────────┤
│  Plugin Interface (Easy Integration)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Integrity   │  │ Anti-Tamper  │  │    Runtime      │  │
│  │  Verification │  │  Protection  │  │   Protection    │  │
│  └───────────────┘  └──────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │    Crypto     │  │     Key      │  │   Obfuscation   │  │
│  │   Utilities   │  │  Management  │  │     Engine      │  │
│  └───────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Installation

```bash
npm install @cryptoshield/protection-sdk
```

### Basic Usage

```typescript
import { CryptoShield } from '@cryptoshield/protection-sdk';

// Create configuration (basic, standard, or maximum protection)
const config = CryptoShield.createConfig('my-app-id', 'maximum');

// Initialize protection
const shield = new CryptoShield(config);
await shield.initialize();

// Protect a function
const protectedFunction = shield.protectFunction(
  function sensitiveOperation(data: string) {
    // Your sensitive code here
    return processData(data);
  },
  'sensitiveOperation'
);

// Use the protected function normally
const result = protectedFunction('secret data');
```

## Protection Levels

### Basic Protection
- Code integrity verification
- File checksums

```typescript
const config = CryptoShield.createConfig('my-app', 'basic');
```

### Standard Protection
- Everything in Basic
- Anti-tampering detection
- Runtime integrity checks

```typescript
const config = CryptoShield.createConfig('my-app', 'standard');
```

### Maximum Protection
- Everything in Standard
- Anti-debugging
- Memory encryption
- Automated threat response

```typescript
const config = CryptoShield.createConfig('my-app', 'maximum');
```

## Advanced Usage

### Custom Configuration

```typescript
import { CryptoShield, ProtectionConfig } from '@cryptoshield/protection-sdk';

const config: ProtectionConfig = {
  appId: 'my-secure-app',
  masterKey: 'your-secure-master-key', // Store securely!
  enableIntegrityCheck: true,
  enableAntiDebug: true,
  enableAntiTamper: true,
  enableMemoryEncryption: true,
  integrityCheckInterval: 3000,
  onTamperDetected: (event) => {
    console.error('Tampering detected:', event);
    // Handle threat (e.g., terminate app, notify server)
    if (event.severity === 'critical') {
      process.exit(1);
    }
  },
  onDebugDetected: (event) => {
    console.warn('Debugger detected:', event);
    // Handle debugging attempt
  },
};

const shield = new CryptoShield(config);
await shield.initialize();
```

### Generating Integrity Manifests

```typescript
// Generate manifest for your application files
const { manifest, privateKey } = await CryptoShield.generateManifest(
  'my-app',
  '1.0.0',
  [
    './dist/index.js',
    './dist/core.js',
    './dist/utils.js',
  ]
);

// Save private key securely (don't commit to version control!)
// Include manifest with your distribution

// Later, verify integrity
const shield = new CryptoShield(config);
await shield.initialize(manifest);
```

### Protecting Modules

```typescript
// Encrypt an entire module
const moduleCode = `
  export function criticalFunction(input) {
    // Sensitive business logic
    return processSecretAlgorithm(input);
  }
`;

const protectedModule = await shield.protectModule(moduleCode, 'critical-module');

// Save protected module
fs.writeFileSync('protected-module.enc', protectedModule);

// Later, load and execute
const loadedModule = await shield.loadProtectedModule(
  fs.readFileSync('protected-module.enc', 'utf8'),
  'critical-module'
);
```

### Encrypting Sensitive Data

```typescript
// Encrypt sensitive configuration
const sensitiveData = JSON.stringify({
  apiKey: 'secret-api-key',
  credentials: 'sensitive-info',
});

const encrypted = shield.encryptData(sensitiveData);

// Store encrypted data safely
fs.writeFileSync('config.enc', encrypted);

// Later, decrypt when needed
const decrypted = shield.decryptData(encrypted);
const config = JSON.parse(decrypted);
```

### Creating Tamper-Proof Objects

```typescript
// Create a sealed configuration object
const secureConfig = shield.sealObject({
  apiEndpoint: 'https://api.example.com',
  secretKey: 'do-not-modify',
  allowedDomains: ['example.com'],
});

// This will throw an error and trigger tamper detection
try {
  secureConfig.secretKey = 'hacked'; // Prevented!
} catch (error) {
  console.error('Modification blocked');
}
```

### Code Obfuscation

```typescript
const sourceCode = `
  function calculateLicenseKey(input) {
    return complexAlgorithm(input);
  }
`;

// Obfuscate code
const obfuscated = shield.obfuscateCode(sourceCode);

// Result is much harder to reverse engineer
console.log(obfuscated);
```

## API Reference

### CryptoShield Class

#### Constructor
```typescript
new CryptoShield(config: ProtectionConfig)
```

#### Methods

- `initialize(manifest?: IntegrityManifest): Promise<void>` - Initialize protection system
- `protectFunction<T>(func: T, name: string): T` - Wrap function with protection
- `encryptData(data: string): string` - Encrypt sensitive data
- `decryptData(encrypted: string): string` - Decrypt data
- `protectModule(code: string, id: string): Promise<string>` - Encrypt module
- `loadProtectedModule(encrypted: string, id: string): Promise<any>` - Load encrypted module
- `obfuscateCode(code: string): string` - Obfuscate code
- `sealObject<T>(obj: T): T` - Create tamper-proof object
- `verifyFileIntegrity(path: string): boolean` - Verify file hasn't been modified
- `isDebuggerPresent(): boolean` - Check for debugger
- `shutdown(): void` - Cleanup and stop monitoring

#### Static Methods

- `CryptoShield.createConfig(appId: string, level: 'basic' | 'standard' | 'maximum'): ProtectionConfig`
- `CryptoShield.generateManifest(appId: string, version: string, files: string[]): Promise<{manifest, privateKey}>`

### CryptoUtils Class

Standalone cryptographic utilities:

```typescript
import { CryptoUtils } from '@cryptoshield/protection-sdk';

// Encryption
const key = CryptoUtils.generateKey();
const encrypted = CryptoUtils.encrypt('data', key);
const decrypted = CryptoUtils.decrypt(encrypted, key);

// Hashing
const hash = CryptoUtils.hash('data');
const strongHash = CryptoUtils.hashStrong('data');

// Signing
const keyPair = CryptoUtils.generateKeyPair();
const signature = CryptoUtils.sign('data', keyPair.privateKey);
const isValid = CryptoUtils.verify('data', signature, keyPair.publicKey);

// HMAC
const hmac = CryptoUtils.hmac('data', 'secret-key');
```

## Security Best Practices

1. **Never hardcode keys**: Store master keys in secure environment variables or key management systems
2. **Rotate keys regularly**: Use the key rotation feature for long-running applications
3. **Monitor tamper events**: Implement proper logging and alerting for security events
4. **Use maximum protection**: For critical applications, always use maximum protection level
5. **Verify integrity on startup**: Always verify file integrity when application starts
6. **Handle security events**: Implement proper threat response (terminate, notify, log)
7. **Keep SDK updated**: Regularly update to get latest security improvements

## Example: Complete Protection Setup

```typescript
import { CryptoShield } from '@cryptoshield/protection-sdk';
import * as fs from 'fs';

// Step 1: Generate integrity manifest (do this once during build)
const { manifest, privateKey } = await CryptoShield.generateManifest(
  'my-app',
  '1.0.0',
  ['./dist/index.js', './dist/core.js']
);

fs.writeFileSync('manifest.json', JSON.stringify(manifest));
// Store privateKey securely!

// Step 2: Configure protection
const config = CryptoShield.createConfig('my-app', 'maximum');

// Step 3: Initialize with manifest
const shield = new CryptoShield(config);
await shield.initialize(manifest);

// Step 4: Protect your sensitive functions
class SecureAPI {
  @ProtectedMethod()
  async processPayment(amount: number, card: string) {
    // Critical payment processing logic
    return await this.chargeCard(amount, card);
  }

  private chargeCard(amount: number, card: string) {
    // Implementation
  }
}

// Decorator for automatic protection
function ProtectedMethod() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = shield.protectFunction(originalMethod, propertyKey);
    return descriptor;
  };
}

// Step 5: Use normally
const api = new SecureAPI();
await api.processPayment(100, '4111-1111-1111-1111');
```

## How It Works

### 1. Integrity Verification
- Generates SHA-256 checksums of all protected files
- Signs manifest with RSA-4096
- Continuously verifies checksums at runtime
- Detects any file modifications immediately

### 2. Anti-Tampering
- Monitors for debugger attachment
- Detects timing anomalies (debugging overhead)
- Analyzes stack traces for suspicious patterns
- Detects Function constructor tampering
- Prevents object modification with Proxy traps

### 3. Runtime Protection
- Encrypts code with AES-256-GCM
- Decrypts only at execution time
- Verifies control flow integrity
- Creates isolated execution sandboxes
- Binds code to specific environments

### 4. Code Obfuscation
- Unicode encoding
- String splitting and concatenation
- Control flow flattening
- String encryption
- Polymorphic code generation

## Performance Impact

- **Basic**: ~1-2% overhead
- **Standard**: ~3-5% overhead
- **Maximum**: ~5-10% overhead

The performance impact is minimal for most applications and provides significant security benefits.

## Compatibility

- Node.js: >= 16.0.0
- TypeScript: >= 4.5.0
- Platforms: Windows, macOS, Linux

## License

MIT License - see LICENSE file

## Support

For issues and questions:
- GitHub Issues: https://github.com/cryptoshield/protection-sdk/issues
- Documentation: https://docs.cryptoshield.dev
- Email: support@cryptoshield.dev

## Contributing

Contributions are welcome! Please see CONTRIBUTING.md for guidelines.

---

**⚠️ Important Security Notice**

This SDK provides strong protection but no security solution is 100% unbreakable. Always follow defense-in-depth principles and combine multiple security measures. Never rely solely on client-side protection for critical security decisions.
