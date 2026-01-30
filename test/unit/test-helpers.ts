import { Client, createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-node';
import Fastify, { FastifyInstance } from 'fastify';
import { ConnectRPC, middlewareConfig } from '../../src/index';
import { interceptorConfig } from '../../src/interfaces';
import { RouteMetadataStore } from '../../src/stores';
import { ElizaController } from '../demo/controller';
import { ElizaService } from '../demo/gen/connectrpc/eliza/v1/eliza_pb';
import {
  TestInterceptor1,
  TestInterceptor2,
  TestInterceptor3,
} from '../demo/interceptors';
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

  // Register interceptors
  new TestInterceptor1();
  new TestInterceptor2();
  new TestInterceptor3();

  ConnectRPC.setLogger(false);

  // Register ConnectRPC plugin
  await ConnectRPC.init(fastify, {
    logger: false,
    middlewares: [
      middlewareConfig(TestMiddleware1), // Global middleware
      middlewareConfig(TestMiddleware2, ElizaService), // ElizaService middleware
      middlewareConfig(TestMiddleware3, ElizaService, ['say']), // Only for 'say' method
    ],
    interceptors: [
      interceptorConfig(TestInterceptor1), // Global interceptor
      interceptorConfig(TestInterceptor2, ElizaService), // ElizaService interceptor
      interceptorConfig(TestInterceptor3, ElizaService, ['say']), // Only for 'say' method
    ],
  });

  // Start the server
  await fastify.listen({ port, host: '127.0.0.1' });
  const actualPort = (fastify.server.address() as any).port;

  // Create client
  const transport = createConnectTransport({
    baseUrl: `http://127.0.0.1:${actualPort}`,
    httpVersion: '1.1',
  });

  const client = createClient(ElizaService, transport);

  const cleanup = async () => {
    await fastify.close();
    ConnectRPC.clear();
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

export function resetInterceptorCallbacks() {
  TestInterceptor1.callback = () => undefined;
  TestInterceptor2.callback = () => undefined;
  TestInterceptor3.callback = () => undefined;
}

export function setupControllerWithoutServer() {
  // Register controller to populate ControllersStore
  const controller = new ElizaController();

  // Manually register routes in RouteMetadataStore
  // These routes would normally be registered during ConnectRPC initialization
  RouteMetadataStore.registerRoute(
    'connectrpc.eliza.v1.ElizaService',
    'Say',
    ElizaController,
    controller.say,
    'say',
    controller,
  );

  RouteMetadataStore.registerRoute(
    'connectrpc.eliza.v1.ElizaService',
    'SayMany',
    ElizaController,
    controller.sayMany,
    'sayMany',
    controller,
  );

  RouteMetadataStore.registerRoute(
    'connectrpc.eliza.v1.ElizaService',
    'ListenMany',
    ElizaController,
    controller.listenMany,
    'listenMany',
    controller,
  );
}
