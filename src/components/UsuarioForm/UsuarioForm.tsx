import { useState } from 'react'
import type { FormEvent } from 'react'
import type { NovoUsuario, Papel, Usuario } from '../../services/usuariosService'
import { Button } from '../../shared/components/Button'
import { Input, Select } from '../../shared/components/Field'
import { Modal } from '../../shared/components/Modal'

interface UsuarioFormProps {
  usuario?: Usuario
  papeis: Papel[]
  busy: boolean
  error: string
  onClose: () => void
  onSave: (dados: NovoUsuario) => void
}

// Regras espelham a validação do backend (zod + GESTOR_PUBLICO exige município).
export function UsuarioForm({ usuario, papeis, busy, error, onClose, onSave }: UsuarioFormProps) {
  const [nome, setNome] = useState(usuario?.nome ?? '')
  const [email, setEmail] = useState(usuario?.email ?? '')
  const [senha, setSenha] = useState('')
  const [papelId, setPapelId] = useState(usuario?.papel_id ?? '')
  const [municipio, setMunicipio] = useState(usuario?.municipio ?? '')
  const [enviado, setEnviado] = useState(false)

  const exigeMunicipio = papeis.find((papel) => papel.id === papelId)?.nome === 'GESTOR_PUBLICO'
  const erros = {
    nome: nome.trim().length < 2 ? 'Informe o nome (mínimo de 2 caracteres).' : '',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? '' : 'Informe um e-mail válido.',
    senha: !usuario && (senha.length < 8 || senha.length > 72) ? 'A senha deve ter entre 8 e 72 caracteres.' : '',
    papel: papelId ? '' : 'Selecione um papel.',
    municipio: exigeMunicipio && !municipio.trim() ? 'Município é obrigatório para GESTOR_PUBLICO.' : '',
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEnviado(true)
    if (Object.values(erros).some(Boolean)) return
    onSave({
      nome: nome.trim(),
      email: email.trim(),
      senha,
      papel_id: papelId,
      // O backend não aceita null: município vazio é omitido.
      municipio: municipio.trim() || undefined,
    })
  }

  return (
    <Modal
      title={usuario ? 'Editar usuário' : 'Novo usuário'}
      description={usuario ? usuario.email : 'Preencha os dados para conceder acesso à plataforma.'}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit} noValidate>
        <fieldset disabled={busy} className="grid min-w-0 gap-3.5">
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)}
            error={enviado ? erros.nome : ''} maxLength={120} autoComplete="name" />
          <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            error={enviado ? erros.email : ''} maxLength={150} autoComplete="email" />
          {!usuario && (
            <Input label="Senha inicial" type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
              error={enviado ? erros.senha : ''} autoComplete="new-password" />
          )}
          <Select label="Papel" value={papelId} onChange={(e) => setPapelId(e.target.value)}
            error={enviado ? erros.papel : ''}>
            <option value="" disabled>Selecione um papel…</option>
            {papeis.map((papel) => (
              <option key={papel.id} value={papel.id} title={papel.descricao}>{papel.nome}</option>
            ))}
          </Select>
          <Input label={exigeMunicipio ? 'Município *' : 'Município'} value={municipio}
            onChange={(e) => setMunicipio(e.target.value)} error={enviado ? erros.municipio : ''} maxLength={100} />
        </fieldset>
        {error && <p role="alert" className="mt-3 text-[13px] text-error">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button type="submit" variant="primary" busy={busy}>
            {usuario ? 'Salvar alterações' : 'Cadastrar usuário'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
