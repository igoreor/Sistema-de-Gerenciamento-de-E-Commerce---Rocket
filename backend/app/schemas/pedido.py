from typing import Optional
from pydantic import BaseModel


class ItemPedidoResumo(BaseModel):
    id_item: int
    id_produto: str
    nome_produto: str
    id_vendedor: str
    nome_vendedor: str
    preco_BRL: float
    preco_frete: float


class AvaliacaoPedidoResumo(BaseModel):
    avaliacao: int
    titulo_comentario: Optional[str]
    comentario: Optional[str]


class ConsumidorResumo(BaseModel):
    id_consumidor: str
    nome_consumidor: str
    cidade: str
    estado: str


class PedidoResponse(BaseModel):
    id_pedido: str
    status: str
    pedido_compra_timestamp: Optional[str]
    nome_consumidor: str
    total_itens: int
    valor_total: float


class PedidoDetail(BaseModel):
    id_pedido: str
    status: str
    pedido_compra_timestamp: Optional[str]
    pedido_entregue_timestamp: Optional[str]
    data_estimada_entrega: Optional[str]
    tempo_entrega_dias: Optional[float]
    tempo_entrega_estimado_dias: Optional[float]
    diferenca_entrega_dias: Optional[float]
    entrega_no_prazo: Optional[str]
    consumidor: ConsumidorResumo
    itens: list[ItemPedidoResumo]
    avaliacoes: list[AvaliacaoPedidoResumo]
    valor_total: float


class PedidoListResponse(BaseModel):
    items: list[PedidoResponse]
    total: int
    page: int
    limit: int
    pages: int
