type Merge<T, U> = {
    [K in keyof T | keyof U]: K extends keyof U
        ? U[K]
        : K extends keyof T
          ? T[K]
          : never;
};
/** 判断相等 */
type isEqual<X, Y> =
    (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
        ? true
        : false;
/**
 * 提取具有相应值类型的键名
 *
 * @template T 对象
 * @template U 值类型
 */
type ExtractKey<T extends {}, V, K = keyof T> = K extends keyof T
    ? isEqual<T[K], V> extends true
        ? K
        : never
    : never;
type d = isEqual<'fa', ''>;
