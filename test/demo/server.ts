import Fastify from 'fastify';
import { ConnectRPC, middlewareConfig } from '../../src/index';
import { interceptorConfig } from '../../src/interfaces';
import { ElizaController } from './controller';
import { ElizaService } from './gen/connectrpc/eliza/v1/eliza_pb';
import { MetadataReaderInterceptor, TestInterceptor1 } from './interceptors';
import {
  TestMiddleware1,
  TestMiddleware2,
  TestMiddleware3,
} from './middlewares';

export async function bootstrap() {
  const fastify = Fastify({
    logger: true,
  });

  // Declare a route
  fastify.get('/', async function handler(request, reply) {
    return { hello: 'world' };
  });

  new ElizaController();

  new TestMiddleware1();
  new TestMiddleware2();
  new TestMiddleware3();

  new TestInterceptor1();
  new MetadataReaderInterceptor();

  await ConnectRPC.init(fastify, {
    interceptors: [
      interceptorConfig(MetadataReaderInterceptor, ElizaService), // Metadata reader interceptor
      interceptorConfig(TestInterceptor1, ElizaService), // Interceptor for all ElizaService methods
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
