/** JSON no soporta bigint: los montos salen como string de enteros. */
export type Serialized<T> = { [K in keyof T]: T[K] extends bigint ? string : T[K] };

export function serializeMoney<T extends Record<string, unknown>>(row: T): Serialized<T> {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? v.toString() : v]),
  ) as Serialized<T>;
}
