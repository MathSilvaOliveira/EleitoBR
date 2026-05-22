# EleitoSP

Plataforma web para análise e visualização do perfil demográfico do eleitorado do Estado de São Paulo, com base nos dados abertos do TSE.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + Recharts + TailwindCSS |
| Backend | Node.js + Express.js |
| ORM | Prisma 5 |
| Banco de dados | PostgreSQL 16 |
| ETL | Node.js + csv-parse + iconv-lite |
| Infraestrutura | Docker + Docker Compose |

---

## Pré-requisitos

- [Node.js 20.19.0](https://nodejs.org/en/blog/release/v20.19.0) — versão exata recomendada
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com)

> **Windows:** instale o Node.js pelo instalador oficial do link acima.
> Após instalar, confirme no terminal:
> ```bash
> node -v  # deve mostrar v20.19.0
> npm -v   # deve mostrar 10.x.x
> ```

---

## Como rodar

**1. Clone o repositório**
```bash
git clone https://github.com/seu-usuario/eleitosp.git
cd eleitosp
```

**2. Configure as variáveis de ambiente**
```bash
cp backend/.env.example backend/.env
```

**3. Suba os containers**
```bash
docker compose up --build
```

**4. Rode a migration do banco (primeira vez)**
```bash
docker compose exec backend npx prisma migrate dev --name init
```

**5. Acesse**
- Frontend: http://localhost:5173
- API: http://localhost:3001
- Health check: http://localhost:3001/health

---

## ETL — Carga dos dados do TSE

Baixe o arquivo CSV do [Portal de Dados Abertos do TSE](https://dadosabertos.tse.jus.br/dataset/eleitorado-atual), coloque em `data/eleitorado_sp.csv` e execute:

```bash
docker compose exec backend npm run etl
```

---

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Status da API |
| GET | `/api/resumo` | Total de eleitores e visão geral |
| GET | `/api/faixa-etaria` | Distribuição por faixa etária |
| GET | `/api/genero` | Distribuição por gênero |
| GET | `/api/escolaridade` | Distribuição por escolaridade |
| GET | `/api/municipios` | Dados por município |
| GET | `/api/regioes` | Dados por região |

---

## Estrutura do projeto

```
eleitosp/
├── backend/          # Node.js + Express (porta 3001)
│   ├── src/
│   ├── prisma/
│   └── etl/
├── frontend/         # React + Vite (porta 5173)
│   └── src/
├── data/             # CSV do TSE (não versionado)
└── docker-compose.yml
```
