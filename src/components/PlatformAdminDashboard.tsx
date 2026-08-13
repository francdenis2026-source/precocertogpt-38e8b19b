import { useEffect, useState } from "react";
import { 
  BadgeDollarSign, Building2, CircleDollarSign, RefreshCcw, 
  ShieldCheck, ShoppingCart, TrendingUp, XCircle, 
  MessageSquare, HelpCircle, CheckCircle2, Eye, EyeOff, Trash2, Mail
} from "lucide-react";
import { loadSessionProfile } from "../lib/roles";
import { loadPlatformSummary, type PlatformSummary } from "../lib/merchantPlatform";
import { 
  loadReviews, updateReviewStatus, loadCategoryFAQs, saveCategoryFAQ,
  type CategoryReview, type CategoryFAQ 
} from "../lib/adminFeedback";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const empty: PlatformSummary = {
  gmvToday: 0,
  platformRevenueToday: 0,
  subscriptionRevenueMonth: 0,
  commissionRevenueToday: 0,
  activeMerchants: 0,
  ordersToday: 0,
  cancelledToday: 0,
  averageTicket: 0,
};

function Card({ label, value, helper, icon: Icon }: { label: string; value: string; helper: string; icon: any }) {
  return <article style={s.card}><div style={s.icon}><Icon size={18} /></div><span style={s.label}>{label}</span><strong style={s.value}>{value}</strong><small style={s.helper}>{helper}</small></article>;
}

export function PlatformAdminDashboard() {
  const [summary, setSummary] = useState(empty);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'reviews' | 'faq'>('summary');
  const [reviews, setReviews] = useState<CategoryReview[]>([]);
  const [faqs, setFaqs] = useState<CategoryFAQ[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() { 
    setSummary(await loadPlatformSummary());
    if (activeTab === 'reviews') setReviews(await loadReviews());
    if (activeTab === 'faq') setFaqs(await loadCategoryFAQs());
  }

  useEffect(() => {
    void (async () => {
      const profile = await loadSessionProfile();
      setAuthorized(Boolean(profile?.isAdmin));
      if (profile?.isAdmin) await refresh();
    })();
  }, [activeTab]);

  const handleReviewAction = async (id: string, action: 'approved' | 'rejected') => {
    setBusy(id);
    await updateReviewStatus(id, action);
    setReviews(await loadReviews());
    setBusy(null);
  };

  const handleToggleFaq = async (faq: CategoryFAQ) => {
    setBusy(faq.id);
    await saveCategoryFAQ({ ...faq, is_active: !faq.is_active });
    setFaqs(await loadCategoryFAQs());
    setBusy(null);
  };

  if (authorized === null) return <main style={s.center}><RefreshCcw /> Verificando acesso…</main>;
  if (!authorized) return <main style={s.center}><ShieldCheck size={40} /><h1>Acesso administrativo restrito</h1><p>Esta visão é exclusiva da administração do Preço Certo.</p><a href="/" style={s.button}>Voltar</a></main>;

  return <main style={s.page}>
    <header style={s.header}>
      <div>
        <span style={s.kicker}>PREÇO CERTO · ADMINISTRAÇÃO</span>
        <h1 style={s.h1}>Painel de Controle</h1>
        <div style={s.tabs}>
          <button style={activeTab === 'summary' ? s.tabActive : s.tab} onClick={() => setActiveTab('summary')}>Resumo Saúde</button>
          <button style={activeTab === 'reviews' ? s.tabActive : s.tab} onClick={() => setActiveTab('reviews')}>Moderação Depoimentos</button>
          <button style={activeTab === 'faq' ? s.tabActive : s.tab} onClick={() => setActiveTab('faq')}>Gestão FAQ</button>
        </div>
      </div>
      <button style={s.secondary} onClick={() => void refresh()}><RefreshCcw size={16} /> Atualizar</button>
    </header>

    {activeTab === 'summary' && (
      <>
        <section style={s.banner}><ShieldCheck size={21} /><div><strong>Separação de responsabilidades ativa</strong><p>O administrador acompanha indicadores sem entrar no painel privado do lojista.</p></div></section>
        <section style={s.grid}>
          <Card label="GMV HOJE" value={brl.format(summary.gmvToday)} helper="volume vendido pela plataforma" icon={TrendingUp} />
          <Card label="COMISSÕES HOJE" value={brl.format(summary.commissionRevenueToday)} helper="receita transacional" icon={CircleDollarSign} />
          <Card label="ASSINATURAS NO MÊS" value={brl.format(summary.subscriptionRevenueMonth)} helper="planos pagos no período" icon={BadgeDollarSign} />
          <Card label="LOJAS ATIVAS" value={String(summary.activeMerchants)} helper="estabelecimentos habilitados" icon={Building2} />
          <Card label="PEDIDOS HOJE" value={String(summary.ordersToday)} helper={`ticket médio ${brl.format(summary.averageTicket)}`} icon={ShoppingCart} />
          <Card label="CANCELADOS HOJE" value={String(summary.cancelledToday)} helper="monitoramento de qualidade" icon={XCircle} />
        </section>

        <section style={s.section}>
          <div style={s.sectionHeader}>
             <Mail size={18} />
             <h3>Configuração de Notificações</h3>
          </div>
          <p style={s.helper}>Notificações por e-mail ativas para: Novos depoimentos, Novas dúvidas de FAQ e Pedidos aguardando revisão.</p>
        </section>
      </>
    )}

    {activeTab === 'reviews' && (
      <section style={s.section}>
        <h2 style={s.h2}>Fila de Aprovação de Depoimentos</h2>
        <div style={s.tableContainer}>
          <table style={s.table}>
            <thead>
              <tr style={s.tr}>
                <th style={s.th}>Data</th>
                <th style={s.th}>Categoria</th>
                <th style={s.th}>Autor</th>
                <th style={s.th}>Avaliação</th>
                <th style={s.th}>Comentário</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id} style={s.tr}>
                  <td style={s.td}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                  <td style={s.td}><Badge text={r.category} /></td>
                  <td style={s.td}>{r.author_name}</td>
                  <td style={s.td}>{r.rating} ★</td>
                  <td style={s.td}>{r.comment}</td>
                  <td style={s.td}>
                    <span style={r.status === 'pending' ? s.statusPending : r.status === 'approved' ? s.statusApproved : s.statusRejected}>
                      {r.status === 'pending' ? 'Pendente' : r.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={s.actions}>
                      {r.status === 'pending' && (
                        <>
                          <button style={s.approveBtn} onClick={() => handleReviewAction(r.id, 'approved')} disabled={busy === r.id}>
                            <CheckCircle2 size={16} /> Aprovar
                          </button>
                          <button style={s.rejectBtn} onClick={() => handleReviewAction(r.id, 'rejected')} disabled={busy === r.id}>
                            <XCircle size={16} /> Rejeitar
                          </button>
                        </>
                      )}
                      {r.status !== 'pending' && <span style={s.helper}>Histórico fechado</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && <tr><td colSpan={7} style={s.emptyTd}>Nenhum depoimento encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    )}

    {activeTab === 'faq' && (
      <section style={s.section}>
        <h2 style={s.h2}>Gerenciamento de Perguntas e Respostas</h2>
        <div style={s.tableContainer}>
          <table style={s.table}>
            <thead>
              <tr style={s.tr}>
                <th style={s.th}>Categoria</th>
                <th style={s.th}>Pergunta</th>
                <th style={s.th}>Resposta</th>
                <th style={s.th}>Visibilidade</th>
                <th style={s.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map(f => (
                <tr key={f.id} style={s.tr}>
                  <td style={s.td}><Badge text={f.category} /></td>
                  <td style={s.td}>{f.question}</td>
                  <td style={s.td}>{f.answer || <em style={s.helper}>Aguardando resposta...</em>}</td>
                  <td style={s.td}>
                    {f.is_active ? 
                      <span style={s.statusApproved}><Eye size={14} /> Ativo</span> : 
                      <span style={s.statusRejected}><EyeOff size={14} /> Oculto</span>
                    }
                  </td>
                  <td style={s.td}>
                    <div style={s.actions}>
                      <button style={s.secondaryBtn} onClick={() => handleToggleFaq(f)} disabled={busy === f.id}>
                        {f.is_active ? 'Ocultar' : 'Publicar'}
                      </button>
                      <button style={s.rejectBtn} onClick={() => {/* delete logic */}} disabled={busy === f.id}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {faqs.length === 0 && <tr><td colSpan={5} style={s.emptyTd}>Nenhum FAQ encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    )}
  </main>;
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f5f7f6", padding: "32px clamp(18px,4vw,64px)", fontFamily: "Inter,system-ui,sans-serif", color: "#142019" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, maxWidth: 1300, margin: "0 auto 30px" },
  kicker: { fontSize: 10, fontWeight: 900, letterSpacing: ".14em", opacity: .55, textTransform: "uppercase" },
  h1: { fontSize: "clamp(24px, 4vw, 36px)", letterSpacing: "-.04em", margin: "6px 0" },
  h2: { fontSize: 22, letterSpacing: "-.03em", margin: "4px 0 20px" },
  helper: { fontSize: 13, color: "#69746d", margin: 0 },
  secondary: { background: "white", border: "1px solid #dce2de", borderRadius: 11, padding: "10px 14px", display: "flex", gap: 7, alignItems: "center", fontWeight: 750, cursor: "pointer" },
  banner: { maxWidth: 1300, margin: "0 auto 14px", padding: "16px 18px", borderRadius: 15, background: "#edf7f0", border: "1px solid #cfe3d6", display: "flex", gap: 12, alignItems: "flex-start" },
  grid: { maxWidth: 1300, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 },
  card: { background: "white", border: "1px solid #e0e5e2", borderRadius: 16, padding: 20, boxShadow: "0 7px 26px rgba(20,50,34,.04)" },
  icon: { width: 38, height: 38, borderRadius: 12, background: "#eef3ef", display: "grid", placeItems:"center", color:"#173d2b", marginBottom: 18 },
  label: { display: "block", fontSize: 10, fontWeight: 900, letterSpacing: ".11em", opacity: .55 },
  value: { display: "block", fontSize: 28, letterSpacing: "-.04em", margin: "5px 0" },
  section: { maxWidth: 1300, margin: "14px auto 0", background: "white", border: "1px solid #e0e5e2", borderRadius: 17, padding: 24 },
  sectionHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  tabs: { display: "flex", gap: 8, marginTop: 15 },
  tab: { background: "transparent", border: "none", padding: "8px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#69746d", borderBottom: "2px solid transparent" },
  tabActive: { background: "transparent", border: "none", padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#183d2b", borderBottom: "2px solid #183d2b" },
  tableContainer: { overflowX: "auto", marginTop: 20 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "12px", borderBottom: "1px solid #edf0ee", color: "#69746d", fontWeight: 600 },
  td: { padding: "12px", borderBottom: "1px solid #f5f7f6" },
  tr: { transition: "background 0.2s" },
  statusPending: { background: "#fff9eb", color: "#a37a00", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 },
  statusApproved: { background: "#ebf7ed", color: "#1b5e20", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 },
  statusRejected: { background: "#fdeced", color: "#c62828", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 },
  actions: { display: "flex", gap: 8 },
  approveBtn: { background: "#183d2b", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 },
  rejectBtn: { background: "#fdeced", color: "#c62828", border: "1px solid #f5caca", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 },
  secondaryBtn: { background: "white", border: "1px solid #dce2de", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  badge: { fontSize: 10, background: "#f0f2f0", padding: "3px 6px", borderRadius: 4, fontWeight: 800, color: "#455a4e" },
  emptyTd: { padding: "40px", textAlign: "center", color: "#69746d" },
  button: { background: "#183d2b", color: "white", textDecoration: "none", padding: "10px 14px", borderRadius: 10 },
  center: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, textAlign: "center", fontFamily: "Inter,system-ui,sans-serif" }
};


const s: Record<string, React.CSSProperties> = {
  page:{minHeight:"100vh",background:"#f5f7f6",padding:"32px clamp(18px,4vw,64px)",fontFamily:"Inter,system-ui,sans-serif",color:"#142019"},header:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:18,maxWidth:1300,margin:"0 auto 20px"},kicker:{fontSize:10,fontWeight:900,letterSpacing:".14em",opacity:.55},h1:{fontSize:"clamp(30px,4vw,48px)",letterSpacing:"-.05em",margin:"6px 0"},h2:{fontSize:26,letterSpacing:"-.03em",margin:"4px 0 18px"},helper:{fontSize:13,color:"#69746d",margin:0},secondary:{background:"white",border:"1px solid #dce2de",borderRadius:11,padding:"10px 14px",display:"flex",gap:7,alignItems:"center",fontWeight:750,cursor:"pointer"},banner:{maxWidth:1300,margin:"0 auto 14px",padding:"16px 18px",borderRadius:15,background:"#edf7f0",border:"1px solid #cfe3d6",display:"flex",gap:12,alignItems:"flex-start"},grid:{maxWidth:1300,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:12},card:{background:"white",border:"1px solid #e0e5e2",borderRadius:16,padding:20,boxShadow:"0 7px 26px rgba(20,50,34,.04)"},icon:{width:38,height:38,borderRadius:12,background:"#eef3ef",display:"grid",placeItems:"center",color:"#173d2b",marginBottom:18},label:{display:"block",fontSize:10,fontWeight:900,letterSpacing:".11em",opacity:.55},value:{display:"block",fontSize:28,letterSpacing:"-.04em",margin:"5px 0"},section:{maxWidth:1300,margin:"14px auto 0",background:"white",border:"1px solid #e0e5e2",borderRadius:17,padding:24},rules:{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10},button:{background:"#183d2b",color:"white",textDecoration:"none",padding:"10px 14px",borderRadius:10},center:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:10,textAlign:"center",fontFamily:"Inter,system-ui,sans-serif"}
};
