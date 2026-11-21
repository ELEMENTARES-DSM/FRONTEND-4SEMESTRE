import { expect, test } from "@playwright/test";
import {
  autenticarNoNavegador,
  E2E_CONFIG,
  loginOuCadastrarMunicipe,
  loginViaApi,
} from "../helpers/api";

interface PontoSerie {
  timestamp: string;
  valor: number;
  valida?: boolean;
}

interface SeriesResponse {
  estacaoId: string;
  grandeza: string;
  periodo: string;
  dados: PontoSerie[];
}

interface IqarResponse {
  estacaoId?: string;
  indice?: number | string | null;
  classificacao?: string;
  status?: string;
  rotuloFaixa?: string;
  mensagem?: string;
}

test.describe("US-35 — Validação E2E (Cenários 1 a 5 + Rotas Públicas e Privadas)", () => {
  test("Cenário 1 (Série de 7 dias): EST-001 (SJC), PM2.5 e 7d exibe médias horárias em µg/m³", async ({
    page,
    request,
  }) => {
    const sessao = await loginViaApi(request, E2E_CONFIG.users.gestorSjc);
    await autenticarNoNavegador(page, sessao);

    const respostas500: string[] = [];
    page.on("response", (res) => {
      const url = res.url();
      if (
        res.status() >= 500 &&
        (url.includes("/analise/") || url.includes("/estacoes/"))
      ) {
        respostas500.push(`${res.status()} ${url}`);
      }
    });

    // Validação direta na API protegida para a série de 7 dias
    const apiRes = await request.get(
      `${E2E_CONFIG.apiUrl}/analise/estacoes/${E2E_CONFIG.estacoes.sjcId}/series`,
      {
        headers: { Authorization: `Bearer ${sessao.token}` },
        params: { grandeza: "PM2.5", periodo: "7d" },
      },
    );
    expect(apiRes.status()).toBe(200);
    const serieApi = (await apiRes.json()) as SeriesResponse;
    expect(Array.isArray(serieApi.dados)).toBeTruthy();
    expect(serieApi.dados.length).toBeGreaterThan(0);

    // Validação na interface: selecionar EST-001, PM2.5 e período 7 dias
    const serieUiPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/analise/estacoes/`) &&
        res.url().includes(`/series`) &&
        res.url().includes("periodo=7d") &&
        res.status() === 200,
    );

    await page.goto(
      `/platform/dashboard/${E2E_CONFIG.estacoes.sjcId}?grandeza=PM2.5&periodo=7d`,
    );

    await serieUiPromise;

    await expect(
      page.getByRole("heading", { name: /Série temporal/i }),
    ).toBeVisible();
    await expect(page.getByText(/µg\/m³|ug\/m³/i).first()).toBeVisible();
    await expect(page.locator(".recharts-surface").first()).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(respostas500).toEqual([]);
  });

  test('Cenário 2 (IQAr sem dados suficientes): estação instalada há < 24h exibe "Sem dados suficientes" sem erro 500', async ({
    page,
    request,
  }) => {
    const sessao = await loginViaApi(request, E2E_CONFIG.users.gestorSjc);
    await autenticarNoNavegador(page, sessao);

    const respostas500: string[] = [];
    page.on("response", (res) => {
      const url = res.url();
      if (
        res.status() >= 500 &&
        (url.includes("/analise/") || url.includes("/estacoes/"))
      ) {
        respostas500.push(`${res.status()} ${url}`);
      }
    });

    // Valida API de IQAr da estação recém-instalada (EST-002)
    const iqarRes = await request.get(`${E2E_CONFIG.apiUrl}/analise/iqar`, {
      headers: { Authorization: `Bearer ${sessao.token}` },
      params: { estacaoId: E2E_CONFIG.estacoes.recenteId },
    });
    expect(iqarRes.status()).toBeLessThan(500);
    expect(iqarRes.status()).toBe(200);
    const iqarBody = (await iqarRes.json()) as IqarResponse;
    const textoIqarApi = JSON.stringify(iqarBody);
    expect(textoIqarApi).toMatch(/Sem dados suficientes/i);

    // Valida renderização do cartão de IQAr na interface
    await page.goto(`/platform/dashboard/${E2E_CONFIG.estacoes.recenteId}`);

    const cardIqar = page.getByRole("region", {
      name: /Índice de Qualidade do Ar/i,
    });
    await expect(cardIqar).toBeVisible();
    await expect(cardIqar.getByText("Sem dados suficientes").first()).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(respostas500).toEqual([]);
  });

  test("Cenário 3 (Medida inválida fora do gráfico): umidade com valida = false não é plotada e não afeta o IQAr", async ({
    page,
    request,
  }) => {
    const sessao = await loginViaApi(request, E2E_CONFIG.users.gestorSjc);
    await autenticarNoNavegador(page, sessao);

    // Seed insere umidade 120.00% (valida = false) e PM2.5 9999.00 (valida = false) em EST-001
    const umidadeRes = await request.get(
      `${E2E_CONFIG.apiUrl}/analise/estacoes/${E2E_CONFIG.estacoes.sjcId}/series`,
      {
        headers: { Authorization: `Bearer ${sessao.token}` },
        params: { grandeza: "Umidade Relativa", periodo: "24h" },
      },
    );
    expect(umidadeRes.status()).toBe(200);
    const serieUmidade = (await umidadeRes.json()) as SeriesResponse;
    expect(serieUmidade.dados.length).toBeGreaterThan(0);

    // Nenhum ponto inválido (valida = false ou > 100%) deve estar presente na série
    for (const ponto of serieUmidade.dados) {
      expect(ponto.valida).not.toBe(false);
      expect(Number(ponto.valor)).toBeLessThanOrEqual(100);
      expect(Number(ponto.valor)).toBeGreaterThanOrEqual(0);
    }

    // IQAr não pode ser contaminado pela medida inválida de PM2.5 (9999)
    const iqarRes = await request.get(`${E2E_CONFIG.apiUrl}/analise/iqar`, {
      headers: { Authorization: `Bearer ${sessao.token}` },
      params: { estacaoId: E2E_CONFIG.estacoes.sjcId },
    });
    expect(iqarRes.status()).toBe(200);
    const iqar = (await iqarRes.json()) as IqarResponse;
    if (typeof iqar.indice === "number") {
      expect(iqar.indice).toBeLessThan(200);
    }

    // Interface renderiza gráfico de Umidade sem erros
    await page.goto(
      `/platform/dashboard/${E2E_CONFIG.estacoes.sjcId}?grandeza=${encodeURIComponent("Umidade Relativa")}&periodo=24h`,
    );
    await expect(page.locator(".recharts-surface").first()).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("Cenário 4 (Outro município): gestor autenticado de SP recebe 404 ao consultar série de estação de SJC", async ({
    request,
  }) => {
    const sessaoSp = await loginViaApi(request, E2E_CONFIG.users.gestorSp);

    const response = await request.get(
      `${E2E_CONFIG.apiUrl}/analise/estacoes/${E2E_CONFIG.estacoes.sjcId}/series`,
      {
        headers: { Authorization: `Bearer ${sessaoSp.token}` },
        params: { grandeza: "PM2.5", periodo: "7d" },
      },
    );

    expect(response.status()).toBe(404);
  });

  test("Cenário 5 (Munícipe — perfil de consulta que substituiu Pesquisador): visualiza a Visão Geral sem botões de criar, editar ou inativar", async ({
    page,
    request,
  }) => {
    const sessaoMunicipe = await loginOuCadastrarMunicipe(request);
    await autenticarNoNavegador(page, sessaoMunicipe);

    await page.goto("/platform");

    await expect(
      page.getByRole("heading", { name: "Visão Geral" }),
    ).toBeVisible();
    await expect(page.getByText(E2E_CONFIG.estacoes.sjcCodigo)).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);

    // Munícipe não deve ver controles de mutação
    await expect(
      page.getByRole("button", { name: /Nova Estação/i }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Editar/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Inativar/i })).toHaveCount(
      0,
    );
    await expect(page.getByRole("button", { name: /Ativar/i })).toHaveCount(0);
  });

  test("Validação adicional: rotas públicas (/publico/) respondem 200 sem token e GET /estacoes/status bloqueia com 401", async ({
    request,
  }) => {
    const municipio = encodeURIComponent(E2E_CONFIG.estacoes.municipioSjc);
    const codigo = encodeURIComponent(E2E_CONFIG.estacoes.sjcCodigo);

    // 1. Rotas públicas de estações (sem Bearer token)
    const pubMunicipios = await request.get(
      `${E2E_CONFIG.apiUrl}/estacoes/publico/municipios`,
    );
    expect(pubMunicipios.status()).toBe(200);

    const pubStatus = await request.get(
      `${E2E_CONFIG.apiUrl}/estacoes/publico/${municipio}/status`,
    );
    expect(pubStatus.status()).toBe(200);

    // 2. Rotas públicas de análise (sem Bearer token)
    const pubIqar = await request.get(
      `${E2E_CONFIG.apiUrl}/analise/publico/${municipio}/iqar`,
      { params: { estacaoId: E2E_CONFIG.estacoes.sjcCodigo } },
    );
    expect(pubIqar.status()).toBe(200);

    const pubSeries = await request.get(
      `${E2E_CONFIG.apiUrl}/analise/publico/${municipio}/estacoes/${codigo}/series`,
      { params: { grandeza: "PM2.5", periodo: "7d" } },
    );
    expect(pubSeries.status()).toBe(200);

    const pubUltimas = await request.get(
      `${E2E_CONFIG.apiUrl}/analise/publico/${municipio}/estacoes/${codigo}/ultimas-leituras`,
    );
    expect(pubUltimas.status()).toBe(200);

    // 3. Rota privada original deve continuar exigindo autenticação (401 sem token)
    const privadaSemToken = await request.get(
      `${E2E_CONFIG.apiUrl}/estacoes/status`,
    );
    expect(privadaSemToken.status()).toBe(401);
  });
});
