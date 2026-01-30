import { ConnectRouter } from '@connectrpc/connect';
import { fastifyConnectPlugin } from '@connectrpc/connect-fastify';
import { Compression } from '@connectrpc/connect/protocol';
import { FastifyInstance } from 'fastify';
import { implementations } from './controllers';
import { logger } from './helpers';
import { contextInterceptor, initializedInterceptors } from './interceptors';

export async function registerFastifyPlugin(
  server: FastifyInstance,
  options: {
    acceptCompression?: Compression[];
  } = {},
) {
  const routes = (router: ConnectRouter) => {
    for (const [service, implementation] of implementations.entries()) {
      router.service(service, implementation);
      logger.log(`Registered {/${service.typeName}} route`);
    }
  };

  if (routes.length === 0) {
    logger.warn('No controllers found to register');
    return;
  }

  await server.register(fastifyConnectPlugin, {
    // For now we enable only Connect protocol by default and disable others.
    // grpc: this.options.grpc ?? false,
    // grpcWeb: this.options.grpcWeb ?? false,
    // connect: this.options.connect ?? true,
    grpc: false,
    grpcWeb: false,
    connect: true,
    acceptCompression: options.acceptCompression ?? [],
    interceptors: [contextInterceptor, ...initializedInterceptors],
    routes: routes,
  });

  logger.log('Ready');
}
