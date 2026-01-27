import Fastify, { FastifyInstance } from 'fastify';
import { ConnectRPC } from '../../src/connectrpc';
import { middlewareConfig } from '../../src/interfaces';
import { getCustomContextValues, initMiddlewares } from '../../src/middlewares';
import { MiddlewareStore } from '../../src/stores';

describe('Middlewares Error Handling', () => {
  let fastify: FastifyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(async () => {
    ConnectRPC.clear();
    ConnectRPC.setStrictMode(true);
    fastify = Fastify({ logger: false });
    processExitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((code?: any) => {
        throw new Error(`process.exit(${code})`);
      });
  });

  afterEach(async () => {
    await fastify.close();
    processExitSpy.mockRestore();
  });

  describe('initMiddlewares', () => {
    it('should exit process when middleware not registered', async () => {
      class UnregisteredMiddleware {
        use(req: any, res: any, next: any) {
          next();
        }
      }

      const configs = [middlewareConfig(UnregisteredMiddleware as any)];

      await expect(async () => {
        await initMiddlewares(fastify, configs);
      }).rejects.toThrow('process.exit(1)');

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle middleware error and return 500', async () => {
      class ErrorMiddleware {
        use(req: any, res: any, next: any) {
          next(new Error('Middleware error'));
        }
      }

      const errorInstance = new ErrorMiddleware();
      MiddlewareStore.registerInstance(errorInstance as any);

      const configs = [middlewareConfig(ErrorMiddleware as any)];

      await initMiddlewares(fastify, configs);
      await fastify.listen({ port: 0 });

      const response = await fastify.inject({
        method: 'POST',
        url: '/test.Service/TestMethod',
        headers: {
          'content-type': 'application/json',
        },
        payload: {},
      });

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.payload)).toEqual({
        error: 'Internal Server Error',
      });
    });

    it('should not send error response if already sent', async () => {
      class ErrorMiddleware {
        use(req: any, res: any, next: any) {
          res.statusCode = 400;
          res.end('Bad Request');
          next(new Error('Middleware error'));
        }
      }

      const errorInstance = new ErrorMiddleware();
      MiddlewareStore.registerInstance(errorInstance as any);

      const configs = [middlewareConfig(ErrorMiddleware as any)];

      await initMiddlewares(fastify, configs);
      await fastify.listen({ port: 0 });

      const response = await fastify.inject({
        method: 'POST',
        url: '/test.Service/TestMethod',
        headers: {
          'content-type': 'application/json',
        },
        payload: {},
      });

      // Response should be what middleware sent, not 500
      expect(response.statusCode).toBe(400);
    });
  });

  describe('getCustomContextValues', () => {
    it('should return null when request ID not in headers', () => {
      const mockReq = {
        headers: {},
      };

      const result = getCustomContextValues(mockReq as any);
      expect(result).toBeNull();
    });

    it('should return null when context not found for request ID', () => {
      const mockReq = {
        headers: {
          'x-server-request-id': 'non-existent-id',
        },
      };

      const result = getCustomContextValues(mockReq as any);
      expect(result).toBeNull();
    });
  });
});
