import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Consumidor, Pedido, ItemPedido
from app.schemas.consumidor import (
    ConsumidorResponse,
    ConsumidorDetail,
    ConsumidorListResponse,
    PedidoResumo,
)

router = APIRouter(prefix="/consumidores", tags=["Consumidores"])


@router.get("", response_model=ConsumidorListResponse)
def listar_consumidores(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    busca: str = Query("", alias="busca"),
    db: Session = Depends(get_db),
):
    stats_sq = (
        select(
            Pedido.id_consumidor,
            func.count(Pedido.id_pedido).label("total_pedidos"),
        )
        .group_by(Pedido.id_consumidor)
        .subquery()
    )

    gasto_sq = (
        select(
            Pedido.id_consumidor,
            func.coalesce(func.sum(ItemPedido.preco_BRL), 0).label("total_gasto"),
        )
        .join(ItemPedido, ItemPedido.id_pedido == Pedido.id_pedido)
        .group_by(Pedido.id_consumidor)
        .subquery()
    )

    base_query = select(Consumidor)
    if busca.strip():
        base_query = base_query.where(Consumidor.nome_consumidor.ilike(f"%{busca.strip()}%"))

    total = db.execute(select(func.count()).select_from(base_query.subquery())).scalar_one()

    rows = db.execute(
        select(
            Consumidor,
            func.coalesce(stats_sq.c.total_pedidos, 0).label("total_pedidos"),
            func.coalesce(gasto_sq.c.total_gasto, 0).label("total_gasto"),
        )
        .outerjoin(stats_sq, Consumidor.id_consumidor == stats_sq.c.id_consumidor)
        .outerjoin(gasto_sq, Consumidor.id_consumidor == gasto_sq.c.id_consumidor)
        .where(
            Consumidor.nome_consumidor.ilike(f"%{busca.strip()}%")
            if busca.strip() else True
        )
        .order_by(func.coalesce(gasto_sq.c.total_gasto, 0).desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()

    return ConsumidorListResponse(
        items=[
            ConsumidorResponse(
                id_consumidor=row.Consumidor.id_consumidor,
                nome_consumidor=row.Consumidor.nome_consumidor,
                cidade=row.Consumidor.cidade,
                estado=row.Consumidor.estado,
                total_pedidos=row.total_pedidos,
                total_gasto=round(row.total_gasto, 2),
            )
            for row in rows
        ],
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total else 0,
    )


@router.get("/{id_consumidor}", response_model=ConsumidorDetail)
def detalhar_consumidor(id_consumidor: str, db: Session = Depends(get_db)):
    consumidor = db.get(Consumidor, id_consumidor)
    if not consumidor:
        raise HTTPException(status_code=404, detail="Consumidor não encontrado")

    valor_sq = (
        select(
            ItemPedido.id_pedido,
            func.coalesce(func.sum(ItemPedido.preco_BRL), 0).label("valor_total"),
        )
        .group_by(ItemPedido.id_pedido)
        .subquery()
    )

    pedidos_rows = db.execute(
        select(
            Pedido,
            func.coalesce(valor_sq.c.valor_total, 0).label("valor_total"),
        )
        .outerjoin(valor_sq, valor_sq.c.id_pedido == Pedido.id_pedido)
        .where(Pedido.id_consumidor == id_consumidor)
        .order_by(Pedido.pedido_compra_timestamp.desc())
        .limit(50)
    ).all()

    total_pedidos = db.execute(
        select(func.count(Pedido.id_pedido)).where(Pedido.id_consumidor == id_consumidor)
    ).scalar_one()

    total_gasto = db.execute(
        select(func.coalesce(func.sum(ItemPedido.preco_BRL), 0))
        .join(Pedido, Pedido.id_pedido == ItemPedido.id_pedido)
        .where(Pedido.id_consumidor == id_consumidor)
    ).scalar_one()

    return ConsumidorDetail(
        id_consumidor=consumidor.id_consumidor,
        nome_consumidor=consumidor.nome_consumidor,
        cidade=consumidor.cidade,
        estado=consumidor.estado,
        prefixo_cep=consumidor.prefixo_cep,
        total_pedidos=total_pedidos,
        total_gasto=round(total_gasto, 2),
        pedidos=[
            PedidoResumo(
                id_pedido=row.Pedido.id_pedido,
                status=row.Pedido.status,
                pedido_compra_timestamp=(
                    row.Pedido.pedido_compra_timestamp.isoformat()
                    if row.Pedido.pedido_compra_timestamp else None
                ),
                valor_total=round(row.valor_total, 2),
            )
            for row in pedidos_rows
        ],
    )
