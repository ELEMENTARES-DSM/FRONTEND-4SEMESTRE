# QA — Testes E2E (US-35)

Suíte automatizada em Playwright para validar ponta a ponta os cenários 1 a 5 da **US-35**, além do acesso anônimo às rotas públicas (`/estacoes/publico/...` e `/analise/publico/...`) e a proteção da rota privada `GET /estacoes/status`.

## Pré-requisitos

1. **Backend e banco rodando** (via `docker compose up` no `BACKEND-4SEMESTRE`, acessível em `http://localhost:80`).
2. **Banco populado com o seed da US-35** (`BACKEND-4SEMESTRE/scripts/popular-dashboard-estacao.sql`):
   ```bash
   docker cp scripts/popular-dashboard-estacao.sql backend-4semestre-postgres-1:/tmp/popular.sql
   docker exec backend-4semestre-postgres-1 psql -U postgres -d pulso -f /tmp/popular.sql
   ```
3. **Frontend rodando** (`npm run dev` na raiz de `FRONTEND-4SEMESTRE`, acessível em `http://localhost:5173`).

## Instalação

```bash
cd qa
npm install
npx playwright install chromium
cp .env.example .env
```

## Execução

```bash
cd qa
npm run test:e2e
```

Para acompanhar no navegador ou abrir o relatório HTML:

```bash
npm run test:e2e:headed
npm run test:e2e:report
```

## Cenários cobertos em `tests/us35.e2e.spec.ts`

1. **Cenário 1 (Série de 7 dias):** seleciona `EST-001` (SJC), `PM2.5` e período `7d`, validando resposta `200 OK` e exibição do gráfico de médias horárias em `µg/m³`.
2. **Cenário 2 (IQAr sem dados suficientes):** acessa `EST-002` (instalada há < 24h) e valida o texto `"Sem dados suficientes"` no cartão de IQAr sem erros `500` ou alertas.
3. **Cenário 3 (Medida inválida fora do gráfico):** valida que leituras com `valida = false` (umidade `120%` e PM2.5 `9999`) não entram na série nem contaminam o cálculo do IQAr.
4. **Cenário 4 (Outro município):** autentica como `GESTOR_PUBLICO` de São Paulo e confirma retorno `404 Not Found` ao requisitar a série de `EST-001` (SJC).
5. **Cenário 5 (Munícipe — perfil de consulta que substituiu Pesquisador):** autentica como `MUNICIPE` e confirma que a Visão Geral (`/platform`) é exibida sem botões de criar, editar, ativar ou inativar.
6. **Rotas públicas vs. privada:** confirma `200 OK` sem token em `/estacoes/publico/...` e `/analise/publico/...`, e `401 Unauthorized` sem token em `GET /estacoes/status`.
