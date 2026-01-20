import { FastifyInstance } from 'fastify';
import { ExecutionContext, Guard } from './interfaces';
export declare class ManualGuardExecutor {
    executeGuard(guard: Guard, context: ExecutionContext): Promise<boolean>;
    executeGuards(guards: Guard[], context: ExecutionContext): Promise<boolean>;
}
export declare function getGuards(controller: any): Guard[];
export declare function initGuards(server: FastifyInstance): Promise<void>;
