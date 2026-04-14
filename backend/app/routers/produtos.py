import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Produto, ItemPedido, AvaliacaoPedido
from app.schemas.produto import (
    ProdutoCreate,
    ProdutoUpdate,
    ProdutoResponse,
    ProdutoDetail,
    ProdutoListResponse,
    VendasStats,
    AvaliacaoStats,
    AvaliacaoItem,
)

router = APIRouter(prefix="/produtos", tags=["Produtos"])


def _media_por_produto(db: Session, ids: list[str]) -> dict[str, tuple[float | None, int]]:
    """Retorna {id_produto: (media, total)} para uma lista de ids."""
    if not ids:
        return {}

    pedidos_sq = (
        select(ItemPedido.id_produto, ItemPedido.id_pedido)
        .where(ItemPedido.id_produto.in_(ids))
        .distinct()
        .subquery()
    )

    rows = db.execute(
        select(
            pedidos_sq.c.id_produto,
            func.round(func.avg(AvaliacaoPedido.avaliacao), 2).label("media"),
            func.count(AvaliacaoPedido.id_avaliacao).label("total"),
        )
        .join(AvaliacaoPedido, AvaliacaoPedido.id_pedido == pedidos_sq.c.id_pedido)
        .group_by(pedidos_sq.c.id_produto)
    ).all()

    return {row.id_produto: (row.media, row.total) for row in rows}


@router.get("", response_model=ProdutoListResponse)
def listar_produtos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    busca: str = Query("", alias="busca"),
    categoria: str = Query("", alias="categoria"),
    ordenar: str = Query("", alias="ordenar"),
    avaliacao_min: int = Query(0, ge=0, le=5, alias="avaliacao_min"),
    db: Session = Depends(get_db),
):
    query = select(Produto)

    if busca.strip():
        query = query.where(Produto.nome_produto.ilike(f"%{busca.strip()}%"))

    if categoria.strip():
        query = query.where(Produto.categoria_produto == categoria.strip())

    if avaliacao_min > 0:
        aval_filter_sq = (
            select(ItemPedido.id_produto)
            .join(AvaliacaoPedido, AvaliacaoPedido.id_pedido == ItemPedido.id_pedido)
            .group_by(ItemPedido.id_produto)
            .having(func.avg(AvaliacaoPedido.avaliacao) >= avaliacao_min)
            .subquery()
        )
        query = query.join(aval_filter_sq, Produto.id_produto == aval_filter_sq.c.id_produto)

    if ordenar == "nome_asc":
        query = query.order_by(Produto.nome_produto.asc())
    elif ordenar == "nome_desc":
        query = query.order_by(Produto.nome_produto.desc())
    elif ordenar == "mais_vendidos":
        vendas_sq = (
            select(ItemPedido.id_produto, func.count(ItemPedido.id_item).label("total_vendas"))
            .group_by(ItemPedido.id_produto)
            .subquery()
        )
        query = query.outerjoin(vendas_sq, Produto.id_produto == vendas_sq.c.id_produto)
        query = query.order_by(func.coalesce(vendas_sq.c.total_vendas, 0).desc())
    elif ordenar == "avaliacao_desc":
        aval_sq = (
            select(
                ItemPedido.id_produto,
                func.avg(AvaliacaoPedido.avaliacao).label("media_aval"),
            )
            .join(AvaliacaoPedido, AvaliacaoPedido.id_pedido == ItemPedido.id_pedido)
            .group_by(ItemPedido.id_produto)
            .subquery()
        )
        query = query.outerjoin(aval_sq, Produto.id_produto == aval_sq.c.id_produto)
        query = query.order_by(func.coalesce(aval_sq.c.media_aval, 0).desc())

    total = db.execute(select(func.count()).select_from(query.subquery())).scalar_one()

    offset = (page - 1) * limit
    produtos = db.execute(query.offset(offset).limit(limit)).scalars().all()

    medias = _media_por_produto(db, [p.id_produto for p in produtos])

    items = []
    for p in produtos:
        media, total_avals = medias.get(p.id_produto, (None, 0))
        data = ProdutoResponse.model_validate(p).model_dump()
        data["media_avaliacao"] = media
        data["total_avaliacoes"] = total_avals
        items.append(ProdutoResponse(**data))

    return ProdutoListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total else 0,
    )


@router.get("/{id_produto}", response_model=ProdutoDetail)
def detalhar_produto(id_produto: str, db: Session = Depends(get_db)):
    produto = db.get(Produto, id_produto)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    vendas_result = db.execute(
        select(
            func.count(ItemPedido.id_item).label("total_unidades"),
            func.coalesce(func.sum(ItemPedido.preco_BRL), 0).label("receita_total"),
            func.coalesce(func.avg(ItemPedido.preco_BRL), 0).label("preco_medio"),
        ).where(ItemPedido.id_produto == id_produto)
    ).one()

    vendas = VendasStats(
        total_unidades_vendidas=vendas_result.total_unidades,
        receita_total=round(vendas_result.receita_total, 2),
        preco_medio=round(vendas_result.preco_medio, 2),
    )

    pedidos_do_produto = (
        select(ItemPedido.id_pedido)
        .where(ItemPedido.id_produto == id_produto)
        .distinct()
        .subquery()
    )

    avals_result = db.execute(
        select(
            func.count(AvaliacaoPedido.id_avaliacao).label("total"),
            func.avg(AvaliacaoPedido.avaliacao).label("media"),
        ).where(AvaliacaoPedido.id_pedido.in_(select(pedidos_do_produto)))
    ).one()

    avals_list = db.execute(
        select(AvaliacaoPedido)
        .where(AvaliacaoPedido.id_pedido.in_(select(pedidos_do_produto)))
        .order_by(AvaliacaoPedido.data_comentario.desc())
        .limit(50)
    ).scalars().all()

    avaliacoes = AvaliacaoStats(
        media_avaliacao=round(avals_result.media, 2) if avals_result.media else None,
        total_avaliacoes=avals_result.total,
        avaliacoes=[
            AvaliacaoItem(
                id_avaliacao=a.id_avaliacao,
                avaliacao=a.avaliacao,
                titulo_comentario=a.titulo_comentario,
                comentario=a.comentario,
                data_comentario=a.data_comentario.isoformat() if a.data_comentario else None,
                resposta_gerente=a.resposta_gerente,
            )
            for a in avals_list
        ],
    )

    return ProdutoDetail(
        **ProdutoResponse.model_validate(produto).model_dump(),
        vendas=vendas,
        avaliacoes=avaliacoes,
    )


@router.post("", response_model=ProdutoResponse, status_code=201)
def criar_produto(payload: ProdutoCreate, db: Session = Depends(get_db)):
    produto = Produto(id_produto=uuid.uuid4().hex, **payload.model_dump())
    db.add(produto)
    db.commit()
    db.refresh(produto)
    return ProdutoResponse.model_validate(produto)


@router.put("/{id_produto}", response_model=ProdutoResponse)
def atualizar_produto(
    id_produto: str, payload: ProdutoUpdate, db: Session = Depends(get_db)
):
    produto = db.get(Produto, id_produto)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(produto, field, value)

    db.commit()
    db.refresh(produto)
    return ProdutoResponse.model_validate(produto)


@router.delete("/{id_produto}", status_code=204)
def deletar_produto(id_produto: str, db: Session = Depends(get_db)):
    produto = db.get(Produto, id_produto)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    db.delete(produto)
    db.commit()
