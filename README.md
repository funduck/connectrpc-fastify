# Connectrpc Fastify Wrapper
<img src="./coverage/badge.svg" alt="Coverage Badge" />

Repo on [github](https://github.com/funduck/connectrpc-fastify)  
Package on [npm](https://www.npmjs.com/package/@funduck/connectrpc-fastify)  
Related repo with [Nestjs Integration](https://github.com/funduck/connectrpc-fastify-nestjs)

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
* Use interceptors for RPC-level request/response handling
* Access HandlerContext in controllers (headers, context values, etc.)

*Bidirectional streaming RPC is currently out of scope because it requires HTTP/2, which is unstable on public networks. In practice, HTTP/1 provides more consistent performance.*

## How To Use
You can check out `test` directory for a complete example of server and client. Start reading from `test/demo/server.ts`.

### Controllers
Controller must implement the service interface and register itself with `ConnectRPC.registerController` in the constructor.

Controller methods receive original Connectrpc's `HandlerContext` which provides access to request headers, context values, and other metadata.

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

Create Fastify server, initialize controller and initialize ConnectRPC.
```TS
const fastify = Fastify({
    logger: true,
});

new ElizaController();

await ConnectRPC.init(fastify);

try {
    await fastify.listen({ port: 3000 });
} catch (err) {
    fastify.log.error(err);
    process.exit(1);
}
```

### Middlewares
Middlewares run as Fastify hooks and have access to raw request/response objects and context values which can be retrieved using `getCustomContextValues` helper.

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
And then initialize middlewares using `ConnectRPC.initMiddlewares` method.  
You can configure middleware to run globally for all services and methods, for specific service only, or for specific method only.  
For type safety use `middlewareConfig` helper.
```TS
const fastify = Fastify({ logger: true });

new ElizaController();
new AuthMiddleware();

await ConnectRPC.init(fastify, {
  middlewares: [
    middlewareConfig(AuthMiddleware), // Global - for all services and methods
    // middlewareConfig(AuthMiddleware, ElizaService), // for all ElizaService methods
    // middlewareConfig(AuthMiddleware, ElizaService, ['say']), // for specific method only
  ]
});

await fastify.listen({ port: 3000 });
```

### Interceptors
Interceptors run at the RPC layer and have access to the full request/response context from ConnectRPC. They are executed after middlewares and before the controller method is called.

Interceptor must implement `Interceptor` interface and register itself with `ConnectRPC.registerInterceptor` in the constructor.
```TS
import { createContextKey } from '@connectrpc/connect';
import type { AnyFn, Interceptor } from '@funduck/connectrpc-fastify';

const reqIdKey = createContextKey('');

export class LoggingInterceptor implements Interceptor {
  constructor() {
    ConnectRPC.registerInterceptor(this);
  }

  use(next: AnyFn): AnyFn {
    return async (req) => {
      // Access request information
      console.log(`Method: ${req.method.name}`);
      console.log(`Service: ${req.service.typeName}`);
      
      // Access headers
      const authHeader = req.header.get('authorization');
      
      // Attach custom data to context
      req.contextValues.set(reqIdKey, crypto.randomUUID());
      
      // Continue with the request
      return await next(req);
    };
  }
}
```

Create an instance of the interceptor and initialize them using `ConnectRPC.init` method.  
You can configure interceptors to run globally for all services and methods, for specific service only, or for specific method only.  
For type safety use `interceptorConfig` helper.
```TS
import { interceptorConfig } from '@funduck/connectrpc-fastify';

const fastify = Fastify({ logger: false });

new AuthMiddleware();
new LoggingInterceptor();
new ElizaController();

await ConnectRPC.init(fastify, {
  logger: false,
  interceptors: [
    interceptorConfig(LoggingInterceptor), // Global - for all services and methods
    // interceptorConfig(LoggingInterceptor, ElizaService), // for all ElizaService methods
    // interceptorConfig(LoggingInterceptor, ElizaService, ['say']), // for specific method only
  ],
  middlewares: [
    middlewareConfig(AuthMiddleware), // Global - for all services and methods
  ],
});

await fastify.listen({ port: 3000 });
```

**Key differences between Middlewares and Interceptors:**
- **Middlewares** run at the HTTP layer (Fastify hooks) with access to raw HTTP request/response objects
- **Interceptors** run at the RPC layer with access to parsed ConnectRPC request/response objects, typed method information, and can modify the request/response in the RPC context

## Using Context Values
This is original `ContextValues`, so you need to create context keys using `createContextKey` helper from Connectrpc.
```TS
import { createContextKey } from '@connectrpc/connect';

const authKey = createContextKey(''); // '' as default value
```

To use context values in middleware, retrieve them using `getCustomContextValues` helper.
```TS
import { getCustomContextValues } from '@funduck/connectrpc-fastify';

// In middleware "use" method
const authHeader = req.headers['authorization'];
const contextValues = getCustomContextValues(req);
contextValues.set(authKey, authHeader);
```

To use context values in controller, retrieve them from `HandlerContext`.
```TS
// In controller method
const authValue = context.values.get(authKey);
```

**Note:** Context values set in middlewares are automatically available in interceptors and controllers. Interceptors can also access and modify context values using `req.contextValues`.

## Strict Mode
If **strict mode** is enabled the library will cause process to exit on errors such as missing middleware or interceptor instances.  
By default, strict mode is disabled to allow more flexibility during development.

To enable it call `ConnectRPC.setStrictMode(true)` before registering any middlewares or interceptors.  
To check it read `ConnectRPC.isStrictMode` property.

## Feedback
Please use [Discussions](https://github.com/funduck/connectrpc-fastify/discussions) or email me.