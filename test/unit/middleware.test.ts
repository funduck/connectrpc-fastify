import { Client, createContextKey } from '@connectrpc/connect';
import { IncomingMessage, ServerResponse } from 'http';
import { getCustomContextValues } from '../../src';
import { setLogger } from '../../src/helpers';
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
    setLogger(false);
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

  it('should receive custom data attached by middleware in controller', async () => {
    let customDataReceived: any = null;
    const key = createContextKey('');
    TestMiddleware1.callback = (req: IncomingMessage, res: ServerResponse) => {
      getCustomContextValues(req)?.set(key, 'custom-data-789');
    };

    ElizaController.sayCallback = (request, context) => {
      customDataReceived = context.values.get(key);
    };

    await client.say({ sentence: 'test' });

    expect(customDataReceived).toBe('custom-data-789');
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
});
