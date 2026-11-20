import { useEffect, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useAuthorization } from '../../auth/useAuthorization'
import {
  AGREGACOES,
  atualizarGrandeza,
  criarGrandeza,
  excluirGrandeza,
  listarGrandezas,
  type Agregacao,
  type Grandeza,
} from '../../services/tiposSensorService'
import { Button } from '../../shared/components/Button'
import { Input, Select } from '../../shared/components/Field'
import { Modal } from '../../shared/components/Modal'
import { Table, type TableColumn } from '../../shared/components/Table'

type Dialogo =
  | { tipo: 'novo' }
  | { tipo: 'editar'; grandeza: Grandeza }
  | { tipo: 'excluir'; grandeza: Grandeza }
  | null

const LIMITE_FAIXA = 9999999999.99

const nomeDaAgregacao = (valor: Agregacao) =>
  AGREGACOES.find((item) => item.value === valor)?.label ?? valor

// O backend responde { message } nos erros tratados (400, 409 e 403).
function mensagemDaApi(error: unknown, padrao: string) {
  const message = isAxiosError(error) ? error.response?.data?.message : undefined
  return typeof message === 'string' ? message : padrao
}

// NUMERIC(12,2): com mais de 2 casas o banco arredondaria em silêncio.
const temNoMaximoDuasCasas = (valor: number) =>
  Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-6

interface Valores {
  nome: string
  unidade: string
  faixaMin: string
  faixaMax: string
  agregacao: Agregacao
}

function valoresIniciais(grandeza?: Grandeza): Valores {
  return {
    nome: grandeza?.nome ?? '',
    unidade: grandeza?.unidade ?? '',
    faixaMin: grandeza ? String(Number(grandeza.faixa_min)) : '',
    faixaMax: grandeza ? String(Number(grandeza.faixa_max)) : '',
    agregacao: grandeza?.agregacao ?? 'media',
  }
}

// Confere o que a API também confere, para o erro aparecer antes do envio.
function validar(valores: Valores, criando: boolean): string | null {
  if (criando && !valores.nome.trim()) return 'Informe o nome da grandeza.'
  if (criando && valores.nome.trim().length > 100) return 'Use até 100 caracteres no nome.'
  if (!valores.unidade.trim()) return 'Informe a unidade de medida.'
  if (valores.unidade.trim().length > 20) return 'Use até 20 caracteres na unidade.'

  const min = Number(valores.faixaMin)
  const max = Number(valores.faixaMax)
  if (valores.faixaMin.trim() === '' || !Number.isFinite(min)) return 'Informe a faixa mínima.'
  if (valores.faixaMax.trim() === '' || !Number.isFinite(max)) return 'Informe a faixa máxima.'
  if (Math.abs(min) > LIMITE_FAIXA || Math.abs(max) > LIMITE_FAIXA) {
    return 'As faixas devem estar entre −9999999999,99 e 9999999999,99.'
  }
  if (!temNoMaximoDuasCasas(min) || !temNoMaximoDuasCasas(max)) {
    return 'Use no máximo 2 casas decimais nas faixas.'
  }
  if (min >= max) return 'A faixa mínima precisa ser menor que a máxima.'
  return null
}

export function Grandezas() {
  const { hasPermission } = useAuthorization()
  const podeGerenciar = hasPermission('grandezas.manage')

  const [grandezas, setGrandezas] = useState<Grandeza[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState(false)
  // Cada "Tentar de novo" soma 1 e dispara a busca de novo.
  const [tentativa, setTentativa] = useState(0)

  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const [valores, setValores] = useState<Valores>(valoresIniciais())
  const [erroForm, setErroForm] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erroExclusao, setErroExclusao] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    listarGrandezas()
      .then((lista) => {
        if (!ativo) return
        setGrandezas(lista)
        setErroCarga(false)
      })
      .catch(() => {
        if (ativo) setErroCarga(true)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [tentativa])

  function tentarDeNovo() {
    setCarregando(true)
    setTentativa((atual) => atual + 1)
  }

  function abrirNovo() {
    setValores(valoresIniciais())
    setErroForm(null)
    setDialogo({ tipo: 'novo' })
  }

  function abrirEdicao(grandeza: Grandeza) {
    setValores(valoresIniciais(grandeza))
    setErroForm(null)
    setDialogo({ tipo: 'editar', grandeza })
  }

  function fechar() {
    if (salvando) return
    setDialogo(null)
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (salvando || !dialogo || (dialogo.tipo !== 'novo' && dialogo.tipo !== 'editar')) return

    const criando = dialogo.tipo === 'novo'
    const erro = validar(valores, criando)
    if (erro) {
      setErroForm(erro)
      return
    }

    setErroForm(null)
    setSalvando(true)
    try {
      const faixa = { faixa_min: Number(valores.faixaMin), faixa_max: Number(valores.faixaMax) }
      if (criando) {
        await criarGrandeza({
          nome: valores.nome.trim(),
          unidade: valores.unidade.trim(),
          agregacao: valores.agregacao,
          ...faixa,
        })
      } else {
        await atualizarGrandeza(dialogo.grandeza.id, {
          unidade: valores.unidade.trim(),
          agregacao: valores.agregacao,
          ...faixa,
        })
      }
      setDialogo(null)
      setTentativa((atual) => atual + 1)
    } catch (error) {
      setErroForm(
        mensagemDaApi(error, 'Não foi possível salvar a grandeza. Confira os dados e tente novamente.'),
      )
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarExclusao() {
    if (salvando || !dialogo || dialogo.tipo !== 'excluir') return
    setErroExclusao(null)
    setSalvando(true)
    try {
      await excluirGrandeza(dialogo.grandeza.id)
      setDialogo(null)
      setTentativa((atual) => atual + 1)
    } catch (error) {
      setErroExclusao(
        mensagemDaApi(error, 'Não foi possível excluir a grandeza. Tente novamente.'),
      )
    } finally {
      setSalvando(false)
    }
  }

  const colunas: TableColumn<Grandeza>[] = [
    { key: 'nome', header: 'Nome', render: (g) => g.nome },
    { key: 'unidade', header: 'Unidade', render: (g) => g.unidade },
    { key: 'faixa_min', header: 'Faixa mínima', render: (g) => Number(g.faixa_min).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
    { key: 'faixa_max', header: 'Faixa máxima', render: (g) => Number(g.faixa_max).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
    { key: 'agregacao', header: 'Agregação', render: (g) => nomeDaAgregacao(g.agregacao) },
    ...(podeGerenciar
      ? [
          {
            key: 'acoes',
            header: 'Ações',
            align: 'right' as const,
            render: (g: Grandeza) => (
              <div className="flex justify-end gap-2">
                <Button onClick={() => abrirEdicao(g)} aria-label={`Editar ${g.nome}`}>Editar</Button>
                <Button variant="danger" onClick={() => { setErroExclusao(null); setDialogo({ tipo: 'excluir', grandeza: g }) }} aria-label={`Excluir ${g.nome}`}>Excluir</Button>
              </div>
            ),
          },
        ]
      : []),
  ]

  const criando = dialogo?.tipo === 'novo'

  return (
    <main className="min-h-screen bg-[#0B1120] p-6 text-base-content">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Grandezas</h1>
            <p className="text-sm text-muted">
              Tipos de medida que os sensores podem usar. Uma grandeza nova pode ser cadastrada antes de a estação ser instalada.
            </p>
          </div>
          {podeGerenciar && (
            <Button variant="primary" onClick={abrirNovo}>+ Nova grandeza</Button>
          )}
        </div>

        {erroCarga && (
          <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-error/40 bg-error/10 p-3.5 text-[13px] text-error">
            <span>Não foi possível carregar as grandezas. Verifique a conexão e tente novamente.</span>
            <Button onClick={tentarDeNovo} disabled={carregando}>Tentar de novo</Button>
          </div>
        )}

        <Table
          aria-label="Grandezas cadastradas"
          aria-busy={carregando}
          columns={colunas}
          data={grandezas}
          keyExtractor={(g) => g.id}
        />

        {dialogo && (dialogo.tipo === 'novo' || dialogo.tipo === 'editar') && (
          <Modal
            title={criando ? 'Nova grandeza' : `Editar ${dialogo.grandeza.nome}`}
            description={criando
              ? 'Defina a grandeza antes de cadastrar os sensores que a usam.'
              : 'Mudar a faixa ou a agregação vale só para as leituras que chegarem depois.'}
            onClose={fechar}
            busy={salvando}
          >
            <form onSubmit={salvar} className="space-y-4">
              {erroForm && (
                <div role="alert" className="rounded-lg border border-error/40 bg-error/10 p-3.5 text-[13px] text-error">{erroForm}</div>
              )}
              <Input
                label="Nome"
                placeholder="Radiação Solar"
                maxLength={100}
                value={valores.nome}
                disabled={!criando}
                onChange={(e) => setValores({ ...valores, nome: e.target.value })}
              />
              {!criando && <p className="-mt-2 text-xs text-muted">O nome não pode ser alterado.</p>}
              <Input
                label="Unidade de medida"
                placeholder="W/m²"
                maxLength={20}
                value={valores.unidade}
                onChange={(e) => setValores({ ...valores, unidade: e.target.value })}
              />
              <p className="-mt-2 text-xs text-muted">
                Se a grandeza já tiver sensor, a unidade não pode ser trocada: a API recusa e a mensagem aparece aqui.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Faixa mínima"
                  type="number"
                  step="0.01"
                  value={valores.faixaMin}
                  onChange={(e) => setValores({ ...valores, faixaMin: e.target.value })}
                />
                <Input
                  label="Faixa máxima"
                  type="number"
                  step="0.01"
                  value={valores.faixaMax}
                  onChange={(e) => setValores({ ...valores, faixaMax: e.target.value })}
                />
              </div>
              <Select
                label="Agregação"
                value={valores.agregacao}
                onChange={(e) => setValores({ ...valores, agregacao: e.target.value as Agregacao })}
              >
                {AGREGACOES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </Select>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button onClick={fechar} disabled={salvando}>Cancelar</Button>
                <Button type="submit" variant="primary" busy={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</Button>
              </div>
            </form>
          </Modal>
        )}

        {dialogo?.tipo === 'excluir' && (
          <Modal
            title={`Excluir ${dialogo.grandeza.nome}?`}
            description="Só é possível excluir uma grandeza que nenhum sensor usa."
            onClose={fechar}
            busy={salvando}
            compact
          >
            <div className="space-y-4">
              {erroExclusao && (
                <div role="alert" className="rounded-lg border border-error/40 bg-error/10 p-3.5 text-[13px] text-error">{erroExclusao}</div>
              )}
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button onClick={fechar} disabled={salvando}>Cancelar</Button>
                <Button variant="danger" onClick={confirmarExclusao} busy={salvando}>
                  {salvando ? 'Excluindo…' : 'Excluir'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </main>
  )
}
