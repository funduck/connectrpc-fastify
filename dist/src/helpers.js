"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.discoverMethodMappings = discoverMethodMappings;
exports.convertMiddlewareToHook = convertMiddlewareToHook;
exports.setLogger = setLogger;
function discoverMethodMappings(prototype, service) {
    const methodMappings = {};
    const serviceMethods = Array.isArray(service.methods) ? service.methods : [];
    const controllerMethods = Object.getOwnPropertyNames(prototype).filter((name) => name !== 'constructor' && typeof prototype[name] === 'function');
    for (const methodDesc of serviceMethods) {
        const serviceMethodName = methodDesc.name;
        const localName = methodDesc.localName;
        let controllerMethodName = controllerMethods.find((name) => name === localName);
        if (!controllerMethodName) {
            controllerMethodName = controllerMethods.find((name) => name.toLowerCase() === serviceMethodName.toLowerCase());
        }
        if (controllerMethodName) {
            methodMappings[serviceMethodName] = controllerMethodName;
        }
    }
    return methodMappings;
}
function convertMiddlewareToHook(middlewareInstance) {
    return async (request, reply) => {
        return new Promise((resolve, reject) => {
            try {
                middlewareInstance.use(request.raw, reply.raw, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            }
            catch (error) {
                reject(error);
            }
        });
    };
}
exports.logger = {
    log: (...args) => {
        console.info(...args);
    },
    error: (...args) => {
        console.error(...args);
    },
    warn: (...args) => {
        console.warn(...args);
    },
    debug: (...args) => {
        console.debug(...args);
    },
    verbose: (...args) => {
        console.log(...args);
    },
};
function setLogger(customLogger) {
    exports.logger = customLogger;
}
//# sourceMappingURL=helpers.js.map