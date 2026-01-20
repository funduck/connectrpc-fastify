"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFastifyPlugin = registerFastifyPlugin;
const connect_fastify_1 = require("@connectrpc/connect-fastify");
const guards_1 = require("./guards");
const helpers_1 = require("./helpers");
const stores_1 = require("./stores");
async function registerFastifyPlugin(server, options = {}) {
    const implementations = new Map();
    for (const { instance, service } of stores_1.ControllersStore.values()) {
        const guards = (0, guards_1.getGuards)(instance);
        if (guards.length > 0) {
            helpers_1.logger.log(`Found ${guards.length} guards on controller ${instance.constructor.name}`);
        }
        const methodMappings = (0, helpers_1.discoverMethodMappings)(instance.__proto__, service);
        const implementation = {};
        for (const methodDesc of service.methods) {
            const { name } = methodDesc;
            const methodName = name[0].toLowerCase() + name.slice(1);
            const controllerMethodName = methodMappings[name];
            if (controllerMethodName) {
                const controllerMethod = instance[controllerMethodName];
                if (controllerMethod) {
                    const bindedMethod = controllerMethod.bind(instance);
                    implementation[methodName] = (...args) => {
                        return bindedMethod(...args);
                    };
                    stores_1.RouteMetadataStore.registerRoute(service.typeName, name, instance.constructor, controllerMethod, controllerMethodName, instance);
                    helpers_1.logger.log(`Binding ${instance.constructor.name}.${controllerMethodName} to ${service.typeName}.${name}`);
                }
                else {
                    helpers_1.logger.warn(`Method ${controllerMethodName} not found in ${instance.constructor.name}`);
                }
            }
        }
        implementations.set(service, implementation);
    }
    const routes = (router) => {
        for (const [service, implementation] of implementations.entries()) {
            router.service(service, implementation);
            helpers_1.logger.log(`Registered {/${service.typeName}} route`);
        }
    };
    if (routes.length === 0) {
        helpers_1.logger.warn('No controllers found to register');
        return;
    }
    await server.register(connect_fastify_1.fastifyConnectPlugin, {
        grpc: false,
        grpcWeb: false,
        connect: true,
        acceptCompression: options.acceptCompression ?? [],
        routes: routes,
    });
    helpers_1.logger.log('Ready');
}
//# sourceMappingURL=fastify-plugin.js.map