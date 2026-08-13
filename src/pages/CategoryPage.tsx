import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Store } from "lucide-react";
import "./CategoryPage.css";

export function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();

  // Mapeamento simples de dados de categorias
  const categoryData: Record<string, any> = {
    "pizzaria": { title: "Pizzarias", description: "As melhores pizzas artesanais de Feijó.", phone: "(68) 99999-0000" },
    "lanchonete": { title: "Lanchonetes", description: "Lanches rápidos, saborosos e feitos na hora.", phone: "(68) 99999-1111" },
    "sorveteria": { title: "Sorveterias", description: "Sobremesas geladas para refrescar seu dia.", phone: "(68) 99999-2222" },
    "conveniencia": { title: "Conveniência", description: "Itens essenciais sempre à mão.", phone: "(68) 99999-3333" },
    "padaria": { title: "Padarias", description: "Pão fresco e quitutes todos os dias.", phone: "(68) 99999-4444" },
    "acougue": { title: "Açougue", description: "Carnes de qualidade e cortes selecionados.", phone: "(68) 99999-5555" },
    "farmacia": { title: "Farmácias", description: "Cuidado e saúde para toda sua família.", phone: "(68) 99999-6666" },
    "mercantil": { title: "Mercantis", description: "Tudo o que você precisa para seu lar.", phone: "(68) 99999-7777" },
    "frutaria": { title: "Frutarias", description: "Frutas e legumes frescos da estação.", phone: "(68) 99999-8888" },
    "papelaria": { title: "Papelarias", description: "Material escolar e escritório em um só lugar.", phone: "(68) 99999-9999" },
  };

  const data = categoryData[category || ""] || { title: "Categoria", description: "Explore nossas opções.", phone: "" };

  return (
    <div className="category-page">
      <header className="category-header">
        <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft /> Voltar</button>
      </header>
      <main className="category-content">
        <h1>{data.title} em Feijó</h1>
        <p>{data.description}</p>
        <div className="contact-card">
          <Store size={48} />
          <h3>Precisa falar com algum estabelecimento?</h3>
          <p>Entre em contato com nossa central de atendimento ou diretamente com os parceiros.</p>
          <a href={`tel:${data.phone.replace(/\D/g, '')}`} className="contact-btn">
            <Phone /> {data.phone}
          </a>
        </div>
      </main>
    </div>
  );
}
