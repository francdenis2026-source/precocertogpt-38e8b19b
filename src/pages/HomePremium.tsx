import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BadgeDollarSign,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  HeartPulse,
  MapPin,
  Menu,
  Moon,
  PackageSearch,
  Search,
  ShoppingBasket,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store,
  Sun,
  Tag,
  X,
} from "lucide-react";
import { buildCatalog, type CatalogPayload, type Product } from "../data/catalog";
import { fetchCatalog } from "../data/remoteCatalog";
import { resolveProductImage } from "../data/productImageResolver";
import { suggestProducts } from "../lib/productSearch";
import "./HomePremium.css";

const popularSearches = ["Arroz", "Café", "Leite", "Carne", "Limpeza"];
const categories = [
  { name: "Mercados", description: "Itens do dia a dia", icon: ShoppingBasket, query: "mercado" },
  { name: "Açougue", description: "Carnes e cortes", icon: Tag, query: "carne" },
  { name: "Farmácias", description: "Saúde e cuidados", icon: HeartPulse, href: "/farmacias" },
  { name: "Livros", description: "Autores de Feijó", icon: BookOpen, href: "/dorinha-barroso" },
];

type Theme = "light" | "dark";
const initialCatalog = buildCatalog();
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const readTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

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

export function HomePremium() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [catalog, setCatalog] = useState<CatalogPayload>(initialCatalog);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(-1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const searchAreaRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    let active = true;
    fetchCatalog()
      .then((result) => { if (active) setCatalog(result); })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const closeSearch = (event: PointerEvent) => {
      if (!searchAreaRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
        setActiveResult(-1);
      }
    };
    document.addEventListener("pointerdown", closeSearch);
    return () => document.removeEventListener("pointerdown", closeSearch);
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedProduct(null);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedProduct]);

  const suggestions = useMemo(() => {
    if (query.trim().length < 2) return [];
    return suggestProducts(catalog.products, query, 6).filter((product) => product.minPrice > 0);
  }, [catalog.products, query]);

  const opportunities = useMemo(() => catalog.products
    .filter((product) => product.minPrice > 0)
    .sort((a, b) => (b.maxPrice - b.minPrice) - (a.maxPrice - a.minPrice))
    .slice(0, 10), [catalog.products]);

  const [comparisonIndex, setComparisonIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const comparableProducts = useMemo(() => {
    return catalog.products
      .filter((p) => p.minPrice > 0 && (p.offers?.length ?? 0) > 1)
      .sort((a, b) => (b.maxPrice - b.minPrice) - (a.maxPrice - a.minPrice));
  }, [catalog.products]);

  useEffect(() => {
    if (comparableProducts.length <= 1) return;
    
    // Create a pool of indices and shuffle them to avoid repetition
    const indicesPool = Array.from({ length: Math.min(comparableProducts.length, 24) }, (_, i) => i);
    let currentIndex = 0;
    
    const shuffle = (array: number[]) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };
    
    shuffle(indicesPool);

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % indicesPool.length;
        if (currentIndex === 0) shuffle(indicesPool);
        
        setComparisonIndex(indicesPool[currentIndex]);
        setIsTransitioning(false);
      }, 1000); // Increased duration for a smoother, high-end feel
    }, 60000); // 60 seconds interval as requested
    
    return () => clearInterval(interval);
  }, [comparableProducts.length]);

  const comparisonProduct = comparableProducts[comparisonIndex] ?? opportunities[0] ?? catalog.products[0];
  const comparisonOffers = useMemo(() => comparisonProduct
    ? [...(comparisonProduct.offers ?? [])].filter((offer) => offer.value > 0).sort((a, b) => a.value - b.value).slice(0, 3)
    : [], [comparisonProduct]);

  const stores = useMemo(() => catalog.stores.filter((store) => store.products > 0).slice(0, 6), [catalog.stores]);

  const search = (term: string) => {
    const normalized = term.trim();
    navigate(normalized ? `/buscar?q=${encodeURIComponent(normalized)}` : "/buscar");
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selected = activeResult >= 0 ? suggestions[activeResult] : undefined;
    if (selected) {
      setSelectedProduct(selected);
      setSearchOpen(false);
      return;
    }
    search(query);
  };

  const handleSearchKeys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") { setSearchOpen(false); setActiveResult(-1); return; }
    if (!searchOpen || !suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResult((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResult((current) => current <= 0 ? suggestions.length - 1 : current - 1);
    } else if (event.key === "Enter" && activeResult >= 0) {
      event.preventDefault();
      setSelectedProduct(suggestions[activeResult]);
      setSearchOpen(false);
    }
  };

  return (
    <div className="pc-home">
      <a className="pc-skip" href="#pc-content">Ir para o conteúdo</a>

      <header className="pc-header">
        <div className="pc-shell pc-header-inner">
          <Link className="pc-logo" to="/" aria-label="PreçoCerto — página inicial">
            <img src="/logo-preco-certo-inversa.svg" alt="PreçoCerto" />
          </Link>
          <nav className="pc-nav" aria-label="Navegação principal">
            <Link to="/buscar">Comparar</Link>
            <Link to="/estabelecimentos">Estabelecimentos</Link>
            <Link to="/farmacias">Farmácias</Link>
            <Link to="/colaborar">Colaborar</Link>
          </nav>
          <div className="pc-header-actions">
            <button className="pc-icon-button" type="button" onClick={() => setTheme((value) => value === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}>
              {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </button>
            <Link className="pc-merchant" to="/lojista">Sou comerciante <ArrowRight aria-hidden="true" /></Link>
            <button className="pc-menu-button" type="button" aria-expanded={menuOpen} aria-controls="pc-mobile-menu" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen((value) => !value)}>
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="pc-mobile-menu" className="pc-mobile-menu" aria-label="Navegação mobile">
            <Link to="/buscar" onClick={() => setMenuOpen(false)}>Comparar preços</Link>
            <Link to="/estabelecimentos" onClick={() => setMenuOpen(false)}>Estabelecimentos</Link>
            <Link to="/farmacias" onClick={() => setMenuOpen(false)}>Farmácias</Link>
            <Link to="/colaborar" onClick={() => setMenuOpen(false)}>Colaborar</Link>
            <Link to="/lojista" onClick={() => setMenuOpen(false)}>Sou comerciante</Link>
          </nav>
        )}
      </header>

      <main id="pc-content">
        <section className="pc-hero" aria-labelledby="pc-title">
          <div className="pc-shell pc-hero-inner">
            <div className="pc-hero-copy">
              <span className="pc-kicker"><MapPin aria-hidden="true" /> Feijó · Acre</span>
              <h1 id="pc-title">Antes de comprar, encontre o <em>preço certo.</em></h1>
              <p>Pesquise produtos, compare estabelecimentos locais e escolha a melhor opção para sua compra em poucos segundos.</p>
              <div className="pc-search-area" ref={searchAreaRef}>
                <form className="pc-search" role="search" onSubmit={submitSearch}>
                  <Search aria-hidden="true" />
                  <label className="sr-only" htmlFor="pc-home-search">Pesquisar produto</label>
                  <input
                    id="pc-home-search"
                    value={query}
                    placeholder="Busque arroz, café, carne, leite..."
                    autoComplete="off"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={searchOpen && query.trim().length >= 2}
                    aria-controls="pc-search-results"
                    aria-activedescendant={activeResult >= 0 ? `pc-result-${activeResult}` : undefined}
                    onFocus={() => setSearchOpen(true)}
                    onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); setActiveResult(-1); }}
                    onKeyDown={handleSearchKeys}
                  />
                  <button type="submit">Encontrar menor preço <ArrowRight aria-hidden="true" /></button>
                </form>
                {searchOpen && query.trim().length >= 2 && (
                  <div className="pc-results" id="pc-search-results" role="listbox" aria-label="Sugestões de produtos">
                    {catalogLoading && !suggestions.length ? (
                      <div className="pc-result-state" role="status"><PackageSearch aria-hidden="true" /><span><strong>Buscando produtos…</strong><small>Consultando os preços disponíveis.</small></span></div>
                    ) : suggestions.length ? suggestions.map((product, index) => {
                      const offer = bestOffer(product);
                      const image = resolveProductImage(product);
                      return (
                        <button id={`pc-result-${index}`} key={String(product.id)} type="button" role="option" aria-selected={activeResult === index} className={`pc-result${activeResult === index ? " is-active" : ""}`} onMouseEnter={() => setActiveResult(index)} onClick={() => { setSelectedProduct(product); setSearchOpen(false); }}>
                          <span className="pc-result-image">{image ? <img src={image} alt="" /> : <PackageSearch aria-hidden="true" />}</span>
                          <span className="pc-result-copy"><strong>{product.name}</strong><small>{[product.brand, product.size].filter(Boolean).join(" · ")}</small><em><Store aria-hidden="true" /> {offer.establishment}</em></span>
                          <span className="pc-result-price"><small>menor preço</small><strong>{money(product.minPrice)}</strong></span>
                        </button>
                      );
                    }) : (
                      <div className="pc-result-state" role="status"><PackageSearch aria-hidden="true" /><span><strong>Nenhum produto encontrado</strong><small>Tente outro nome, marca ou categoria.</small></span></div>
                    )}
                  </div>
                )}
              </div>
              <div className="pc-quick" aria-label="Buscas rápidas"><span>Mais buscados:</span>{popularSearches.map((item) => <button key={item} type="button" onClick={() => search(item)}>{item}</button>)}</div>
            </div>
            <aside className="pc-hero-side" aria-label="Recursos principais">
              <div><BadgeDollarSign aria-hidden="true" /><span><strong>Compare preços reais</strong><small>Veja a diferença entre estabelecimentos.</small></span></div>
              <div><ShoppingCart aria-hidden="true" /><span><strong>Monte sua cesta</strong><small>Planeje sua compra com mais clareza.</small></span></div>
              <div><Store aria-hidden="true" /><span><strong>Descubra lojas locais</strong><small>Acesse catálogos e ofertas disponíveis.</small></span></div>
            </aside>
          </div>
        </section>

        <section className="pc-action-strip" aria-label="Atalhos da plataforma">
          <div className="pc-shell pc-action-strip-inner">
            <Link to="/buscar"><Search aria-hidden="true" /><span><strong>Comparar produto</strong><small>Pesquise e veja onde está mais barato</small></span><ChevronRight aria-hidden="true" /></Link>
            <Link to="/cesta-basica"><ShoppingCart aria-hidden="true" /><span><strong>Cesta inteligente</strong><small>Organize os itens que pretende comprar</small></span><ChevronRight aria-hidden="true" /></Link>
            <Link to="/estabelecimentos"><Store aria-hidden="true" /><span><strong>Explorar lojas</strong><small>Conheça os catálogos de Feijó</small></span><ChevronRight aria-hidden="true" /></Link>
          </div>
        </section>

        <section className="pc-section pc-shell pc-categories" aria-labelledby="pc-categories-title">
          <div className="pc-heading"><span>Explore por categoria</span><h2 id="pc-categories-title">Encontre mais rápido o que precisa.</h2></div>
          <div className="pc-category-row">
            {categories.map(({ name, description, icon: Icon, href, query: categoryQuery }) => {
              const content = <><span className="pc-category-icon"><Icon aria-hidden="true" /></span><span><strong>{name}</strong><small>{description}</small></span><ChevronRight aria-hidden="true" /></>;
              return href ? <Link key={name} className="pc-category" to={href}>{content}</Link> : <button key={name} className="pc-category" type="button" onClick={() => search(categoryQuery ?? name)}>{content}</button>;
            })}
          </div>
        </section>

        <section className="pc-section pc-shell pc-opportunities" aria-labelledby="pc-opportunities-title">
          <div className="pc-heading pc-heading-row"><div><span>Oportunidades do catálogo</span><h2 id="pc-opportunities-title">Produtos com diferença de preço para comparar.</h2></div><Link to="/buscar">Ver todos <ArrowRight aria-hidden="true" /></Link></div>
          <div className="pc-product-grid">
            {opportunities.map((product) => {
              const offer = bestOffer(product);
              const image = resolveProductImage(product);
              const saving = Math.max(0, product.maxPrice - product.minPrice);
              return (
                <article className="pc-product-card" key={String(product.id)} onClick={() => setSelectedProduct(product)}>
                  <div className="pc-product-open" aria-label={`Abrir comparação de ${product.name}`}>
                    <span className="pc-product-media">{image ? <img src={image} alt={product.name} loading="lazy" /> : <PackageSearch aria-hidden="true" />}</span>
                    <span className="pc-product-info"><small>{[product.brand, product.size].filter(Boolean).join(" · ")}</small><strong>{product.name}</strong></span>
                  </div>
                  <div className="pc-price-line"><span><small>Menor preço</small><strong>{money(product.minPrice)}</strong></span>{saving > 0 && <em>diferença de {money(saving)}</em>}</div>
                  <div className="pc-store-line"><Store aria-hidden="true" /><span><strong>{offer.establishment}</strong><small>{offer.neighborhood || "Feijó, AC"}</small></span></div>
                  <button className="pc-compare-button" type="button">Comparar <ArrowRight aria-hidden="true" /></button>
                </article>
              );
            })}
          </div>
        </section>

        {comparisonProduct && (
          <section className="pc-compare-section" aria-labelledby="pc-compare-title">
            <div className="pc-shell pc-compare-layout">
              <div className="pc-compare-copy">
                <span className="pc-kicker"><BadgeCheck aria-hidden="true" /> Comparação prática</span>
                <h2 id="pc-compare-title">A melhor escolha aparece lado a lado.</h2>
                <p>Compare o mesmo produto em diferentes estabelecimentos sem precisar abrir várias telas.</p>
                <button type="button" onClick={() => setSelectedProduct(comparisonProduct)}>Abrir comparação completa <ArrowRight aria-hidden="true" /></button>
              </div>
              <button 
                type="button"
                className={`pc-compare-product${isTransitioning ? " is-exiting" : " is-entering"}`}
                onClick={() => setSelectedProduct(comparisonProduct)}
                aria-label={`Ver detalhes de ${comparisonProduct.name}`}
              >
                <div className="pc-compare-product-head">
                  <span className={`pc-compare-product-image ${resolveProductImage(comparisonProduct)?.endsWith('.png') ? 'is-transparent' : ''}`}>
                    {resolveProductImage(comparisonProduct) ? (
                      <img src={resolveProductImage(comparisonProduct)} alt={comparisonProduct.name} loading="lazy" />
                    ) : (
                      <div className="pc-no-image">
                        <PackageSearch aria-hidden="true" />
                        <strong>{comparisonProduct.name}</strong>
                      </div>
                    )}
                    <span className="pc-compare-badge"><Sparkles size={10} /> Em destaque</span>
                  </span>
                  <div className="pc-compare-product-details">
                    <small>{[comparisonProduct.brand, comparisonProduct.size].filter(Boolean).join(" · ")}</small>
                    <strong>{comparisonProduct.name}</strong>
                  </div>
                </div>
                <div className="pc-offer-list">
                  {comparisonOffers.length > 0 ? (
                    comparisonOffers.map((offer, idx) => (
                      <div key={`${comparisonProduct.id}-${offer.establishmentId}-${idx}`} className={`pc-offer-row ${idx === 0 ? "is-best" : ""}`}>
                        <span className="pc-offer-rank">{idx + 1}</span>
                        <span>
                          <strong>{offer.establishment}</strong>
                          <small>{offer.neighborhood || "Feijó, AC"}</small>
                        </span>
                        {idx === 0 && <em>Melhor preço</em>}
                        <b>{money(offer.value)}</b>
                      </div>
                    ))
                  ) : (
                    <div className="pc-offer-row-empty">Carregando ofertas...</div>
                  )}
                  {/* Fill empty rows to maintain height if fewer than 3 offers */}
                  {comparisonOffers.length < 3 && Array.from({ length: 3 - comparisonOffers.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="pc-offer-row pc-offer-row-placeholder" />
                  ))}
                </div>
              </button>
            </div>
          </section>
        )}

        <section className="pc-section pc-shell pc-stores" aria-labelledby="pc-stores-title">
          <div className="pc-heading pc-heading-row"><div><span>Comércio local</span><h2 id="pc-stores-title">Estabelecimentos para explorar.</h2></div><Link to="/estabelecimentos">Ver todos <ArrowRight aria-hidden="true" /></Link></div>
          <div className="pc-store-grid">
            {stores.map((store) => (
              <Link className="pc-store-card" to={`/estabelecimento/${store.slug}`} key={String(store.id)}>
                <span className="pc-store-avatar" style={{ background: store.color }}><Store aria-hidden="true" /></span>
                <span><strong>{store.name}</strong><small>{store.neighborhood || "Feijó, AC"}</small><em>{store.products} {store.products === 1 ? "produto" : "produtos"} no catálogo</em></span>
                <ChevronRight aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section className="pc-basket-section" aria-labelledby="pc-basket-title">
          <div className="pc-shell pc-basket-layout">
            <div className="pc-basket-copy">
              <span className="pc-kicker"><Sparkles aria-hidden="true" /> Planejamento de compra</span>
              <h2 id="pc-basket-title">Monte a cesta antes de sair de casa.</h2>
              <p>Junte os produtos que precisa e use o PreçoCerto para pesquisar, comparar e organizar melhor sua compra.</p>
              <Link to="/cesta-basica">Abrir minha cesta <ArrowRight aria-hidden="true" /></Link>
            </div>
            <div className="pc-basket-points" aria-label="Benefícios da cesta">
              <span><CheckCircle2 aria-hidden="true" /> Organize os itens da compra</span>
              <span><CheckCircle2 aria-hidden="true" /> Compare antes de decidir</span>
              <span><CheckCircle2 aria-hidden="true" /> Acesse pelo celular</span>
            </div>
          </div>
        </section>

        <section className="pc-section pc-shell pc-how" aria-labelledby="pc-how-title">
          <div className="pc-how-head">
            <div>
              <h2 id="pc-how-title">Da busca à melhor escolha, sem complicação.</h2>
              <p>Em poucos instantes, o PreçoCerto transforma uma pesquisa em uma decisão mais inteligente.</p>
            </div>
            <Link to="/buscar">Experimentar agora <ArrowRight aria-hidden="true" /></Link>
          </div>

          <ol className="pc-how-flow">
            <li className="pc-how-step pc-how-search-step">
              <span className="pc-how-number" aria-hidden="true">1</span>
              <div className="pc-how-icon"><Search aria-hidden="true" /></div>
              <div className="pc-how-copy"><strong>Pesquise o que precisa</strong><p>Digite o nome do produto para começar.</p></div>
              <div className="pc-how-demo pc-how-query" aria-hidden="true"><Search /><span>Arroz 5 kg</span><i><ArrowRight /></i></div>
            </li>
            <li className="pc-how-step pc-how-compare-step">
              <span className="pc-how-number" aria-hidden="true">2</span>
              <div className="pc-how-icon"><BadgeDollarSign aria-hidden="true" /></div>
              <div className="pc-how-copy"><strong>Compare lado a lado</strong><p>Veja as opções disponíveis em diferentes lojas.</p></div>
              <div className="pc-how-demo pc-how-bars" aria-hidden="true">
                <span><i style={{ width: "100%" }} /><small>Loja A</small></span>
                <span className="is-best"><i style={{ width: "72%" }} /><small>Loja B</small></span>
                <span><i style={{ width: "88%" }} /><small>Loja C</small></span>
              </div>
            </li>
            <li className="pc-how-step pc-how-choice-step">
              <span className="pc-how-number" aria-hidden="true">3</span>
              <div className="pc-how-icon"><CheckCircle2 aria-hidden="true" /></div>
              <div className="pc-how-copy"><strong>Escolha com confiança</strong><p>A melhor opção ganha destaque para você decidir.</p></div>
              <div className="pc-how-demo pc-how-result" aria-hidden="true"><span><CheckCircle2 /></span><div><small>Melhor opção</small><strong>Pronto para escolher</strong></div><ArrowRight /></div>
            </li>
          </ol>
        </section>

        <section className="pc-commercial" aria-labelledby="pc-commercial-title">
          <div className="pc-shell pc-commercial-layout">
            <div className="pc-commercial-copy">
              <span><Store aria-hidden="true" /> PreçoCerto para comerciantes</span>
              <h2 id="pc-commercial-title">Sua loja pode aparecer onde o cliente já está pesquisando.</h2>
              <p>Crie sua presença digital, organize o catálogo, apresente preços e prepare seu comércio para receber pedidos online pela plataforma.</p>
              <div className="pc-commercial-features">
                <span><Smartphone aria-hidden="true" /> Vitrine digital</span>
                <span><PackageSearch aria-hidden="true" /> Catálogo organizado</span>
                <span><BadgeDollarSign aria-hidden="true" /> Preços e ofertas</span>
              </div>
              <Link to="/lojista">Quero colocar minha loja no PreçoCerto <ArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
        </section>
      </main>

      {selectedProduct && (() => {
        const offers = [...(selectedProduct.offers ?? [])].filter((offer) => offer.value > 0).sort((a, b) => a.value - b.value);
        const image = resolveProductImage(selectedProduct);
        return (
          <div className="pc-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedProduct(null); }}>
            <section ref={dialogRef} className="pc-dialog" role="dialog" aria-modal="true" aria-labelledby="pc-dialog-title">
              <button ref={closeRef} className="pc-dialog-close" type="button" aria-label="Fechar comparação" onClick={() => setSelectedProduct(null)}><X aria-hidden="true" /></button>
              <div className="pc-dialog-media">{image ? <img src={image} alt={selectedProduct.name} /> : <PackageSearch aria-hidden="true" />}</div>
              <div className="pc-dialog-content">
                <span className="pc-dialog-kicker">{selectedProduct.category || "Produto"}</span>
                <h2 id="pc-dialog-title">{selectedProduct.name}</h2>
                <p>{[selectedProduct.brand, selectedProduct.size].filter(Boolean).join(" · ")}</p>
                <div className="pc-dialog-prices"><span><small>Menor</small><strong>{money(selectedProduct.minPrice)}</strong></span><span><small>Média</small><strong>{money(selectedProduct.avgPrice)}</strong></span><span><small>Maior</small><strong>{money(selectedProduct.maxPrice)}</strong></span></div>
                <div className="pc-dialog-offers">
                  {(offers.length ? offers : [bestOffer(selectedProduct)]).slice(0, 5).map((offer, index) => (
                    <div className={index === 0 ? "is-best" : ""} key={`${offer.establishmentId}-${offer.value}`}><span><strong>{offer.establishment}</strong><small>{offer.neighborhood || "Feijó, AC"}</small></span>{index === 0 && <em>Melhor preço</em>}<b>{money(offer.value)}</b></div>
                  ))}
                </div>
                <div className="pc-dialog-actions"><Link to={`/produto/${selectedProduct.slug || selectedProduct.id}`} onClick={() => setSelectedProduct(null)}>Ver detalhes <ArrowRight aria-hidden="true" /></Link><button type="button" onClick={() => search(selectedProduct.name)}>Comparar similares</button></div>
              </div>
            </section>
          </div>
        );
      })()}

      <footer className="pc-footer">
        <div className="pc-shell pc-footer-inner">
          <div className="pc-footer-brand"><img src="/logo-preco-certo-inversa.svg" alt="PreçoCerto" /><p>Pesquise, compare e escolha melhor no comércio local de Feijó.</p></div>
          <nav aria-label="Links do rodapé"><Link to="/buscar">Comparar</Link><Link to="/estabelecimentos">Estabelecimentos</Link><Link to="/cesta-basica">Minha cesta</Link><Link to="/lojista">Sou comerciante</Link><Link to="/fale-conosco">Contato</Link></nav>
        </div>
        <div className="pc-shell pc-footer-bottom"><span>PreçoCerto · Feijó, Acre</span><span>Informação local para compras mais inteligentes.</span></div>
      </footer>
    </div>
  );
}
