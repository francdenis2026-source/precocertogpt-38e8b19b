import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, PackageSearch, Store } from "lucide-react";
import { buildCatalog, type Product } from "../data/catalog";
import { fetchCatalog } from "../data/remoteCatalog";
import { resolveProductImage } from "../data/productImageResolver";
import { HomepageSearchOverlayPro } from "./HomepageSearchOverlayPro";
import "./HourlyHomeProductRotation.css";

const HOUR_MS = 60 * 60 * 1000;
const HOME_PRODUCT_LIMIT = 10;
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function hourBucket() {
  return Math.floor(Date.now() / HOUR_MS);
}

function seededNumber(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffle<T>(items: T[], seed: number) {
  const next = [...items];
  const random = seededNumber(seed);
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function bestOffer(product: Product) {
  return [...(product.offers ?? [])]
    .filter((offer) => Number.isFinite(offer.value) && offer.value > 0)
    .sort((a, b) => a.value - b.value)[0] ?? {
      establishmentId: product.establishmentId,
      establishmentSlug: product.establishmentSlug,
      establishment: product.establishment,
      neighborhood: product.neighborhood,
      storeColor: product.storeColor,
      value: product.minPrice,
      capturedAt: product.capturedAt,
    };
}

function chooseHourlyProducts(products: Product[], bucket: number) {
  const eligible = products.filter((product) => Number.isFinite(product.minPrice) && product.minPrice > 0);
  const byStore = new Map<string, Product[]>();

  eligible.forEach((product) => {
    const offer = bestOffer(product);
    const key = String(offer.establishmentId || offer.establishment || product.establishmentId || product.establishment || "sem-loja");
    const current = byStore.get(key) ?? [];
    current.push(product);
    byStore.set(key, current);
  });

  const seed = hashText(`precocerto-home-${bucket}`);
  const storeEntries = shuffle([...byStore.entries()], seed);
  const pools = storeEntries.map(([storeId, storeProducts], index) => ({
    storeId,
    products: shuffle(storeProducts, seed ^ hashText(storeId) ^ (index * 2654435761)),
    cursor: 0,
  }));

  const selected: Product[] = [];
  const seen = new Set<string>();

  for (const pool of pools) {
    const product = pool.products[pool.cursor++];
    if (!product) continue;
    const id = String(product.id);
    if (seen.has(id)) continue;
    selected.push(product);
    seen.add(id);
    if (selected.length >= HOME_PRODUCT_LIMIT) return selected;
  }

  let hasCandidates = true;
  while (selected.length < HOME_PRODUCT_LIMIT && hasCandidates) {
    hasCandidates = false;
    for (const pool of pools) {
      const product = pool.products[pool.cursor++];
      if (!product) continue;
      hasCandidates = true;
      const id = String(product.id);
      if (seen.has(id)) continue;
      selected.push(product);
      seen.add(id);
      if (selected.length >= HOME_PRODUCT_LIMIT) break;
    }
  }

  return selected;
}

export function HourlyHomeProductRotation() {
  const [products, setProducts] = useState<Product[]>(() => buildCatalog().products);
  const [bucket, setBucket] = useState(hourBucket);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    fetchCatalog().then((result) => {
      if (active && result.products.length) setProducts(result.products);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let timeout: number | undefined;
    const scheduleNextHour = () => {
      const now = Date.now();
      const nextBoundary = (Math.floor(now / HOUR_MS) + 1) * HOUR_MS;
      timeout = window.setTimeout(() => {
        setBucket(hourBucket());
        scheduleNextHour();
      }, Math.max(1000, nextBoundary - now + 250));
    };
    scheduleNextHour();
    return () => { if (timeout) window.clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    const resolve = () => {
      const onHome = window.location.pathname === "/";
      const grid = onHome ? document.querySelector<HTMLElement>(".pc-opportunities .pc-product-grid") : null;
      setTarget(grid);
      if (grid) grid.classList.add("pc-hourly-rotation-active");
    };

    resolve();
    const observer = new MutationObserver(resolve);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", resolve);
    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", resolve);
      document.querySelector<HTMLElement>(".pc-product-grid.pc-hourly-rotation-active")?.classList.remove("pc-hourly-rotation-active");
    };
  }, []);

  const hourlyProducts = useMemo(() => chooseHourlyProducts(products, bucket), [products, bucket]);

  const rotation = target && hourlyProducts.length ? createPortal(
    <>
      {hourlyProducts.map((product) => {
        const offer = bestOffer(product);
        const image = resolveProductImage(product);
        const saving = Math.max(0, product.maxPrice - product.minPrice);
        const href = `/produto/${product.slug || product.id}`;
        return (
          <article className="pc-product-card pc-hourly-product-card" key={`${bucket}-${String(product.id)}`}>
            <a className="pc-product-open" href={href} aria-label={`Abrir comparação de ${product.name}`}>
              <span className="pc-product-media">{image ? <img src={image} alt={product.name} loading="lazy" /> : <PackageSearch aria-hidden="true" />}</span>
              <span className="pc-product-info"><small>{[product.brand, product.size].filter(Boolean).join(" · ")}</small><strong>{product.name}</strong></span>
            </a>
            <div className="pc-price-line"><span><small>Menor preço</small><strong>{money(product.minPrice)}</strong></span>{saving > 0 && <em>diferença de {money(saving)}</em>}</div>
            <div className="pc-store-line"><Store aria-hidden="true" /><span><strong>{offer.establishment}</strong><small>{offer.neighborhood || "Feijó, AC"}</small></span></div>
            <a className="pc-compare-button" href={href}>Comparar <ArrowRight aria-hidden="true" /></a>
          </article>
        );
      })}
    </>,
    target,
  ) : null;

  return (
    <>
      <HomepageSearchOverlayPro />
      {rotation}
    </>
  );
}
