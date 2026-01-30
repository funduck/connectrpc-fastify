import { RouteConfigGlobal, RouteConfigService } from './interfaces';
import { RouteMetadataStore } from './stores';

/** Returns checker function for url */
export function buildRouteConfigChecker<
  T extends RouteConfigGlobal | RouteConfigService<any>,
>(configs: T[]) {
  const lookupMap = new Map<string, T[]>();
  const routes = RouteMetadataStore.getAllRoutes();

  // Building lookup map, for faster checking later
  for (const [url, meta] of routes) {
    const matchedConfigs: T[] = [];

    for (const config of configs) {
      // Skip if service name does not match
      if (config.on && config.on.typeName !== meta.serviceName) {
        continue;
      }

      // Skip if method name does not match
      if (
        config.methods?.length &&
        !config.methods.includes(meta.controllerMethodName)
      ) {
        continue;
      }

      matchedConfigs.push(config);
    }

    if (matchedConfigs.length > 0) {
      lookupMap.set(url, matchedConfigs);
    }
  }

  /** Returns matched route configs for a given URL */
  return (url: string, checkConfig?: T) => {
    const configs = lookupMap.get(url) || [];

    if (checkConfig) {
      return configs.filter((cfg) => cfg === checkConfig);
    }

    return configs;
  };
}
