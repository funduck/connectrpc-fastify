import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ManualExecutionContext } from './execution-context';
import { logger } from './helpers';
import { ExecutionContext, Guard } from './interfaces';
import { GuardsStore, RouteMetadataStore } from './stores';

export class ManualGuardExecutor {
  async executeGuard(
    guard: Guard,
    context: ExecutionContext,
  ): Promise<boolean> {
    const result = guard.canActivate(context);

    // Handle synchronous boolean result
    if (typeof result === 'boolean') {
      return result;
    }

    // Handle Promise result
    return await result;
  }

  async executeGuards(
    guards: Guard[],
    context: ExecutionContext,
  ): Promise<boolean> {
    for (const guard of guards) {
      const canActivate = await this.executeGuard(guard, context);
      if (!canActivate) {
        return false;
      }
    }
    return true;
  }
}

export function getGuards(controller: any): Guard[] {
  // Return all registered guards
  // In a more sophisticated implementation, you could filter guards
  // based on decorators on the controller or method
  return GuardsStore.getAllGuards();
}

/**
 * Initialize guards middleware - this should be called after all other middlewares are registered
 */
export async function initGuards(server: FastifyInstance) {
  const guardExecutor = new ManualGuardExecutor();

  // Add a hook that runs after all other middlewares
  server.addHook(
    'preHandler',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const url = request.url;

      // Parse the URL to get the route
      // Format: /package.ServiceName/MethodName
      const match = url.match(/^\/([^/]+)\/([^/]+)$/);

      if (!match) {
        // Not a ConnectRPC route, skip guard execution
        return;
      }

      // Get route metadata
      const routeMetadata = RouteMetadataStore.getRouteMetadata(url);

      if (!routeMetadata) {
        // No metadata found for this route
        logger.warn(`No route metadata found for ${url}`);
        return;
      }

      const {
        controllerClass,
        controllerMethod,
        controllerMethodName,
        instance,
      } = routeMetadata;

      // Get guards for the controller
      const guards = getGuards(instance);

      if (guards.length === 0) {
        // No guards to execute
        return;
      }

      // Create execution context
      // Note: For ConnectRPC, we don't have the actual request arguments yet at this point
      // They will be deserialized later by the ConnectRPC handler
      const executionContext = new ManualExecutionContext(
        request.raw,
        reply.raw,
        (() => undefined) as <T = any>() => T,
        [], // args will be populated later if needed
        controllerClass,
        controllerMethod,
      );

      // Execute guards
      try {
        const canActivate = await guardExecutor.executeGuards(
          guards,
          executionContext,
        );

        if (!canActivate) {
          // Guard rejected the request
          reply.code(403).send({
            code: 'permission_denied',
            message: 'Forbidden',
          });
          throw new Error('Guard rejected the request');
        }
      } catch (error) {
        // If guard throws an error, reject the request
        if (!reply.sent) {
          reply.code(403).send({
            code: 'permission_denied',
            message: error instanceof Error ? error.message : 'Forbidden',
          });
        }
        throw error;
      }
    },
  );

  logger.log('Guards middleware initialized');
}
