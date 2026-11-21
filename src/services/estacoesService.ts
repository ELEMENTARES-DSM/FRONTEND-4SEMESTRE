import api from "../api/instance";

export interface EstacaoStatus {
  id: string;
  codigo: string;
  nome: string;
  municipio?: string;
  status_operacional: "Ativa" | "Com Falha" | "Inativa";
  ultimo_ping: string | null;
  minutos_sem_sinal: number | null;
  iqar?: number | null;
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

  return {
    resumo: response.data.resumo,
    estacoes,
  };
}

export async function getEstacoesStatus(): Promise<EstacaoStatus[]> {
  const { estacoes } = await getVisaoGeralEstacoes();
  return estacoes;
}