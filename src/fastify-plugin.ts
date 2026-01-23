import { GenService } from '@bufbuild/protobuf/codegenv2';
import { ConnectRouter } from '@connectrpc/connect';
import { fastifyConnectPlugin } from '@connectrpc/connect-fastify';
import { Compression } from '@connectrpc/connect/protocol';
import { FastifyInstance } from 'fastify';
import { logger } from './helpers';
import { contextInterceptor, initializedInterceptors } from './interceptors';
import { ControllersStore, RouteMetadataStore } from './stores';

export async function registerFastifyPlugin(
  server: FastifyInstance,
  options: {
    acceptCompression?: Compression[];
  } = {},
) {
  // Create implementations from controller instances
  const implementations = new Map<GenService<any>, any>();

  for (const { instance, service } of ControllersStore.values()) {
    // Create the implementation object
    const implementation: any = {};

    // Bind each method from the service
    for (const methodDesc of service.methods) {
      const { name: methodName } = methodDesc; // This is in PascalCase, e.g., "Say" as in service .proto file
      const controllerMethodName =
        methodName[0].toLowerCase() + methodName.slice(1); // This is in camelCase, e.g., "say" as in controller

      if (controllerMethodName) {
        const controllerMethod = instance[controllerMethodName];

        if (controllerMethod) {
          // Bind the method with proper 'this' context
          const bindedMethod = controllerMethod.bind(instance);
          implementation[controllerMethodName] = bindedMethod;

          // Store route metadata for interceptors
          RouteMetadataStore.registerRoute(
            service.typeName,
            methodName,
            instance.constructor,
            controllerMethod,
            controllerMethodName,
            instance,
          );

          logger.log(
            `Binding ${instance.constructor.name}.${controllerMethodName} to ${service.typeName}.${methodName}`,
          );
        } else {
          logger.warn(
            `Method ${controllerMethodName} not found in ${instance.constructor.name}`,
          );
        }
      }
    }

    implementations.set(service, implementation);
  }

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
