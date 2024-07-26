import * as csstype from 'csstype';
import * as litHtml from 'lit-html';
import {
  ParseSelector,
  StrictlyParseSelector,
} from 'typed-query-selector/parser';

declare global {
  type HTMLTemplateResult = litHtml.HTMLTemplateResult;
  type CSSProperties = csstype.PropertiesHyphen;
  /** 需要转换的 Props */
  type ConvertProps = {
    class: string | string[];
    style: string | CSSProperties;
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
}
