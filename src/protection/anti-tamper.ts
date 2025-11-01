/**
 * Anti-Tampering Protection
 * Detects and prevents various tampering attempts
 */

import { DebugEvent, TamperEvent } from '../types';
import { CryptoUtils } from '../crypto/crypto-utils';

export class AntiTamper {
  private debuggerCheckInterval: NodeJS.Timeout | null = null;
  private onDebugDetected?: (event: DebugEvent) => void;
  private onTamperDetected?: (event: TamperEvent) => void;
  private isMonitoring: boolean = false;
  private lastExecutionTime: number = 0;
  private executionTimeSamples: number[] = [];

  constructor(
    onDebugDetected?: (event: DebugEvent) => void,
    onTamperDetected?: (event: TamperEvent) => void
  ) {
    this.onDebugDetected = onDebugDetected;
    this.onTamperDetected = onTamperDetected;
  }

  /**
   * Check if debugger is attached (Node.js)
   */
  isDebuggerAttached(): boolean {
    // Check for common debugger indicators
    const isDebugging =
      typeof (global as any).v8debug !== 'undefined' ||
      /--debug|--inspect/.test(process.execArgv.join(' ')) ||
      process.env.NODE_OPTIONS?.includes('--inspect') ||
      false;

    return isDebugging;
  }

  /**
   * Detect debugger using timing analysis
   */
  detectDebuggerTiming(): boolean {
    const start = Date.now();

    // Debugger adds latency to execution
    debugger; // This will pause if debugger is attached

    const end = Date.now();
    const executionTime = end - start;

    // If execution took longer than 100ms, likely debugger is present
    if (executionTime > 100) {
      this.reportDebug({
        type: 'debugger_attached',
        timestamp: Date.now(),
        details: `Timing anomaly detected: ${executionTime}ms`,
      });
      return true;
    }

    return false;
  }

  /**
   * Anti-debugging using performance timing
   */
  detectTimingAnomaly(): boolean {
    const start = performance.now();

    // Execute a simple operation
    let sum = 0;
    for (let i = 0; i < 1000; i++) {
      sum += i;
    }

    const end = performance.now();
    const executionTime = end - start;

    // Track execution time samples
    this.executionTimeSamples.push(executionTime);
    if (this.executionTimeSamples.length > 10) {
      this.executionTimeSamples.shift();
    }

    // Calculate average
    const avg = this.executionTimeSamples.reduce((a, b) => a + b, 0) / this.executionTimeSamples.length;

    // If current execution is significantly slower, may indicate debugging
    if (executionTime > avg * 3 && this.executionTimeSamples.length >= 5) {
      this.reportDebug({
        type: 'profiler_detected',
        timestamp: Date.now(),
        details: `Performance degradation detected: ${executionTime.toFixed(2)}ms vs avg ${avg.toFixed(2)}ms`,
      });
      return true;
    }

    return false;
  }

  /**
   * Detect code modification through stack trace analysis
   */
  detectStackTraceModification(): boolean {
    try {
      const error = new Error();
      const stack = error.stack || '';

      // Check for common debugging/hooking patterns in stack
      const suspiciousPatterns = [
        'eval',
        'Function',
        'frida',
        'xposed',
        'hook',
        'proxy',
        'intercept',
      ];

      for (const pattern of suspiciousPatterns) {
        if (stack.toLowerCase().includes(pattern)) {
          this.reportTamper({
            type: 'integrity_violation',
            timestamp: Date.now(),
            details: `Suspicious stack trace pattern: ${pattern}`,
            severity: 'high',
          });
          return true;
        }
      }
    } catch (error) {
      // Stack trace analysis failed
    }

    return false;
  }

  /**
   * Detect console override attempts
   */
  detectConsoleOverride(): boolean {
    const originalConsole = console;

    // Check if console methods have been modified
    const methods = ['log', 'warn', 'error', 'debug', 'info'];
    for (const method of methods) {
      const fn = (console as any)[method];
      if (fn && fn.toString().includes('native code') === false) {
        this.reportTamper({
          type: 'integrity_violation',
          timestamp: Date.now(),
          details: `Console.${method} has been overridden`,
          severity: 'medium',
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Detect Function constructor tampering
   */
  detectFunctionTampering(): boolean {
    try {
      const originalFunction = Function;
      const testFunc = new Function('return 1');

      // Check if Function constructor behaves normally
      if (testFunc() !== 1) {
        this.reportTamper({
          type: 'integrity_violation',
          timestamp: Date.now(),
          details: 'Function constructor has been tampered',
          severity: 'critical',
        });
        return true;
      }
    } catch (error) {
      this.reportTamper({
        type: 'integrity_violation',
        timestamp: Date.now(),
        details: 'Function constructor access denied',
        severity: 'high',
      });
      return true;
    }

    return false;
  }

  /**
   * Protect a function with anti-tampering wrapper
   */
  protectFunction<T extends (...args: any[]) => any>(
    func: T,
    functionName: string
  ): T {
    const originalCode = func.toString();
    const checksum = CryptoUtils.checksum(originalCode);

    const wrapped = function (this: any, ...args: any[]) {
      // Verify function hasn't been modified
      const currentCode = func.toString();
      const currentChecksum = CryptoUtils.checksum(currentCode);

      if (!CryptoUtils.secureCompare(checksum, currentChecksum)) {
        const event: TamperEvent = {
          type: 'integrity_violation',
          timestamp: Date.now(),
          details: `Function ${functionName} has been modified`,
          severity: 'critical',
        };

        if (this.onTamperDetected) {
          this.onTamperDetected(event);
        }

        throw new Error('Security violation: Function tampering detected');
      }

      // Execute original function
      return func.apply(this, args);
    }.bind(this);

    return wrapped as T;
  }

  /**
   * Create a tamper-proof object seal
   */
  sealObject<T extends object>(obj: T): T {
    // Freeze the object to prevent modifications
    Object.freeze(obj);

    // Seal to prevent property additions/deletions
    Object.seal(obj);

    // Create a proxy to detect access attempts
    return new Proxy(obj, {
      set: (target, prop, value) => {
        this.reportTamper({
          type: 'integrity_violation',
          timestamp: Date.now(),
          details: `Attempt to modify sealed object property: ${String(prop)}`,
          severity: 'high',
        });
        return false;
      },
      deleteProperty: (target, prop) => {
        this.reportTamper({
          type: 'integrity_violation',
          timestamp: Date.now(),
          details: `Attempt to delete sealed object property: ${String(prop)}`,
          severity: 'high',
        });
        return false;
      },
    });
  }

  /**
   * Start continuous anti-tampering monitoring
   */
  startMonitoring(intervalMs: number = 3000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    this.debuggerCheckInterval = setInterval(() => {
      this.isDebuggerAttached();
      this.detectTimingAnomaly();
      this.detectStackTraceModification();
      this.detectConsoleOverride();
      this.detectFunctionTampering();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.debuggerCheckInterval) {
      clearInterval(this.debuggerCheckInterval);
      this.debuggerCheckInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Report debug event
   */
  private reportDebug(event: DebugEvent): void {
    if (this.onDebugDetected) {
      this.onDebugDetected(event);
    }
  }

  /**
   * Report tamper event
   */
  private reportTamper(event: TamperEvent): void {
    if (this.onTamperDetected) {
      this.onTamperDetected(event);
    }
  }

  /**
   * Generate anti-tampering checksum for critical code
   */
  static generateCodeChecksum(code: string): string {
    return CryptoUtils.checksum(code);
  }

  /**
   * Verify code integrity with checksum
   */
  static verifyCodeChecksum(code: string, expectedChecksum: string): boolean {
    const actualChecksum = CryptoUtils.checksum(code);
    return CryptoUtils.secureCompare(actualChecksum, expectedChecksum);
  }
}
