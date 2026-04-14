from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import produtos, categorias, dashboard, vendedores, pedidos, consumidores, avaliacoes

app = FastAPI(
    title="Sistema de Gerenciamento de E-Commerce",
    description="API para gerenciamento de produtos, vendas e avaliações.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(produtos.router)
app.include_router(categorias.router)
app.include_router(dashboard.router)
app.include_router(vendedores.router)
app.include_router(pedidos.router)
app.include_router(consumidores.router)
app.include_router(avaliacoes.router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "API rodando com sucesso!"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
