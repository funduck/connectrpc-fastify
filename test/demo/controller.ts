import type { HandlerContext } from '@connectrpc/connect';
import { ConnectRPC, OmitConnectrpcFields, Service } from '../../src/index';
import type {
  SayRequest,
  SayResponse,
  SayResponses,
} from './gen/connectrpc/eliza/v1/eliza_pb';
import { ElizaService } from './gen/connectrpc/eliza/v1/eliza_pb';

export class ElizaController implements Service<typeof ElizaService> {
  static sayCallback: (
    request: SayRequest,
    context: HandlerContext,
  ) => undefined;
  static listenManyCallback: (
    request: SayRequest,
    context: HandlerContext,
  ) => undefined;
  static sayManyCallback: (
    request: AsyncIterable<SayRequest>,
    context: HandlerContext,
  ) => undefined;

  constructor() {
    ConnectRPC.registerController(this, ElizaService);
  }

  /**
   * Unary RPC: Say
   * Client sends one request, server sends one response
   */
  async say(
    request: SayRequest,
    context: HandlerContext,

    // You can leave out the return type, it will be inferred from the interface
  ) {
    ElizaController.sayCallback?.(request, context);

    return {
      sentence: `You said: ${request.sentence}`,
    };
  }

  /**
   * Client Streaming RPC: SayMany
   * Client sends multiple requests, server sends one response with all collected
   */
  async sayMany(
    request: AsyncIterable<SayRequest>,
    context: HandlerContext,
    // You can specify the return type if you want, but you always need to use OmitConnectrpcFields<> because ConnectRPC adds extra fields internally
  ): Promise<OmitConnectrpcFields<SayResponses>> {
    ElizaController.sayManyCallback?.(request, context);

    const responses: OmitConnectrpcFields<SayResponse>[] = [];

    for await (const req of request) {
      responses.push({
        sentence: `You said: ${req.sentence}`,
      });
    }

    return {
      responses,
    };
  }

  /**
   * Server Streaming RPC: ListenMany
   * Client sends one request, server sends multiple responses
   */
  async *listenMany(request: SayRequest, context: HandlerContext) {
    ElizaController.listenManyCallback?.(request, context);

    const words = request.sentence.split(' ');

    for (const word of words) {
      // Simulate some processing delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      yield {
        sentence: `Echo: ${word}`,
      };
    }
  }
}
