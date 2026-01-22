# Connectrpc Fastify Wrapper
!BETA

Code is not production ready.

## Description

This is a wrapper for [Connectrpc](https://github.com/connectrpc/connect-es) using the [Fastify](https://github.com/fastify/fastify) server.

If you are comfortable with HTTP/1 only and want a compact, ready-to-use setup, this repository is for you.

It simplifies the binding of controllers and middlewares.

I use it as a basis for integration into Nestjs, which will be implemented [here](https://github.com/funduck/connectrpc-fastify-nestjs).


## Features

This library allows you to:
* Use only HTTP/1 transport
* Perform RPC with simple request and response messages
* Perform RPC with streaming responses
* Perform RPC with streaming requests
* Use middlewares with Fastify hooks
* Access HandlerContext in controllers (headers, context values, etc.)

*Bidirectional streaming RPC is currently out of scope because it requires HTTP/2, which is unstable on public networks. In practice, HTTP/1 provides more consistent performance.*

## How To Use
You can check out `test` directory for a complete example of server and client. Start reading from `test/demo/server.ts`.

### Controllers
Controller must implement the service interface and register itself with `ConnectRPC.registerController` in the constructor.

Controller methods receive `HandlerContext` which provides access to request headers, context values, and other metadata.

```TS
import type { HandlerContext } from '@connectrpc/connect';

export class ElizaController implements Service<typeof ElizaService> {
  constructor() {
    ConnectRPC.registerController(this, ElizaService);
  }

  async say(
    request: SayRequest,
    context: HandlerContext,
  ) {
    // Access headers from context
    const authHeader = context.requestHeader.get('authorization');
    
    return {
      sentence: `You said: ${request.sentence}`,
    };
  }
}
```

Create Fastify server, initialize controller and register ConnectRPC plugin.
```TS
const fastify = Fastify({
    logger: true,
});

new ElizaController();

await ConnectRPC.registerFastifyPlugin(fastify);

try {
    await fastify.listen({ port: 3000 });
} catch (err) {
    fastify.log.error(err);
    process.exit(1);
}
```

### Middlewares
Middlewares run as Fastify hooks and have access to raw request/response objects.

Middleware must implement `Middleware` interface and register itself with `ConnectRPC.registerMiddleware` in the constructor.
```TS
export class AuthMiddleware implements Middleware {
  constructor() {
    ConnectRPC.registerMiddleware(this);
  }

  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    // Check authentication
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      res.statusCode = 401;
      res.end('Unauthorized');
      return;
    }
    next();
  }
}
```

Create an instance of the middleware before registering the ConnectRPC plugin.
```TS
const fastify = Fastify({ logger: true });

new ElizaController();
new AuthMiddleware();

await ConnectRPC.registerFastifyPlugin(fastify);

ConnectRPC.initMiddlewares(fastify, [
    middlewareConfig(AuthMiddleware), // Global middleware for all services and methods
    // middlewareConfig(AuthMiddleware, ElizaService), // Middleware for all ElizaService methods
    // middlewareConfig(AuthMiddleware, ElizaService, ['say']), // Middleware for specific method only
]);

await fastify.listen({ port: 3000 });
```

## Feedback
Please use [Discussions](https://github.com/funduck/connectrpc-fastify/discussions) or email me.