import type { GenMessage, GenService } from '@bufbuild/protobuf/codegenv2';
import { FastifyReply, FastifyRequest } from 'fastify';
import { OmitConnectrpcFields } from './types';
export interface Logger {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    verbose: (...args: any[]) => void;
}
export interface Middleware {
    use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: (err?: any) => void): void;
}
export interface Type<T = any> extends Function {
    new (...args: any[]): T;
}
type ExtractInput<T> = T extends {
    input: GenMessage<infer M>;
} ? M : never;
type ExtractOutput<T> = T extends {
    output: GenMessage<infer M>;
} ? M : never;
type ServiceMethod<T> = T extends {
    methodKind: 'unary';
} ? (request: ExtractInput<T>) => Promise<OmitConnectrpcFields<ExtractOutput<T>>> : T extends {
    methodKind: 'server_streaming';
} ? (request: ExtractInput<T>) => AsyncIterable<OmitConnectrpcFields<ExtractOutput<T>>> : T extends {
    methodKind: 'client_streaming';
} ? (request: AsyncIterable<ExtractInput<T>>) => Promise<OmitConnectrpcFields<ExtractOutput<T>>> : T extends {
    methodKind: 'bidi_streaming';
} ? (request: AsyncIterable<ExtractInput<T>>) => AsyncIterable<OmitConnectrpcFields<ExtractOutput<T>>> : never;
export type Service<T> = T extends GenService<infer Methods> ? {
    [K in keyof Methods]?: ServiceMethod<Methods[K]>;
} : never;
export type ServiceMethodNames<T> = T extends GenService<infer Methods> ? {
    [K in keyof Methods]: K;
}[keyof Methods] : never;
export type MiddlewareConfigGlobal = {
    use: Type<Middleware>;
    on?: never;
    methods?: never;
};
export type MiddlewareConfig<T extends GenService<any>> = {
    use: Type<Middleware>;
    on: T;
    methods?: Array<ServiceMethodNames<T>>;
};
export type MiddlewareConfigUnion = MiddlewareConfigGlobal | MiddlewareConfig<any>;
export declare function middlewareConfig<T extends GenService<any>>(use: Type<Middleware>, on?: T, methods?: Array<ServiceMethodNames<T>>): MiddlewareConfigUnion;
export interface ExecutionContext {
    getClass<T = any>(): Type<T>;
    getHandler(): Function;
    getArgs<T extends Array<any> = any[]>(): T;
    getArgByIndex<T = any>(index: number): T;
    switchToHttp(): {
        getRequest(): FastifyRequest['raw'];
        getResponse(): FastifyReply['raw'];
        getNext<T = any>(): () => T;
    };
    switchToRpc(): any;
    switchToWs(): any;
}
export interface Guard {
    canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}
export {};
