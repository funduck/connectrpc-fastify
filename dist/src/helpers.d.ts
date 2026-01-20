import { GenService } from '@bufbuild/protobuf/codegenv2';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Logger } from './interfaces';
export declare function discoverMethodMappings(prototype: any, service: GenService<any>): Record<string, string>;
export declare function convertMiddlewareToHook(middlewareInstance: any): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare let logger: Logger;
export declare function setLogger(customLogger: Logger): void;
