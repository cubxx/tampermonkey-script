import { PropertiesHyphen } from 'csstype';
import { StrictlyParseSelector } from 'typed-query-selector/parser';
import _van from './van-1.5.5.min';
import * as _vanx from './van-x-0.6.3';

declare global {
  const van: typeof _van;
  const vanX: typeof _vanx;

  type CSSProperties = PropertiesHyphen;
  /** 需要转换的 Props */
  type ConvertProps = {
    class: string | string[];
    style: string | CSSProperties | Record<string, string>;
  };
  /** Props 配置 */
  type Props<K extends keyof HTMLElementTagNameMap = 'var'> = Merge<
    HTMLElementTagNameMap[K],
    ConvertProps & {
      // [x: `on${string}`]: (this: HTMLElementTagNameMap[K]) => void;
    }
  > & {
    key: string | number;
    [x: string]: unknown;
  };

  type Selector<
    T extends string,
    E = StrictlyParseSelector<T>,
  > = E extends HTMLElement ? E : HTMLElement;
  type RouteMap = { [key: string]: RouteMap | (() => void) };
}
