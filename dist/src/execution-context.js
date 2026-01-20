"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualExecutionContext = void 0;
class ManualExecutionContext {
    request;
    response;
    next;
    args;
    constructorRef;
    handler;
    constructor(request, response, next, args, constructorRef = null, handler = null) {
        this.request = request;
        this.response = response;
        this.next = next;
        this.args = args;
        this.constructorRef = constructorRef;
        this.handler = handler;
    }
    getClass() {
        return this.constructorRef;
    }
    getHandler() {
        return this.handler;
    }
    getArgs() {
        return this.args;
    }
    getArgByIndex(index) {
        return this.args[index];
    }
    switchToHttp() {
        return Object.assign(this, {
            getRequest: () => this.request,
            getResponse: () => this.response,
            getNext: () => this.next,
        });
    }
    switchToRpc() {
        throw new Error('Context switching to RPC is not supported.');
    }
    switchToWs() {
        throw new Error('Context switching to WebSockets is not supported.');
    }
}
exports.ManualExecutionContext = ManualExecutionContext;
//# sourceMappingURL=execution-context.js.map