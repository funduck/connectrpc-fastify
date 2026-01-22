import { Client } from '@connectrpc/connect';
import { ElizaController } from '../demo/controller';
import { ElizaService } from '../demo/gen/connectrpc/eliza/v1/eliza_pb';
import { resetMiddlewareCallbacks, setupTestServer } from './test-helpers';

describe('Unary RPC Methods', () => {
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
  });

  it('should handle unary request and return response', async () => {
    const response = await client.say({ sentence: 'Hello' });

    expect(response).toBeDefined();
    expect(response.sentence).toBe('You said: Hello');
  });

  it('should handle empty message in unary request', async () => {
    const response = await client.say({ sentence: '' });

    expect(response).toBeDefined();
    expect(response.sentence).toBe('You said: ');
  });

  it('should process multiple sequential requests', async () => {
    const sentences = ['First', 'Second', 'Third'];

    const responses = await Promise.all(
      sentences.map((sentence) => client.say({ sentence })),
    );

    expect(responses).toHaveLength(3);
    expect(responses[0].sentence).toBe('You said: First');
    expect(responses[1].sentence).toBe('You said: Second');
    expect(responses[2].sentence).toBe('You said: Third');
  });

  it('should handle long messages', async () => {
    const longMessage = 'This is a long message with many words to test';
    const response = await client.say({ sentence: longMessage });

    expect(response.sentence).toBe(`You said: ${longMessage}`);
  });

  it('should receive request object with data in controller callback', async () => {
    let receivedRequest: any = null;

    ElizaController.sayCallback = (request, context) => {
      receivedRequest = request;
    };

    await client.say({ sentence: 'callback test' });

    expect(receivedRequest).toBeDefined();
    expect(receivedRequest.sentence).toBe('callback test');
  });

  it('should receive context with request headers in controller', async () => {
    let receivedHeaders = new Map<string, string>();

    ElizaController.sayCallback = (request, context) => {
      receivedHeaders = new Map(context.requestHeader.entries());
    };

    await client.say(
      { sentence: 'header test' },
      {
        headers: {
          Authorization: 'Bearer controller-header-test',
          'X-Test-Header': 'test-value',
        },
      },
    );

    expect(receivedHeaders.get('authorization')).toBe(
      'Bearer controller-header-test',
    );
    expect(receivedHeaders.get('x-test-header')).toBe('test-value');
  });
});
