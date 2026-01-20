"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardsStore = exports.RouteMetadataStore = exports.MiddlewareStore = exports.ControllersStore = void 0;
class ControllersStoreClass {
    controllers = new Map();
    values() {
        return Array.from(this.controllers.entries()).map(([target, data]) => ({
            target,
            ...data,
        }));
    }
    registerInstance(self, service, { allowMultipleInstances = false, } = {}) {
        const controllerClass = self.constructor;
        if (!allowMultipleInstances && this.controllers.has(controllerClass)) {
            throw new Error(`Controller ${controllerClass.name} is already registered! This may happen if you export controller as provider and also register it in some Nest module.`);
        }
        this.controllers.set(controllerClass, {
            instance: self,
            service,
        });
    }
}
exports.ControllersStore = new ControllersStoreClass();
class MiddlewareStoreClass {
    middlewares = new Map();
    registerInstance(self, { allowMultipleInstances = false, } = {}) {
        const middlewareClass = self.constructor;
        if (!allowMultipleInstances && this.middlewares.has(middlewareClass)) {
            throw new Error(`Middleware ${middlewareClass.name} is already registered! This may happen if you export middleware as provider and also register it in some Nest module.`);
        }
        this.middlewares.set(middlewareClass, self);
    }
    getInstance(middlewareClass) {
        return this.middlewares.get(middlewareClass) || null;
    }
}
exports.MiddlewareStore = new MiddlewareStoreClass();
class RouteMetadataStoreClass {
    routes = new Map();
    registerRoute(serviceName, methodName, controllerClass, controllerMethod, controllerMethodName, instance) {
        const routeKey = `/${serviceName}/${methodName}`;
        this.routes.set(routeKey, {
            controllerClass,
            controllerMethod,
            controllerMethodName,
            instance,
            serviceName,
            methodName,
        });
    }
    getRouteMetadata(urlPath) {
        return this.routes.get(urlPath) || null;
    }
    getAllRoutes() {
        return Array.from(this.routes.entries());
    }
}
exports.RouteMetadataStore = new RouteMetadataStoreClass();
class GuardsStoreClass {
    guards = new Map();
    registerInstance(self, { allowMultipleInstances = false, } = {}) {
        const guardClass = self.constructor;
        if (!allowMultipleInstances && this.guards.has(guardClass)) {
            throw new Error(`Guard ${guardClass.name} is already registered! This may happen if you export guard as provider and also register it in some Nest module.`);
        }
        this.guards.set(guardClass, self);
    }
    getInstance(guardClass) {
        return this.guards.get(guardClass) || null;
    }
    getAllGuards() {
        return Array.from(this.guards.values());
    }
}
exports.GuardsStore = new GuardsStoreClass();
//# sourceMappingURL=stores.js.map