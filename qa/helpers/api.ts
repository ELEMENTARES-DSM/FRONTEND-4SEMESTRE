import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const E2E_CONFIG = {
  baseUrl: process.env.E2E_BASE_URL || "http://localhost:5173",
  apiUrl: (process.env.E2E_API_URL || "http://localhost:80").replace(/\/$/, ""),
  users: {
    admin: {
      email: process.env.E2E_ADMIN_EMAIL || "admin@exemplo.com",
      senha: process.env.E2E_DEFAULT_PASSWORD || "Admin@123",
    },
    gestorSjc: {
      email: process.env.E2E_GESTOR_SJC_EMAIL || "gestor.sjc@exemplo.com",
      senha: process.env.E2E_DEFAULT_PASSWORD || "Admin@123",
    },
    gestorSp: {
      email: process.env.E2E_GESTOR_SP_EMAIL || "gestor.sp@exemplo.com",
      senha: process.env.E2E_DEFAULT_PASSWORD || "Admin@123",
    },
    municipe: {
      email: process.env.E2E_MUNICIPE_EMAIL || "municipe@exemplo.com",
      senha: process.env.E2E_DEFAULT_PASSWORD || "Admin@123",
    },
  },
  estacoes: {
    sjcId:
      process.env.E2E_ESTACAO_SJC_ID ||
      "11111111-1111-4111-8111-111111111111",
    sjcCodigo: process.env.E2E_ESTACAO_SJC_CODIGO || "EST-001",
    recenteId:
      process.env.E2E_ESTACAO_RECENTE_ID ||
      "22222222-2222-4222-8222-222222222222",
    recenteCodigo: process.env.E2E_ESTACAO_RECENTE_CODIGO || "EST-002",
    municipioSjc: process.env.E2E_MUNICIPIO_SJC || "São José dos Campos",
  },
};

export interface SessaoAutenticada {
  token: string;
  usuario: {
    id: string;
    nome: string;
    email?: string;
    papel: string;
    municipio: string | null;
  };
}

export async function loginViaApi(
  request: APIRequestContext,
  credenciais: { email: string; senha: string },
): Promise<SessaoAutenticada> {
  const response = await request.post(`${E2E_CONFIG.apiUrl}/auth/login`, {
    data: {
      email: credenciais.email,
      senha: credenciais.senha,
    },
  });

  expect(
    response.ok(),
    `Falha ao autenticar ${credenciais.email} em ${E2E_CONFIG.apiUrl}/auth/login (HTTP ${response.status()}). ` +
      `Verifique se o backend está rodando e se o seed scripts/popular-dashboard-estacao.sql foi executado.`,
  ).toBeTruthy();

  const body = (await response.json()) as {
    token?: string;
    accessToken?: string;
    usuario?: SessaoAutenticada["usuario"];
  };

  const token = body.token ?? body.accessToken;
  expect(token, "Token JWT não retornado no login").toBeTruthy();
  expect(body.usuario, "Dados do usuário não retornados no login").toBeTruthy();

  return {
    token: token!,
    usuario: body.usuario!,
  };
}

export async function loginOuCadastrarMunicipe(
  request: APIRequestContext,
): Promise<SessaoAutenticada> {
  const loginPadrao = await request.post(`${E2E_CONFIG.apiUrl}/auth/login`, {
    data: {
      email: E2E_CONFIG.users.municipe.email,
      senha: E2E_CONFIG.users.municipe.senha,
    },
  });

  if (loginPadrao.ok()) {
    const body = (await loginPadrao.json()) as {
      token?: string;
      accessToken?: string;
      usuario?: SessaoAutenticada["usuario"];
    };
    const token = body.token ?? body.accessToken;
    if (token && body.usuario) {
      return { token, usuario: body.usuario };
    }
  }

  // Fallback autossuficiente: cadastra o munícipe de teste uma única vez via /usuarios/cadastro
  const email = E2E_CONFIG.users.municipe.email;
  const senha = E2E_CONFIG.users.municipe.senha;
  const cadastroRes = await request.post(
    `${E2E_CONFIG.apiUrl}/usuarios/cadastro`,
    {
      data: {
        nome: "Munícipe E2E",
        email,
        senha,
        municipio: E2E_CONFIG.estacoes.municipioSjc,
        aceite_privacidade: true,
      },
    },
  );

  expect(
    cadastroRes.status(),
    `Falha ao cadastrar munícipe de teste em ${E2E_CONFIG.apiUrl}/usuarios/cadastro (HTTP ${cadastroRes.status()})`,
  ).toBe(201);

  return loginViaApi(request, { email, senha });
}

export async function autenticarNoNavegador(
  page: Page,
  sessao: SessaoAutenticada,
): Promise<void> {
  await page.addInitScript(
    ({ token, usuario }) => {
      window.localStorage.setItem("token", token);
      window.localStorage.setItem("usuario", JSON.stringify(usuario));
    },
    { token: sessao.token, usuario: sessao.usuario },
  );
}
