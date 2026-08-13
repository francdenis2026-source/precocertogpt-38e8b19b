import { useEffect } from "react";
import "./HomepageSearchVisibleTypingFix.css";

export function HomepageSearchVisibleTypingFix() {
  useEffect(() => {
    const originalSelector = "#pc-home-search";
    const floatingSelector = "#pc-home-search-floating";

    const transferFocus = () => {
      const original = document.querySelector<HTMLInputElement>(originalSelector);
      const floating = document.querySelector<HTMLInputElement>(floatingSelector);
      if (!original || !floating) return;

      if (document.activeElement === original) {
        requestAnimationFrame(() => {
          floating.focus({ preventScroll: true });
          const end = floating.value.length;
          try {
            floating.setSelectionRange(end, end);
          } catch {
            // Mantém apenas o foco quando seleção não for suportada.
          }
        });
      }
    };

    const observer = new MutationObserver(transferFocus);
    observer.observe(document.body, { childList: true, subtree: true });

    const onInput = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.matches?.(originalSelector)) transferFocus();
    };

    document.addEventListener("input", onInput, true);
    transferFocus();

    return () => {
      observer.disconnect();
      document.removeEventListener("input", onInput, true);
    };
  }, []);

  return null;
}
