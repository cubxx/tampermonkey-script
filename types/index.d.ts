import * as csstype from 'csstype';
import * as Sober from 'sober';
import * as LitHtml from 'lit-html';

declare global {
    const sober: typeof Sober;
    const lit: typeof LitHtml;
    type HTMLTemplateResult = LitHtml.HTMLTemplateResult;
    type CSSProperties = csstype.Properties;
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
}
