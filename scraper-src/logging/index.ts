/**
 * V-Editor Scraper - Logging Module
 * 
 * 📝 用途：简化的日志系统
 */

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  outputs: ('console' | 'file')[];
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
}

export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;

  private constructor(config: LoggerConfig) {
    this.config = config;
  }

  static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config || Logger.createDefaultConfig());
    }
    return Logger.instance;
  }

  static createDefaultConfig(): LoggerConfig {
    return {
      level: 'info',
      format: 'json',
      outputs: ['console'],
    };
  }

  private log(level: string, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    if (this.config.outputs.includes('console')) {
      if (this.config.format === 'json') {
        console.error(JSON.stringify(logEntry));
      } else {
        console.error(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta || '');
      }
    }
  }

  debug(message: string, meta?: any) {
    if (['debug'].includes(this.config.level)) {
      this.log('debug', message, meta);
    }
  }

  info(message: string, meta?: any) {
    if (['debug', 'info'].includes(this.config.level)) {
      this.log('info', message, meta);
    }
  }

  warn(message: string, meta?: any) {
    if (['debug', 'info', 'warn'].includes(this.config.level)) {
      this.log('warn', message, meta);
    }
  }

  error(message: string, error?: Error, meta?: any) {
    this.log('error', message, {
      error: error?.message,
      stack: error?.stack,
      ...meta
    });
  }
}

export class RequestLoggingMiddleware {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  logServerStartup(serverInfo: any) {
    this.logger.info('Server starting', serverInfo);
  }

  logServerShutdown() {
    this.logger.info('Server shutting down');
  }

  wrapHandler<T extends (...args: any[]) => Promise<any>>(
    name: string,
    handler: T
  ): T {
    return (async (...args: any[]) => {
      const startTime = Date.now();
      try {
        const result = await handler(...args);
        this.logger.debug(`${name} completed`, { duration: Date.now() - startTime });
        return result;
      } catch (error) {
        this.logger.error(`${name} failed`, error as Error);
        throw error;
      }
    }) as T;
  }

  wrapToolHandler(handler: Function) {
    return async (name: string, args: any, server: any) => {
      const startTime = Date.now();
      this.logger.info(`Tool call: ${name}`, { args });
      try {
        const result = await handler(name, args, server);
        this.logger.info(`Tool completed: ${name}`, { duration: Date.now() - startTime });
        return result;
      } catch (error) {
        this.logger.error(`Tool failed: ${name}`, error as Error);
        throw error;
      }
    };
  }
}
