"use strict";
/**
 * V-Editor Scraper - Logging Module
 *
 * 📝 用途：简化的日志系统
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestLoggingMiddleware = exports.Logger = void 0;
class Logger {
    constructor(config) {
        this.config = config;
    }
    static getInstance(config) {
        if (!Logger.instance) {
            Logger.instance = new Logger(config || Logger.createDefaultConfig());
        }
        return Logger.instance;
    }
    static createDefaultConfig() {
        return {
            level: 'info',
            format: 'json',
            outputs: ['console'],
        };
    }
    log(level, message, meta) {
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
            }
            else {
                console.error(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta || '');
            }
        }
    }
    debug(message, meta) {
        if (['debug'].includes(this.config.level)) {
            this.log('debug', message, meta);
        }
    }
    info(message, meta) {
        if (['debug', 'info'].includes(this.config.level)) {
            this.log('info', message, meta);
        }
    }
    warn(message, meta) {
        if (['debug', 'info', 'warn'].includes(this.config.level)) {
            this.log('warn', message, meta);
        }
    }
    error(message, error, meta) {
        this.log('error', message, {
            error: error?.message,
            stack: error?.stack,
            ...meta
        });
    }
}
exports.Logger = Logger;
class RequestLoggingMiddleware {
    constructor(logger) {
        this.logger = logger;
    }
    logServerStartup(serverInfo) {
        this.logger.info('Server starting', serverInfo);
    }
    logServerShutdown() {
        this.logger.info('Server shutting down');
    }
    wrapHandler(name, handler) {
        return (async (...args) => {
            const startTime = Date.now();
            try {
                const result = await handler(...args);
                this.logger.debug(`${name} completed`, { duration: Date.now() - startTime });
                return result;
            }
            catch (error) {
                this.logger.error(`${name} failed`, error);
                throw error;
            }
        });
    }
    wrapToolHandler(handler) {
        return async (name, args, server) => {
            const startTime = Date.now();
            this.logger.info(`Tool call: ${name}`, { args });
            try {
                const result = await handler(name, args, server);
                this.logger.info(`Tool completed: ${name}`, { duration: Date.now() - startTime });
                return result;
            }
            catch (error) {
                this.logger.error(`Tool failed: ${name}`, error);
                throw error;
            }
        };
    }
}
exports.RequestLoggingMiddleware = RequestLoggingMiddleware;
//# sourceMappingURL=index.js.map