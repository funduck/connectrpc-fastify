import { Compression } from '@connectrpc/connect/protocol';
import { FastifyInstance } from 'fastify';
export declare function registerFastifyPlugin(server: FastifyInstance, options?: {
    acceptCompression?: Compression[];
}): Promise<void>;
