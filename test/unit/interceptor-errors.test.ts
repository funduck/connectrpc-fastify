import { ConnectRPC } from '../../src/connectrpc';
import { setLogger } from '../../src/helpers';
import { initInterceptors } from '../../src/interceptors';
import { interceptorConfig } from '../../src/interfaces';
import { InterceptorStore } from '../../src/stores';

describe('Interceptors Error Handling', () => {
  let processExitSpy: jest.SpyInstance;

  beforeAll(() => {
    setLogger(false);
  });

  beforeEach(() => {
    ConnectRPC.clear();
    ConnectRPC.setStrictMode(true);
    processExitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((code?: any) => {
        throw new Error(`process.exit(${code})`);
      });
  });

  afterEach(() => {
    processExitSpy.mockRestore();
  });

  describe('initInterceptors', () => {
    class TestInterceptor {
      use(next: any) {
        return async (req: any) => next(req);
      }
    }

    it('should exit process when interceptor not registered', () => {
      class UnregisteredInterceptor {
        use(next: any) {
          return async (req: any) => next(req);
        }
      }

      const configs = [interceptorConfig(UnregisteredInterceptor as any)];

      expect(() => {
        initInterceptors(configs);
      }).toThrow('process.exit(1)');

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle interceptor registered properly', () => {
      const instance = new TestInterceptor();
      InterceptorStore.registerInstance(instance as any);

      const configs = [interceptorConfig(TestInterceptor as any)];

      expect(() => {
        initInterceptors(configs);
      }).not.toThrow();
    });
  });
});
