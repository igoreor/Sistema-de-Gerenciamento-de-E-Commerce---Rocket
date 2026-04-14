import csv
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, Depends
from sqlalchemy import select, distinct
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Produto
from app.schemas.categoria import CategoriaResponse

router = APIRouter(prefix="/categorias", tags=["Categorias"])

IMAGENS_CSV = Path(__file__).resolve().parents[3] / "dados" / "dim_categoria_imagens.csv"


@lru_cache(maxsize=1)
def _carregar_imagens() -> dict[str, str]:
    mapa: dict[str, str] = {}
    if IMAGENS_CSV.exists():
        with open(IMAGENS_CSV, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                mapa[row["Categoria"].strip()] = row["Link"].strip()
    return mapa


@router.get("", response_model=list[CategoriaResponse])
def listar_categorias(db: Session = Depends(get_db)):
    categorias = db.execute(
        select(distinct(Produto.categoria_produto))
        .where(Produto.categoria_produto != "")
        .order_by(Produto.categoria_produto)
    ).scalars().all()

    imagens = _carregar_imagens()

    return [
        CategoriaResponse(nome=cat, imagem_url=imagens.get(cat))
        for cat in categorias
    ]
