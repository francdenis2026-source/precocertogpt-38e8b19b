import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { 
  ArrowLeft, Phone, Store, Clock, MapPin, Search, 
  MessageSquare, Star, Send, Navigation, HelpCircle,
  ChevronDown, ChevronUp
} from "lucide-react";
import { useState } from "react";
import "./CategoryPage.css";

const categoryData: Record<string, any> = {
  "pizzaria": { 
    title: "Pizzarias", 
    description: "As melhores pizzas artesanais de Feijó.", 
    phone: "(68) 99999-0000", 
    hours: "18:00 - 23:30", 
    address: "Centro, Feijó - AC",
    lat: -8.1633, 
    lng: -70.3533,
    faqs: [
      { q: "Quais são os sabores mais pedidos?", a: "Os sabores mais pedidos são Calabresa, Portuguesa e Frango com Catupiry." },
      { q: "Fazem entrega em todos os bairros?", a: "Sim, entregamos em todo o perímetro urbano de Feijó." }
    ]
  },
  "lanchonete": { title: "Lanchonetes", description: "Lanches rápidos, saborosos e feitos na hora.", phone: "(68) 99999-1111", hours: "07:00 - 22:00", address: "Diversos Bairros", lat: -8.1650, lng: -70.3550 },
  "sorveteria": { title: "Sorveterias", description: "Sobremesas geladas para refrescar seu dia.", phone: "(68) 99999-2222", hours: "10:00 - 22:00", address: "Centro", lat: -8.1620, lng: -70.3520 },
  "conveniencia": { title: "Conveniência", description: "Itens essenciais sempre à mão.", phone: "(68) 99999-3333", hours: "24h", address: "Centro", lat: -8.1610, lng: -70.3510 },
  "padaria": { title: "Padarias", description: "Pão fresco e quitutes todos os dias.", phone: "(68) 99999-4444", hours: "05:00 - 20:00", address: "Centro", lat: -8.1640, lng: -70.3540 },
  "acougue": { title: "Açougue", description: "Carnes de qualidade e cortes selecionados.", phone: "(68) 99999-5555", hours: "07:00 - 18:00", address: "Mercado Central", lat: -8.1660, lng: -70.3560 },
  "farmacia": { title: "Farmácias", description: "Cuidado e saúde para toda sua família.", phone: "(68) 99999-6666", hours: "08:00 - 22:00", address: "Centro", lat: -8.1670, lng: -70.3570 },
  "mercantil": { title: "Mercantis", description: "Tudo o que você precisa para seu lar.", phone: "(68) 99999-7777", hours: "08:00 - 19:00", address: "Bairros Diversos", lat: -8.1680, lng: -70.3580 },
  "frutaria": { title: "Frutarias", description: "Frutas e legumes frescos da estação.", phone: "(68) 99999-8888", hours: "07:00 - 18:00", address: "Feijó", lat: -8.1690, lng: -70.3590 },
  "papelaria": { title: "Papelarias", description: "Material escolar e escritório em um só lugar.", phone: "(68) 99999-9999", hours: "08:00 - 18:00", address: "Centro", lat: -8.1700, lng: -70.3600 },
  "desapego": { title: "Desapego", description: "Oportunidades de itens usados e seminovos em Feijó.", phone: "(68) 99999-0001", hours: "Aberto para propostas", address: "Localizado em Feijó", lat: -8.1710, lng: -70.3610 },
  "moveis-imoveis": { title: "Móveis & Imóveis", description: "As melhores opções de mobiliário e mercado imobiliário.", phone: "(68) 99999-0002", hours: "08:00 - 18:00", address: "Centro e Expansão", lat: -8.1720, lng: -70.3620 },
  "hotelaria": { title: "Hotelaria & Pousadas", description: "Onde se hospedar com conforto e qualidade em Feijó.", phone: "(68) 99999-0003", hours: "24h", address: "Pontos estratégicos de Feijó", lat: -8.1730, lng: -70.3630 },
};

const mockTestimonials = [
  { name: "João Silva", rating: 5, comment: "Excelente atendimento e qualidade!", date: "15/05/2026" },
  { name: "Maria Santos", rating: 4, comment: "Muito bom, recomendo a todos em Feijó.", date: "10/05/2026" },
];

export function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const data = categoryData[category || ""] || { 
    title: "Categoria", 
    description: "Explore nossas opções.", 
    phone: "", 
    hours: "", 
    address: "",
    lat: -8.1633,
    lng: -70.3533
  };

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}`;
    window.open(url, '_blank');
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>{data.title} em Feijó | PreçoCerto</title>
        <meta name="description" content={`Confira os melhores estabelecimentos de ${data.title} em Feijó (AC). Compare preços, veja contatos e endereços.`} />
      </Helmet>

      <div className="category-page">
        <header className="category-header">
          <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft /> Voltar</button>
          <div className="category-search">
            <input type="text" placeholder="Buscar estabelecimento..." />
            <Search size={16} />
          </div>
        </header>

        <main className="category-content">
          <section className="category-hero">
            <h1>{data.title} em Feijó</h1>
            <p className="subtitle">{data.description}</p>
            
            <div className="info-grid">
              <div className="info-item"><Clock size={20} /> <strong>Horário:</strong> {data.hours}</div>
              <div className="info-item"><MapPin size={20} /> <strong>Local:</strong> {data.address}</div>
            </div>

            <div className="contact-actions">
              <a href={`tel:${data.phone.replace(/\D/g, '')}`} className="btn btn-call"><Phone /> Ligar Agora</a>
              <a href={`https://wa.me/55${data.phone.replace(/\D/g, '')}`} target="_blank" className="btn btn-whatsapp">WhatsApp</a>
            </div>
          </section>

          {/* Map Section */}
          <section className="category-section map-section">
            <h3><MapPin className="section-icon" /> Localização</h3>
            <div className="map-placeholder">
              <div className="map-inner">
                <MapPin size={48} className="map-pin-anim" />
                <p>{data.address}</p>
                <button onClick={handleGetDirections} className="btn btn-directions">
                  <Navigation size={18} /> Gerar Rota no Google Maps
                </button>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="category-section testimonials-section">
            <h3><MessageSquare className="section-icon" /> Avaliações</h3>
            <div className="testimonials-grid">
              {mockTestimonials.map((t, i) => (
                <div key={i} className="testimonial-card">
                  <div className="testimonial-header">
                    <span className="author">{t.name}</span>
                    <div className="stars">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} size={14} fill={idx < t.rating ? "var(--pc-gold)" : "none"} stroke="var(--pc-gold)" />
                      ))}
                    </div>
                  </div>
                  <p>"{t.comment}"</p>
                  <span className="date">{t.date}</span>
                </div>
              ))}
            </div>
            
            <div className="add-review">
              <h4>Deixe sua avaliação</h4>
              <form className="review-form" onSubmit={(e) => { e.preventDefault(); alert('Avaliação enviada com sucesso!'); }}>
                <div className="form-row">
                  <input type="text" placeholder="Seu nome" required />
                  <select required defaultValue="">
                    <option value="" disabled>Nota</option>
                    <option value="5">5 Estrelas</option>
                    <option value="4">4 Estrelas</option>
                    <option value="3">3 Estrelas</option>
                    <option value="2">2 Estrelas</option>
                    <option value="1">1 Estrela</option>
                  </select>
                </div>
                <textarea placeholder="Seu comentário..." rows={3} required></textarea>
                <button type="submit" className="btn btn-submit"><Send size={16} /> Enviar Avaliação</button>
              </form>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="category-section faq-section">
            <h3><HelpCircle className="section-icon" /> Perguntas Frequentes</h3>
            <div className="faq-list">
              {(data.faqs || [
                { q: "Como entrar em contato?", a: "Você pode usar os botões de ligação ou WhatsApp acima para falar diretamente com o estabelecimento." },
                { q: "Quais as formas de pagamento?", a: "A maioria aceita Dinheiro, PIX e Cartões de Crédito/Débito." }
              ]).map((faq: any, i: number) => (
                <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <div className="faq-question">
                    <span>{faq.q}</span>
                    {openFaq === i ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                  {openFaq === i && <div className="faq-answer">{faq.a}</div>}
                </div>
              ))}
            </div>
            <div className="faq-footer">
              <p>Ainda tem dúvidas? <Link to="/contato" className="contact-link">Entre em contato conosco</Link></p>
            </div>
          </section>

          {/* Main Contact Form */}
          <section className="contact-form-section">
            <h3>Fale com nossos parceiros</h3>
            <form onSubmit={(e) => { e.preventDefault(); alert('Mensagem enviada!'); }}>
              <input type="text" placeholder="Seu Nome" required />
              <input type="email" placeholder="Seu E-mail" required />
              <textarea placeholder="Sua dúvida ou solicitação" rows={4} required></textarea>
              <button type="submit" className="btn btn-submit">Enviar Mensagem</button>
            </form>
          </section>
        </main>
      </div>
    </HelmetProvider>
  );
}
