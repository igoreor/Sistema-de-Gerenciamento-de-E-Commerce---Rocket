import { useEffect, useState } from 'react';
import {
  Package,
  DollarSign,
  ShoppingCart,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LabelList,
} from 'recharts';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { api, DashboardResponse } from '@/services/api';

// Chaves em português — correspondem exatamente aos valores retornados pelo backend
const STATUS_COLORS: Record<string, string> = {
  entregue:      '#22c55e', // verde
  enviado:       '#3b82f6', // azul
  processando:   '#f59e0b', // âmbar
  aprovado:      '#8b5cf6', // roxo
  cancelado:     '#ef4444', // vermelho
  faturado:      '#06b6d4', // ciano
  indisponivel:  '#f97316', // laranja
};

const STATUS_LABELS: Record<string, string> = {
  entregue:     'Entregue',
  enviado:      'Enviado',
  processando:  'Processando',
  aprovado:     'Aprovado',
  cancelado:    'Cancelado',
  faturado:     'Faturado',
  indisponivel: 'Indisponível',
};

// Normaliza a chave removendo acentos e espaços para bater com o mapa
function normalizeKey(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function statusColor(s: string) {
  return STATUS_COLORS[normalizeKey(s)] ?? '#94a3b8';
}
function statusLabel(s: string) {
  return STATUS_LABELS[normalizeKey(s)] ?? s;
}

function formatMonth(mes: string) {
  const [year, month] = mes.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

export function Dashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.dashboard
      .get()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="font-medium">{error ?? 'Erro ao carregar dados'}</p>
        <p className="text-sm text-muted-foreground">
          Verifique se o backend está rodando em{' '}
          {import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}
        </p>
      </div>
    );
  }

  const taxaPrazo =
    data.total_pedidos > 0
      ? ((data.pedidos_no_prazo / data.total_pedidos) * 100).toFixed(1)
      : '0';

  const stats = [
    {
      title: 'Total de Pedidos',
      value: formatNumber(data.total_pedidos),
      icon: ShoppingCart,
      color: 'bg-blue-500/10 text-blue-500',
      trend: 'up' as const,
    },
    {
      title: 'Receita Total',
      value: formatCurrency(data.receita_total),
      icon: DollarSign,
      color: 'bg-green-500/10 text-green-500',
      trend: 'up' as const,
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(data.ticket_medio),
      icon: Package,
      color: 'bg-amber-500/10 text-amber-500',
      trend: 'up' as const,
    },
    {
      title: 'Entregas no Prazo',
      value: `${taxaPrazo}%`,
      icon: Clock,
      color: 'bg-rose-500/10 text-rose-500',
      trend: Number(taxaPrazo) >= 90 ? ('up' as const) : ('down' as const),
    },
  ];

  const chartData = data.pedidos_por_mes.map((d) => ({
    month: formatMonth(d.mes),
    sales: d.total,
  }));

  const totalPedidosStatus = data.status_pedidos.reduce((acc, s) => acc + s.total, 0);

  const statusData = data.status_pedidos
    .sort((a, b) => b.total - a.total)
    .map((s) => ({
      name: statusLabel(s.status),
      value: s.total,
      pct: totalPedidosStatus > 0 ? ((s.total / totalPedidosStatus) * 100).toFixed(1) : '0',
      color: statusColor(s.status),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Extra</h1>
        <p className="text-muted-foreground">Visão geral do seu e-commerce</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className={cn('rounded-lg p-2', stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                )}
              >
                {stat.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Orders Chart */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Pedidos por Mês</h3>
            <p className="text-sm text-muted-foreground">
              Volume de pedidos ao longo do tempo
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(220, 70%, 50%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(220, 70%, 50%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [
                    formatNumber(value),
                    'Pedidos',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(220, 70%, 50%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Status dos Pedidos</h3>
            <p className="text-sm text-muted-foreground">
              Distribuição por status
            </p>
          </div>
          <div className="flex h-72 items-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusData}
                layout="vertical"
                margin={{ top: 4, right: 52, left: 4, bottom: 4 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  formatter={(value: number, _name: string, props: { payload?: { pct?: string } }) => [
                    `${formatNumber(value)} pedidos (${props.payload?.pct ?? 0}%)`,
                    '',
                  ]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={26}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList
                    dataKey="pct"
                    position="right"
                    formatter={(v: string) => `${v}%`}
                    style={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Top 5 Produtos</h3>
            <p className="text-sm text-muted-foreground">
              Mais vendidos por unidades
            </p>
          </div>
          <a
            href="/products"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todos
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Produto</th>
                <th className="pb-3 font-medium">Categoria</th>
                <th className="pb-3 font-medium">Unidades</th>
                <th className="pb-3 font-medium">Receita</th>
              </tr>
            </thead>
            <tbody>
              {data.top_produtos.map((p) => (
                <tr
                  key={p.id_produto}
                  className="border-b border-border last:border-0"
                >
                  <td className="py-3">
                    <span className="font-medium line-clamp-1">
                      {p.nome_produto}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-muted-foreground">
                    {p.categoria_produto}
                  </td>
                  <td className="py-3">
                    <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500">
                      {formatNumber(p.total_unidades)} un.
                    </span>
                  </td>
                  <td className="py-3 font-medium">
                    {formatCurrency(p.receita_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
