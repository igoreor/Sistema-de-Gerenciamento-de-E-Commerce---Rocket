import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models import Consumidor, Produto, Vendedor, Pedido, ItemPedido, AvaliacaoPedido

# StaticPool garante que todas as conexões compartilham o mesmo banco em memória
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, _):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Recria as tabelas antes de cada teste para garantir isolamento
@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db(setup_db):
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ─── Fixtures de dados ────────────────────────────────────────────────────────

@pytest.fixture
def consumidor(db):
    obj = Consumidor(
        id_consumidor="cons0001",
        prefixo_cep="01310",
        nome_consumidor="João Silva",
        cidade="São Paulo",
        estado="SP",
    )
    db.add(obj)
    db.flush()
    return obj


@pytest.fixture
def vendedor(db):
    obj = Vendedor(
        id_vendedor="vend0001",
        nome_vendedor="Loja Teste",
        prefixo_cep="80010",
        cidade="Curitiba",
        estado="PR",
    )
    db.add(obj)
    db.flush()
    return obj


@pytest.fixture
def produto(db):
    obj = Produto(
        id_produto="prod0001",
        nome_produto="Produto Teste",
        categoria_produto="eletronicos",
        peso_produto_gramas=500.0,
        comprimento_centimetros=20.0,
        altura_centimetros=10.0,
        largura_centimetros=15.0,
    )
    db.add(obj)
    db.flush()
    return obj


@pytest.fixture
def pedido(db, consumidor):
    from datetime import datetime
    obj = Pedido(
        id_pedido="pedi0001",
        id_consumidor=consumidor.id_consumidor,
        status="entregue",
        pedido_compra_timestamp=datetime(2024, 3, 15, 10, 0, 0),
        pedido_entregue_timestamp=datetime(2024, 3, 20, 14, 0, 0),
        entrega_no_prazo="Sim",
        tempo_entrega_dias=5.0,
        tempo_entrega_estimado_dias=7.0,
        diferenca_entrega_dias=2.0,
    )
    db.add(obj)
    db.flush()
    return obj


@pytest.fixture
def item_pedido(db, pedido, produto, vendedor):
    obj = ItemPedido(
        id_pedido=pedido.id_pedido,
        id_item=1,
        id_produto=produto.id_produto,
        id_vendedor=vendedor.id_vendedor,
        preco_BRL=199.90,
        preco_frete=15.00,
    )
    db.add(obj)
    db.flush()
    return obj


@pytest.fixture
def avaliacao(db, pedido):
    obj = AvaliacaoPedido(
        id_avaliacao="aval0001",
        id_pedido=pedido.id_pedido,
        avaliacao=5,
        titulo_comentario="Ótimo produto",
        comentario="Chegou rápido e em perfeito estado.",
    )
    db.add(obj)
    db.flush()
    return obj
