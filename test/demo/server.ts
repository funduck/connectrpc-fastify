import Fastify from 'fastify';
import { ConnectRPC, middlewareConfig } from '../../src/index';
import { interceptorConfig } from '../../src/interfaces';
import { ElizaController } from './controller';
import { ElizaService } from './gen/connectrpc/eliza/v1/eliza_pb';
import {
  MetadataReaderInterceptor,
  TestInterceptor1,
  TestInterceptor2,
  TestInterceptor3,
} from './interceptors';
import {
  TestMiddleware1,
  TestMiddleware2,
  TestMiddleware3,
} from './middlewares';

export async function bootstrap() {
  const fastify = Fastify({
    logger: true,
  });

  // Declare regular routes
  fastify.get('/', async function handler(request, reply) {
    return { hello: 'world' };
  });
  fastify.get('/hello', async function handler(request, reply) {
    return { hello: 'world' };
  });

  new ElizaController();

  new TestMiddleware1();
  new TestMiddleware2();
  new TestMiddleware3();

  new TestInterceptor1();
  new TestInterceptor2();
  new TestInterceptor3();
  new MetadataReaderInterceptor();

  await ConnectRPC.init(fastify, {
    interceptors: [
      interceptorConfig(MetadataReaderInterceptor, ElizaService), // Metadata reader interceptor
      interceptorConfig(TestInterceptor1), // Global interceptor for all services and methods
      interceptorConfig(TestInterceptor2, ElizaService), // Interceptor for all ElizaService methods
      interceptorConfig(TestInterceptor3, ElizaService, ['say']), // Interceptor for ElizaService's say method only
    ],
    middlewares: [
      middlewareConfig(TestMiddleware1), // Global middleware for all services and methods
      middlewareConfig(TestMiddleware2, ElizaService), // Middleware for all ElizaService methods
      middlewareConfig(TestMiddleware3, ElizaService, ['say']), // Middleware for ElizaService's say method only
    ],
  });

  // Run the server!
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}
