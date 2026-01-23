import { FastifyInstance, FastifyRequest } from 'fastify';
import { createCustomContextValues } from './context-values';
import {
  buildRouteConfigChecker,
  callMiddlewareAsync,
  generateRequestId,
  logger,
} from './helpers';
import { MiddlewareConfigUnion } from './interfaces';
import { MiddlewareContextStore, MiddlewareStore } from './stores';

export const xServerRequestIdHeader = 'x-server-request-id';

function setupCustomContextValues(req: FastifyRequest['raw']) {
  const requestId = generateRequestId();
  // Store the request ID in a custom header
  req.headers[xServerRequestIdHeader] = requestId;

  // Create and store the middleware context with ContextValues
  MiddlewareContextStore.set(requestId, {
    contextValues: createCustomContextValues(),
  });
}

/** This method allows middleware to access custom context values associated with a request */
export function getCustomContextValues(req: FastifyRequest['raw']) {
  const requestId = req.headers[xServerRequestIdHeader] as string;

  if (requestId) {
    const middlewareContext = MiddlewareContextStore.get(requestId);

    if (middlewareContext) {
      return middlewareContext.contextValues;
    }
  }

  return null;
}

function clearCustomContextValues(req: FastifyRequest['raw']) {
  const requestId = req.headers[xServerRequestIdHeader] as string;

  if (requestId) {
    MiddlewareContextStore.delete(requestId);
  }
}

export async function initMiddlewares(
  server: FastifyInstance,
  middlewareConfigs: MiddlewareConfigUnion[],
) {
  // Add context middleware first - this stores req/res and creates ContextValues for interceptors
  server.addHook('onRequest', async (request, reply) => {
    setupCustomContextValues(request.raw);

    // Clean up the context when the response finishes
    reply.raw.on('finish', () => {
      clearCustomContextValues(request.raw);
    });
  });

  // Check all registered middlewares
  for (const config of middlewareConfigs) {
    const middlewareInstance = MiddlewareStore.getInstance(config.use);

    if (!middlewareInstance) {
      logger.error(
        `Middleware ${config.use.name} not found in store. Did you forget to add MiddlewareStore.registerInstance(this) in the constructor? Or did you forget to instantiate the middleware?`,
      );
      process.exit(1);
    }

    const serviceInfo = config.on
      ? ` to service ${config.on.typeName}`
      : ' to all services';
    const methodInfo = config.methods
      ? ` methods [${config.methods.join(', ')}]`
      : ' all methods';
    logger.log(
      `Registered middleware: ${config.use.name}${serviceInfo}${methodInfo}`,
    );
  }

  const routeChecker = buildRouteConfigChecker(middlewareConfigs);

  server.addHook('onRequest', async (request, reply) => {
    const url = request.url as string;
    const configs = routeChecker(url);

    try {
      for (const config of configs) {
        const middlewareInstance = MiddlewareStore.getInstance(config.use)!;
        await callMiddlewareAsync(middlewareInstance, request, reply);
      }
    } catch (error) {
      logger.error(`Error in middleware for request ${request.url}:`, error);
      if (!reply.sent) {
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });
}
