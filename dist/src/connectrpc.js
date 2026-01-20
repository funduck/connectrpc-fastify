"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectRPC = void 0;
const fastify_plugin_1 = require("./fastify-plugin");
const guards_1 = require("./guards");
const helpers_1 = require("./helpers");
const middlewares_1 = require("./middlewares");
const stores_1 = require("./stores");
class ConnectRPCClass {
    setLogger(customLogger) {
        (0, helpers_1.setLogger)(customLogger);
    }
    registerMiddleware(self, options) {
        stores_1.MiddlewareStore.registerInstance(self, options);
    }
    registerController(self, service, options) {
        stores_1.ControllersStore.registerInstance(self, service, options);
    }
    registerGuard(self, options) {
        stores_1.GuardsStore.registerInstance(self, options);
    }
    registerFastifyPlugin(server) {
        return (0, fastify_plugin_1.registerFastifyPlugin)(server);
    }
    _middlewaresInitialized = false;
    initMiddlewares(server, middlewareConfigs) {
        if (this._middlewaresInitialized) {
            throw new Error('Middlewares have already been initialized!');
        }
        if (this._guardsInitialized) {
            throw new Error('Middlewares must be initialized before guards!');
        }
        this._middlewaresInitialized = true;
        return (0, middlewares_1.initMiddlewares)(server, middlewareConfigs);
    }
    _guardsInitialized = false;
    initGuards(server) {
        if (this._guardsInitialized) {
            throw new Error('Guards have already been initialized!');
        }
        this._guardsInitialized = true;
        return (0, guards_1.initGuards)(server);
    }
}
exports.ConnectRPC = new ConnectRPCClass();
//# sourceMappingURL=connectrpc.js.map