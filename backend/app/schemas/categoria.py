from pydantic import BaseModel


class CategoriaResponse(BaseModel):
    nome: str
    imagem_url: str | None
