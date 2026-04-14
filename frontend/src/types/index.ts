// Produto — campos disponíveis no backend
export interface Product {
  id: string;
  name: string;
  category: string;
  rating: number | null;
  reviewCount: number;
  peso: number | null;
  comprimento: number | null;
  altura: number | null;
  largura: number | null;
}

export interface Review {
  id: string;
  avaliacao: number;
  titulo: string | null;
  comentario: string | null;
  data: string | null;
  resposta: string | null;
}

export interface DashboardStats {
  totalPedidos: number;
  receitaTotal: number;
  ticketMedio: number;
  pedidosNoPrazo: number;
  pedidosAtrasados: number;
}

export interface SalesData {
  month: string;
  sales: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export type ViewMode = 'grid' | 'table';

export type SortField = 'name' | 'rating' | 'reviewCount';
export type SortOrder = 'asc' | 'desc';

export interface ProductFilters {
  search: string;
  category: string;
  sortField: SortField;
  sortOrder: SortOrder;
}
