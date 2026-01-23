import { FastifyReply, FastifyRequest } from 'fastify';
import {
  Logger,
  Middleware,
  RouteConfigGlobal,
  RouteConfigService,
} from './interfaces';

export function callMiddlewareAsync(
  middleware: Middleware,
  req: FastifyRequest,
  res: FastifyReply,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      middleware.use(req.raw, res.raw, (err?: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper to convert NestJS middleware to Fastify hook
 */
export function convertMiddlewareToHook(
  middlewareInstance: any,
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await callMiddlewareAsync(middlewareInstance, request, reply);
  };
}

export let logger: Logger = {
  log: (...args: any[]) => {
    console.info(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  debug: (...args: any[]) => {
    console.debug(...args);
  },
  verbose: (...args: any[]) => {
    console.log(...args);
  },
};

export function setLogger(customLogger: Logger | false) {
  if (customLogger === false) {
    // Disable logging
    logger = {
      log: () => {},
      error: () => {},
      warn: () => {},
      debug: () => {},
      verbose: () => {},
    };
    return;
  }
  logger = customLogger;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/** Returns checker function for url */
export function buildRouteConfigChecker<
  T extends RouteConfigGlobal | RouteConfigService<any>,
>(configs: T[]) {
  const configMethods = configs.map((config) => ({
    config: config,
    methods: new Set(
      // Convert method names to set with PascalCase
      (config.methods || []).map((m) => m[0].toUpperCase() + m.slice(1)),
    ),
  }));

  /** Returns matched route configs for a given URL */
  return (url: string, checkConfig?: T) => {
    // Parse the URL to get service and method
    // Format: /package.ServiceName/MethodName
    const match = url.match(/^\/([^/]+)\/([^/]+)$/);

    if (!match) {
      // Not a ConnectRPC route, skip
      return [];
    }

    const [, serviceName, methodName] = match;

    const matchedConfigs: T[] = [];

    for (const { config, methods } of configMethods) {
      // If checkConfig is provided, only match that specific config
      if (checkConfig && config !== checkConfig) {
        continue;
      }

      // Check if config should apply to this service
      if (config.on && config.on.typeName !== serviceName) {
        continue;
      }

      // Check if config should apply to this method
      if (methods.size && !methods.has(methodName)) {
        continue;
      }

      matchedConfigs.push(config);
    }

    return matchedConfigs;
  };
}

/** Returns the pathname part of a URL which should be used to parse service name and method name */
export function getURLPath(url: string): string {
  return URL.parse(url)?.pathname || url;
}
