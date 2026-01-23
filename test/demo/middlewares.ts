import { FastifyReply, FastifyRequest } from 'fastify';

import { ConnectRPC, Middleware } from '../../src/index';

export class TestMiddleware1 implements Middleware {
  static callback = (req: FastifyRequest['raw'], res: FastifyReply['raw']) =>
    undefined;

  constructor() {
    ConnectRPC.registerMiddleware(this);
  }

  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    TestMiddleware1.callback(req, res);
    next();
  }
}

export class TestMiddleware2 implements Middleware {
  static callback = (req: FastifyRequest['raw'], res: FastifyReply['raw']) =>
    undefined;

  constructor() {
    ConnectRPC.registerMiddleware(this);
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
    ConnectRPC.registerMiddleware(this);
  }

  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    TestMiddleware3.callback(req, res);
    next();
  }
}
