const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? 'Erro na requisição');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Tipos do backend ─────────────────────────────────────────────────────────

export interface BackendProduct {
  id_produto: string;
  nome_produto: string;
  categoria_produto: string;
  peso_produto_gramas: number | null;
  comprimento_centimetros: number | null;
  altura_centimetros: number | null;
  largura_centimetros: number | null;
  media_avaliacao: number | null;
  total_avaliacoes: number;
}

export interface AvaliacaoItem {
  id_avaliacao: string;
  avaliacao: number;
  titulo_comentario: string | null;
  comentario: string | null;
  data_comentario: string | null;
  resposta_gerente: string | null;
}

export interface VendasStats {
  total_unidades_vendidas: number;
  receita_total: number;
  preco_medio: number;
}

export interface AvaliacaoStats {
  media_avaliacao: number | null;
  total_avaliacoes: number;
  avaliacoes: AvaliacaoItem[];
}

export interface BackendProductDetail extends BackendProduct {
  vendas: VendasStats;
  avaliacoes: AvaliacaoStats;
}

export interface ProdutoListResponse {
  items: BackendProduct[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CategoriaResponse {
  nome: string;
  imagem_url: string | null;
}

export interface TopProduto {
  id_produto: string;
  nome_produto: string;
  categoria_produto: string;
  total_unidades: number;
  receita_total: number;
}

export interface ReceitaEstado {
  estado: string;
  receita: number;
}

export interface PedidosPorMes {
  mes: string;
  total: number;
}

export interface StatusPedido {
  status: string;
  total: number;
}

export interface DashboardResponse {
  total_pedidos: number;
  receita_total: number;
  ticket_medio: number;
  pedidos_no_prazo: number;
  pedidos_atrasados: number;
  top_produtos: TopProduto[];
  receita_por_estado: ReceitaEstado[];
  pedidos_por_mes: PedidosPorMes[];
  status_pedidos: StatusPedido[];
}

export interface ProdutoCreate {
  nome_produto: string;
  categoria_produto: string;
  peso_produto_gramas?: number | null;
  comprimento_centimetros?: number | null;
  altura_centimetros?: number | null;
  largura_centimetros?: number | null;
}

export type ProdutoUpdate = Partial<ProdutoCreate>;

// ─── Parâmetros de listagem de produtos ───────────────────────────────────────

export interface ListProdutosParams {
  page?: number;
  limit?: number;
  busca?: string;
  categoria?: string;
  ordenar?: '' | 'nome_asc' | 'nome_desc' | 'mais_vendidos' | 'avaliacao_desc';
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.append(k, String(v));
  }
  const str = q.toString();
  return str ? `?${str}` : '';
}

// ─── API ──────────────────────────────────────────────────────────────────────

// ─── Tipos de pedidos ─────────────────────────────────────────────────────────

export interface PedidoResponse {
  id_pedido: string;
  status: string;
  pedido_compra_timestamp: string | null;
  nome_consumidor: string;
  total_itens: number;
  valor_total: number;
}

export interface PedidoListResponse {
  items: PedidoResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ItemPedidoResumo {
  id_item: number;
  id_produto: string;
  nome_produto: string;
  id_vendedor: string;
  nome_vendedor: string;
  preco_BRL: number;
  preco_frete: number;
}

export interface AvaliacaoPedidoResumo {
  avaliacao: number;
  titulo_comentario: string | null;
  comentario: string | null;
}

export interface ConsumidorResumo {
  id_consumidor: string;
  nome_consumidor: string;
  cidade: string;
  estado: string;
}

export interface PedidoDetail {
  id_pedido: string;
  status: string;
  pedido_compra_timestamp: string | null;
  pedido_entregue_timestamp: string | null;
  data_estimada_entrega: string | null;
  tempo_entrega_dias: number | null;
  tempo_entrega_estimado_dias: number | null;
  diferenca_entrega_dias: number | null;
  entrega_no_prazo: string | null;
  consumidor: ConsumidorResumo;
  itens: ItemPedidoResumo[];
  avaliacoes: AvaliacaoPedidoResumo[];
  valor_total: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const api = {
  produtos: {
    list: (params: ListProdutosParams = {}) =>
      request<ProdutoListResponse>(
        `/produtos${buildQuery({
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          busca: params.busca,
          categoria: params.categoria,
          ordenar: params.ordenar,
        })}`
      ),

    get: (id: string) => request<BackendProductDetail>(`/produtos/${id}`),

    create: (data: ProdutoCreate) =>
      request<BackendProduct>('/produtos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: ProdutoUpdate) =>
      request<BackendProduct>(`/produtos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<void>(`/produtos/${id}`, { method: 'DELETE' }),
  },

  categorias: {
    list: () => request<CategoriaResponse[]>('/categorias'),
  },

  dashboard: {
    get: () => request<DashboardResponse>('/dashboard'),
  },

  pedidos: {
    list: (params: { page?: number; limit?: number; status?: string } = {}) =>
      request<PedidoListResponse>(
        `/pedidos${buildQuery({
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          status: params.status,
        })}`
      ),
    get: (id: string) => request<PedidoDetail>(`/pedidos/${id}`),
  },
};
