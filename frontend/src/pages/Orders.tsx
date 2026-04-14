import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  ShoppingCart,
  User,
  Package,
  Star,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import {
  api,
  PedidoResponse,
  PedidoDetail,
} from '@/services/api';

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  entregue:        { label: 'Entregue',        color: 'bg-green-500/10 text-green-500' },
  enviado:         { label: 'Enviado',          color: 'bg-blue-500/10 text-blue-500' },
  cancelado:       { label: 'Cancelado',        color: 'bg-red-500/10 text-red-500' },
  'em processamento': { label: 'Processando',   color: 'bg-amber-500/10 text-amber-500' },
  aprovado:        { label: 'Aprovado',         color: 'bg-violet-500/10 text-violet-500' },
  faturado:        { label: 'Faturado',         color: 'bg-cyan-500/10 text-cyan-500' },
  criado:          { label: 'Criado',           color: 'bg-slate-500/10 text-slate-400' },
  indisponivel:    { label: 'Indisponível',     color: 'bg-orange-500/10 text-orange-500' },
};

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function statusInfo(s: string) {
  return STATUS_MAP[normalize(s)] ?? { label: s, color: 'bg-muted text-muted-foreground' };
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

const LIMIT = 20;

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'em processamento', label: 'Processando' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'faturado', label: 'Faturado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'criado', label: 'Criado' },
];

// ─── Modal de detalhe ─────────────────────────────────────────────────────────

function OrderDetailModal({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<PedidoDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) { setDetail(null); return; }
    setLoading(true);
    api.pedidos
      .get(id)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [id]);

  const isOpen = !!id;
  const info = detail ? statusInfo(detail.status) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">Detalhes do Pedido</h2>
                {detail && (
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    #{detail.id_pedido.slice(0, 16)}…
                  </p>
                )}
              </div>
              <button onClick={onClose} className="rounded-lg p-2 hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : !detail ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  Não foi possível carregar o pedido.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status + datas */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="mb-2 text-xs text-muted-foreground">Status</p>
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', info?.color)}>
                        {info?.label}
                      </span>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="mb-1 text-xs text-muted-foreground">Valor Total</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(detail.valor_total)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Compra
                      </div>
                      <p className="text-sm font-medium">{fmtDate(detail.pedido_compra_timestamp)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Entrega
                      </div>
                      <p className="text-sm font-medium">{fmtDate(detail.pedido_entregue_timestamp)}</p>
                    </div>
                  </div>

                  {/* Entrega */}
                  {(detail.tempo_entrega_dias !== null || detail.entrega_no_prazo) && (
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Truck className="h-3.5 w-3.5" />
                        Logística
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {detail.tempo_entrega_dias !== null && (
                          <span>
                            <span className="text-muted-foreground">Tempo real: </span>
                            <strong>{detail.tempo_entrega_dias} dias</strong>
                          </span>
                        )}
                        {detail.tempo_entrega_estimado_dias !== null && (
                          <span>
                            <span className="text-muted-foreground">Estimado: </span>
                            <strong>{detail.tempo_entrega_estimado_dias} dias</strong>
                          </span>
                        )}
                        {detail.entrega_no_prazo && (
                          <span className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            detail.entrega_no_prazo === 'Sim'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-red-500/10 text-red-500'
                          )}>
                            {detail.entrega_no_prazo === 'Sim' ? 'No prazo' : 'Atrasado'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cliente */}
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      Cliente
                    </div>
                    <p className="font-semibold">{detail.consumidor.nome_consumidor}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {detail.consumidor.cidade}, {detail.consumidor.estado}
                    </div>
                  </div>

                  {/* Itens */}
                  {detail.itens.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Package className="h-3.5 w-3.5" />
                        Itens ({detail.itens.length})
                      </div>
                      <div className="overflow-hidden rounded-lg border border-border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                              <th className="px-4 py-2.5 font-medium">Produto</th>
                              <th className="px-4 py-2.5 font-medium">Vendedor</th>
                              <th className="px-4 py-2.5 text-right font-medium">Preço</th>
                              <th className="px-4 py-2.5 text-right font-medium">Frete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.itens.map((item) => (
                              <tr key={item.id_item} className="border-b border-border last:border-0">
                                <td className="max-w-[160px] truncate px-4 py-2.5 font-medium">
                                  {item.nome_produto}
                                </td>
                                <td className="px-4 py-2.5 text-muted-foreground">
                                  {item.nome_vendedor}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {formatCurrency(item.preco_BRL)}
                                </td>
                                <td className="px-4 py-2.5 text-right text-muted-foreground">
                                  {formatCurrency(item.preco_frete)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Avaliações */}
                  {detail.avaliacoes.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Star className="h-3.5 w-3.5" />
                        Avaliações
                      </div>
                      <div className="space-y-2">
                        {detail.avaliacoes.map((av, i) => (
                          <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                            <div className="mb-1 flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, j) => (
                                <Star
                                  key={j}
                                  className={j < av.avaliacao
                                    ? 'h-3.5 w-3.5 fill-amber-400 text-amber-400'
                                    : 'h-3.5 w-3.5 fill-muted text-muted'}
                                />
                              ))}
                            </div>
                            {av.titulo_comentario && (
                              <p className="text-sm font-medium">{av.titulo_comentario}</p>
                            )}
                            {av.comentario && (
                              <p className="mt-0.5 text-sm text-muted-foreground">{av.comentario}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function Orders() {
  const [orders, setOrders] = useState<PedidoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [statusFilter, search]);

  const fetchOrders = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.pedidos.list({ page: p, limit: LIMIT, status: statusFilter || undefined });
      setOrders(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(page); }, [fetchOrders, page]);

  // filtro de busca local (por nome do cliente ou ID)
  const filtered = search
    ? orders.filter(
        (o) =>
          o.nome_consumidor.toLowerCase().includes(search.toLowerCase()) ||
          o.id_pedido.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">
            {loading ? 'Carregando...' : `${formatNumber(total)} pedido${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cliente ou ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-52"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {(statusFilter || searchInput) && (
          <button
            onClick={() => { setStatusFilter(''); setSearchInput(''); }}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
            Limpar
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="font-medium text-destructive">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card">
          <ShoppingCart className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Nenhum pedido encontrado</p>
          <p className="text-sm text-muted-foreground">Tente ajustar os filtros</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-sm text-muted-foreground">
                  <th className="px-4 py-3 font-medium">ID do Pedido</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Itens</th>
                  <th className="px-4 py-3 font-medium">Valor Total</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const si = statusInfo(order.status);
                  return (
                    <tr
                      key={order.id_pedido}
                      onClick={() => setSelectedId(order.id_pedido)}
                      className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {order.id_pedido.slice(0, 12)}…
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="max-w-[180px] truncate font-medium">
                          {order.nome_consumidor}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', si.color)}>
                          {si.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {order.total_itens} {order.total_itens === 1 ? 'item' : 'itens'}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(order.valor_total)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {fmtDate(order.pedido_compra_timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {page} de {pages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-background disabled:opacity-40 hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-background disabled:opacity-40 hover:bg-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <OrderDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
