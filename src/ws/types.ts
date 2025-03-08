import { TSocketEndpoints } from './api.calls.types';

type KeysMatching<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;

type DeepPartial<T> = T extends
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | symbol
  | Date
  ? T | undefined
  : T extends Array<infer ArrayType>
  ? Array<DeepPartial<ArrayType>>
  : T extends ReadonlyArray<infer ArrayType>
  ? ReadonlyArray<ArrayType>
  : T extends Set<infer SetType>
  ? Set<DeepPartial<SetType>>
  : T extends ReadonlySet<infer SetType>
  ? ReadonlySet<SetType>
  : T extends Map<infer KeyType, infer ValueType>
  ? Map<DeepPartial<KeyType>, DeepPartial<ValueType>>
  : T extends ReadonlyMap<infer KeyType, infer ValueType>
  ? ReadonlyMap<DeepPartial<KeyType>, DeepPartial<ValueType>>
  : { [K in keyof T]?: DeepPartial<T[K]> };  

export type TSocketEndpointNames = keyof TSocketEndpoints;

export type TSocketSubscribableEndpointNames =
  | KeysMatching<TSocketEndpoints, { request: { subscribe?: number } }>
  | 'exchange_rates';

export type TSocketResponse<T extends TSocketEndpointNames> =
  TSocketEndpoints[T]['response'];

export type TSocketResponseData<T extends TSocketEndpointNames> =
  TSocketResponse<T>[T extends 'ticks' ? 'tick' : T];

export type TSocketRequest<T extends TSocketEndpointNames> =
  TSocketEndpoints[T]['request'];

export type TSocketRequestCleaned<T extends TSocketEndpointNames> = Omit<
  TSocketRequest<T>,
  | (T extends KeysMatching<TSocketRequest<T>, 1> ? T : never)
  | 'passthrough'
  | 'req_id'
  | 'subscribe'
>;

export type TSocketRequestProps<T extends TSocketEndpointNames> =
  TSocketRequestCleaned<T> extends Record<string, never>
    ? never
    : TSocketRequestCleaned<T>;
