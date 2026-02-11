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
export declare class Logger {
    private static instance;
    private config;
    private constructor();
    static getInstance(config?: LoggerConfig): Logger;
    static createDefaultConfig(): LoggerConfig;
    private log;
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: Error, meta?: any): void;
}
export declare class RequestLoggingMiddleware {
    private logger;
    constructor(logger: Logger);
    logServerStartup(serverInfo: any): void;
    logServerShutdown(): void;
    wrapHandler<T extends (...args: any[]) => Promise<any>>(name: string, handler: T): T;
    wrapToolHandler(handler: Function): (name: string, args: any, server: any) => Promise<any>;
}
//# sourceMappingURL=index.d.ts.map