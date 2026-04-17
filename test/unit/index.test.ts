import { setLogger } from '../../src/helpers';
import { printMsg } from '../../src/index';

describe('index.ts exports', () => {
  beforeAll(() => {
    setLogger(false);
  });

  describe('printMsg', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should print development warning message', () => {
      printMsg();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'connectrpc-fastify is in development mode! not ready for production yet!',
      );
    });

    it('should be callable multiple times', () => {
      printMsg();
      printMsg();

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    });
  });
});
