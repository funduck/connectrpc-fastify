import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { isStrictMode } from './config';
import { createCustomContextValues } from './context-values';
import { generateRequestId, getLogger } from './helpers';
import { Middleware, MiddlewareConfigUnion } from './interfaces';
import { buildRouteConfigChecker } from './route-config-checker';
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
  configs: MiddlewareConfigUnion[],
) {
  const checkedConfigs: MiddlewareConfigUnion[] = [];

  // Check all registered middlewares
  for (const config of configs) {
    const middlewareInstance = MiddlewareStore.getInstance(config.use);

    if (!middlewareInstance) {
      getLogger().error(
        `Middleware ${config.use.name} not found in store. Did you forget to add ConnectRPC.registerMiddleware(this) in the constructor? Or did you forget to instantiate the middleware?`,
      );
      if (isStrictMode) {
        getLogger().error(
          'Exiting. To disable strict mode, set isStrictMode to false.',
        );
        process.exit(1);
      }
      continue;
    }

    const serviceInfo = config.on
      ? ` to service ${config.on.typeName}`
      : ' to all services';
    const methodInfo = config.methods
      ? ` methods [${config.methods.join(', ')}]`
      : ' all methods';
    getLogger().log(
      `Registered middleware: ${config.use.name}${serviceInfo}${methodInfo}`,
    );

    checkedConfigs.push(config);
  }

  if (!checkedConfigs.length) {
    return;
  }

  // Add context middleware first - this stores req/res and creates ContextValues for interceptors
  server.addHook('onRequest', async (request, reply) => {
    setupCustomContextValues(request.raw);

    // Clean up the context when the response finishes
    reply.raw.on('finish', () => {
      clearCustomContextValues(request.raw);
    });
  });

  const routeChecker = buildRouteConfigChecker(checkedConfigs);

  server.addHook('onRequest', async (request, reply) => {
    const url = request.url as string;
    const configs = routeChecker(url);

    try {
      for (const config of configs) {
        const middlewareInstance = MiddlewareStore.getInstance(config.use)!;
        await callMiddlewareAsync(middlewareInstance, request, reply);
      }
    } catch (error) {
      getLogger().error(
        `Error in middleware for request ${request.url}:`,
        error,
      );
      if (!reply.sent) {
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });
}

function callMiddlewareAsync(
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
