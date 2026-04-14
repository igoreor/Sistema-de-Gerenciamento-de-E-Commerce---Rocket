from typing import Optional
from pydantic import BaseModel


class PedidoResumo(BaseModel):
    id_pedido: str
    status: str
    pedido_compra_timestamp: Optional[str]
    valor_total: float


class ConsumidorResponse(BaseModel):
    id_consumidor: str
    nome_consumidor: str
    cidade: str
    estado: str
    total_pedidos: int
    total_gasto: float


class ConsumidorDetail(ConsumidorResponse):
    prefixo_cep: str
    pedidos: list[PedidoResumo]


class ConsumidorListResponse(BaseModel):
    items: list[ConsumidorResponse]
    total: int
    page: int
    limit: int
    pages: int
