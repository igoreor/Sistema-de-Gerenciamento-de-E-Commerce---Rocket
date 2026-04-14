def test_listar_consumidores_vazio(client):
    resp = client.get("/consumidores")
    assert resp.status_code == 200
    assert resp.json()["items"] == []


def test_listar_consumidores(client, consumidor):
    resp = client.get("/consumidores")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["id_consumidor"] == consumidor.id_consumidor


def test_listar_consumidores_busca(client, consumidor):
    resp = client.get("/consumidores", params={"busca": "João"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    resp = client.get("/consumidores", params={"busca": "Inexistente"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


def test_detalhar_consumidor(client, consumidor, pedido, item_pedido):
    resp = client.get(f"/consumidores/{consumidor.id_consumidor}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id_consumidor"] == consumidor.id_consumidor
    assert body["total_pedidos"] == 1
    assert body["total_gasto"] == 199.90
    assert len(body["pedidos"]) == 1
    assert body["pedidos"][0]["id_pedido"] == pedido.id_pedido


def test_detalhar_consumidor_nao_encontrado(client):
    resp = client.get("/consumidores/naoexiste")
    assert resp.status_code == 404
