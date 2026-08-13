import { supabase } from "../lib/supabase";
import {
  buildCatalog,
  verifiedDatasetMetrics,
  type CatalogPayload,
  type PlatformMetrics,
  type Product,
  type StoreRow,
} from "./catalog";

type EstablishmentRow = {
  id: string;
  slug: string | null;
  name: string | null;
  neighborhood: string | null;
  brand_color: string | null;
};

type ProductRow = {
  id: string | number;
  slug: string | null;
  name: string | null;
  brand: string | null;
  category: string | null;
  size: string | null;
  unit: string | null;
  barcode: string | null;
  image_url: string | null;
};

type PriceRow = {
  product_id: string;
  establishment_id: string;
  value: number | string | null;
  previous_value: number | string | null;
  captured_at: string | null;
  source?: string;
};

export type CatalogSource = "supabase" | "local";

export type CatalogResult = CatalogPayload & { source: CatalogSource; error?: string };

const round = (value: number) => Math.round(value * 100) / 100;
const toNumber = (value: number | string | null) => (value === null ? NaN : Number(value));
const DATABASE_PAGE_SIZE = 1000;

export const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const normalizeUnit = (value: string | null | undefined) => {
  const unit = normalize(value || "").replace(/[^a-z]/g, "");
  if (["un", "und", "unid", "unidade", "unidades"].includes(unit)) return "un";
  if (["pct", "pacote", "pacotes"].includes(unit)) return "pacote";
  if (["cx", "caixa", "caixas"].includes(unit)) return "caixa";
  if (["garrafa", "garrafas"].includes(unit)) return "garrafa";
  if (["frasco", "frascos"].includes(unit)) return "frasco";
  if (["lata", "latas"].includes(unit)) return "lata";
  if (["saco", "sacos"].includes(unit)) return "saco";
  return unit || "un";
};

const measurementToken = (amount: number, unit: string) => {
  const normalizedUnit = normalize(unit).replace(/[^a-z]/g, "");
  if (["kg", "quilo", "quilos", "kilograma", "kilogramas"].includes(normalizedUnit)) return `mass:${Math.round(amount * 1000)}g`;
  if (["g", "gr", "grama", "gramas"].includes(normalizedUnit)) return `mass:${Math.round(amount)}g`;
  if (["l", "lt", "litro", "litros"].includes(normalizedUnit)) return `volume:${Math.round(amount * 1000)}ml`;
  if (["ml", "mililitro", "mililitros"].includes(normalizedUnit)) return `volume:${Math.round(amount)}ml`;
  if (["un", "und", "unid", "unidade", "unidades"].includes(normalizedUnit)) return `count:${Math.round(amount)}un`;
  return `${amount}:${normalizedUnit}`;
};

const extractSpecification = (product: ProductRow) => {
  const source = normalize(`${product.size || ""} ${product.name || ""}`).replace(/,/g, ".");
  const unitPattern = "kg|quilo|quilos|kilograma|kilogramas|g|gr|grama|gramas|l|lt|litro|litros|ml|mililitro|mililitros|un|und|unid|unidade|unidades";
  const pack = source.match(new RegExp(`\\b(\\d+)\\s*x\\s*(\\d+(?:\\.\\d+)?)\\s*(${unitPattern})\\b`, "i"));
  if (pack) return `pack:${Number(pack[1])}x${measurementToken(Number(pack[2]), pack[3])}`;

  const single = source.match(new RegExp(`\\b(\\d+(?:\\.\\d+)?)\\s*(${unitPattern})\\b`, "i"));
  if (single) return measurementToken(Number(single[1]), single[2]);

  const size = normalize(product.size || "").replace(/[^a-z0-9]+/g, "");
  return size && size !== "-" ? `size:${size}` : `unit:${normalizeUnit(product.unit)}`;
};

const baseProductName = (value: string | null) => normalize(value || "")
  .replace(/\b\d+\s*x\s*\d+(?:[.,]\d+)?\s*(?:kg|g|gr|l|lt|ml|un|und|unid|unidade|unidades)\b/g, " ")
  .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|gr|grama|gramas|l|lt|litro|litros|ml|mililitro|mililitros|un|und|unid|unidade|unidades)\b/g, " ")
  .replace(/[^a-z0-9]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

// Barcode é a identidade mais segura. Sem barcode, só agrupamos produtos que
// compartilham nome-base, marca, categoria e a MESMA especificação física
// (peso, volume, quantidade ou tamanho). Isso evita comparar, por exemplo,
// 500 g com 1 kg ou 6 unidades com 12 unidades.
const productIdentity = (product: ProductRow) => product.barcode
  ? `barcode:${normalize(product.barcode)}`
  : [
      `name:${baseProductName(product.name)}`,
      `brand:${normalize(product.brand || "")}`,
      `category:${normalize(product.category || "")}`,
      `spec:${extractSpecification(product)}`,
    ].join("|");

/**
 * O PostgREST limita o número de linhas devolvidas por requisição. Lemos em
 * páginas para que produtos e preços acima desse limite também apareçam.
 *
 * A paginação exige uma ordenação estável: sem um ORDER BY único o banco pode
 * devolver as mesmas linhas em ordens diferentes entre chamadas, causando
 * variação no conjunto exibido. Por isso ordenamos sempre por uma coluna única.
 */
async function fetchAllRows(
  table: "establishments" | "products" | "prices",
  columns: string,
  orderColumn: string,
) {
  const rows: unknown[] = [];

  for (let from = 0; ; from += DATABASE_PAGE_SIZE) {
    const response = await supabase!
      .from(table)
      .select(columns)
      .order(orderColumn, { ascending: true })
      .range(from, from + DATABASE_PAGE_SIZE - 1);

    if (response.error) return { data: rows, error: response.error };

    const page = response.data ?? [];
    rows.push(...page);
    if (page.length < DATABASE_PAGE_SIZE) return { data: rows, error: null };
  }
}

/** Lê establishments/products/prices do Supabase e agrega no formato da UI. */
export async function fetchCatalog(query = ""): Promise<CatalogResult> {
  const local = buildCatalog(query);

  if (!supabase) {
    return { ...local, source: "local", error: "Supabase não configurado." };
  }

  try {
    const [establishments, products, prices] = await Promise.all([
      fetchAllRows("establishments", "id, name, neighborhood, brand_color", "id"),
      fetchAllRows("products", "id, name, brand, category, size, unit, barcode, image_url", "id"),
      fetchAllRows("prices", "id, product_id, establishment_id, value, previous_value, captured_at", "id"),
    ]);

    const failure = establishments.error ?? products.error ?? prices.error;
    if (failure) {
      return { ...local, source: "local", error: failure.message };
    }

    const storeRows = (establishments.data ?? []) as unknown as EstablishmentRow[];
    const productRows = (products.data ?? []) as unknown as ProductRow[];
    const priceRows = ((prices.data ?? []) as unknown as PriceRow[]).filter(row =>
      Number.isFinite(toNumber(row.value)),
    );

    if (!storeRows.length || !productRows.length || !priceRows.length) {
      return { ...local, source: "local", error: "Banco conectado, porém sem dados de preços." };
    }

    const q = normalize(query);
    const productPriceMap = new Map<string, PriceRow[]>();

    productRows.forEach(product => {
      const key = productIdentity(product);
      const rows = priceRows.filter(price => String(price.product_id) === String(product.id));
      if (!productPriceMap.has(key)) productPriceMap.set(key, []);
      productPriceMap.get(key)!.push(...rows);
    });

    const uniqueProductRows = Array.from(
      productRows.reduce((map, product) => {
        const key = productIdentity(product);
        const current = map.get(key);
        // Prefere a ocorrência que possui imagem; em seguida mantém a primeira.
        if (!current || (!current.image_url && product.image_url)) map.set(key, product);
        return map;
      }, new Map<string, ProductRow>()).values(),
    );

    const mapped = uniqueProductRows
      .map((product): Product | null => {
        const key = productIdentity(product);
        const rows = productPriceMap.get(key) || [];
        if (!rows.length) return null;

        const latestByStore = Array.from(rows.reduce((map, row) => {
          const current = map.get(String(row.establishment_id));
          const incomingTime = Date.parse(row.captured_at || "") || 0;
          const currentTime = Date.parse(current?.captured_at || "") || 0;
          if (!current || incomingTime >= currentTime) map.set(String(row.establishment_id), row);
          return map;
        }, new Map<string, PriceRow>()).values());

        const values = latestByStore.map(row => toNumber(row.value)).filter(Number.isFinite);
        if (!values.length) return null;

        const best = latestByStore.reduce((lowest, row) =>
          toNumber(row.value) < toNumber(lowest.value) ? row : lowest,
        );
        const store = storeRows.find(item => String(item.id) === String(best.establishment_id));
        if (!store) return null;

        const previous = toNumber(best.previous_value);

        return {
          id: product.id,
          slug: String(product.id),
          name: product.name ?? "Produto sem nome",
          brand: product.brand ?? "—",
          category: product.category ?? "Geral",
          size: product.size ?? "—",
          unit: product.unit ?? "un",
          barcode: product.barcode ?? undefined,
          minPrice: round(Math.min(...values)),
          avgPrice: round(values.reduce((total, value) => total + value, 0) / values.length),
          maxPrice: round(Math.max(...values)),
          storeCount: latestByStore.length,
          establishmentId: store.id,
          establishmentSlug: String(store.id),
          establishment: store.name ?? "Estabelecimento",
          neighborhood: store.neighborhood ?? "—",
          storeColor: store.brand_color ?? "#1473E6",
          capturedAt: best.captured_at ?? new Date().toISOString(),
          previousPrice: Number.isFinite(previous) ? round(previous) : undefined,
          image_url: product.image_url || undefined,
          source: "Coleta Manual",
          updated_at: best.captured_at || undefined,
          offers: latestByStore.map(row => {
            const offerStore = storeRows.find(item => String(item.id) === String(row.establishment_id));
            const offerPrevious = toNumber(row.previous_value);
            return {
              establishmentId: row.establishment_id,
              establishmentSlug: String(row.establishment_id),
              establishment: offerStore?.name ?? "Estabelecimento",
              neighborhood: offerStore?.neighborhood ?? "—",
              storeColor: offerStore?.brand_color ?? "#1473E6",
              value: round(toNumber(row.value)),
              capturedAt: row.captured_at ?? new Date().toISOString(),
              previousPrice: Number.isFinite(offerPrevious) ? round(offerPrevious) : undefined,
            };
          }).sort((a, b) => a.value - b.value),
          price_history: rows
            .map(row => ({ date: row.captured_at || new Date().toISOString(), value: toNumber(row.value) }))
            .filter(item => Number.isFinite(item.value))
            .sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
        };
      })
      .filter((product): product is Product => product !== null)
      .filter(product => {
        if (!q) return true;
        const searchFields = [product.name, product.category, product.brand, product.barcode, product.size].filter(Boolean) as string[];
        return searchFields.some(field => normalize(field).includes(q));
      })
      // Ordenação determinística: preço, nome e, por fim, o id (único) como desempate.
      .sort((a, b) =>
        a.minPrice - b.minPrice ||
        a.name.localeCompare(b.name, "pt-BR") ||
        String(a.id).localeCompare(String(b.id)));

    const stores: StoreRow[] = storeRows.map(store => ({
      id: store.id,
      slug: String(store.id),
      name: store.name ?? "Estabelecimento",
      neighborhood: store.neighborhood ?? "—",
      color: store.brand_color ?? "#1473E6",
      products: new Set(
        priceRows
          .filter(row => String(row.establishment_id) === String(store.id))
          .map(row => row.product_id),
      ).size,
    }));

    const metrics: PlatformMetrics = {
      products: productRows.length || verifiedDatasetMetrics.products,
      prices: priceRows.length || verifiedDatasetMetrics.prices,
      stores: storeRows.length || verifiedDatasetMetrics.stores,
    };

    return {
      products: mapped,
      stores,
      metrics,
      updatedAt: new Date().toISOString(),
      source: "supabase",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar o banco.";
    return { ...local, source: "local", error: message };
  }
}
