import { OptionalKeysOf, Primitive, RequiredKeysOf } from 'type-fest';

export type OmitFieldsDeep<T, K extends keyof any> = T extends Primitive | Date
  ? T
  : T extends Array<any>
    ? {
        [P in keyof T]?: OmitFieldsDeep<T[P], K>;
      }
    : T extends object
      ? {
          [P in Exclude<RequiredKeysOf<T>, K>]: OmitFieldsDeep<T[P], K>;
        } & {
          [P in Exclude<OptionalKeysOf<T>, K>]?: OmitFieldsDeep<T[P], K>;
        }
      : T;

/**
 * Used to simplify types by omitting ConnectRPC specific fields like `$typeName` and `$unknown`
 * The fields are omitted deeply in nested structures.
 */
export type OmitConnectrpcFields<T> = OmitFieldsDeep<
  T,
  '$typeName' | '$unknown'
>;
