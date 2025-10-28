/**
 * Enhanced logging utility for semantic retrieval system
 * Provides structured logging with performance monitoring and error tracking
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  error?: Error;
  performance?: PerformanceData;
}

export interface PerformanceData {
  duration: number;
  memoryUsage?: number;
  operationType: string;
  inputSize?: number;
  outputSize?: number;
}

/**
 * Enhanced logger with performance monitoring and structured output
 */
export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogEntries = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(component: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, component, message, data);
  }

  info(component: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, component, message, data);
  }

  warn(component: string, message: string, data?: any, error?: Error): void {
    this.log(LogLevel.WARN, component, message, data, error);
  }

  error(component: string, message: string, data?: any, error?: Error): void {
    this.log(LogLevel.ERROR, component, message, data, error);
  }

  performance(
    component: string,
    message: string,
    performance: PerformanceData,
    data?: any
  ): void {
    this.log(LogLevel.INFO, component, message, data, undefined, performance);
  }

  private log(
    level: LogLevel,
    component: string,
    message: string,
    data?: any,
    error?: Error,
    performance?: PerformanceData
  ): void {
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      component,
      message,
      data,
      error,
      performance,
    };

    // Add to internal log storage
    this.logs.push(entry);
    if (this.logs.length > this.maxLogEntries) {
      this.logs.shift();
    }

    // Output to console with appropriate level
    const formattedMessage = this.formatLogEntry(entry);
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.log(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        if (error) console.warn(error);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        if (error) console.error(error);
        break;
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const levelName = LogLevel[entry.level];
    let message = `[${timestamp}] ${levelName} [${entry.component}] ${entry.message}`;

    if (entry.performance) {
      message += ` (${entry.performance.duration}ms)`;
      if (entry.performance.memoryUsage) {
        message += ` [${(entry.performance.memoryUsage / 1024 / 1024).toFixed(
          2
        )}MB]`;
      }
    }

    if (entry.data) {
      message += ` | Data: ${JSON.stringify(entry.data)}`;
    }

    return message;
  }

  /**
   * Get recent log entries for debugging
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs filtered by component
   */
  getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter((log) => log.component === component);
  }

  /**
   * Get error logs only
   */
  getErrorLogs(): LogEntry[] {
    return this.logs.filter((log) => log.level === LogLevel.ERROR);
  }

  /**
   * Get performance metrics from logs
   */
  getPerformanceMetrics(): {
    averageDuration: number;
    totalOperations: number;
    operationTypes: Record<string, number>;
  } {
    const perfLogs = this.logs.filter((log) => log.performance);

    if (perfLogs.length === 0) {
      return {
        averageDuration: 0,
        totalOperations: 0,
        operationTypes: {},
      };
    }

    const totalDuration = perfLogs.reduce(
      (sum, log) => sum + (log.performance?.duration || 0),
      0
    );

    const operationTypes: Record<string, number> = {};
    perfLogs.forEach((log) => {
      const opType = log.performance?.operationType || "unknown";
      operationTypes[opType] = (operationTypes[opType] || 0) + 1;
    });

    return {
      averageDuration: totalDuration / perfLogs.length,
      totalOperations: perfLogs.length,
      operationTypes,
    };
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}

/**
 * Performance measurement utility
 */
export class PerformanceMonitor {
  private startTime: number;
  private startMemory: number;
  private operationType: string;

  constructor(operationType: string) {
    this.operationType = operationType;
    this.startTime = Date.now();
    this.startMemory = process.memoryUsage().heapUsed;
  }

  finish(inputSize?: number, outputSize?: number): PerformanceData {
    const duration = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage().heapUsed - this.startMemory;

    return {
      duration,
      memoryUsage,
      operationType: this.operationType,
      inputSize,
      outputSize,
    };
  }
}

/**
 * Decorator for automatic performance monitoring
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  component: string,
  operationType: string,
  fn: T
): T {
  return ((...args: any[]) => {
    const logger = Logger.getInstance();
    const monitor = new PerformanceMonitor(operationType);

    try {
      const result = fn(...args);

      // Handle both sync and async functions
      if (result instanceof Promise) {
        return result
          .then((value) => {
            const perf = monitor.finish();
            logger.performance(component, `${operationType} completed`, perf);
            return value;
          })
          .catch((error) => {
            const perf = monitor.finish();
            logger.error(component, `${operationType} failed`, { perf }, error);
            throw error;
          });
      } else {
        const perf = monitor.finish();
        logger.performance(component, `${operationType} completed`, perf);
        return result;
      }
    } catch (error) {
      const perf = monitor.finish();
      logger.error(
        component,
        `${operationType} failed`,
        { perf },
        error as Error
      );
      throw error;
    }
  }) as T;
}

/**
 * System health and diagnostics utility
 */
export interface SystemHealth {
  status: "healthy" | "degraded" | "critical";
  components: {
    enhancedEmbeddings: boolean;
    configManager: boolean;
    memoryUsage: number;
    errorRate: number;
  };
  recentErrors: LogEntry[];
  performanceMetrics: {
    averageDuration: number;
    totalOperations: number;
    operationTypes: Record<string, number>;
  };
}

export function getSystemHealth(): SystemHealth {
  const logger = Logger.getInstance();
  const recentLogs = logger.getRecentLogs(100);
  const errorLogs = recentLogs.filter((log) => log.level === LogLevel.ERROR);
  const errorRate =
    recentLogs.length > 0 ? errorLogs.length / recentLogs.length : 0;

  const memoryUsage = process.memoryUsage().heapUsed;
  const performanceMetrics = logger.getPerformanceMetrics();

  // Determine overall system status
  let status: "healthy" | "degraded" | "critical" = "healthy";
  if (errorRate > 0.1) {
    // More than 10% errors
    status = "critical";
  } else if (errorRate > 0.05 || memoryUsage > 500 * 1024 * 1024) {
    // More than 5% errors or >500MB memory
    status = "degraded";
  }

  return {
    status,
    components: {
      enhancedEmbeddings: true, // Will be updated by embeddings module
      configManager: true, // Will be updated by embeddings module
      memoryUsage,
      errorRate,
    },
    recentErrors: errorLogs.slice(-10), // Last 10 errors
    performanceMetrics,
  };
}

// Export singleton instance
export const logger = Logger.getInstance();
