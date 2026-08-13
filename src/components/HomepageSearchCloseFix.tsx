import { useEffect } from "react";

const nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;

export function HomepageSearchCloseFix() {
  useEffect(() => {
    const closeSearch = () => {
      const input = document.querySelector<HTMLInputElement>("#pc-home-search");
      if (input) {
        nativeValueSetter?.call(input, "");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.blur();
      }
      document.body.classList.remove("pc-search-input-active");
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      const closeButton = target.closest?.(".pc-stable-search__header > button, .pc-search-clear-button");
      if (!closeButton) return;
      event.preventDefault();
      event.stopPropagation();
      closeSearch();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  return null;
}
