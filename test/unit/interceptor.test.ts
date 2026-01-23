import { Client, createContextKey } from '@connectrpc/connect';
import { ElizaController } from '../demo/controller';
import { ElizaService } from '../demo/gen/connectrpc/eliza/v1/eliza_pb';
import {
  TestInterceptor1,
  TestInterceptor2,
  TestInterceptor3,
} from '../demo/interceptors';
import {
  resetInterceptorCallbacks,
  setupTestServerWithInterceptors,
} from './test-helpers';

describe('Interceptor Access to Request Data', () => {
  let client: Client<typeof ElizaService>;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const setup = await setupTestServerWithInterceptors();
    client = setup.client;
    cleanup = setup.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(() => {
    resetInterceptorCallbacks();
  });

  it('should access request headers in interceptor', async () => {
    let capturedHeaders: Record<string, any> = {};

    TestInterceptor1.callback = (req) => {
      capturedHeaders = {
        authorization: req.header.get('authorization'),
        'x-request-id': req.header.get('x-request-id'),
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

  it('should access request URL in interceptor', async () => {
    let capturedUrl: string = '';

    TestInterceptor1.callback = (req) => {
      capturedUrl = req.url;
    };

    await client.say({ sentence: 'test' });

    expect(capturedUrl).toContain('ElizaService/Say');
  });

  it('should access request method information in interceptor', async () => {
    let capturedMethod: string = '';
    let capturedService: string = '';

    TestInterceptor1.callback = (req) => {
      capturedMethod = req.method.name;
      capturedService = req.service.typeName;
    };

    await client.say({ sentence: 'test' });

    expect(capturedMethod).toBe('Say');
    expect(capturedService).toBe('connectrpc.eliza.v1.ElizaService');
  });

  it('should attach custom data to request context values', async () => {
    const customKey = createContextKey('custom-data');
    let dataFromInterceptor2: any = null;

    TestInterceptor1.callback = (req) => {
      // Attach custom data to context values
      req.contextValues.set(customKey, 'interceptor-data-123');
    };

    TestInterceptor2.callback = (req) => {
      // Access the custom data set by TestInterceptor1
      dataFromInterceptor2 = req.contextValues.get(customKey);
    };

    await client.say({ sentence: 'test' });

    expect(dataFromInterceptor2).toBe('interceptor-data-123');
  });

  it('should only call method-specific interceptor for matching methods', async () => {
    let interceptor3CalledForSay = false;
    let interceptor3CalledForSayMany = false;

    TestInterceptor3.callback = (req) => {
      if (req.method.name === 'Say') {
        interceptor3CalledForSay = true;
      }
      if (req.method.name === 'SayMany') {
        interceptor3CalledForSayMany = true;
      }
    };

    // TestInterceptor3 is configured only for 'say' method
    await client.say({ sentence: 'test' });

    expect(interceptor3CalledForSay).toBe(true);

    // Reset for next call
    interceptor3CalledForSay = false;
    interceptor3CalledForSayMany = false;

    // Call sayMany - interceptor3 should NOT be called
    async function* generateRequests() {
      yield { sentence: 'test' };
    }
    await client.sayMany(generateRequests());

    expect(interceptor3CalledForSayMany).toBe(false);
  });

  it('should access request message in interceptor', async () => {
    let capturedSentence: string = '';

    TestInterceptor1.callback = (req) => {
      if ('message' in req) {
        capturedSentence = (req.message as any).sentence;
      }
    };

    await client.say({ sentence: 'Hello from interceptor test' });

    expect(capturedSentence).toBe('Hello from interceptor test');
  });

  it('should access request signal in interceptor', async () => {
    let hasSignal = false;

    TestInterceptor1.callback = (req) => {
      hasSignal = req.signal instanceof AbortSignal;
    };

    await client.say({ sentence: 'test' });

    expect(hasSignal).toBe(true);
  });
});

describe('Controller Receives Data from Interceptors', () => {
  let client: Client<typeof ElizaService>;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const setup = await setupTestServerWithInterceptors();
    client = setup.client;
    cleanup = setup.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(() => {
    resetInterceptorCallbacks();
    ElizaController.sayCallback = undefined as any;
    ElizaController.listenManyCallback = undefined as any;
    ElizaController.sayManyCallback = undefined as any;
  });

  it('should receive custom data attached by interceptor in controller', async () => {
    let customDataReceived: any = null;
    const key = createContextKey('interceptor-custom-data');

    TestInterceptor1.callback = (req) => {
      req.contextValues.set(key, 'custom-data-from-interceptor');
    };

    ElizaController.sayCallback = (request, context) => {
      customDataReceived = context.values.get(key);
    };

    await client.say({ sentence: 'test' });

    expect(customDataReceived).toBe('custom-data-from-interceptor');
  });
});

describe('Interceptor Execution Order', () => {
  let client: Client<typeof ElizaService>;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const setup = await setupTestServerWithInterceptors();
    client = setup.client;
    cleanup = setup.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(() => {
    resetInterceptorCallbacks();
  });

  it('should execute interceptors in order', async () => {
    const executionOrder: string[] = [];

    TestInterceptor1.callback = () => {
      executionOrder.push('Interceptor1');
    };

    TestInterceptor2.callback = () => {
      executionOrder.push('Interceptor2');
    };

    TestInterceptor3.callback = () => {
      executionOrder.push('Interceptor3');
    };

    await client.say({ sentence: 'test' });

    expect(executionOrder).toEqual([
      'Interceptor1',
      'Interceptor2',
      'Interceptor3',
    ]);
  });

  it('should pass data through the interceptor chain', async () => {
    const key1 = createContextKey('data1');
    const key2 = createContextKey('data2');
    const key3 = createContextKey('data3');
    let finalData: any = {};

    TestInterceptor1.callback = (req) => {
      req.contextValues.set(key1, 'from-interceptor-1');
    };

    TestInterceptor2.callback = (req) => {
      const data1 = req.contextValues.get(key1);
      req.contextValues.set(key2, `from-interceptor-2-received-${data1}`);
    };

    TestInterceptor3.callback = (req) => {
      const data1 = req.contextValues.get(key1);
      const data2 = req.contextValues.get(key2);
      req.contextValues.set(
        key3,
        `from-interceptor-3-received-${data1}-and-${data2}`,
      );
    };

    ElizaController.sayCallback = (request, context) => {
      finalData = {
        data1: context.values.get(key1),
        data2: context.values.get(key2),
        data3: context.values.get(key3),
      };
    };

    await client.say({ sentence: 'test' });

    expect(finalData.data1).toBe('from-interceptor-1');
    expect(finalData.data2).toBe(
      'from-interceptor-2-received-from-interceptor-1',
    );
    expect(finalData.data3).toBe(
      'from-interceptor-3-received-from-interceptor-1-and-from-interceptor-2-received-from-interceptor-1',
    );
  });
});
