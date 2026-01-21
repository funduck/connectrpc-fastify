import { Client, createContextKey, HandlerContext } from '@connectrpc/connect';
import { IncomingMessage, ServerResponse } from 'http';
import { ContextStorage } from '../demo/async_hooks';
import { ElizaController } from '../demo/controller';
import { ElizaService } from '../demo/gen/connectrpc/eliza/v1/eliza_pb';
import {
  TestMiddleware1,
  TestMiddleware2,
  TestMiddleware3,
} from '../demo/middlewares';
import { resetMiddlewareCallbacks, setupTestServer } from './test-helpers';

describe('Middleware Access to Request Headers and Data', () => {
  let client: Client<typeof ElizaService>;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const setup = await setupTestServer();
    client = setup.client;
    cleanup = setup.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(() => {
    resetMiddlewareCallbacks();
  });

  it('should access request headers in middleware', async () => {
    let capturedHeaders: Record<string, any> = {};

    TestMiddleware1.callback = (req: IncomingMessage, res: ServerResponse) => {
      capturedHeaders = {
        authorization: req.headers['authorization'],
        'x-request-id': req.headers['x-request-id'],
      };
    };

    await client.say(
      { sentence: 'test' },
      {
        headers: {
          Authorization: 'Bearer token123',
          'x-request-id': 'test-001',
        },
      },
    );

    expect(capturedHeaders['authorization']).toBe('Bearer token123');
    expect(capturedHeaders['x-request-id']).toBe('test-001');
  });

  it('should attach custom data to request object', async () => {
    let requestWithData: any = null;

    TestMiddleware1.callback = (req: IncomingMessage, res: ServerResponse) => {
      // Attach custom data to request
      (req as any).customUserId = '12345';
      (req as any).customTimestamp = Date.now();
      (req as any).customFlag = true;
    };

    TestMiddleware2.callback = (req: IncomingMessage, res: ServerResponse) => {
      // Capture the request object with attached data
      requestWithData = {
        userId: (req as any).customUserId,
        timestamp: (req as any).customTimestamp,
        flag: (req as any).customFlag,
      };
    };

    await client.say({ sentence: 'test' });

    expect(requestWithData).toBeDefined();
    expect(requestWithData.userId).toBe('12345');
    expect(requestWithData.timestamp).toBeGreaterThan(0);
    expect(requestWithData.flag).toBe(true);
  });

  it('should pass attached data between middlewares', async () => {
    let middleware1Called = false;
    let middleware2Data: any = null;

    TestMiddleware1.callback = (req: IncomingMessage, res: ServerResponse) => {
      middleware1Called = true;
      (req as any).sharedData = {
        fromMiddleware1: 'value1',
        counter: 100,
      };
    };

    TestMiddleware2.callback = (req: IncomingMessage, res: ServerResponse) => {
      middleware2Data = (req as any).sharedData;
      // Modify the shared data
      if (middleware2Data) {
        middleware2Data.fromMiddleware2 = 'value2';
      }
    };

    await client.say({ sentence: 'test' });

    expect(middleware1Called).toBe(true);
    expect(middleware2Data).toBeDefined();
    expect(middleware2Data.fromMiddleware1).toBe('value1');
    expect(middleware2Data.counter).toBe(100);
    expect(middleware2Data.fromMiddleware2).toBe('value2');
  });

  it('should call middlewares in correct order', async () => {
    const callOrder: string[] = [];

    TestMiddleware1.callback = () => {
      callOrder.push('middleware1');
    };

    TestMiddleware2.callback = () => {
      callOrder.push('middleware2');
    };

    TestMiddleware3.callback = () => {
      callOrder.push('middleware3');
    };

    await client.say({ sentence: 'test' });

    expect(callOrder).toEqual(['middleware1', 'middleware2', 'middleware3']);
  });

  it('should only call method-specific middleware for matching methods', async () => {
    let middleware3CalledForSay = false;
    let middleware3CalledForSayMany = false;

    TestMiddleware3.callback = (req: IncomingMessage) => {
      if (req.url?.includes('/Say')) {
        middleware3CalledForSay = true;
      }
      if (req.url?.includes('/SayMany')) {
        middleware3CalledForSayMany = true;
      }
    };

    // TestMiddleware3 is configured only for 'say' method
    await client.say({ sentence: 'test' });

    expect(middleware3CalledForSay).toBe(true);

    // Reset for next call
    middleware3CalledForSay = false;
    middleware3CalledForSayMany = false;

    // Call sayMany - middleware3 should NOT be called
    async function* generateRequests() {
      yield { sentence: 'test' };
    }
    await client.sayMany(generateRequests());

    expect(middleware3CalledForSayMany).toBe(false);
  });

  it('should access different header types', async () => {
    let capturedHeaders: any = {};

    TestMiddleware1.callback = (req: IncomingMessage) => {
      capturedHeaders = {
        auth: req.headers['authorization'],
        contentType: req.headers['content-type'],
        userAgent: req.headers['user-agent'],
        customHeader: req.headers['x-custom-header'],
      };
    };

    await client.say(
      { sentence: 'test' },
      {
        headers: {
          Authorization: 'Bearer xyz',
          'User-Agent': 'test-client',
          'X-Custom-Header': 'custom-value',
        },
      },
    );

    expect(capturedHeaders.auth).toBe('Bearer xyz');
    expect(capturedHeaders.userAgent).toBe('test-client');
    expect(capturedHeaders.customHeader).toBe('custom-value');
  });

  it('should allow middleware to inspect request URL and method', async () => {
    let capturedUrl: string = '';
    let capturedMethod: string = '';

    TestMiddleware1.callback = (req: IncomingMessage) => {
      capturedUrl = req.url || '';
      capturedMethod = req.method || '';
    };

    await client.say({ sentence: 'test' });

    expect(capturedUrl).toContain('ElizaService/Say');
    expect(capturedMethod).toBe('POST');
  });
});

describe('Controller Receives Headers and Custom Data from Middlewares', () => {
  let client: Client<typeof ElizaService>;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const setup = await setupTestServer();
    client = setup.client;
    cleanup = setup.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(() => {
    resetMiddlewareCallbacks();
    ElizaController.sayCallback = undefined as any;
    ElizaController.listenManyCallback = undefined as any;
    ElizaController.sayManyCallback = undefined as any;
  });

  it('should receive client headers in controller via HandlerContext', async () => {
    let capturedHeaders: Array<[string, string]> = [];

    ElizaController.sayCallback = (request, context) => {
      capturedHeaders = Array.from(context.requestHeader.entries());
    };

    await client.say(
      { sentence: 'test' },
      {
        headers: {
          Authorization: 'Bearer controller-test',
          'X-User-Id': '12345',
          'X-Custom-Header': 'custom-value',
        },
      },
    );

    const headersMap = new Map(capturedHeaders);
    expect(headersMap.get('authorization')).toBe('Bearer controller-test');
    expect(headersMap.get('x-user-id')).toBe('12345');
    expect(headersMap.get('x-custom-header')).toBe('custom-value');
  });

  it.only('should receive custom data attached by middleware in controller', async () => {
    let capturedCustomData: any = null;

    // Middleware attaches custom data to raw request
    TestMiddleware1.callback = (req: IncomingMessage, res: ServerResponse) => {
      if (!ContextStorage.getStore()) {
        console.error('No context store available in middleware');
      }
      ContextStorage.getStore()?.set('customData', 'middleware-attached-data');
    };

    // Controller accesses the custom data through context.signal
    // Note: ConnectRPC passes the raw request, we need to access it through context
    ElizaController.sayCallback = (request, context) => {
      if (!ContextStorage.getStore()) {
        console.error('No context store available in controller');
      }
      // capturedCustomData = context.values.get('customData');
      capturedCustomData = ContextStorage.getStore()?.get('customData');
    };

    await client.say({ sentence: 'test' });

    expect(capturedCustomData).toBe('middleware-attached-data');
  });

  it('should receive data from middleware through context in streaming methods', async () => {
    let listenerCalled = false;
    let receivedContext: HandlerContext | null = null;

    const contextKey = createContextKey<string>('streamId');

    TestMiddleware1.callback = (req: IncomingMessage, res: ServerResponse) => {
      // TODO
    };

    ElizaController.listenManyCallback = (request, context) => {
      listenerCalled = true;
      receivedContext = context;
    };

    // Trigger server streaming
    const stream = client.listenMany({ sentence: 'hello world' });
    for await (const _response of stream) {
    }

    expect(listenerCalled).toBe(true);
    expect(receivedContext).toBeDefined();
    expect(receivedContext!.values.get<string>(contextKey)).toBe('stream-123');
  });

  it('should receive headers across multiple requests', async () => {
    const capturedHeadersArray: string[] = [];

    ElizaController.sayCallback = (request, context) => {
      const authHeader = context.requestHeader.get('authorization');
      if (authHeader) {
        capturedHeadersArray.push(authHeader);
      }
    };

    await client.say(
      { sentence: 'first' },
      {
        headers: { Authorization: 'Bearer token1' },
      },
    );

    await client.say(
      { sentence: 'second' },
      {
        headers: { Authorization: 'Bearer token2' },
      },
    );

    await client.say(
      { sentence: 'third' },
      {
        headers: { Authorization: 'Bearer token3' },
      },
    );

    expect(capturedHeadersArray).toHaveLength(3);
    expect(capturedHeadersArray[0]).toBe('Bearer token1');
    expect(capturedHeadersArray[1]).toBe('Bearer token2');
    expect(capturedHeadersArray[2]).toBe('Bearer token3');
  });

  it('should access request metadata in client streaming controller', async () => {
    let callbackInvoked = false;
    let hasContext = false;

    ElizaController.sayManyCallback = (request, context) => {
      callbackInvoked = true;
      hasContext = !!context;
    };

    async function* generateRequests() {
      yield { sentence: 'msg1' };
      yield { sentence: 'msg2' };
    }

    await client.sayMany(generateRequests(), {
      headers: {
        Authorization: 'Bearer streaming-token',
        'X-Stream-Id': 'stream-456',
      },
    });

    expect(callbackInvoked).toBe(true);
    expect(hasContext).toBe(true);
  });

  it('should access URL and protocol information in controller', async () => {
    let capturedUrl: string = '';
    let capturedProtocol: string = '';

    ElizaController.sayCallback = (request, context) => {
      capturedUrl = context.url;
      capturedProtocol = context.protocolName;
    };

    await client.say({ sentence: 'protocol test' });

    expect(capturedUrl).toContain('ElizaService/Say');
    expect(capturedProtocol).toBe('connect');
  });

  it('should handle multiple headers set by different middlewares', async () => {
    let finalHeaders: Map<string, string> = new Map();

    TestMiddleware1.callback = (req: IncomingMessage, res: ServerResponse) => {
      // Middleware 1 sets a response header
      (res as any).setHeader('X-Middleware-1', 'processed');
    };

    TestMiddleware2.callback = (req: IncomingMessage, res: ServerResponse) => {
      // Middleware 2 sets another response header
      (res as any).setHeader('X-Middleware-2', 'validated');
    };

    ElizaController.sayCallback = (request, context) => {
      // Controller can read request headers
      finalHeaders = new Map(context.requestHeader.entries());
    };

    await client.say(
      { sentence: 'multi-middleware' },
      {
        headers: {
          'X-Client-Header': 'client-value',
        },
      },
    );

    expect(finalHeaders.get('x-client-header')).toBe('client-value');
    expect(finalHeaders.get('x-middleware-1')).toBe('processed');
    expect(finalHeaders.get('x-middleware-2')).toBe('validated');
    expect(finalHeaders.size).toBeGreaterThan(0);
  });
});
