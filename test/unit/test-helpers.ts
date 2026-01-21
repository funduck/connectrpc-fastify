import { Client, createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-node';
import Fastify, { FastifyInstance } from 'fastify';
import { ConnectRPC, middlewareConfig } from '../../src/index';
import {
  ControllersStore,
  GuardsStore,
  MiddlewareStore,
  RouteMetadataStore,
} from '../../src/stores';
import { ElizaController } from '../demo/controller';
import { ElizaService } from '../demo/gen/connectrpc/eliza/v1/eliza_pb';
import { TestGuard1 } from '../demo/guards';
import {
  TestMiddleware1,
  TestMiddleware2,
  TestMiddleware3,
} from '../demo/middlewares';

export async function setupTestServer(port: number = 0): Promise<{
  server: FastifyInstance;
  client: Client<typeof ElizaService>;
  port: number;
  cleanup: () => Promise<void>;
}> {
  const fastify = Fastify({
    logger: false, // Disable logging in tests
  });

  // Register controller
  new ElizaController();

  // Register middlewares
  new TestMiddleware1();
  new TestMiddleware2();
  new TestMiddleware3();

  // Register guards
  new TestGuard1();

  // Register ConnectRPC plugin
  await ConnectRPC.registerFastifyPlugin(fastify);

  // Initialize middlewares
  ConnectRPC.initMiddlewares(fastify, [
    middlewareConfig(TestMiddleware1), // Global middleware
    middlewareConfig(TestMiddleware2, ElizaService), // ElizaService middleware
    middlewareConfig(TestMiddleware3, ElizaService, ['say']), // Only for 'say' method
  ]);

  // Initialize guards
  ConnectRPC.initGuards(fastify);

  // Start the server
  const address = await fastify.listen({ port, host: '127.0.0.1' });
  const actualPort = (fastify.server.address() as any).port;

  // Create client
  const transport = createConnectTransport({
    baseUrl: `http://127.0.0.1:${actualPort}`,
    httpVersion: '1.1',
  });

  const client = createClient(ElizaService, transport);

  const cleanup = async () => {
    await fastify.close();
    ControllersStore.clear();
    RouteMetadataStore.clear();
    MiddlewareStore.clear();
    GuardsStore.clear();
    ConnectRPC['_middlewaresInitialized'] = false;
    ConnectRPC['_guardsInitialized'] = false;
  };

  return {
    server: fastify,
    client,
    port: actualPort,
    cleanup,
  };
}

export function resetMiddlewareCallbacks() {
  TestMiddleware1.callback = () => undefined;
  TestMiddleware2.callback = () => undefined;
  TestMiddleware3.callback = () => undefined;
}

export function resetGuardCallbacks() {
  TestGuard1.callback = () => true;
}
