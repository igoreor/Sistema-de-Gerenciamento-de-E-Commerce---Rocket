def test_listar_pedidos_vazio(client):
    resp = client.get("/pedidos")
    assert resp.status_code == 200
    body = resp.json()
    assert body["items"] == []


def test_listar_pedidos(client, pedido, consumidor, item_pedido):
    resp = client.get("/pedidos")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    item = body["items"][0]
    assert item["id_pedido"] == pedido.id_pedido
    assert item["status"] == "entregue"
    assert item["nome_consumidor"] == consumidor.nome_consumidor
    assert item["total_itens"] == 1
    assert item["valor_total"] == 199.90


def test_listar_pedidos_filtro_status(client, pedido, item_pedido):
    resp = client.get("/pedidos", params={"status": "entregue"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    resp = client.get("/pedidos", params={"status": "cancelado"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


def test_detalhar_pedido(client, pedido, consumidor, item_pedido, avaliacao):
    resp = client.get(f"/pedidos/{pedido.id_pedido}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id_pedido"] == pedido.id_pedido
    assert body["consumidor"]["id_consumidor"] == consumidor.id_consumidor
    assert len(body["itens"]) == 1
    assert len(body["avaliacoes"]) == 1
    assert body["avaliacoes"][0]["avaliacao"] == 5
    assert body["valor_total"] == 199.90


def test_detalhar_pedido_nao_encontrado(client):
    resp = client.get("/pedidos/naoexiste")
    assert resp.status_code == 404
