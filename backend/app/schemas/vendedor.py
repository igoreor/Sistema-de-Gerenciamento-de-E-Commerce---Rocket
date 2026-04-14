import math
from pydantic import BaseModel


class VendedorResponse(BaseModel):
    id_vendedor: str
    nome_vendedor: str
    cidade: str
    estado: str
    total_vendas: int
    receita_total: float


class VendedorListResponse(BaseModel):
    items: list[VendedorResponse]
    total: int
    page: int
    limit: int
    pages: int
