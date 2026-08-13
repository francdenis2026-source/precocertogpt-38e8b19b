import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "./HomepageSearchInputPolish.css";

const nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;

export function HomepageSearchInputPolish() {
  const [form, setForm] = useState<HTMLElement | null>(null);
  const [hasValue, setHasValue] = useState(false);

  useEffect(() => {
    const getInput = () => document.querySelector<HTMLInputElement>("#pc-home-search");
    const getForm = () => document.querySelector<HTMLElement>(".pc-home .pc-search");

    const sync = () => {
      const input = getInput();
      const nextForm = getForm();
      setForm((current) => current === nextForm ? current : nextForm);
      setHasValue(Boolean(input?.value.length));
      document.body.classList.toggle("pc-search-input-active", Boolean(input && input.value.trim().length >= 2));
    };

    const onInput = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target.matches?.("#pc-home-search")) return;
      sync();
    };

    const onFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (!target.matches?.("#pc-home-search")) return;
      sync();
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest?.(".pc-search-overlay__backdrop") || target.closest?.(".pc-search-overlay__header > button")) {
        document.body.classList.remove("pc-search-input-active");
      }
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("input", onInput, true);
    document.addEventListener("focusin", onFocus, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    sync();

    return () => {
      observer.disconnect();
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("focusin", onFocus, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.body.classList.remove("pc-search-input-active");
    };
  }, []);

  const clearSearch = () => {
    const input = document.querySelector<HTMLInputElement>("#pc-home-search");
    if (!input) return;
    nativeValueSetter?.call(input, "");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    setHasValue(false);
    document.body.classList.remove("pc-search-input-active");
    input.focus();
  };

  if (!form || !hasValue) return null;

  return createPortal(
    <button
      className="pc-search-clear-button"
      type="button"
      aria-label="Limpar pesquisa"
      title="Limpar pesquisa"
      onClick={clearSearch}
    >
      <X aria-hidden="true" />
    </button>,
    form,
  );
}
