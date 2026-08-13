import { CSSProperties, KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, LoaderCircle, PackageSearch, Search, Store, X } from "lucide-react";
import { buildCatalog, type CatalogPayload, type Product } from "../data/catalog";
import { fetchCatalog } from "../data/remoteCatalog";
import { resolveProductImage } from "../data/productImageResolver";
import { suggestProducts } from "../lib/productSearch";
import "./HomepageSearchOverlayPro.css";

const seed = buildCatalog();
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

type OverlayPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

function resultHref(product: Product) {
  return `/buscar?q=${encodeURIComponent(product.name)}`;
}

function SearchResult({ product, active, onHover }: { product: Product; active: boolean; onHover: () => void }) {
  const image = resolveProductImage(product);
  const saving = Math.max(0, (product.maxPrice || product.minPrice) - product.minPrice);

  return (
    <a
      className={`pc-search-overlay__result${active ? " is-active" : ""}`}
      href={resultHref(product)}
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
    >
      <span className="pc-search-overlay__thumb">
        {image ? <img src={image} alt="" /> : <PackageSearch aria-hidden="true" />}
      </span>
      <span className="pc-search-overlay__copy">
        <strong>{product.name}</strong>
        <small>{[product.brand, product.size].filter(Boolean).join(" · ") || product.category || "Produto"}</small>
        <em><Store aria-hidden="true" /> {product.establishment || "Comércio local"}</em>
      </span>
      <span className="pc-search-overlay__price">
        <small>menor preço</small>
        <strong>{money(product.minPrice)}</strong>
        {saving > 0 && <em>economize {money(saving)}</em>}
      </span>
      <ArrowRight className="pc-search-overlay__arrow" aria-hidden="true" />
    </a>
  );
}

export function HomepageSearchOverlayPro() {
  const [catalog, setCatalog] = useState<CatalogPayload>(seed);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<OverlayPosition | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const normalized = query.trim();
    if (normalized.length < 2) return [];
    return suggestProducts(catalog.products, normalized, 8).filter((product) => product.minPrice > 0);
  }, [catalog.products, query]);

  useEffect(() => {
    let mounted = true;
    fetchCatalog()
      .then((payload) => { if (mounted) setCatalog(payload); })
      .finally(() => { if (mounted) setCatalogLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const getInput = () => document.querySelector<HTMLInputElement>("#pc-home-search");
    const getSearchArea = () => document.querySelector<HTMLElement>(".pc-home .pc-search-area");

    const updatePosition = () => {
      const anchor = getSearchArea();
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const mobile = viewportWidth <= 720;
      const gutter = mobile ? 12 : 16;
      const left = mobile ? gutter : Math.max(gutter, rect.left);
      const width = mobile ? viewportWidth - gutter * 2 : Math.min(rect.width, viewportWidth - left - gutter);
      const availableBelow = viewportHeight - rect.bottom - gutter;
      const preferredHeight = mobile ? 460 : 520;
      const useAbove = availableBelow < 280 && rect.top > availableBelow;
      const maxHeight = Math.max(220, Math.min(preferredHeight, useAbove ? rect.top - gutter * 2 : availableBelow));
      const top = useAbove ? Math.max(gutter, rect.top - maxHeight - 10) : Math.min(viewportHeight - 220, rect.bottom + 10);
      setPosition({ top, left, width, maxHeight });
    };

    const onFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (!target.matches?.("#pc-home-search")) return;
      const input = target as HTMLInputElement;
      setQuery(input.value);
      setOpen(input.value.trim().length >= 2);
      setActiveIndex(-1);
      updatePosition();
    };

    const onInput = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target.matches?.("#pc-home-search")) return;
      const value = (target as HTMLInputElement).value;
      setQuery(value);
      setOpen(value.trim().length >= 2);
      setActiveIndex(-1);
      updatePosition();
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const area = getSearchArea();
      if (area?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
      setActiveIndex(-1);
    };

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (!target.matches?.("#pc-home-search")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        return;
      }
      if (!open || !suggestions.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();
        setActiveIndex((current) => (current + 1) % suggestions.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        setActiveIndex((current) => current <= 0 ? suggestions.length - 1 : current - 1);
      } else if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        event.stopPropagation();
        window.location.assign(resultHref(suggestions[activeIndex]));
      }
    };

    const onSubmitCapture = (event: SubmitEvent) => {
      const form = event.target as HTMLElement;
      if (!form.matches?.(".pc-home .pc-search")) return;
      const value = getInput()?.value.trim() || "";
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(value ? `/buscar?q=${encodeURIComponent(value)}` : "/buscar");
    };

    const onViewportChange = () => {
      if (open) updatePosition();
    };

    document.addEventListener("focusin", onFocus, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("submit", onSubmitCapture, true);
    window.addEventListener("resize", onViewportChange, { passive: true });
    window.addEventListener("scroll", onViewportChange, { passive: true, capture: true });

    const input = getInput();
    if (input) {
      setQuery(input.value);
      updatePosition();
    }

    return () => {
      document.removeEventListener("focusin", onFocus, true);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("submit", onSubmitCapture, true);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [activeIndex, open, suggestions]);

  if (!open || query.trim().length < 2 || !position || typeof document === "undefined") return null;

  const panelStyle = {
    "--pc-search-top": `${position.top}px`,
    "--pc-search-left": `${position.left}px`,
    "--pc-search-width": `${position.width}px`,
    "--pc-search-max-height": `${position.maxHeight}px`,
  } as CSSProperties;

  return createPortal(
    <div className="pc-search-overlay" aria-hidden="false">
      <button className="pc-search-overlay__backdrop" type="button" aria-label="Fechar resultados da busca" onClick={() => setOpen(false)} />
      <section className="pc-search-overlay__panel" style={panelStyle} ref={panelRef} aria-label="Resultados da busca">
        <header className="pc-search-overlay__header">
          <div>
            <span><Search aria-hidden="true" /> Busca inteligente</span>
            <strong>{catalogLoading && !suggestions.length ? "Procurando no catálogo…" : `${suggestions.length} ${suggestions.length === 1 ? "resultado encontrado" : "resultados encontrados"}`}</strong>
            <small>Compare rapidamente produto, estabelecimento e menor preço.</small>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Fechar resultados"><X aria-hidden="true" /></button>
        </header>

        <div className="pc-search-overlay__body" role="listbox" aria-label={`Sugestões para ${query}`}>
          {catalogLoading && !suggestions.length ? (
            <div className="pc-search-overlay__state" role="status">
              <LoaderCircle className="is-loading" aria-hidden="true" />
              <div><strong>Buscando melhores opções</strong><small>Consultando os preços disponíveis no catálogo local.</small></div>
            </div>
          ) : suggestions.length ? (
            suggestions.map((product, index) => (
              <SearchResult key={String(product.id)} product={product} active={activeIndex === index} onHover={() => setActiveIndex(index)} />
            ))
          ) : (
            <div className="pc-search-overlay__state" role="status">
              <PackageSearch aria-hidden="true" />
              <div><strong>Nenhum produto encontrado</strong><small>Tente outro nome, marca, categoria ou uma palavra mais curta.</small></div>
            </div>
          )}
        </div>

        <footer className="pc-search-overlay__footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navegar <kbd>Enter</kbd> abrir <kbd>Esc</kbd> fechar</span>
          <a href={`/buscar?q=${encodeURIComponent(query.trim())}`}>Ver todos os resultados <ArrowRight aria-hidden="true" /></a>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
