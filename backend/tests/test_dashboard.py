def test_dashboard_vazio(client):
    resp = client.get("/dashboard")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_pedidos"] == 0
    assert body["receita_total"] == 0
    assert body["ticket_medio"] == 0
    assert body["top_produtos"] == []
    assert body["pedidos_por_mes"] == []
    assert body["status_pedidos"] == []


def test_dashboard_com_dados(client, pedido, item_pedido, vendedor):
    resp = client.get("/dashboard")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_pedidos"] == 1
    assert body["receita_total"] == 199.90
    assert body["ticket_medio"] == 199.90
    assert body["pedidos_no_prazo"] == 1
    assert body["pedidos_atrasados"] == 0
    assert len(body["top_produtos"]) == 1
    assert len(body["status_pedidos"]) == 1
    assert body["status_pedidos"][0]["status"] == "entregue"
    assert len(body["pedidos_por_mes"]) == 1
    assert body["pedidos_por_mes"][0]["mes"] == "2024-03"
    assert len(body["receita_por_estado"]) == 1
    assert body["receita_por_estado"][0]["estado"] == "PR"
