---
target: homepage
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-08-13T03-04-54Z
slug: src-pages-homepremium-tsx
---
# Homepage PreçoCerto — crítica Impeccable

## Saúde de design

| Heurística | Pontuação (0–4) | Evidência principal |
|---|---:|---|
| Visibilidade do estado | 3 | Busca possui carregamento e vazio; atualização de preços ainda pode ser mais explícita. |
| Mundo real | 4 | Linguagem, bairros e comércio são específicos de Feijó. |
| Controle e liberdade | 3 | Modal fecha por Escape; rotação automática precisava respeitar redução de movimento. |
| Consistência | 2 | Muitas folhas CSS concorrentes fragilizam a geometria. |
| Prevenção de erros | 2 | Cards clicáveis não tinham semântica de teclado. |
| Reconhecimento | 4 | Busca, categorias, lojas e atalhos são visíveis. |
| Flexibilidade | 3 | Busca e chips aceleram a tarefa; página estava longa. |
| Estética minimalista | 2 | Boa identidade, mas repetição e excesso de módulos diluíam a hierarquia. |
| Recuperação de erros | 3 | Busca vazia orienta nova tentativa. |
| Ajuda | 2 | Fluxo é claro; regras de atualização e disponibilidade poderiam ser explicadas. |
| **Total** | **28/40** | **Base forte, com dívida estrutural e de acessibilidade localizada.** |

## Especificidade

A composição é reconhecivelmente PreçoCerto: verde profundo, coral, fotografia de comércio, Feijó e dados reais. Não é uma landing page intercambiável. A fragilidade vinha da cascata com 13 folhas de refinamento, 327 seletores duplicados e regras conflitantes para comparação, cabeçalho e módulos móveis.

## Forças

- Busca é o foco e possui sugestões, teclado, carregamento e vazio.
- Identidade local e visual própria.
- Boa base de landmarks, labels, foco visível, Escape e focus trap.

## Prioridades

- P0: corrigir cards de produto para interação semântica por teclado.
- P1: estabilizar a camada final de CSS e remover offsets móveis que geram vazios.
- P1: reduzir repetição e quantidade inicial de produtos.
- P1: respeitar movimento reduzido e cancelar timers.
- P2: reforçar escala tipográfica, contraste e consistência cromática.

## Personas

- Morador de Feijó no celular: precisa chegar rápido à busca e evitar rolagem excessiva.
- Responsável pela compra mensal: precisa comparar itens, lojas e bairros com clareza.
- Pessoa com baixa visão ou pouca familiaridade digital: precisa de alvos, foco e semântica previsíveis.
- Comerciante local: precisa encontrar a entrada B2B sem competir com a ação do consumidor.

## Questões futuras

- A data de atualização e a disponibilidade devem aparecer diretamente nos cards?
- A cesta deve permanecer como seção editorial ou virar ferramenta contextual após a busca?
