import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Pedido, Consumidor, ItemPedido, Produto, Vendedor, AvaliacaoPedido
from app.schemas.pedido import (
    PedidoResponse,
    PedidoDetail,
    PedidoListResponse,
    ItemPedidoResumo,
    AvaliacaoPedidoResumo,
    ConsumidorResumo,
)

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


@router.get("", response_model=PedidoListResponse)
def listar_pedidos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query("", alias="status"),
    db: Session = Depends(get_db),
):
    # subquery: valor total por pedido
    valor_sq = (
        select(
            ItemPedido.id_pedido,
            func.coalesce(func.sum(ItemPedido.preco_BRL), 0).label("valor_total"),
            func.count(ItemPedido.id_item).label("total_itens"),
        )
        .group_by(ItemPedido.id_pedido)
        .subquery()
    )

    query = (
        select(
            Pedido,
            Consumidor.nome_consumidor,
            func.coalesce(valor_sq.c.valor_total, 0).label("valor_total"),
            func.coalesce(valor_sq.c.total_itens, 0).label("total_itens"),
        )
        .join(Consumidor, Consumidor.id_consumidor == Pedido.id_consumidor)
        .outerjoin(valor_sq, valor_sq.c.id_pedido == Pedido.id_pedido)
    )

    if status.strip():
        query = query.where(Pedido.status == status.strip())

    total_query = select(func.count()).select_from(
        select(Pedido).where(Pedido.status == status.strip()).subquery()
        if status.strip()
        else Pedido
    )
    total = db.execute(total_query).scalar_one()

    rows = db.execute(
        query.order_by(Pedido.pedido_compra_timestamp.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()

    return PedidoListResponse(
        items=[
            PedidoResponse(
                id_pedido=row.Pedido.id_pedido,
                status=row.Pedido.status,
                pedido_compra_timestamp=(
                    row.Pedido.pedido_compra_timestamp.isoformat()
                    if row.Pedido.pedido_compra_timestamp else None
                ),
                nome_consumidor=row.nome_consumidor,
                total_itens=row.total_itens,
                valor_total=round(row.valor_total, 2),
            )
            for row in rows
        ],
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total else 0,
    )


@router.get("/{id_pedido}", response_model=PedidoDetail)
def detalhar_pedido(id_pedido: str, db: Session = Depends(get_db)):
    pedido = db.get(Pedido, id_pedido)
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    consumidor = db.get(Consumidor, pedido.id_consumidor)

    itens_rows = db.execute(
        select(
            ItemPedido,
            Produto.nome_produto,
            Vendedor.nome_vendedor,
        )
        .join(Produto, Produto.id_produto == ItemPedido.id_produto)
        .join(Vendedor, Vendedor.id_vendedor == ItemPedido.id_vendedor)
        .where(ItemPedido.id_pedido == id_pedido)
        .order_by(ItemPedido.id_item)
    ).all()

    avaliacoes = db.execute(
        select(AvaliacaoPedido).where(AvaliacaoPedido.id_pedido == id_pedido)
    ).scalars().all()

    valor_total = sum(r.ItemPedido.preco_BRL for r in itens_rows)

    return PedidoDetail(
        id_pedido=pedido.id_pedido,
        status=pedido.status,
        pedido_compra_timestamp=(
            pedido.pedido_compra_timestamp.isoformat() if pedido.pedido_compra_timestamp else None
        ),
        pedido_entregue_timestamp=(
            pedido.pedido_entregue_timestamp.isoformat() if pedido.pedido_entregue_timestamp else None
        ),
        data_estimada_entrega=(
            pedido.data_estimada_entrega.isoformat() if pedido.data_estimada_entrega else None
        ),
        tempo_entrega_dias=pedido.tempo_entrega_dias,
        tempo_entrega_estimado_dias=pedido.tempo_entrega_estimado_dias,
        diferenca_entrega_dias=pedido.diferenca_entrega_dias,
        entrega_no_prazo=pedido.entrega_no_prazo,
        consumidor=ConsumidorResumo(
            id_consumidor=consumidor.id_consumidor,
            nome_consumidor=consumidor.nome_consumidor,
            cidade=consumidor.cidade,
            estado=consumidor.estado,
        ),
        itens=[
            ItemPedidoResumo(
                id_item=r.ItemPedido.id_item,
                id_produto=r.ItemPedido.id_produto,
                nome_produto=r.nome_produto,
                id_vendedor=r.ItemPedido.id_vendedor,
                nome_vendedor=r.nome_vendedor,
                preco_BRL=r.ItemPedido.preco_BRL,
                preco_frete=r.ItemPedido.preco_frete,
            )
            for r in itens_rows
        ],
        avaliacoes=[
            AvaliacaoPedidoResumo(
                avaliacao=a.avaliacao,
                titulo_comentario=a.titulo_comentario,
                comentario=a.comentario,
            )
            for a in avaliacoes
        ],
        valor_total=round(valor_total, 2),
    )
