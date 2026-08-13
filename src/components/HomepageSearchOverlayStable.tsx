import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, LoaderCircle, PackageSearch, Search, Store, X } from "lucide-react";
import { buildCatalog, type CatalogPayload, type Product } from "../data/catalog";
import { fetchCatalog } from "../data/remoteCatalog";
import { resolveProductImage } from "../data/productImageResolver";
import { suggestProducts } from "../lib/productSearch";
import "./HomepageSearchOverlayStable.css";

const seed = buildCatalog();
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

type SearchGeometry = {
  panelTop: number;
  panelLeft: number;
  panelWidth: number;
  panelHeight: number;
  holeTop: number;
  holeLeft: number;
  holeRight: number;
  holeBottom: number;
};

function resultHref(product: Product) {
  return `/buscar?q=${encodeURIComponent(product.name)}`;
}

function SearchResult({ product, active, onHover }: { product: Product; active: boolean; onHover: () => void }) {
  const image = resolveProductImage(product);
  const saving = Math.max(0, (product.maxPrice || product.minPrice) - product.minPrice);

  return (
    <a
      className={`pc-stable-search__result${active ? " is-active" : ""}`}
      href={resultHref(product)}
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
    >
      <span className="pc-stable-search__thumb">
        {image ? <img src={image} alt="" /> : <PackageSearch aria-hidden="true" />}
      </span>
      <span className="pc-stable-search__copy">
        <strong>{product.name}</strong>
        <small>{[product.brand, product.size].filter(Boolean).join(" · ") || product.category || "Produto"}</small>
        <em><Store aria-hidden="true" /> {product.establishment || "Comércio local"}</em>
      </span>
      <span className="pc-stable-search__price">
        <small>menor preço</small>
        <strong>{money(product.minPrice)}</strong>
        {saving > 0 && <em>economize {money(saving)}</em>}
      </span>
      <ArrowRight className="pc-stable-search__arrow" aria-hidden="true" />
    </a>
  );
}

export function HomepageSearchOverlayStable() {
  const [catalog, setCatalog] = useState<CatalogPayload>(seed);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [geometry, setGeometry] = useState<SearchGeometry | null>(null);
  const panelRef = useRef<HTMLElement>(null);

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
    const getForm = () => document.querySelector<HTMLElement>(".pc-home .pc-search");

    const updateGeometry = () => {
      const form = getForm();
      if (!form) return;
      const rect = form.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw <= 720;
      const gutter = mobile ? 10 : 16;
      const gap = mobile ? 8 : 10;
      const holePadding = mobile ? 5 : 7;

      const panelLeft = mobile ? gutter : Math.max(gutter, rect.left);
      const panelWidth = mobile ? vw - gutter * 2 : Math.min(rect.width, vw - panelLeft - gutter);
      const availableAbove = Math.max(160, rect.top - gutter - gap);
      const preferredHeight = mobile ? 340 : 440;
      const panelHeight = Math.min(preferredHeight, availableAbove);
      const panelTop = Math.max(gutter, rect.top - panelHeight - gap);

      setGeometry({
        panelTop,
        panelLeft,
        panelWidth,
        panelHeight,
        holeTop: Math.max(0, rect.top - holePadding),
        holeLeft: Math.max(0, rect.left - holePadding),
        holeRight: Math.min(vw, rect.right + holePadding),
        holeBottom: Math.min(vh, rect.bottom + holePadding),
      });
    };

    const syncFromInput = (input: HTMLInputElement) => {
      const value = input.value;
      setQuery(value);
      setOpen(value.trim().length >= 2);
      setActiveIndex(-1);
      updateGeometry();
    };

    const onFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches?.("#pc-home-search")) syncFromInput(target as HTMLInputElement);
    };

    const onInput = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.matches?.("#pc-home-search")) syncFromInput(target as HTMLInputElement);
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
        setActiveIndex((current) => (current + 1) % suggestions.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => current <= 0 ? suggestions.length - 1 : current - 1);
      } else if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        window.location.assign(resultHref(suggestions[activeIndex]));
      }
    };

    const onViewportChange = () => {
      if (open) updateGeometry();
    };

    document.addEventListener("focusin", onFocus, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("resize", onViewportChange, { passive: true });
    window.addEventListener("scroll", onViewportChange, { passive: true, capture: true });

    const input = getInput();
    if (input) {
      setQuery(input.value);
      updateGeometry();
    }

    return () => {
      document.removeEventListener("focusin", onFocus, true);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [activeIndex, open, suggestions]);

  if (!open || query.trim().length < 2 || !geometry || typeof document === "undefined") return null;

  const rootStyle = {
    "--pc-hole-top": `${geometry.holeTop}px`,
    "--pc-hole-left": `${geometry.holeLeft}px`,
    "--pc-hole-right": `${geometry.holeRight}px`,
    "--pc-hole-bottom": `${geometry.holeBottom}px`,
    "--pc-panel-top": `${geometry.panelTop}px`,
    "--pc-panel-left": `${geometry.panelLeft}px`,
    "--pc-panel-width": `${geometry.panelWidth}px`,
    "--pc-panel-height": `${geometry.panelHeight}px`,
  } as CSSProperties;

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
    document.querySelector<HTMLInputElement>("#pc-home-search")?.focus({ preventScroll: true });
  };

  return createPortal(
    <div className="pc-stable-search" style={rootStyle}>
      <button className="pc-stable-search__shade pc-stable-search__shade--top" type="button" aria-label="Fechar resultados" onClick={close} />
      <button className="pc-stable-search__shade pc-stable-search__shade--left" type="button" aria-label="Fechar resultados" onClick={close} />
      <button className="pc-stable-search__shade pc-stable-search__shade--right" type="button" aria-label="Fechar resultados" onClick={close} />
      <button className="pc-stable-search__shade pc-stable-search__shade--bottom" type="button" aria-label="Fechar resultados" onClick={close} />

      <section className="pc-stable-search__panel" ref={panelRef} aria-label="Resultados da busca">
        <header className="pc-stable-search__header">
          <div>
            <span><Search aria-hidden="true" /> Busca inteligente</span>
            <strong>{catalogLoading && !suggestions.length ? "Procurando no catálogo…" : `${suggestions.length} ${suggestions.length === 1 ? "resultado encontrado" : "resultados encontrados"}`}</strong>
            <small>Continue digitando na barra abaixo para refinar os resultados.</small>
          </div>
          <button type="button" onClick={close} aria-label="Fechar resultados"><X aria-hidden="true" /></button>
        </header>

        <div className="pc-stable-search__body" role="listbox" aria-label={`Sugestões para ${query}`}>
          {catalogLoading && !suggestions.length ? (
            <div className="pc-stable-search__state" role="status">
              <LoaderCircle className="is-loading" aria-hidden="true" />
              <div><strong>Buscando melhores opções</strong><small>Consultando os preços disponíveis no catálogo local.</small></div>
            </div>
          ) : suggestions.length ? (
            suggestions.map((product, index) => (
              <SearchResult key={String(product.id)} product={product} active={activeIndex === index} onHover={() => setActiveIndex(index)} />
            ))
          ) : (
            <div className="pc-stable-search__state" role="status">
              <PackageSearch aria-hidden="true" />
              <div><strong>Nenhum produto encontrado</strong><small>Tente outro nome, marca, categoria ou uma palavra mais curta.</small></div>
            </div>
          )}
        </div>

        <footer className="pc-stable-search__footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navegar <kbd>Enter</kbd> abrir <kbd>Esc</kbd> fechar</span>
          <a href={`/buscar?q=${encodeURIComponent(query.trim())}`}>Ver todos os resultados <ArrowRight aria-hidden="true" /></a>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
