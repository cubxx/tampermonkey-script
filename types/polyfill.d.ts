declare namespace Polyfill {
    interface Node {
        $: ParentNode['querySelector'];
        /** @see ParentNode['querySelectorAll'] */
        $$: {
            <K extends keyof HTMLElementTagNameMap>(
                selectors: K,
            ): Array<HTMLElementTagNameMap[K]>;
            <K extends keyof SVGElementTagNameMap>(
                selectors: K,
            ): Array<SVGElementTagNameMap[K]>;
            <K extends keyof MathMLElementTagNameMap>(
                selectors: K,
            ): Array<MathMLElementTagNameMap[K]>;
            /** @deprecated */
            <K extends keyof HTMLElementDeprecatedTagNameMap>(
                selectors: K,
            ): Array<HTMLElementDeprecatedTagNameMap[K]>;
            <E extends Element = Element>(selectors: string): Array<E>;
        };
        on: Document['addEventListener'];
        off: Document['removeEventListener'];
        /** 挂载 @alias m */
        mount<T extends globalThis.Node>(
            this: T,
            container: string | globalThis.Node,
        ): T;
        /** 监听 */
        observe<T extends globalThis.Node>(
            this: T,
            callback: (
                observer: MutationObserver,
                records: MutationRecord[],
            ) => void,
            config: MutationObserverInit,
        ): MutationObserver;
        /** 隐藏 */
        hide<T extends Element>(this: T): void;
    }
}

interface Node extends Polyfill.Node {}
