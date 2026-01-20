import { GenService, GenServiceMethods } from '@bufbuild/protobuf/codegenv2';
import { FastifyInstance } from 'fastify';
import { Guard, Logger, Middleware, MiddlewareConfigUnion, Service } from './interfaces';
declare class ConnectRPCClass {
    setLogger(customLogger: Logger): void;
    registerMiddleware(self: Middleware, options?: {
        allowMultipleInstances?: boolean;
    }): void;
    registerController<T extends GenServiceMethods>(self: Service<GenService<T>>, service: GenService<T>, options?: {
        allowMultipleInstances?: boolean;
    }): void;
    registerGuard(self: Guard, options?: {
        allowMultipleInstances?: boolean;
    }): void;
    registerFastifyPlugin(server: FastifyInstance): Promise<void>;
    private _middlewaresInitialized;
    initMiddlewares(server: FastifyInstance, middlewareConfigs: MiddlewareConfigUnion[]): Promise<void>;
    private _guardsInitialized;
    initGuards(server: FastifyInstance): Promise<void>;
}
export declare const ConnectRPC: ConnectRPCClass;
export {};
