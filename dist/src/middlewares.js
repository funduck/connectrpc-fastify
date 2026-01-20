"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMiddlewares = initMiddlewares;
const helpers_1 = require("./helpers");
const stores_1 = require("./stores");
async function initMiddlewares(server, middlewareConfigs) {
    for (const config of middlewareConfigs) {
        const methods = new Set((config.methods || []).map((m) => m[0].toUpperCase() + m.slice(1)));
        const middlewareInstance = stores_1.MiddlewareStore.getInstance(config.use);
        if (!middlewareInstance) {
            helpers_1.logger.warn(`Middleware ${config.use.name} not found in store. Did you forget to add MiddlewareStore.registerInstance(this) in the constructor? Or did you forget to instantiate the middleware?`);
            continue;
        }
        if (typeof middlewareInstance.use === 'function') {
            const hook = (0, helpers_1.convertMiddlewareToHook)(middlewareInstance);
            const filteredHook = async (request, reply) => {
                const url = request.url;
                const match = url.match(/^\/([^/]+)\/([^/]+)$/);
                if (!match) {
                    return;
                }
                const [, serviceName, methodName] = match;
                if (config.on && config.on.typeName !== serviceName) {
                    return;
                }
                if (methods.size && !methods.has(methodName)) {
                    return;
                }
                await hook(request, reply);
            };
            server.addHook('onRequest', filteredHook);
            const serviceInfo = config.on
                ? ` to service ${config.on.typeName}`
                : ' to all services';
            const methodInfo = config.methods
                ? ` methods [${config.methods.join(', ')}]`
                : ' all methods';
            helpers_1.logger.log(`Applied middleware: ${config.use.name}${serviceInfo}${methodInfo}`);
        }
    }
}
//# sourceMappingURL=middlewares.js.map