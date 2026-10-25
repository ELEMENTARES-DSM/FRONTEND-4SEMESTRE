import { isAxiosError } from 'axios'

export type TipoErroAlarmes = 'sem-conexao' | 'sem-permissao' | 'nao-encontrado' | 'servidor'

export const MENSAGENS_ERRO_ALARMES: Record<TipoErroAlarmes, string> = {
  'sem-conexao': 'Sem conexão com o servidor. Verifique a rede e tente de novo.',
  'sem-permissao': 'Seu perfil não tem permissão para ver os alarmes.',
  'nao-encontrado': 'Alarme não encontrado.',
  servidor: 'O servidor não conseguiu responder. Tente de novo em instantes.',
}

/** Classifica a falha para a tela mostrar a mensagem certa (US-24). */
export function classificarErroAlarmes(erro: unknown): TipoErroAlarmes {
  if (isAxiosError(erro)) {
    if (!erro.response) return 'sem-conexao'
    if (erro.response.status === 403) return 'sem-permissao'
    if (erro.response.status === 404) return 'nao-encontrado'
  }
  return 'servidor'
}
