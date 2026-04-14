from typing import Optional
from pydantic import BaseModel, Field


# Schema de leitura — sem min_length para tolerar dados legados do banco
class ProdutoBase(BaseModel):
    nome_produto: str = Field(..., max_length=255)
    categoria_produto: str = Field(..., max_length=100)
    peso_produto_gramas: Optional[float] = Field(None, ge=0)
    comprimento_centimetros: Optional[float] = Field(None, ge=0)
    altura_centimetros: Optional[float] = Field(None, ge=0)
    largura_centimetros: Optional[float] = Field(None, ge=0)


# Schemas de escrita — validam que o usuário não submete strings vazias
class ProdutoCreate(BaseModel):
    nome_produto: str = Field(..., min_length=1, max_length=255)
    categoria_produto: str = Field(..., min_length=1, max_length=100)
    peso_produto_gramas: Optional[float] = Field(None, ge=0)
    comprimento_centimetros: Optional[float] = Field(None, ge=0)
    altura_centimetros: Optional[float] = Field(None, ge=0)
    largura_centimetros: Optional[float] = Field(None, ge=0)


class ProdutoUpdate(BaseModel):
    nome_produto: Optional[str] = Field(None, min_length=1, max_length=255)
    categoria_produto: Optional[str] = Field(None, min_length=1, max_length=100)
    peso_produto_gramas: Optional[float] = Field(None, ge=0)
    comprimento_centimetros: Optional[float] = Field(None, ge=0)
    altura_centimetros: Optional[float] = Field(None, ge=0)
    largura_centimetros: Optional[float] = Field(None, ge=0)


class ProdutoResponse(ProdutoBase):
    id_produto: str
    media_avaliacao: Optional[float] = None
    total_avaliacoes: int = 0

    model_config = {"from_attributes": True}


class VendasStats(BaseModel):
    total_unidades_vendidas: int
    receita_total: float
    preco_medio: float


class AvaliacaoItem(BaseModel):
    id_avaliacao: str
    avaliacao: int
    titulo_comentario: Optional[str]
    comentario: Optional[str]
    data_comentario: Optional[str]
    resposta_gerente: Optional[str] = None


class AvaliacaoStats(BaseModel):
    media_avaliacao: Optional[float]
    total_avaliacoes: int
    avaliacoes: list[AvaliacaoItem]


class ProdutoDetail(ProdutoResponse):
    vendas: VendasStats
    avaliacoes: AvaliacaoStats


class ProdutoListResponse(BaseModel):
    items: list[ProdutoResponse]
    total: int
    page: int
    limit: int
    pages: int
