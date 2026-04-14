from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AvaliacaoPedido

router = APIRouter(prefix="/avaliacoes", tags=["Avaliações"])


class RespostaPayload(BaseModel):
    resposta: str = Field(..., min_length=1, max_length=1000)


@router.patch("/{id_avaliacao}/resposta", status_code=200)
def responder_avaliacao(
    id_avaliacao: str,
    payload: RespostaPayload,
    db: Session = Depends(get_db),
):
    avaliacao = db.get(AvaliacaoPedido, id_avaliacao)
    if not avaliacao:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")

    avaliacao.resposta_gerente = payload.resposta
    db.commit()
    return {"id_avaliacao": id_avaliacao, "resposta_gerente": avaliacao.resposta_gerente}


@router.delete("/{id_avaliacao}/resposta", status_code=204)
def remover_resposta(
    id_avaliacao: str,
    db: Session = Depends(get_db),
):
    avaliacao = db.get(AvaliacaoPedido, id_avaliacao)
    if not avaliacao:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")

    avaliacao.resposta_gerente = None
    db.commit()
