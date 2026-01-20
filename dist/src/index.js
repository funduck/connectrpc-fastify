"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initGuards = exports.middlewareConfig = exports.ConnectRPC = void 0;
exports.printMsg = printMsg;
function printMsg() {
    console.log('Thanks for using connectrpc-fastify!');
}
var connectrpc_1 = require("./connectrpc");
Object.defineProperty(exports, "ConnectRPC", { enumerable: true, get: function () { return connectrpc_1.ConnectRPC; } });
var interfaces_1 = require("./interfaces");
Object.defineProperty(exports, "middlewareConfig", { enumerable: true, get: function () { return interfaces_1.middlewareConfig; } });
var guards_1 = require("./guards");
Object.defineProperty(exports, "initGuards", { enumerable: true, get: function () { return guards_1.initGuards; } });
//# sourceMappingURL=index.js.map