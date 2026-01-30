import { GenService } from '@bufbuild/protobuf/codegenv2';
import { Logger, RouteConfigGlobal, RouteConfigService } from './interfaces';

export let logger: Logger = {
  log: (...args: any[]) => {
    console.info(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  debug: (...args: any[]) => {
    console.debug(...args);
  },
  verbose: (...args: any[]) => {
    console.log(...args);
  },
};

export function setLogger(customLogger: Logger | boolean) {
  if (typeof customLogger == 'boolean') {
    if (customLogger === false) {
      // Disable logging
      logger = {
        log: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
        verbose: () => {},
      };
    }
    return;
  }
  logger = customLogger;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/** Returns the pathname part of a URL which should be used to parse service name and method name */
export function getURLPath(url: string): string {
  return URL.parse(url)?.pathname || url;
}

/** Converts a method name to camelCase - a convention for controller methods */
export function methodNameInController(methodName: string): string {
  // Convert first character to lowercase to match typical controller method naming: camelCase
  return methodName.charAt(0).toLowerCase() + methodName.slice(1);
}

/** Converts a method name to PascalCase - a convention for .proto files */
export function methodNameInService(methodName: string): string {
  // Convert first character to uppercase to match typical service method naming: PascalCase
  return methodName.charAt(0).toUpperCase() + methodName.slice(1);
}

export function routeConfigToString<T extends GenService<any>>(
  c: RouteConfigGlobal | RouteConfigService<T>,
): string {
  if (!c.on) {
    return 'global';
  }
  if (!c.methods) {
    return c.on.typeName;
  }
  return `${c.on.typeName}(${c.methods.join(',')})`;
}
