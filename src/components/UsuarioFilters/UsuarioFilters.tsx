import { useState } from 'react'
import { Button } from '../../shared/components/Button'
import { Icon } from '../../shared/components/Icon'
import { Modal } from '../../shared/components/Modal'
import { SearchInput } from '../../shared/components/SearchInput'
import { Select } from '../../shared/components/Field'
import type { Papel } from '../../services/usuariosService'

export interface FiltrosUsuarios {
  busca: string
  papel: string
  municipio: string
  status: '' | 'ativo' | 'inativo'
}

interface Props {
  filtros: FiltrosUsuarios
  papeis: Papel[]
  municipios: string[]
  onChange: (filtros: FiltrosUsuarios) => void
  onClear: () => void
}

export function UsuarioFilters({ filtros, papeis, municipios, onChange, onClear }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const update = (campo: keyof FiltrosUsuarios, valor: string) => onChange({ ...filtros, [campo]: valor })
  const ativos = (Object.keys(filtros) as (keyof FiltrosUsuarios)[]).filter((key) => filtros[key])

  const campos = (prefixo: string) => (
    <>
      <div className="min-w-0">
        <SearchInput aria-label="Buscar por nome ou e-mail" placeholder="Buscar por nome ou e-mail…"
          value={filtros.busca} onChange={(e) => update('busca', e.target.value)} onClear={() => update('busca', '')} />
      </div>
      <Select id={`${prefixo}-papel`} aria-label="Perfil" value={filtros.papel} onChange={(e) => update('papel', e.target.value)}>
        <option value="">Todos os perfis</option>
        {papeis.map((papel) => <option key={papel.id} value={papel.nome}>{papel.nome.replaceAll('_', ' ')}</option>)}
      </Select>
      <Select id={`${prefixo}-municipio`} aria-label="Município" value={filtros.municipio} onChange={(e) => update('municipio', e.target.value)}>
        <option value="">Todos os municípios</option>
        {municipios.map((municipio) => <option key={municipio} value={municipio}>{municipio}</option>)}
        <option value="__nenhum">Não se aplica</option>
      </Select>
      <Select id={`${prefixo}-status`} aria-label="Status" value={filtros.status} onChange={(e) => update('status', e.target.value)}>
        <option value="">Todos os status</option>
        <option value="ativo">Ativo</option>
        <option value="inativo">Inativo</option>
      </Select>
    </>
  )

  return (
    <section aria-label="Filtros de usuários" className="sticky top-0 z-20 mb-4 rounded-[10px] border border-line bg-base-200 p-3.5 shadow-[0_8px_24px_#0003] sm:p-4">
      <div className="hidden grid-cols-2 gap-2.5 sm:grid lg:grid-cols-[2fr_1fr_1fr_1fr]">{campos('desktop')}</div>
      <button type="button" onClick={() => setMobileOpen(true)} className="flex w-full items-center justify-between rounded-lg border border-line bg-base-300 px-3.5 py-2.5 text-sm sm:hidden">
        <span className="flex items-center gap-2"><Icon name="filter" /> Filtros
          {ativos.length > 0 && <span className="rounded-full bg-primary px-2 text-xs font-semibold text-primary-content">{ativos.length}</span>}
        </span>
        <Icon name="right" />
      </button>
      {ativos.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {ativos.map((key) => (
            <span key={key} className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary">
              <span className="max-w-48 truncate">{key === 'busca' ? `“${filtros[key]}”` : key === 'papel' ? filtros[key].replaceAll('_', ' ') : key === 'municipio' && filtros[key] === '__nenhum' ? 'Sem município' : key === 'status' ? filtros[key] === 'ativo' ? 'Ativo' : 'Inativo' : filtros[key]}</span>
              <button type="button" aria-label={`Remover filtro ${key}`} onClick={() => update(key, '')}><Icon name="close" size={12} /></button>
            </span>
          ))}
          <button type="button" className="px-1 text-xs text-muted underline hover:text-base-content" onClick={onClear}>Limpar filtros</button>
        </div>
      )}
      {mobileOpen && (
        <Modal title="Filtros" sheet onClose={() => setMobileOpen(false)}>
          <div className="mt-4 grid gap-2.5">{campos('mobile')}</div>
          <div className="mt-5 flex gap-2.5">
            {ativos.length > 0 && <Button className="flex-1" onClick={() => { onClear(); setMobileOpen(false) }}>Limpar filtros</Button>}
            <Button variant="outline" className="flex-1" onClick={() => setMobileOpen(false)}>Aplicar</Button>
          </div>
        </Modal>
      )}
    </section>
  )
}
