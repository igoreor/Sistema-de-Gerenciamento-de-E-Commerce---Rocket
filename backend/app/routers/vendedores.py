import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Vendedor, ItemPedido
from app.schemas.vendedor import VendedorResponse, VendedorListResponse

router = APIRouter(prefix="/vendedores", tags=["Vendedores"])


@router.get("", response_model=VendedorListResponse)
def listar_vendedores(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stats_sq = (
        select(
            ItemPedido.id_vendedor,
            func.count(ItemPedido.id_item).label("total_vendas"),
            func.coalesce(func.sum(ItemPedido.preco_BRL), 0).label("receita_total"),
        )
        .group_by(ItemPedido.id_vendedor)
        .subquery()
    )

    total = db.execute(select(func.count(Vendedor.id_vendedor))).scalar_one()

    rows = db.execute(
        select(
            Vendedor,
            func.coalesce(stats_sq.c.total_vendas, 0).label("total_vendas"),
            func.coalesce(stats_sq.c.receita_total, 0).label("receita_total"),
        )
        .outerjoin(stats_sq, Vendedor.id_vendedor == stats_sq.c.id_vendedor)
        .order_by(func.coalesce(stats_sq.c.receita_total, 0).desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()

    return VendedorListResponse(
        items=[
            VendedorResponse(
                id_vendedor=row.Vendedor.id_vendedor,
                nome_vendedor=row.Vendedor.nome_vendedor,
                cidade=row.Vendedor.cidade,
                estado=row.Vendedor.estado,
                total_vendas=row.total_vendas,
                receita_total=round(row.receita_total, 2),
            )
            for row in rows
        ],
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total else 0,
    )
