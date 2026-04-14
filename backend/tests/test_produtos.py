import pytest


def test_listar_produtos_vazio(client):
    resp = client.get("/produtos")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 0
    assert body["items"] == []


def test_listar_produtos(client, produto):
    resp = client.get("/produtos")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["id_produto"] == produto.id_produto


def test_listar_produtos_busca(client, produto):
    resp = client.get("/produtos", params={"busca": "Teste"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    resp = client.get("/produtos", params={"busca": "inexistente"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


def test_listar_produtos_filtro_categoria(client, produto):
    resp = client.get("/produtos", params={"categoria": "eletronicos"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    resp = client.get("/produtos", params={"categoria": "outra"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


def test_criar_produto(client):
    payload = {
        "nome_produto": "Novo Produto",
        "categoria_produto": "ferramentas",
        "peso_produto_gramas": 300.0,
    }
    resp = client.post("/produtos", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["nome_produto"] == "Novo Produto"
    assert body["categoria_produto"] == "ferramentas"
    assert "id_produto" in body


def test_criar_produto_sem_nome(client):
    resp = client.post("/produtos", json={"nome_produto": "", "categoria_produto": "cat"})
    assert resp.status_code == 422


def test_detalhar_produto(client, produto):
    resp = client.get(f"/produtos/{produto.id_produto}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id_produto"] == produto.id_produto
    assert "vendas" in body
    assert "avaliacoes" in body


def test_detalhar_produto_nao_encontrado(client):
    resp = client.get("/produtos/naoexiste")
    assert resp.status_code == 404


def test_atualizar_produto(client, produto):
    resp = client.put(f"/produtos/{produto.id_produto}", json={"nome_produto": "Produto Atualizado"})
    assert resp.status_code == 200
    assert resp.json()["nome_produto"] == "Produto Atualizado"


def test_deletar_produto(client, produto):
    resp = client.delete(f"/produtos/{produto.id_produto}")
    assert resp.status_code == 204

    resp = client.get(f"/produtos/{produto.id_produto}")
    assert resp.status_code == 404


def test_deletar_produto_nao_encontrado(client):
    resp = client.delete("/produtos/naoexiste")
    assert resp.status_code == 404
