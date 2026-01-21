import { create } from '@bufbuild/protobuf';
import { Client } from '@connectrpc/connect';
import { IncomingMessage, ServerResponse } from 'http';
import { ElizaController } from '../demo/controller';
import {
  ElizaService,
  SayRequestSchema,
} from '../demo/gen/connectrpc/eliza/v1/eliza_pb';
import { TestMiddleware1 } from '../demo/middlewares';
import { resetMiddlewareCallbacks, setupTestServer } from './test-helpers';

// Helper to collect items from async iterable
async function collectAsyncIterable<T>(
  iterable: AsyncIterable<T>,
): Promise<T[]> {
  const items: T[] = [];
  for await (const item of iterable) {
    items.push(item);
  }
  return items;
}

describe('Server Streaming RPC Methods', () => {
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

  it('should stream multiple responses from single request', async () => {
    const responses = await collectAsyncIterable(
      client.listenMany({ sentence: 'hello world test' }),
    );

    expect(responses).toHaveLength(3);
    expect(responses[0].sentence).toBe('Echo: hello');
    expect(responses[1].sentence).toBe('Echo: world');
    expect(responses[2].sentence).toBe('Echo: test');
  });

  it('should handle single word in server stream', async () => {
    const responses = await collectAsyncIterable(
      client.listenMany({ sentence: 'single' }),
    );

    expect(responses).toHaveLength(1);
    expect(responses[0].sentence).toBe('Echo: single');
  });

  it('should handle empty string in server stream', async () => {
    const responses = await collectAsyncIterable(
      client.listenMany({ sentence: '' }),
    );

    expect(responses).toHaveLength(1);
    expect(responses[0].sentence).toBe('Echo: ');
  });

  it('should stream with custom headers', async () => {
    const responses = await collectAsyncIterable(
      client.listenMany(
        { sentence: 'test message' },
        {
          headers: {
            Authorization: 'Bearer test-token',
            'x-request-id': 'stream-test-001',
          },
        },
      ),
    );

    expect(responses).toHaveLength(2);
    expect(responses[0].sentence).toBe('Echo: test');
    expect(responses[1].sentence).toBe('Echo: message');
  });

  it('should handle many words', async () => {
    const sentence = 'one two three four five';
    const responses = await collectAsyncIterable(
      client.listenMany({ sentence }),
    );

    expect(responses).toHaveLength(5);
    responses.forEach((resp, idx) => {
      const expectedWord = ['one', 'two', 'three', 'four', 'five'][idx];
      expect(resp.sentence).toBe(`Echo: ${expectedWord}`);
    });
  });

  it('should receive request and context in server streaming callback', async () => {
    let receivedRequest: any = null;
    let receivedContext: any = null;

    ElizaController.listenManyCallback = (request, context) => {
      receivedRequest = request;
      receivedContext = context;
    };

    const responses = await collectAsyncIterable(
      client.listenMany({ sentence: 'callback stream' }),
    );

    expect(receivedRequest).toBeDefined();
    expect(receivedRequest.sentence).toBe('callback stream');
    expect(receivedContext).toBeDefined();
    expect(receivedContext.url).toContain('ListenMany');
  });

  it('should receive headers in server streaming controller', async () => {
    let receivedHeaders = new Map<string, string>();

    ElizaController.listenManyCallback = (request, context) => {
      receivedHeaders = new Map(context.requestHeader.entries());
    };

    await collectAsyncIterable(
      client.listenMany(
        { sentence: 'header stream' },
        {
          headers: {
            Authorization: 'Bearer stream-token',
            'X-Stream-Type': 'server',
          },
        },
      ),
    );

    expect(receivedHeaders.get('authorization')).toBe('Bearer stream-token');
    expect(receivedHeaders.get('x-stream-type')).toBe('server');
  });
});

describe('Client Streaming RPC Methods', () => {
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
    ElizaController.sayManyCallback = undefined as any;
  });

  it('should collect multiple requests into single response', async () => {
    async function* generateRequests() {
      yield create(SayRequestSchema, { sentence: 'first' });
      yield create(SayRequestSchema, { sentence: 'second' });
      yield create(SayRequestSchema, { sentence: 'third' });
    }

    const response = await client.sayMany(generateRequests());

    expect(response.responses).toHaveLength(3);
    expect(response.responses[0].sentence).toBe('You said: first');
    expect(response.responses[1].sentence).toBe('You said: second');
    expect(response.responses[2].sentence).toBe('You said: third');
  });

  it('should handle single request in client stream', async () => {
    async function* generateRequests() {
      yield create(SayRequestSchema, { sentence: 'only' });
    }

    const response = await client.sayMany(generateRequests());

    expect(response.responses).toHaveLength(1);
    expect(response.responses[0].sentence).toBe('You said: only');
  });

  it('should handle empty stream in client stream', async () => {
    async function* generateRequests() {
      // Empty generator
    }

    const response = await client.sayMany(generateRequests());

    expect(response.responses).toHaveLength(0);
  });

  it('should work with custom headers', async () => {
    async function* generateRequests() {
      yield create(SayRequestSchema, { sentence: 'a' });
      yield create(SayRequestSchema, { sentence: 'b' });
    }

    const response = await client.sayMany(generateRequests(), {
      headers: {
        Authorization: 'Bearer test-token',
        'x-request-id': 'client-stream-001',
      },
    });

    expect(response.responses).toHaveLength(2);
    expect(response.responses[0].sentence).toBe('You said: a');
    expect(response.responses[1].sentence).toBe('You said: b');
  });

  it('should handle large number of requests', async () => {
    async function* generateRequests() {
      for (let i = 0; i < 50; i++) {
        yield create(SayRequestSchema, { sentence: `item-${i}` });
      }
    }

    const response = await client.sayMany(generateRequests());

    expect(response.responses).toHaveLength(50);
    expect(response.responses[0].sentence).toBe('You said: item-0');
    expect(response.responses[49].sentence).toBe('You said: item-49');
  });

  it('should receive context in client streaming callback', async () => {
    let receivedContext: any = null;
    let hasAsyncIterable = false;

    ElizaController.sayManyCallback = (request, context) => {
      receivedContext = context;
      hasAsyncIterable = typeof request[Symbol.asyncIterator] === 'function';
    };

    async function* generateRequests() {
      yield create(SayRequestSchema, { sentence: 'stream1' });
      yield create(SayRequestSchema, { sentence: 'stream2' });
    }

    await client.sayMany(generateRequests());

    expect(receivedContext).toBeDefined();
    expect(hasAsyncIterable).toBe(true);
    expect(receivedContext.url).toContain('SayMany');
  });

  it('should receive headers in client streaming controller', async () => {
    let receivedHeaders = new Map<string, string>();

    ElizaController.sayManyCallback = (request, context) => {
      receivedHeaders = new Map(context.requestHeader.entries());
    };

    async function* generateRequests() {
      yield create(SayRequestSchema, { sentence: 'test' });
    }

    await client.sayMany(generateRequests(), {
      headers: {
        Authorization: 'Bearer client-stream-token',
        'X-Stream-Type': 'client',
      },
    });

    expect(receivedHeaders.get('authorization')).toBe(
      'Bearer client-stream-token',
    );
    expect(receivedHeaders.get('x-stream-type')).toBe('client');
  });

  it('should verify middleware runs before client streaming controller', async () => {
    const executionOrder: string[] = [];

    TestMiddleware1.callback = (req: IncomingMessage, res: ServerResponse) => {
      executionOrder.push('middleware');
    };

    ElizaController.sayManyCallback = (request, context) => {
      executionOrder.push('controller');
    };

    async function* generateRequests() {
      yield create(SayRequestSchema, { sentence: 'order test' });
    }

    await client.sayMany(generateRequests());

    expect(executionOrder).toEqual(['middleware', 'controller']);
  });
});
