"""
Script para popular o banco de dados com os dados dos arquivos CSV.
Execução: python -m app.seed (a partir da pasta backend/)
"""

import csv
import os
import sys
from datetime import datetime, date
from pathlib import Path

from sqlalchemy import text
from app.database import SessionLocal, engine
from app.models import Consumidor, Produto, Vendedor, Pedido, ItemPedido, AvaliacaoPedido

DADOS_DIR = Path(__file__).resolve().parents[2] / "dados"
BATCH_SIZE = 1000


def _str(value: str) -> str | None:
    return value.strip() if value.strip() else None


def _float(value: str) -> float | None:
    v = value.strip()
    return float(v) if v else None


def _int(value: str) -> int | None:
    v = value.strip()
    return int(v) if v else None


def _datetime(value: str) -> datetime | None:
    v = value.strip()
    if not v:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(v, fmt)
        except ValueError:
            continue
    return None


def _date(value: str) -> date | None:
    v = value.strip()
    if not v:
        return None
    try:
        return datetime.strptime(v, "%Y-%m-%d").date()
    except ValueError:
        return None


def bulk_insert(session, model, rows: list[dict]) -> None:
    if not rows:
        return
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        session.bulk_insert_mappings(model, batch)
    session.commit()


def seed_consumidores(session) -> int:
    path = DADOS_DIR / "dim_consumidores.csv"
    rows = []
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append({
                "id_consumidor": row["id_consumidor"].strip(),
                "prefixo_cep": row["prefixo_cep"].strip(),
                "nome_consumidor": row["nome_consumidor"].strip(),
                "cidade": row["cidade"].strip(),
                "estado": row["estado"].strip(),
            })
    bulk_insert(session, Consumidor, rows)
    return len(rows)


def seed_produtos(session) -> int:
    path = DADOS_DIR / "dim_produtos.csv"
    rows = []
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append({
                "id_produto": row["id_produto"].strip(),
                "nome_produto": row["nome_produto"].strip(),
                "categoria_produto": row["categoria_produto"].strip(),
                "peso_produto_gramas": _float(row["peso_produto_gramas"]),
                "comprimento_centimetros": _float(row["comprimento_centimetros"]),
                "altura_centimetros": _float(row["altura_centimetros"]),
                "largura_centimetros": _float(row["largura_centimetros"]),
            })
    bulk_insert(session, Produto, rows)
    return len(rows)


def seed_vendedores(session) -> int:
    path = DADOS_DIR / "dim_vendedores.csv"
    rows = []
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append({
                "id_vendedor": row["id_vendedor"].strip(),
                "nome_vendedor": row["nome_vendedor"].strip(),
                "prefixo_cep": row["prefixo_cep"].strip(),
                "cidade": row["cidade"].strip(),
                "estado": row["estado"].strip(),
            })
    bulk_insert(session, Vendedor, rows)
    return len(rows)


def seed_pedidos(session) -> int:
    path = DADOS_DIR / "fat_pedidos.csv"
    rows = []
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append({
                "id_pedido": row["id_pedido"].strip(),
                "id_consumidor": row["id_consumidor"].strip(),
                "status": row["status"].strip(),
                "pedido_compra_timestamp": _datetime(row["pedido_compra_timestamp"]),
                "pedido_entregue_timestamp": _datetime(row["pedido_entregue_timestamp"]),
                "data_estimada_entrega": _date(row["data_estimada_entrega"]),
                "tempo_entrega_dias": _float(row["tempo_entrega_dias"]),
                "tempo_entrega_estimado_dias": _float(row["tempo_entrega_estimado_dias"]),
                "diferenca_entrega_dias": _float(row["diferenca_entrega_dias"]),
                "entrega_no_prazo": _str(row["entrega_no_prazo"]),
            })
    bulk_insert(session, Pedido, rows)
    return len(rows)


def seed_itens_pedidos(session) -> int:
    path = DADOS_DIR / "fat_itens_pedidos.csv"
    rows = []
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append({
                "id_pedido": row["id_pedido"].strip(),
                "id_item": int(row["id_item"].strip()),
                "id_produto": row["id_produto"].strip(),
                "id_vendedor": row["id_vendedor"].strip(),
                "preco_BRL": float(row["preco_BRL"].strip()),
                "preco_frete": float(row["preco_frete"].strip()),
            })
    bulk_insert(session, ItemPedido, rows)
    return len(rows)


def seed_avaliacoes(session) -> int:
    path = DADOS_DIR / "fat_avaliacoes_pedidos.csv"
    # Deduplica por id_avaliacao mantendo a última ocorrência
    seen: dict[str, dict] = {}
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            key = row["id_avaliacao"].strip()
            seen[key] = {
                "id_avaliacao": key,
                "id_pedido": row["id_pedido"].strip(),
                "avaliacao": int(row["avaliacao"].strip()),
                "titulo_comentario": _str(row["titulo_comentario"]),
                "comentario": _str(row["comentario"]),
                "data_comentario": _datetime(row["data_comentario"]),
                "data_resposta": _datetime(row["data_resposta"]),
            }
    rows = list(seen.values())
    bulk_insert(session, AvaliacaoPedido, rows)
    return len(rows)


def run():
    print("Iniciando seed do banco de dados...\n")

    session = SessionLocal()
    try:
        # Verifica se já foi populado
        total = session.execute(text("SELECT COUNT(*) FROM produtos")).scalar()
        if total and total > 0:
            print(f"Banco já populado ({total} produtos encontrados). Abortando seed.")
            print("Para re-popular, delete o arquivo database.db e rode 'alembic upgrade head' novamente.")
            return

        steps = [
            ("Consumidores", seed_consumidores),
            ("Produtos",     seed_produtos),
            ("Vendedores",   seed_vendedores),
            ("Pedidos",      seed_pedidos),
            ("Itens de Pedidos", seed_itens_pedidos),
            ("Avaliações",   seed_avaliacoes),
        ]

        for label, fn in steps:
            print(f"  Inserindo {label}...", end=" ", flush=True)
            count = fn(session)
            print(f"{count:,} registros")

        print("\nSeed concluído com sucesso!")

    except Exception as e:
        session.rollback()
        print(f"\nErro durante o seed: {e}", file=sys.stderr)
        raise
    finally:
        session.close()


if __name__ == "__main__":
    run()
