import { StreamRequest, UnaryRequest } from '@connectrpc/connect';
import {
  AnyFn,
  ConnectRPC,
  controllerClassContextKey,
  controllerMethodContextKey,
  Interceptor,
} from '../../src';
import { getClassMetadata, getMethodMetadata } from './decorators';

export class TestInterceptor1 implements Interceptor {
  static callback: (req: UnaryRequest | StreamRequest) => void;

  constructor() {
    ConnectRPC.registerInterceptor(this);
  }

  use(next: AnyFn): AnyFn {
    return async (req) => {
      TestInterceptor1.callback?.(req);

      return await next(req);
    };
  }
}

export class TestInterceptor2 implements Interceptor {
  static callback: (req: UnaryRequest | StreamRequest) => void;

  constructor() {
    ConnectRPC.registerInterceptor(this);
  }

  use(next: AnyFn): AnyFn {
    return async (req) => {
      TestInterceptor2.callback?.(req);

      return await next(req);
    };
  }
}

export class TestInterceptor3 implements Interceptor {
  static callback: (req: UnaryRequest | StreamRequest) => void;

  constructor() {
    ConnectRPC.registerInterceptor(this);
  }

  use(next: AnyFn): AnyFn {
    return async (req) => {
      TestInterceptor3.callback?.(req);

      return await next(req);
    };
  }
}

/**
 * Interceptor that reads and logs metadata from controller class and method
 */
export class MetadataReaderInterceptor implements Interceptor {
  static classMetadata: Record<string, any> | undefined;
  static methodMetadata: Record<string, any> | undefined;

  constructor() {
    ConnectRPC.registerInterceptor(this);
  }

  use(next: AnyFn): AnyFn {
    return async (req) => {
      // Access controller class from contextValues
      const controllerClass = req.contextValues?.get(controllerClassContextKey);

      // Access controller method from contextValues
      const controllerMethod = req.contextValues?.get(
        controllerMethodContextKey,
      );

      if (controllerClass) {
        // Read class metadata
        const classMetadata = getClassMetadata(controllerClass);
        MetadataReaderInterceptor.classMetadata = classMetadata;
      }

      if (controllerMethod && controllerClass) {
        // Read method metadata
        const methodMetadata = getMethodMetadata(
          controllerClass.prototype,
          controllerMethod.name,
        );
        MetadataReaderInterceptor.methodMetadata = methodMetadata;
      }

      return await next(req);
    };
  }
}
