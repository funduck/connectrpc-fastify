import { FastifyInstance } from 'fastify';
import { convertMiddlewareToHook, logger } from './helpers';
import { MiddlewareConfigUnion } from './interfaces';
import { MiddlewareStore } from './stores';

export async function initMiddlewares(
  server: FastifyInstance,
  middlewareConfigs: MiddlewareConfigUnion[],
) {
  for (const config of middlewareConfigs) {
    // Convert method names to set with PascalCase
    const methods = new Set(
      (config.methods || []).map((m) => m[0].toUpperCase() + m.slice(1)),
    );

    // Get the middleware instance from the store
    const middlewareInstance = MiddlewareStore.getInstance(config.use);

    if (!middlewareInstance) {
      logger.warn(
        `Middleware ${config.use.name} not found in store. Did you forget to add MiddlewareStore.registerInstance(this) in the constructor? Or did you forget to instantiate the middleware?`,
      );
      continue;
    }

    if (typeof middlewareInstance.use === 'function') {
      const hook = convertMiddlewareToHook(middlewareInstance);

      // Create a filtered hook that checks service and method
      const filteredHook = async (request: any, reply: any) => {
        const url = request.url as string;

        // Parse the URL to get service and method
        // Format: /package.ServiceName/MethodName
        const match = url.match(/^\/([^/]+)\/([^/]+)$/);

        if (!match) {
          // Not a ConnectRPC route, skip
          return;
        }

        const [, serviceName, methodName] = match;

        // Check if middleware should apply to this service
        if (config.on && config.on.typeName !== serviceName) {
          return;
        }

        // Check if middleware should apply to this method
        if (methods.size && !methods.has(methodName)) {
          return;
        }

        // Apply the middleware
        await hook(request, reply);
      };

      server.addHook('onRequest', filteredHook);

      const serviceInfo = config.on
        ? ` to service ${config.on.typeName}`
        : ' to all services';
      const methodInfo = config.methods
        ? ` methods [${config.methods.join(', ')}]`
        : ' all methods';
      logger.log(
        `Applied middleware: ${config.use.name}${serviceInfo}${methodInfo}`,
      );
    }
  }
}
