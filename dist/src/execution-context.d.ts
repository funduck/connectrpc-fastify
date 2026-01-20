import { FastifyReply, FastifyRequest } from 'fastify';
import { ExecutionContext, Type } from './interfaces';
export declare class ManualExecutionContext implements ExecutionContext {
    readonly request: FastifyRequest['raw'];
    readonly response: FastifyReply['raw'];
    readonly next: <T = any>() => T;
    readonly args: any[];
    readonly constructorRef: Type<any> | null;
    readonly handler: Function | null;
    constructor(request: FastifyRequest['raw'], response: FastifyReply['raw'], next: <T = any>() => T, args: any[], constructorRef?: Type<any> | null, handler?: Function | null);
    getClass<T = any>(): Type<T>;
    getHandler(): Function;
    getArgs<T extends Array<any> = any[]>(): T;
    getArgByIndex<T = any>(index: number): T;
    switchToHttp(): this & {
        getRequest: () => import("node:http").IncomingMessage;
        getResponse: () => import("node:http").ServerResponse<import("node:http").IncomingMessage>;
        getNext: () => <T = any>() => T;
    };
    switchToRpc(): void;
    switchToWs(): void;
}
