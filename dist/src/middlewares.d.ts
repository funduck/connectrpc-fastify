import { FastifyInstance } from 'fastify';
import { MiddlewareConfigUnion } from './interfaces';
export declare function initMiddlewares(server: FastifyInstance, middlewareConfigs: MiddlewareConfigUnion[]): Promise<void>;
