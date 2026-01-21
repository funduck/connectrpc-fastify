import { FastifyReply, FastifyRequest } from 'fastify';

import { ConnectRPC, Middleware } from '../../src/index';
import { ContextStorage } from './async_hooks';

export class TestMiddleware1 implements Middleware {
  static callback = (req: FastifyRequest['raw'], res: FastifyReply['raw']) =>
    undefined;

  constructor() {
    ConnectRPC.registerMiddleware(this, {
      allowMultipleInstances: false, // If true, we allow multiple instances of this middleware, but usually we want only one
    });
  }

  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    ContextStorage.runAsync(new Map<string, any>(), async () => {
      console.log('TestMiddleware1: context store initialized');
      return new Promise<void>((resolve) => {
        try {
          res.once('finish', () => {
            resolve();
          });

          TestMiddleware1.callback(req, res);

          next();
        } catch (error) {
          resolve();
        }
      });
    }).finally(() => {
      console.log('TestMiddleware1: context store cleared');
    });
  }
}

export class TestMiddleware2 implements Middleware {
  static callback = (req: FastifyRequest['raw'], res: FastifyReply['raw']) =>
    undefined;

  constructor() {
    ConnectRPC.registerMiddleware(this, {
      allowMultipleInstances: false, // If true, we allow multiple instances of this middleware, but usually we want only one
    });
  }

  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    TestMiddleware2.callback(req, res);
    next();
  }
}

export class TestMiddleware3 implements Middleware {
  static callback = (req: FastifyRequest['raw'], res: FastifyReply['raw']) =>
    undefined;

  constructor() {
    ConnectRPC.registerMiddleware(this, {
      allowMultipleInstances: false, // If true, we allow multiple instances of this middleware, but usually we want only one
    });
  }

  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    TestMiddleware3.callback(req, res);
    next();
  }
}
