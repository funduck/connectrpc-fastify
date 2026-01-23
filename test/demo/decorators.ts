import 'reflect-metadata';

/**
 * Class decorator that adds metadata to a class
 * @param metadata - The metadata object to attach to the class
 */
export function ClassMetadata(metadata: Record<string, any>) {
  return function (target: Function) {
    Reflect.defineMetadata('custom:class-metadata', metadata, target);
  };
}

/**
 * Method decorator that adds metadata to a class method
 * @param metadata - The metadata object to attach to the method
 */
export function MethodMetadata(metadata: Record<string, any>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    Reflect.defineMetadata(
      'custom:method-metadata',
      metadata,
      target,
      propertyKey,
    );
  };
}

/**
 * Read class metadata
 */
export function getClassMetadata(
  target: Function,
): Record<string, any> | undefined {
  return Reflect.getMetadata('custom:class-metadata', target);
}

/**
 * Read method metadata
 */
export function getMethodMetadata(
  target: any,
  propertyKey: string,
): Record<string, any> | undefined {
  return Reflect.getMetadata('custom:method-metadata', target, propertyKey);
}
