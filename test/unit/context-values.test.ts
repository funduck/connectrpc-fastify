import { createContextKey } from '@connectrpc/connect';
import {
  CustomContextValues,
  controllerClassContextKey,
  controllerMethodContextKey,
  createCustomContextValues,
} from '../../src/context-values';
import { setLogger } from '../../src/helpers';

describe('CustomContextValues', () => {
  let contextValues: CustomContextValues;

  beforeAll(() => {
    setLogger(false);
  });

  beforeEach(() => {
    contextValues = new CustomContextValues();
  });

  describe('get', () => {
    it('should return default value when key not set', () => {
      const key = createContextKey<string>('default');
      expect(contextValues.get(key)).toBe('default');
    });

    it('should return set value when key is set', () => {
      const key = createContextKey<string>('default');
      contextValues.set(key, 'custom value');
      expect(contextValues.get(key)).toBe('custom value');
    });

    it('should return value for number type', () => {
      const key = createContextKey<number>(42);
      contextValues.set(key, 100);
      expect(contextValues.get(key)).toBe(100);
    });

    it('should return value for object type', () => {
      const key = createContextKey<{ name: string }>({ name: 'default' });
      const value = { name: 'test' };
      contextValues.set(key, value);
      expect(contextValues.get(key)).toEqual(value);
    });
  });

  describe('set', () => {
    it('should set a context value and return this', () => {
      const key = createContextKey<string>('default');
      const result = contextValues.set(key, 'new value');
      expect(result).toBe(contextValues);
      expect(contextValues.get(key)).toBe('new value');
    });

    it('should allow chaining multiple set calls', () => {
      const key1 = createContextKey<string>('default1');
      const key2 = createContextKey<number>(0);
      const key3 = createContextKey<boolean>(false);

      contextValues.set(key1, 'value1').set(key2, 42).set(key3, true);

      expect(contextValues.get(key1)).toBe('value1');
      expect(contextValues.get(key2)).toBe(42);
      expect(contextValues.get(key3)).toBe(true);
    });

    it('should overwrite existing values', () => {
      const key = createContextKey<string>('default');
      contextValues.set(key, 'first');
      contextValues.set(key, 'second');
      expect(contextValues.get(key)).toBe('second');
    });
  });

  describe('delete', () => {
    it('should delete a context value and return this', () => {
      const key = createContextKey<string>('default');
      contextValues.set(key, 'value');
      const result = contextValues.delete(key);
      expect(result).toBe(contextValues);
      expect(contextValues.get(key)).toBe('default');
    });

    it('should allow chaining delete calls', () => {
      const key1 = createContextKey<string>('default1');
      const key2 = createContextKey<string>('default2');

      contextValues.set(key1, 'value1').set(key2, 'value2');
      contextValues.delete(key1).delete(key2);

      expect(contextValues.get(key1)).toBe('default1');
      expect(contextValues.get(key2)).toBe('default2');
    });

    it('should handle deleting non-existent keys gracefully', () => {
      const key = createContextKey<string>('default');
      const result = contextValues.delete(key);
      expect(result).toBe(contextValues);
      expect(contextValues.get(key)).toBe('default');
    });
  });

  describe('entries', () => {
    it('should return empty iterator for new context', () => {
      const entries = Array.from(contextValues.entries());
      expect(entries).toEqual([]);
    });

    it('should iterate over all key-value pairs', () => {
      const key1 = createContextKey<string>('default1');
      const key2 = createContextKey<number>(0);
      const key3 = createContextKey<boolean>(false);

      contextValues.set(key1, 'value1');
      contextValues.set(key2, 42);
      contextValues.set(key3, true);

      const entries = Array.from(contextValues.entries());
      expect(entries).toHaveLength(3);

      const ids = entries.map(([id]) => id);
      const values = entries.map(([, value]) => value);

      expect(ids).toContain(key1.id);
      expect(ids).toContain(key2.id);
      expect(ids).toContain(key3.id);

      expect(values).toContain('value1');
      expect(values).toContain(42);
      expect(values).toContain(true);
    });

    it('should not include deleted entries', () => {
      const key1 = createContextKey<string>('default1');
      const key2 = createContextKey<string>('default2');
      const key3 = createContextKey<string>('default3');

      contextValues.set(key1, 'value1');
      contextValues.set(key2, 'value2');
      contextValues.set(key3, 'value3');
      contextValues.delete(key2);

      const entries = Array.from(contextValues.entries());
      expect(entries).toHaveLength(2);

      const ids = entries.map(([id]) => id);
      expect(ids).toContain(key1.id);
      expect(ids).toContain(key3.id);
      expect(ids).not.toContain(key2.id);
    });
  });

  describe('createCustomContextValues', () => {
    it('should create a new CustomContextValues instance', () => {
      const context = createCustomContextValues();
      expect(context).toBeInstanceOf(CustomContextValues);
    });

    it('should create independent instances', () => {
      const context1 = createCustomContextValues();
      const context2 = createCustomContextValues();
      const key = createContextKey<string>('default');

      context1.set(key, 'value1');
      context2.set(key, 'value2');

      expect(context1.get(key)).toBe('value1');
      expect(context2.get(key)).toBe('value2');
    });
  });

  describe('exported context keys', () => {
    it('should export controllerClassContextKey with null default', () => {
      expect(controllerClassContextKey.defaultValue).toBe(null);
    });

    it('should export controllerMethodContextKey with null default', () => {
      expect(controllerMethodContextKey.defaultValue).toBe(null);
    });

    it('should allow setting controllerClassContextKey', () => {
      class TestController {}
      contextValues.set(controllerClassContextKey, TestController);
      expect(contextValues.get(controllerClassContextKey)).toBe(TestController);
    });

    it('should allow setting controllerMethodContextKey', () => {
      function testMethod() {}
      contextValues.set(controllerMethodContextKey, testMethod);
      expect(contextValues.get(controllerMethodContextKey)).toBe(testMethod);
    });
  });
});
