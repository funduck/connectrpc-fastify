import { GenService } from '@bufbuild/protobuf/codegenv2';
import { logger, methodNameInController } from './helpers';
import { ControllersStore, RouteMetadataStore } from './stores';

/** Here we will setup initialized implementstions for services */
export let implementations = new Map<GenService<any>, any>();

export function initControllers() {
  // Create implementations from controller instances

  for (const { instance, service } of ControllersStore.values()) {
    // Create the implementation object
    const implementation: any = {};

    // Bind each method from the service
    for (const methodDesc of service.methods) {
      const { name: methodName } = methodDesc; // This is in PascalCase, e.g., "Say" as in service .proto file
      const controllerMethodName = methodNameInController(methodName);

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
}
