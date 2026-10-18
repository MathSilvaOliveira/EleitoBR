# EleitoBR

Plataforma web para análise interativa e visualização do perfil demográfico do eleitorado brasileiro — todos os estados e o eleitorado no exterior (ZZ) — com base nos dados abertos do TSE.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite + Recharts + TailwindCSS 4 |
| Backend | Node.js + Express.js |
| ORM | Prisma 5 |
| Banco de dados | PostgreSQL 16 |
| ETL | Node.js + csv-parse + iconv-lite |
| Infraestrutura | Docker + Docker Compose |

---

## Arquitetura

```
frontend/src
├── pages/          PainelGeral (dashboard) · Comparar (dois municípios lado a lado)
├── context/        FiltrosContext (drill-down global) · TemaContext (dark/light)
├── hooks/          useApi (fetch com params, AbortController, refetch automático)
│                   useRota (troca de tela pela History API, sem router)
│                   useComparacao (par A/B na URL) · usePerfilMunicipio
├── components/
│   ├── Cabecalho   Navegação entre telas + data da base TSE
│   ├── CabecalhoPagina     Caminho, título e ações de cada tela
│   ├── ui/         ChartCard, InfoTooltip, Skeleton, ErroCarga, ThemeToggle,
│   │               Segmentado, LinkTela
│   ├── charts/     Pirâmide etária, Heatmap, Barras empilhadas, Donut, UFs,
│   │               Escolaridade comparada, Gerações, Faixa a faixa
│   ├── comparar/   Seletor A/B, abas Visão geral e Idade, resumo e frase-síntese
│   ├── BuscaMunicipio      Autocomplete de município (FilterBar e Comparar)
│   ├── FilterBar   Filtros dinâmicos (UF + autocomplete de município)
│   ├── RankingMunicipios   Tabela de indicadores (IEE, Hiato Instrucional)
│   └── ExteriorPanel       Painel do eleitorado no exterior (ZZ)
└── utils/          formatos.js (formatação e faixas etárias)
                    estatisticas.js (idade mediana, escala de eixos)

backend/src
├── lib/            prisma.js · logger.js (JSON estruturado) · queryFilters.js
├── services/       eleitoradoService.js (dimensão única)
│                   cruzamentoService.js (cruzamentos + indicadores)
├── routes/         index.js (validação + delegação, handler DRY)
└── app.js          middlewares (CORS, request log, erro global)
```

Padrão em camadas (MVC adaptado a API): **rotas** validam e delegam, **services** concentram a lógica de dados, o **Prisma/PostgreSQL** persiste. O frontend atua como camada de visualização desacoplada, consumindo a API REST.

---

## Endpoints da API

Filtros comuns: `?uf=SP` (sigla, aceita `ZZ` = exterior), `?municipioId=123` e `?genero=M|F|NI`.

| Endpoint | Descrição |
|---|---|
| `GET /api/resumo` | Totais: Brasil (sem exterior), exterior, seleção atual, municípios, estados |
| `GET /api/faixa-etaria` | Distribuição por faixa etária |
| `GET /api/genero` | Distribuição por gênero |
| `GET /api/escolaridade` | Distribuição por grau de instrução |
| `GET /api/municipios?q=&uf=&limit=` | Busca leve de municípios (autocomplete), sem diferenciar acento; nome exato primeiro |
| `GET /api/municipios?municipioId=` | Busca por id; alcança também o exterior |
| `GET /api/municipios/ranking?uf=&limit=` | Top municípios por eleitores |
| `GET /api/regioes` | Total por UF (exclui ZZ) |
| `GET /api/cruzamentos/genero-faixa` | Gênero × faixa etária (pirâmide) |
| `GET /api/cruzamentos/escolaridade-faixa` | Escolaridade × faixa etária (heatmap) |
| `GET /api/cruzamentos/escolaridade-genero` | Escolaridade × gênero (empilhado) |
| `GET /api/indicadores/municipios?orderBy=total\|iee\|hiato&direcao=desc\|asc&minEleitores=` | IEE e Hiato Instrucional por município; com `municipioId`, só aquele município e sem o corte de `minEleitores` |
| `GET /api/exterior?limit=` | Perfil consolidado do eleitorado no exterior |
| `GET /api/importacao` | Procedência: arquivo, tamanho, data e SHA-256 do CSV em uso |

**Convenção para o gênero:** os gráficos que têm gênero como eixo próprio (donut de gênero, pirâmide etária e escolaridade × gênero) não aplicam `genero` a si mesmos — mantêm a comparação completa e apenas destacam a seleção. Caso contrário o donut viraria uma fatia única e deixaria de servir como controle, e os dois comparativos perderiam o sentido.

**Convenção para o exterior (ZZ):** agregados nacionais excluem ZZ; `uf=ZZ` consulta exclusivamente o exterior; o total do exterior é exposto separadamente em `/api/resumo` (`total_exterior`).

### Indicadores originais

- **IEE — Índice de Envelhecimento Eleitoral** = eleitores 60+ ÷ eleitores 16–24. IEE > 1: idosos superam jovens no eleitorado.
- **Hiato Instrucional (p.p.)** = %baixa instrução (analfabeto, lê e escreve, fundamental incompleto) − %instrução superior (incompleta ou completa). Positivo: predomínio de baixa instrução.

Municípios com menos de 10.000 eleitores são omitidos do ranking por padrão (`minEleitores`), evitando distorção de razões em populações pequenas. Na tela de comparação eles aparecem, com aviso de que IEE e Hiato ficam instáveis.

### Comparação de municípios

A tela **Comparar** coloca dois municípios lado a lado (`/comparar?a=&b=`), sempre na mesma escala: em percentual do eleitorado de cada um, por padrão, ou em número de eleitores. As abas **Visão geral** e **Idade** (`?aba=idade`) usam os mesmos dados, carregados uma vez.

- **Idade mediana (estimada)**: o TSE publica a idade em faixas, então a mediana é calculada como em dados agrupados: localiza-se a faixa que contém metade do eleitorado e interpola-se linearmente dentro dela, supondo as idades distribuídas por igual na faixa.
- **Pirâmide comparada**: faixas de 5 anos, com 15–17 (inclui os alistados aos 15, que votam aos 16) e 18–19 separadas, e topo aberto em 90+.
- **Superior completo**: percentual de eleitores com instrução superior completa sobre o total do município.
- **Gerações**: até 24 anos (inclui os alistados aos 15), 25 a 44, 45 a 59 e 60 ou mais, sobre os eleitores com idade informada. O IEE segue usando 16–24 para os jovens.
- **Voto facultativo**: eleitores com até 17 anos ou com 70 anos ou mais, pela idade registrada no cadastro do TSE.
- **Faixa mais numerosa**: a faixa da pirâmide comparada com mais eleitores.

---

## Pré-requisitos

- [Node.js 20.19.0](https://nodejs.org/en/blog/release/v20.19.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com)

> **Windows:** instale o Node.js pelo instalador oficial. **Linux:** use o asdf (`.tool-versions` já aponta a versão).

---

## Como rodar

**1. Clone e configure**
```bash
git clone https://github.com/seu-usuario/eleitobr.git
cd eleitobr
cp backend/.env-example backend/.env
cp frontend/.env-example frontend/.env
```

**2. Suba os containers**
```bash
docker compose up --build
```

**3. Aplique o schema no banco** (primeira vez)
```bash
docker compose exec backend npx prisma migrate deploy
```

**4. Carregue os dados do TSE**

Baixe manualmente o CSV `perfil_eleitorado_ATUAL.csv` no [portal de dados abertos do TSE](https://dadosabertos.tse.jus.br/) (download manual é intencional, por reprodutibilidade acadêmica), salve como `data/eleitorado.csv` na raiz do projeto e rode:
```bash
docker compose exec backend node etl/load.js
```

**5. Acesse**
- Dashboard: http://localhost:5173
- API: http://localhost:3001/api/resumo · Health: http://localhost:3001/health

**Smoke test da API:**
```bash
curl "http://localhost:3001/api/cruzamentos/genero-faixa?uf=SP"
curl "http://localhost:3001/api/indicadores/municipios?orderBy=iee&direcao=asc&limit=5"
curl "http://localhost:3001/api/exterior"
```

---

## Procedência dos dados

O TSE republica o perfil do eleitorado sempre sob o mesmo nome (`perfil_eleitorado_ATUAL.csv`), de modo que o nome do arquivo não identifica o recorte: o mesmo link devolve números diferentes ao longo do tempo.

Para que os números publicados sejam reproduzíveis, o ETL registra na tabela `Importacao` a identidade do arquivo que originou a carga — nome, tamanho em bytes, data de modificação, SHA-256 do conteúdo, linhas lidas e registros gravados. O dashboard exibe esse recorte no rodapé e a API o expõe em `GET /api/importacao`.

Conferir se um banco corresponde ao arquivo que você tem em mãos:

```bash
sha256sum data/eleitorado.csv
curl -s http://localhost:3001/api/importacao
```

---

## Testes

Testes de integração dos services, no executor nativo do Node 20 — sem dependência adicional. Rodam contra um banco próprio, criado pelas mesmas migrations da aplicação:

```bash
docker compose exec db psql -U postgres -c "CREATE DATABASE eleitobr_test;"
docker compose exec -e DATABASE_URL=postgresql://postgres:postgres@db:5432/eleitobr_test backend npx prisma migrate deploy
docker compose exec -e DATABASE_URL=postgresql://postgres:postgres@db:5432/eleitobr_test backend npm test
```

A massa de teste (`backend/test/seed.js`) é pequena e de números redondos, para que todo valor esperado possa ser conferido à mão — inclusive o IEE e o Hiato, cujos valores aparecem calculados nos comentários do arquivo.

O seed **recusa rodar** se `DATABASE_URL` não apontar para um banco terminado em `_test`, evitando apagar a base de trabalho por engano.

A suíte cobre: exclusão do exterior (ZZ) dos agregados nacionais, composição dos filtros `uf` + `municipioId` + `genero`, cálculo e ordenação de IEE e Hiato (incluindo IEE nulo em município sem jovens e consulta de um município pelo id) e validação de parâmetros na borda.

---

## Funcionalidades do dashboard

- **Filtros dinâmicos globais**: UF (incluindo Exterior/ZZ) + autocomplete de município com debounce; toda a tela reage.
- **Drill-down**: clique em uma barra de estado, em uma linha do ranking ou em uma fatia do donut de gênero para filtrar o dashboard inteiro; clique novamente para desfazer.
- **Seleção na URL**: a visão atual fica na querystring (`?uf=SP&municipioId=5363&genero=F`), usando os mesmos nomes de parâmetro da API. A ordenação do ranking entra junto (`&orderBy=iee&direcao=asc`), de modo que o link reproduz a tela inteira. O link pode ser compartilhado, citado e recarregado, e cada mudança de filtro vira uma entrada no histórico — voltar e avançar funcionam; ordenar apenas refina a visão e não polui o histórico. Parâmetros inválidos ou id inexistente são descartados silenciosamente, caindo na visão nacional.
- **Cruzamentos**: pirâmide etária (gênero × idade), mapa de calor (escolaridade × idade), barras empilhadas (escolaridade × gênero).
- **Indicadores originais**: IEE e Hiato Instrucional por município, com ordenação server-side em ambos os sentidos — clicar na coluna já ativa inverte a ordem, revelando a outra ponta de cada indicador (o eleitorado mais jovem do país, a menor defasagem escolar). Municípios com indicador nulo ficam no fim nas duas direções.
- **Exterior (ZZ)**: painel dedicado com total, gênero e maiores localidades no mundo; botão para analisar o exterior em todos os gráficos.
- **Modo escuro/claro** persistido, com paleta própria para os gráficos.
- **Tooltips explicativos (ⓘ)** em todos os cartões; carregamento assíncrono e independente por gráfico (skeleton + estado de erro).

---

## Logs estruturados

O backend emite logs JSON (um por linha): requisições com método, rota, status e latência (`http_request`) e erros (`unhandled_error`). Nível mínimo via `LOG_LEVEL` (`debug|info|warn|error`, default `info`).

```bash
docker compose logs backend | grep http_request | tail
```
