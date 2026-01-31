declare const van: typeof import('./van-1.6.0').default;
declare const vanX: typeof import('./van-x-0.6.3');
interface HTMLMediaElement {
  captureStream(): MediaStream;
  mozCaptureStream(): MediaStream;
}

// tools
type Merge<T, U> = Omit<T, keyof U> & U;
type isEqual<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
type ExtractKey<T extends {}, V, K = keyof T> = K extends keyof T
  ? isEqual<T[K], V> extends true
    ? K
    : never
  : never;
type MaybePromise<T> = T | Promise<T>;

type EventType<T extends EventTarget, K = keyof T> = keyof T extends infer K
  ? K extends `on${infer ET}`
    ? ET
    : never
  : never;
type EventValue<T extends EventTarget, K extends EventType<T>> = Parameters<
  T[`on${K}`]
>[0];

// globals
type Selectable = Document | DocumentFragment | Element;
/** Replace `Element` with `HTMLElement` */
type Selector<
  T extends string,
  E = import('typed-query-selector/parser').StrictlyParseSelector<T>,
> = E extends HTMLElement ? E : HTMLElement;

type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | { [key: string]: Serializable };
type LooseObject = Record<string, any>;
