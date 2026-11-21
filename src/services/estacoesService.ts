import api from "../api/instance";
import { getIqar, type IqarResponse } from "./analise/analise.service";

const SEM_DADOS_SUFICIENTES = "sem dados suficientes";

export interface EstacaoStatus {
  id: string;
  codigo: string;
  nome: string;
  municipio?: string;
  status_operacional: "Ativa" | "Com Falha" | "Inativa";
  ultimo_ping: string | null;
  minutos_sem_sinal: number | null;
  iqar?: number | null;
  iqar_classificacao?: string | null;
  iqar_cor?: string | null;
  iqar_sem_dados?: boolean;
}

export interface ResumoEstacoes {
  total: number;
  ativas: number;
  com_falha: number;
  inativas: number;
}

interface StatusEstacoesResponse {
  resumo: ResumoEstacoes;
  estacoes: (Omit<EstacaoStatus, "minutos_sem_sinal"> & {
    iqar_atual?: number | null;
  })[];
}

export interface VisaoGeralData {
  resumo: ResumoEstacoes;
  estacoes: EstacaoStatus[];
}

interface EstacaoMunicipioResponse {
  id: string;
  municipio?: string | null;
}

export interface VisaoGeralOptions {
  incluirMunicipio?: boolean;
  incluirIqar?: boolean;
}

type CamposIqar = Pick<
  EstacaoStatus,
  "iqar" | "iqar_classificacao" | "iqar_cor" | "iqar_sem_dados"
>;

function semDadosSuficientes(valor?: string | number): boolean {
  return typeof valor === "string" && valor.trim().toLowerCase() === SEM_DADOS_SUFICIENTES;
}

function converterIqar(resposta: IqarResponse): CamposIqar {
  const semDados =
    semDadosSuficientes(resposta.indice) ||
    semDadosSuficientes(resposta.status) ||
    semDadosSuficientes(resposta.rotuloFaixa);

  if (semDados) {
    return { iqar: null, iqar_sem_dados: true };
  }

  if (typeof resposta.indice !== "number" || !Number.isFinite(resposta.indice)) {
    return {};
  }

  return {
    iqar: resposta.indice,
    iqar_classificacao:
      resposta.rotuloFaixa?.trim() || resposta.classificacao?.trim() || null,
    iqar_cor: resposta.cor ?? null,
  };
}

export async function getVisaoGeralEstacoes(
  options?: VisaoGeralOptions,
): Promise<VisaoGeralData> {
  const response = await api.get<StatusEstacoesResponse>("/estacoes/status");
  const agora = Date.now();

  let estacoes = response.data.estacoes.map((estacao) => {
    const ultimoPing = estacao.ultimo_ping ? Date.parse(estacao.ultimo_ping) : NaN;
    return {
      ...estacao,
      iqar: estacao.iqar ?? estacao.iqar_atual ?? null,
      minutos_sem_sinal: Number.isFinite(ultimoPing)
        ? Math.max(0, Math.floor((agora - ultimoPing) / 60000))
        : null,
    };
  });

  const precisaMunicipio =
    options?.incluirMunicipio &&
    estacoes.some((estacao) => !estacao.municipio?.trim());

  if (precisaMunicipio) {
    try {
      const estacoesResponse =
        await api.get<EstacaoMunicipioResponse[]>("/estacoes");

      if (Array.isArray(estacoesResponse.data)) {
        const municipiosPorId = new Map<string, string>();
        for (const item of estacoesResponse.data) {
          const municipio = item.municipio?.trim();
          if (item.id && municipio) {
            municipiosPorId.set(item.id, municipio);
          }
        }

        if (municipiosPorId.size > 0) {
          estacoes = estacoes.map((estacao) => ({
            ...estacao,
            municipio:
              estacao.municipio?.trim() ||
              municipiosPorId.get(estacao.id) ||
              estacao.municipio,
          }));
        }
      }
    } catch {
      // Fallback opcional: mantém a Visão Geral funcionando mesmo se /estacoes falhar.
    }
  }

  if (options?.incluirIqar) {
    const resultados = await Promise.allSettled(
      estacoes.map((estacao) =>
        estacao.status_operacional === "Inativa"
          ? Promise.resolve<CamposIqar>({})
          : getIqar(estacao.id).then(converterIqar),
      ),
    );

    estacoes = estacoes.map((estacao, indice) => {
      const resultado = resultados[indice];
      return resultado.status === "fulfilled"
        ? { ...estacao, ...resultado.value }
        : estacao;
    });
  }

  return {
    resumo: response.data.resumo,
    estacoes,
  };
}

export async function getEstacoesStatus(): Promise<EstacaoStatus[]> {
  const { estacoes } = await getVisaoGeralEstacoes();
  return estacoes;
}