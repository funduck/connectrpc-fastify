import { GenService } from '@bufbuild/protobuf/codegenv2';
import { ConnectRouter } from '@connectrpc/connect';
import { fastifyConnectPlugin } from '@connectrpc/connect-fastify';
import { Compression } from '@connectrpc/connect/protocol';
import { FastifyInstance } from 'fastify';
import { getGuards } from './guards';
import { discoverMethodMappings, logger } from './helpers';
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
    const guards = getGuards(instance);
    if (guards.length > 0) {
      logger.log(
        `Found ${guards.length} guards on controller ${instance.constructor.name}`,
      );
    }

    const methodMappings = discoverMethodMappings(instance.__proto__, service);

    // Create the implementation object
    const implementation: any = {};

    // Bind each method from the service
    for (const methodDesc of service.methods) {
      const { name } = methodDesc;
      const methodName = name[0].toLowerCase() + name.slice(1);

      // Check if there's a mapped controller method
      const controllerMethodName = methodMappings[name];

      if (controllerMethodName) {
        const controllerMethod = instance[controllerMethodName];

        if (controllerMethod) {
          // Bind the method with proper 'this' context
          const bindedMethod = controllerMethod.bind(instance);
          implementation[methodName] = (...args: any[]) => {
            return bindedMethod(...args);
          };

          // Store route metadata for guards and interceptors
          RouteMetadataStore.registerRoute(
            service.typeName,
            name, // PascalCase method name (e.g., "Say")
            instance.constructor,
            controllerMethod,
            controllerMethodName,
            instance,
          );

          logger.log(
            `Binding ${instance.constructor.name}.${controllerMethodName} to ${service.typeName}.${name}`,
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
    routes: routes,
  });

  logger.log('Ready');
}
