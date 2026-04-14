from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Pedido, ItemPedido, Produto, Vendedor
from app.schemas.dashboard import DashboardResponse, TopProduto, ReceitaEstado, PedidosPorMes, StatusPedido

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db)):
    total_pedidos = db.execute(
        select(func.count(Pedido.id_pedido))
    ).scalar_one()

    financeiro = db.execute(
        select(
            func.coalesce(func.sum(ItemPedido.preco_BRL), 0).label("receita"),
            func.coalesce(func.avg(ItemPedido.preco_BRL), 0).label("ticket"),
        )
    ).one()

    pedidos_no_prazo = db.execute(
        select(func.count()).where(Pedido.entrega_no_prazo == "Sim")
    ).scalar_one()

    pedidos_atrasados = db.execute(
        select(func.count()).where(Pedido.entrega_no_prazo == "Não")
    ).scalar_one()

    top_rows = db.execute(
        select(
            Produto.id_produto,
            Produto.nome_produto,
            Produto.categoria_produto,
            func.count(ItemPedido.id_item).label("total_unidades"),
            func.coalesce(func.sum(ItemPedido.preco_BRL), 0).label("receita_total"),
        )
        .join(ItemPedido, ItemPedido.id_produto == Produto.id_produto)
        .group_by(Produto.id_produto)
        .order_by(func.count(ItemPedido.id_item).desc())
        .limit(5)
    ).all()

    estado_rows = db.execute(
        select(
            Vendedor.estado,
            func.coalesce(func.sum(ItemPedido.preco_BRL), 0).label("receita"),
        )
        .join(ItemPedido, ItemPedido.id_vendedor == Vendedor.id_vendedor)
        .group_by(Vendedor.estado)
        .order_by(func.coalesce(func.sum(ItemPedido.preco_BRL), 0).desc())
        .limit(10)
    ).all()

    mes_rows = db.execute(
        select(
            func.strftime("%Y-%m", Pedido.pedido_compra_timestamp).label("mes"),
            func.count(Pedido.id_pedido).label("total"),
        )
        .where(Pedido.pedido_compra_timestamp.isnot(None))
        .group_by(func.strftime("%Y-%m", Pedido.pedido_compra_timestamp))
        .order_by(func.strftime("%Y-%m", Pedido.pedido_compra_timestamp).asc())
    ).all()

    status_rows = db.execute(
        select(
            Pedido.status,
            func.count(Pedido.id_pedido).label("total"),
        )
        .group_by(Pedido.status)
        .order_by(func.count(Pedido.id_pedido).desc())
    ).all()

    return DashboardResponse(
        total_pedidos=total_pedidos,
        receita_total=round(financeiro.receita, 2),
        ticket_medio=round(financeiro.ticket, 2),
        pedidos_no_prazo=pedidos_no_prazo,
        pedidos_atrasados=pedidos_atrasados,
        top_produtos=[
            TopProduto(
                id_produto=r.id_produto,
                nome_produto=r.nome_produto,
                categoria_produto=r.categoria_produto,
                total_unidades=r.total_unidades,
                receita_total=round(r.receita_total, 2),
            )
            for r in top_rows
        ],
        receita_por_estado=[
            ReceitaEstado(estado=r.estado, receita=round(r.receita, 2))
            for r in estado_rows
        ],
        pedidos_por_mes=[
            PedidosPorMes(mes=r.mes, total=r.total)
            for r in mes_rows
        ],
        status_pedidos=[
            StatusPedido(status=r.status, total=r.total)
            for r in status_rows
        ],
    )
