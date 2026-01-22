import { GenService } from '@bufbuild/protobuf/codegenv2';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Logger } from './interfaces';

/**
 * Automatically discover method mappings by matching service methods to controller methods
 */
export function discoverMethodMappings(
  prototype,
  service: GenService<any>,
): Record<string, string> {
  const methodMappings: Record<string, string> = {};

  // service.methods is an array of method descriptors
  const serviceMethods = Array.isArray(service.methods) ? service.methods : [];

  // Get all controller methods
  const controllerMethods = Object.getOwnPropertyNames(prototype).filter(
    (name) => name !== 'constructor' && typeof prototype[name] === 'function',
  );

  // Check each service method
  for (const methodDesc of serviceMethods) {
    const serviceMethodName = methodDesc.name; // e.g., "Say" - this is what connectrpc module uses as key
    const localName = methodDesc.localName; // e.g., "say" (camelCase version)

    // Try to find a matching controller method
    // First try exact match with localName (camelCase), then try case-insensitive
    let controllerMethodName = controllerMethods.find(
      (name) => name === localName,
    );

    if (!controllerMethodName) {
      controllerMethodName = controllerMethods.find(
        (name) => name.toLowerCase() === serviceMethodName.toLowerCase(),
      );
    }

    if (controllerMethodName) {
      // Map using the service method name (e.g., "Say") because that's what the module looks for
      methodMappings[serviceMethodName] = controllerMethodName;
    }
  }

  return methodMappings;
}

/**
 * Helper to convert NestJS middleware to Fastify hook
 */
export function convertMiddlewareToHook(
  middlewareInstance: any,
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    return new Promise<void>((resolve, reject) => {
      try {
        // NestJS middleware expects raw req/res
        middlewareInstance.use(request.raw, reply.raw, (err?: any) => {
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
  };
}

export let logger: Logger = {
  log: (...args: any[]) => {
    // console.info(...args);
  },
  error: (...args: any[]) => {
    // console.error(...args);
  },
  warn: (...args: any[]) => {
    // console.warn(...args);
  },
  debug: (...args: any[]) => {
    // console.debug(...args);
  },
  verbose: (...args: any[]) => {
    // console.log(...args);
  },
};

export function setLogger(customLogger: Logger) {
  logger = customLogger;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
