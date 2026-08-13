import { useEffect } from "react";

const nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;

export function HomepageSearchCloseFixV2() {
  useEffect(() => {
    const clearBeforeReactClose = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      const closeButton = target.closest?.(".pc-stable-search__header > button");
      if (!closeButton) return;

      const input = document.querySelector<HTMLInputElement>("#pc-home-search");
      if (input) {
        nativeValueSetter?.call(input, "");
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      document.body.classList.remove("pc-search-input-active");
      // Não usar preventDefault/stopPropagation: o onClick React precisa executar.
    };

    document.addEventListener("pointerdown", clearBeforeReactClose, true);
    return () => document.removeEventListener("pointerdown", clearBeforeReactClose, true);
  }, []);

  return null;
}
