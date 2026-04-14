# 🚀 RocketDash — Sistema de Gerenciamento de E-Commerce

Dashboard administrativo completo para gerenciamento de e-commerce, desenvolvido como atividade prática para o processo seletivo da **Rocket**.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Dataset](#dataset)
- [Como Rodar](#como-rodar)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Endpoints da API](#endpoints-da-api)

---

## Visão Geral

O **RocketDash** é um painel administrativo full-stack que consome dados reais de um e-commerce brasileiro (baseado no dataset público Olist). O sistema exibe métricas de negócio, permite gerenciar produtos e visualizar pedidos com todos os seus detalhes.

---

## Tecnologias

### Backend
| Tecnologia | Versão | Função |
|---|---|---|
| Python | 3.11+ | Linguagem principal |
| FastAPI | 0.115 | Framework da API REST |
| SQLAlchemy | 2.0 | ORM e queries |
| Alembic | 1.14 | Migrações do banco |
| SQLite | — | Banco de dados |
| Uvicorn | 0.32 | Servidor ASGI |
| Pydantic | 2.10 | Validação de dados |

### Frontend
| Tecnologia | Versão | Função |
|---|---|---|
| React | 18.3 | Biblioteca de UI |
| TypeScript | 5.5 | Tipagem estática |
| Vite | 5.4 | Build tool |
| Tailwind CSS | 3.4 | Estilização |
| Recharts | 2.15 | Gráficos |
| Framer Motion | 11.0 | Animações |
| React Router | 6.22 | Roteamento |
| Sonner | 1.7 | Notificações toast |

---

## Estrutura do Projeto

```
Sistema-de-Gerenciamento-de-E-Commerce---Rocket/
│
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── main.py             # Entrypoint + CORS
│   │   ├── config.py           # Configurações via .env
│   │   ├── database.py         # Conexão SQLAlchemy
│   │   ├── seed.py             # Importação dos CSVs para o banco
│   │   ├── models/             # Modelos ORM (tabelas)
│   │   │   ├── produto.py
│   │   │   ├── pedido.py
│   │   │   ├── item_pedido.py
│   │   │   ├── consumidor.py
│   │   │   ├── vendedor.py
│   │   │   └── avaliacao_pedido.py
│   │   ├── routers/            # Endpoints da API
│   │   │   ├── produtos.py
│   │   │   ├── pedidos.py
│   │   │   ├── categorias.py
│   │   │   ├── consumidores.py
│   │   │   ├── vendedores.py
│   │   │   ├── avaliacoes.py
│   │   │   └── dashboard.py
│   │   └── schemas/            # Schemas Pydantic (request/response)
│   ├── alembic/                # Migrações
│   ├── tests/                  # Testes com pytest
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                   # SPA React
│   └── src/
│       ├── App.tsx             # Roteamento principal
│       ├── pages/
│       │   ├── Dashboard.tsx   # Página de métricas
│       │   ├── Products.tsx    # Gestão de produtos
│       │   └── Orders.tsx      # Visualização de pedidos
│       ├── components/
│       │   ├── Sidebar.tsx
│       │   ├── Header.tsx
│       │   ├── ProductCard.tsx
│       │   ├── ProductTable.tsx
│       │   ├── ProductModal.tsx
│       │   ├── ProductFormModal.tsx
│       │   └── DeleteConfirmModal.tsx
│       ├── services/
│       │   └── api.ts          # Cliente HTTP centralizado
│       └── types/
│           └── index.ts        # Interfaces TypeScript
│
└── dados/                      # CSVs com dados do e-commerce
    ├── dim_produtos.csv
    ├── dim_consumidores.csv
    ├── dim_vendedores.csv
    ├── dim_categoria_imagens.csv
    ├── fat_pedidos.csv
    ├── fat_itens_pedidos.csv
    └── fat_avaliacoes_pedidos.csv
```

---

## Funcionalidades

### Dashboard

Visão executiva do negócio em tempo real, alimentada diretamente pelo banco de dados.

- **KPIs principais** — 4 cards de destaque: total de pedidos, receita total acumulada, ticket médio por pedido e percentual de entregas realizadas no prazo
- **Gráfico de volume mensal** — área preenchida com evolução mês a mês do número de pedidos, ideal para identificar sazonalidade e tendências
- **Distribuição de status** — gráfico de barras horizontal com todos os status de pedidos (entregue, enviado, cancelado, etc.), cada barra com sua cor característica e percentual calculado sobre o total
- **Ranking de produtos** — tabela com os top 5 produtos mais vendidos, exibindo nome, categoria, unidades vendidas e receita gerada por cada um

---

### Produtos

CRUD completo com visualização rica e filtros avançados sobre o catálogo de produtos.

- **Duas visualizações** — alterna entre grid de cards (com imagem de categoria, nome, média de avaliação e total de avaliações) e tabela compacta com dimensões físicas (peso, comprimento, altura, largura)
- **Busca inteligente** — campo com debounce de 400ms que filtra produtos por nome em tempo real, sem recarregar a página
- **Filtro por categoria** — dropdown carregado dinamicamente da API, listando todas as categorias existentes no banco
- **Ordenação múltipla** — mais vendidos (padrão), melhor avaliados, nome A–Z e nome Z–A
- **Paginação server-side** — 20 produtos por página, navegação com controles de página
- **Imagens de categoria** — cada card exibe a imagem correspondente à categoria do produto, vinda do banco de dados
- **Criar produto** — formulário modal com campos: nome, categoria (dropdown), peso, comprimento, altura e largura
- **Editar produto** — mesmo formulário pré-preenchido com os dados atuais, via PUT na API
- **Excluir produto** — modal de confirmação antes da exclusão definitiva
- **Modal de detalhes** — ao clicar em um produto, abre painel com dimensões físicas completas, estatísticas de vendas (unidades vendidas, receita total, preço médio) e lista completa de avaliações reais feitas por clientes
- **Feedback via toast** — notificações de sucesso e erro para todas as operações de criação, edição e exclusão

---

### Pedidos

Consulta e acompanhamento completo de todos os pedidos do e-commerce.

- **Tabela paginada** — listagem de pedidos ordenados por data de compra (mais recentes primeiro), com colunas: ID do pedido, nome do cliente, status, quantidade de itens, valor total e data
- **Filtro por status** — dropdown com todos os status disponíveis (entregue, enviado, cancelado, processando, etc.), com badge colorido indicativo
- **Busca local** — campo de texto que filtra simultaneamente por nome do cliente ou ID do pedido
- **Paginação** — navegação por páginas com contador de total de resultados
- **Modal de detalhes do pedido** — ao clicar em qualquer linha da tabela, exibe:
  - Status com badge colorido
  - Valor total do pedido
  - Datas de compra, entrega estimada e entrega real
  - Análise logística: dias de entrega real vs estimado, com indicação visual de atraso ou pontualidade
  - Dados do cliente: nome, cidade e estado
  - Tabela de itens: nome do produto, vendedor responsável, preço unitário e frete por item
  - Avaliações do pedido: nota, título e comentário deixados pelo cliente

---

### UX & Interface

- **Tema dark/light** — alternância entre modo escuro e claro com persistência no `localStorage`
- **Sidebar responsiva** — navegação lateral com ícones e labels, visível apenas em telas `lg+`
- **Modais centralizados** — todos os modais são renderizados centralizados na viewport, com backdrop escurecido e fechamento ao clicar fora
- **Loading states** — skeleton/spinner em todas as páginas enquanto os dados são carregados da API
- **Tratamento de erros** — mensagens de erro amigáveis em caso de falha nas requisições
- **Animações** — transições suaves com Framer Motion nos modais e elementos de UI

---

## Dataset

Os dados são provenientes de um e-commerce brasileiro real (baseado no dataset público Olist), compostos por:

| Arquivo | Conteúdo |
|---|---|
| `dim_produtos.csv` | Cadastro de produtos com dimensões físicas e categoria |
| `dim_consumidores.csv` | Clientes com cidade e estado |
| `dim_vendedores.csv` | Vendedores com localização |
| `dim_categoria_imagens.csv` | URL de imagem por categoria |
| `fat_pedidos.csv` | Pedidos com status e timestamps de entrega |
| `fat_itens_pedidos.csv` | Itens de cada pedido com preço e frete |
| `fat_avaliacoes_pedidos.csv` | Avaliações com nota, título e comentário |

---

## Como Rodar

### Pré-requisitos
- Python 3.11+
- Node.js 18+

---

### 1. Clone o repositório

```bash
git clone https://github.com/igoreor/Sistema-de-Gerenciamento-de-E-Commerce---Rocket.git
cd Sistema-de-Gerenciamento-de-E-Commerce---Rocket
```

---

### 2. Backend

```bash
cd backend
```

Crie e ative o ambiente virtual:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python -m venv venv
source venv/bin/activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Configure o arquivo de ambiente:

```bash
cp .env.example .env
```

Rode as migrações para criar o banco:

```bash
alembic upgrade head
```

Popule o banco com os dados dos CSVs:

```bash
python -m app.seed
```

Inicie o servidor:

```bash
uvicorn app.main:app --reload
```

A API estará disponível em **http://localhost:8000**  
Documentação interativa (Swagger): **http://localhost:8000/docs**

---

### 3. Frontend

Em outro terminal:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O frontend estará disponível em **http://localhost:5173**

---

## Variáveis de Ambiente

### Backend — `backend/.env`

```env
DATABASE_URL=sqlite:///./database.db
```

### Frontend — `frontend/.env.local`

```env
VITE_API_URL=http://localhost:8000
```

---

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Health check |
| GET | `/produtos` | Lista produtos (paginado, com busca/filtro/ordenação) |
| GET | `/produtos/{id}` | Detalhes do produto com vendas e avaliações |
| POST | `/produtos` | Cria um novo produto |
| PUT | `/produtos/{id}` | Atualiza um produto |
| DELETE | `/produtos/{id}` | Remove um produto |
| GET | `/categorias` | Lista categorias com imagens |
| GET | `/pedidos` | Lista pedidos (paginado, filtrável por status) |
| GET | `/pedidos/{id}` | Detalhes do pedido com itens, cliente e avaliações |
| GET | `/consumidores` | Lista consumidores |
| GET | `/consumidores/{id}` | Detalhes do consumidor com histórico |
| GET | `/vendedores` | Lista vendedores |
| GET | `/dashboard` | Dados agregados para o dashboard |
| PATCH | `/avaliacoes/{id}/resposta` | Responde uma avaliação |
| DELETE | `/avaliacoes/{id}/resposta` | Remove resposta de avaliação |

---

## Autor

**Igor** — [@igoreor](https://github.com/igoreor)
