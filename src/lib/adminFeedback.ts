import { supabase } from "./roles";

export type CategoryReview = {
  id: string;
  category: string;
  author_name: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export type CategoryFAQ = {
  id: string;
  category: string;
  question: string;
  answer: string;
  is_active: boolean;
  created_at: string;
};

/**
 * Carrega depoimentos/reviews pendentes ou todos para moderação.
 */
export async function loadReviews(status?: 'pending' | 'approved' | 'rejected'): Promise<CategoryReview[]> {
  if (!supabase) return [];
  let query = supabase.from('category_reviews').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  
  const { data, error } = await query;
  if (error) {
    console.error("Erro ao carregar reviews:", error);
    return [];
  }
  return data || [];
}

/**
 * Atualiza o status de um depoimento.
 */
export async function updateReviewStatus(id: string, status: 'approved' | 'rejected'): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Banco não configurado" };
  const { error } = await supabase
    .from('category_reviews')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  return { error: error?.message ?? null };
}

/**
 * Carrega FAQs por categoria.
 */
export async function loadCategoryFAQs(category?: string): Promise<CategoryFAQ[]> {
  if (!supabase) return [];
  let query = supabase.from('category_faqs').select('*').order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);
  
  const { data, error } = await query;
  if (error) {
    console.error("Erro ao carregar FAQs:", error);
    return [];
  }
  return data || [];
}

/**
 * Salva ou atualiza um FAQ.
 */
export async function saveCategoryFAQ(faq: Partial<CategoryFAQ> & { category: string; question: string; answer: string }) {
  if (!supabase) return { error: "Banco não configurado" };
  const row = { ...faq, updated_at: new Date().toISOString() };
  const q = faq.id 
    ? supabase.from('category_faqs').update(row).eq('id', faq.id)
    : supabase.from('category_faqs').insert(row);
    
  const { error } = await q;
  return { error: error?.message ?? null };
}

/**
 * Envia um novo depoimento (usado no frontend público).
 */
export async function submitReview(review: Omit<CategoryReview, 'id' | 'status' | 'created_at'>) {
  if (!supabase) return { error: "Banco não configurado" };
  const { error } = await supabase.from('category_reviews').insert({
    ...review,
    status: 'pending'
  });
  
  // Aqui futuramente poderíamos disparar uma notificação via Edge Function
  if (!error) {
    try {
      await supabase.functions.invoke('notify-admin-feedback', {
        body: { type: 'review', category: review.category }
      });
    } catch (e) {
      console.warn("Falha ao notificar admin:", e);
    }
  }

  return { error: error?.message ?? null };
}

/**
 * Envia uma nova dúvida de FAQ (usado no frontend público).
 */
export async function submitFAQ(faq: { category: string; question: string }) {
  if (!supabase) return { error: "Banco não configurado" };
  const { error } = await supabase.from('category_faqs').insert({
    ...faq,
    answer: '',
    is_active: false
  });

  if (!error) {
    try {
      await supabase.functions.invoke('notify-admin-feedback', {
        body: { type: 'faq', category: faq.category }
      });
    } catch (e) {
      console.warn("Falha ao notificar admin:", e);
    }
  }

  return { error: error?.message ?? null };
}
