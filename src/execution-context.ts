import { FastifyReply, FastifyRequest } from 'fastify';
import { ExecutionContext, Type } from './interfaces';

export class ManualExecutionContext implements ExecutionContext {
  constructor(
    readonly request: FastifyRequest['raw'],
    readonly response: FastifyReply['raw'],
    readonly next: <T = any>() => T,
    readonly args: any[],
    readonly constructorRef: Type<any> | null = null,
    readonly handler: Function | null = null,
  ) {}

  getClass<T = any>(): Type<T> {
    return this.constructorRef!;
  }

  getHandler(): Function {
    return this.handler!;
  }

  getArgs<T extends Array<any> = any[]>(): T {
    return this.args as T;
  }

  getArgByIndex<T = any>(index: number): T {
    return this.args[index] as T;
  }

  switchToHttp() {
    return Object.assign(this, {
      getRequest: () => this.request,
      getResponse: () => this.response,
      getNext: () => this.next,
    });
  }

  switchToRpc() {
    throw new Error('Context switching to RPC is not supported.');
  }

  switchToWs() {
    throw new Error('Context switching to WebSockets is not supported.');
  }
}
