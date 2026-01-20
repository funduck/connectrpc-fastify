"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualGuardExecutor = void 0;
exports.getGuards = getGuards;
exports.initGuards = initGuards;
const execution_context_1 = require("./execution-context");
const helpers_1 = require("./helpers");
const stores_1 = require("./stores");
class ManualGuardExecutor {
    async executeGuard(guard, context) {
        const result = guard.canActivate(context);
        if (typeof result === 'boolean') {
            return result;
        }
        return await result;
    }
    async executeGuards(guards, context) {
        for (const guard of guards) {
            const canActivate = await this.executeGuard(guard, context);
            if (!canActivate) {
                return false;
            }
        }
        return true;
    }
}
exports.ManualGuardExecutor = ManualGuardExecutor;
function getGuards(controller) {
    return stores_1.GuardsStore.getAllGuards();
}
async function initGuards(server) {
    const guardExecutor = new ManualGuardExecutor();
    server.addHook('preHandler', async (request, reply) => {
        const url = request.url;
        const match = url.match(/^\/([^/]+)\/([^/]+)$/);
        if (!match) {
            return;
        }
        const routeMetadata = stores_1.RouteMetadataStore.getRouteMetadata(url);
        if (!routeMetadata) {
            helpers_1.logger.warn(`No route metadata found for ${url}`);
            return;
        }
        const { controllerClass, controllerMethod, controllerMethodName, instance, } = routeMetadata;
        const guards = getGuards(instance);
        if (guards.length === 0) {
            return;
        }
        const executionContext = new execution_context_1.ManualExecutionContext(request.raw, reply.raw, (() => undefined), [], controllerClass, controllerMethod);
        try {
            const canActivate = await guardExecutor.executeGuards(guards, executionContext);
            if (!canActivate) {
                reply.code(403).send({
                    code: 'permission_denied',
                    message: 'Forbidden',
                });
                throw new Error('Guard rejected the request');
            }
        }
        catch (error) {
            if (!reply.sent) {
                reply.code(403).send({
                    code: 'permission_denied',
                    message: error instanceof Error ? error.message : 'Forbidden',
                });
            }
            throw error;
        }
    });
    helpers_1.logger.log('Guards middleware initialized');
}
//# sourceMappingURL=guards.js.map