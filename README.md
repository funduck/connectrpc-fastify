# Connectrpc Fastify Wrapper

## Description

This is a wrapper for [Connectrpc](https://github.com/connectrpc/connect-es) using the [Fastify](https://github.com/fastify/fastify) server.

If you are comfortable with HTTP/1 only and want a compact, ready-to-use setup, this repository is for you.

It simplifies the binding of controllers, middlewares, and guards.

I use it as a basis for integration into Nestjs, which will be implemented [here](https://github.com/funduck/connectrpc-fastify-nestjs).


## Features

This library allows you to:
* Use only HTTP/1 transport
* Perform RPC with simple request and response messages
* Perform RPC with streaming responses
* Perform RPC with streaming requests
* Use middlewares
* Use global guards

*Bidirectional streaming RPC is currently out of scope because it requires HTTP/2, which is unstable on public networks. In practice, HTTP/1 provides more consistent performance.*

## How To Use
You can check out `test` directory for a complete example of server and client.

### Controllers
Controller must implement the service interface and register itself with `ConnectRPC.registerController` in the constructor.
```TS
export class ElizaController implements Service<typeof ElizaService> {
  constructor() {
    ConnectRPC.registerController(this, ElizaService);
  }

  async say(
    request: SayRequest,
  ) {
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
You can use middlewares for pre-processing requests.

Middleware must implement `Middleware` interface and register itself with `ConnectRPC.registerMiddleware` in the constructor.
```TS
export class TestMiddleware1 implements Middleware {
  constructor() {
    ConnectRPC.registerMiddleware(this);
  }

  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    next();
  }
}
```

Then create an instance of the middleware before registering the ConnectRPC plugin.
```TS
const fastify = Fastify({
    logger: true,
});

new ElizaController();

new TestMiddleware1();

await ConnectRPC.registerFastifyPlugin(fastify);

ConnectRPC.initMiddlewares(fastify, [
    middlewareConfig(TestMiddleware1), // Global middleware for all services and methods
    //middlewareConfig(TestMiddleware1, ElizaService), // Middleware for all ElizaService methods
    //middlewareConfig(TestMiddleware1, ElizaService, ['say']), // Middleware for ElizaService's say method only
]);

try {
    await fastify.listen({ port: 3000 });
} catch (err) {
    fastify.log.error(err);
    process.exit(1);
}
```

### Guards
Guards are used to restrict access to certain services or methods.

Guard must implement `Guard` interface and register itself with `ConnectRPC.registerGuard` in the constructor.
```TS
export class TestGuard1 implements Guard {
  constructor() {
    ConnectRPC.registerGuard(this);
  }

  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}
```

Then create an instance of the guard before registering the ConnectRPC plugin and initialize it similarly to middlewares.
```TS
const fastify = Fastify({
    logger: true,
});

new ElizaController();

new TestMiddleware1();

new TestGuard1();

await ConnectRPC.registerFastifyPlugin(fastify);

ConnectRPC.initMiddlewares(fastify, [
    middlewareConfig(TestMiddleware1), // Global middleware for all services and methods
    // middlewareConfig(TestMiddleware1, ElizaService), // Middleware for all ElizaService methods
    // middlewareConfig(TestMiddleware1, ElizaService, ['say']), // Middleware for ElizaService's say method only
]);

ConnectRPC.initGuards(fastify);

try {
    await fastify.listen({ port: 3000 });
} catch (err) {
    fastify.log.error(err);
    process.exit(1);
}
```

## Feedback
Please use [Discussions](https://github.com/funduck/connectrpc-fastify/discussions) or email me.