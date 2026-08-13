import { useParams, useNavigate } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { ArrowLeft, Phone, Store, Clock, MapPin, Search } from "lucide-react";
import "./CategoryPage.css";

const categoryData: Record<string, any> = {
  "pizzaria": { title: "Pizzarias", description: "As melhores pizzas artesanais de Feijó.", phone: "(68) 99999-0000", hours: "18:00 - 23:30", address: "Centro, Feijó - AC" },
  "lanchonete": { title: "Lanchonetes", description: "Lanches rápidos, saborosos e feitos na hora.", phone: "(68) 99999-1111", hours: "07:00 - 22:00", address: "Diversos Bairros" },
  "sorveteria": { title: "Sorveterias", description: "Sobremesas geladas para refrescar seu dia.", phone: "(68) 99999-2222", hours: "10:00 - 22:00", address: "Centro" },
  "conveniencia": { title: "Conveniência", description: "Itens essenciais sempre à mão.", phone: "(68) 99999-3333", hours: "24h", address: "Centro" },
  "padaria": { title: "Padarias", description: "Pão fresco e quitutes todos os dias.", phone: "(68) 99999-4444", hours: "05:00 - 20:00", address: "Centro" },
  "acougue": { title: "Açougue", description: "Carnes de qualidade e cortes selecionados.", phone: "(68) 99999-5555", hours: "07:00 - 18:00", address: "Mercado Central" },
  "farmacia": { title: "Farmácias", description: "Cuidado e saúde para toda sua família.", phone: "(68) 99999-6666", hours: "08:00 - 22:00", address: "Centro" },
  "mercantil": { title: "Mercantis", description: "Tudo o que você precisa para seu lar.", phone: "(68) 99999-7777", hours: "08:00 - 19:00", address: "Bairros Diversos" },
  "frutaria": { title: "Frutarias", description: "Frutas e legumes frescos da estação.", phone: "(68) 99999-8888", hours: "07:00 - 18:00", address: "Feijó" },
  "papelaria": { title: "Papelarias", description: "Material escolar e escritório em um só lugar.", phone: "(68) 99999-9999", hours: "08:00 - 18:00", address: "Centro" },
  "desapego": { title: "Desapego", description: "Oportunidades de itens usados e seminovos em Feijó.", phone: "(68) 99999-0001", hours: "Aberto para propostas", address: "Localizado em Feijó" },
  "moveis-imoveis": { title: "Móveis & Imóveis", description: "As melhores opções de mobiliário e mercado imobiliário.", phone: "(68) 99999-0002", hours: "08:00 - 18:00", address: "Centro e Expansão" },
  "hotelaria": { title: "Hotelaria & Pousadas", description: "Onde se hospedar com conforto e qualidade em Feijó.", phone: "(68) 99999-0003", hours: "24h", address: "Pontos estratégicos de Feijó" },
};

export function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const data = categoryData[category || ""] || { title: "Categoria", description: "Explore nossas opções.", phone: "", hours: "", address: "" };

  return (
    <HelmetProvider>
      <Helmet>
        <title>{data.title} em Feijó | PreçoCerto</title>
        <meta name="description" content={`Confira os melhores estabelecimentos de ${data.title} em Feijó (AC). Compare preços, veja contatos e endereços.`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": data.title,
            "description": data.description
          })}
        </script>
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
          <h1>{data.title} em Feijó</h1>
          <p>{data.description}</p>

          <div className="info-grid">
            <div className="info-item"><Clock size={20} /> <strong>Horário:</strong> {data.hours}</div>
            <div className="info-item"><MapPin size={20} /> <strong>Local:</strong> {data.address}</div>
          </div>

          <div className="contact-actions">
            <a href={`tel:${data.phone.replace(/\D/g, '')}`} className="btn btn-call"><Phone /> Ligar Agora</a>
            <a href={`https://wa.me/55${data.phone.replace(/\D/g, '')}`} target="_blank" className="btn btn-whatsapp">WhatsApp</a>
          </div>

          <section className="contact-form-section">
            <h3>Fale com nossos parceiros</h3>
            <form onSubmit={(e) => e.preventDefault()}>
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
