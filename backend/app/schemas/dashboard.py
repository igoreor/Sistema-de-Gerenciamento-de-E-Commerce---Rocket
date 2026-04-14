from pydantic import BaseModel


class TopProduto(BaseModel):
    id_produto: str
    nome_produto: str
    categoria_produto: str
    total_unidades: int
    receita_total: float


class ReceitaEstado(BaseModel):
    estado: str
    receita: float


class PedidosPorMes(BaseModel):
    mes: str       # "2023-01"
    total: int


class StatusPedido(BaseModel):
    status: str
    total: int


class DashboardResponse(BaseModel):
    total_pedidos: int
    receita_total: float
    ticket_medio: float
    pedidos_no_prazo: int
    pedidos_atrasados: int
    top_produtos: list[TopProduto]
    receita_por_estado: list[ReceitaEstado]
    pedidos_por_mes: list[PedidosPorMes]
    status_pedidos: list[StatusPedido]
