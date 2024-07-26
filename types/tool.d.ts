type Merge<T, U> = Omit<T, keyof U> & U;
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

type EventType<T extends EventTarget, K = keyof T> = keyof T extends infer K
  ? K extends `on${infer ET}`
    ? ET
    : never
  : never;
type EventValue<T extends EventTarget, K extends EventType<T>> = Parameters<
  T[`on${K}`]
>[0];

type El = Document | DocumentFragment | Element;
type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | { [key: string]: Serializable };
type Effect = () => void;
type SignalNode<T> = { value: T; subscribers: Set<Effect> };
type Signal<T> = [() => T, (v: T) => void];
type ComponentOptions<P extends string> = Partial<
  { props: P[] } & Record<'onMounted' | 'onUnmounted', Effect[]>
>;
