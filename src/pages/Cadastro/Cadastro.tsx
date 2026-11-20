import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { devAuthBypass } from '../../auth/session'
import { Button } from '../../shared/components/Button'
import { Card } from '../../shared/components/Card'
import { Input } from '../../shared/components/Field'
import { Icon } from '../../shared/components/Icon'
import { EnvironmentalArtwork } from '../Login/EnvironmentalArtwork'
import { cadastrarMunicipe, CadastroServiceError } from '../../services/cadastroService'
import {
  evaluatePasswordRules,
  validarCadastroMunicipe,
} from '../../utils/cadastroMunicipeValidator'
import '../Login/Login.css'

export function Cadastro() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [aceitePrivacidade, setAceitePrivacidade] = useState(false)

  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const [errosLocais, setErrosLocais] = useState<Record<string, string>>({})
  const [erroGlobal, setErroGlobal] = useState('')

  if (token || devAuthBypass) {
    return <Navigate to="/platform" replace />
  }

  const passwordRules = evaluatePasswordRules(senha)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    setErroGlobal('')

    const dados = {
      nome: nome.trim(),
      email: email.trim(),
      senha,
      municipio: municipio.trim() || undefined,
      aceite_privacidade: aceitePrivacidade,
    }

    const validacao = validarCadastroMunicipe(dados)
    if (!validacao.success) {
      setErrosLocais(validacao.errors)
      return
    }

    setErrosLocais({})
    setBusy(true)

    try {
      await cadastrarMunicipe(dados)
      setSucesso(true)
    } catch (cause) {
      if (cause instanceof CadastroServiceError) {
        if (cause.status === 409) {
          setErrosLocais((prev) => ({
            ...prev,
            email: 'Este e-mail já está cadastrado na plataforma.',
          }))
        } else if (cause.status === 400 && cause.fieldErrors) {
          const mappedErrors: Record<string, string> = {}
          for (const [campo, mensagens] of Object.entries(cause.fieldErrors)) {
            if (mensagens && mensagens.length > 0) {
              mappedErrors[campo] = mensagens[0]
            }
          }
          setErrosLocais(mappedErrors)
        } else if (cause.status === 429) {
          setErroGlobal(cause.message)
        } else {
          setErroGlobal(cause.message || 'Ocorreu um erro ao processar o cadastro.')
        }
      } else {
        setErroGlobal('Não foi possível realizar o cadastro. Tente novamente mais tarde.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="pu-shell">
      <section
        className="pu-story"
        aria-label="Pulso Urbano, monitoramento ambiental"
      >
        <header className="pu-brand">
          <span className="pu-brand-symbol" aria-hidden="true">
            <svg viewBox="0 0 44 44" fill="none">
              <circle
                cx="22"
                cy="22"
                r="18"
                stroke="currentColor"
                strokeOpacity=".58"
              />
              <path
                d="M7 22h8l4-8 6 17 4-9h8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="22" cy="22" r="2" fill="currentColor" />
            </svg>
          </span>

          <span>
            PULSO <strong>URBANO</strong>
          </span>
        </header>

        <div className="pu-story-body">
          <p className="pu-eyebrow">
            <span /> PARTICIPAÇÃO CIDADÃ
          </p>

          <h1>
            Junte-se ao <em>Pulso Urbano.</em>
          </h1>

          <p className="pu-story-description">
            Crie sua conta como munícipe para acompanhar a qualidade ambiental da sua região e dados climáticos abertos.
          </p>

          <EnvironmentalArtwork />
        </div>

        <p className="pu-story-footer">
          TECNOLOGIA PARA DECISÕES MAIS CONSCIENTES
          <span>↗</span>
        </p>
      </section>

      <section className="pu-entry" aria-label="Cadastro de Munícipe">
        <div className="pu-entry-inner">
          <p className="pu-entry-kicker">
            NOVA CONTA <span>／</span> MUNÍCIPE
          </p>

          <h2>
            Cadastre-se<span>.</span>
          </h2>

          <p className="pu-entry-description">
            Preencha seus dados para criar sua conta gratuita e pública na plataforma.
          </p>

          {sucesso ? (
            <Card className="pu-login-card" bodyClassName="pu-login-card-body">
              <div className="flex flex-col items-center py-4 text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-success/20 text-success">
                  <Icon name="check" className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-base-content">
                  Cadastro realizado com sucesso!
                </h3>
                <p className="mt-2 text-sm text-muted">
                  Sua conta de munícipe foi criada. Você já pode acessar a plataforma utilizando seu e-mail e senha.
                </p>
                <Button
                  variant="primary"
                  className="mt-6 w-full"
                  onClick={() => navigate('/login')}
                >
                  Entrar na plataforma
                  <span aria-hidden="true">↗</span>
                </Button>
              </div>
            </Card>
          ) : (
            <Card
              className="pu-login-card"
              bodyClassName="pu-login-card-body"
            >
              <form onSubmit={handleSubmit} className="pu-login-form" noValidate>
                <fieldset disabled={busy} className="contents">
                  <Input
                    label="Nome completo *"
                    type="text"
                    placeholder="Seu nome completo"
                    required
                    maxLength={120}
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    error={submitted ? errosLocais.nome : ''}
                    autoComplete="name"
                  />

                  <Input
                    label="E-mail *"
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    required
                    maxLength={150}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    error={submitted ? errosLocais.email : ''}
                    autoComplete="username"
                  />

                  <div>
                    <Input
                      label="Senha *"
                      type="password"
                      placeholder="Crie uma senha forte"
                      required
                      maxLength={72}
                      value={senha}
                      onChange={(event) => setSenha(event.target.value)}
                      error={submitted ? errosLocais.senha : ''}
                      autoComplete="new-password"
                    />

                    <div className="mt-2.5 rounded-lg border border-line/60 bg-base-300/40 p-3 text-xs">
                      <p className="font-semibold text-muted">Requisitos da senha:</p>
                      <ul className="mt-1.5 space-y-1">
                        {passwordRules.map((rule, idx) => (
                          <li
                            key={idx}
                            className={`flex items-center gap-1.5 ${
                              rule.isValid ? 'text-success' : 'text-muted'
                            }`}
                          >
                            <span className="text-[10px]" aria-hidden="true">
                              {rule.isValid ? '●' : '○'}
                            </span>
                            <span>{rule.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Input
                    label="Município (opcional)"
                    type="text"
                    placeholder="Ex: São José dos Campos"
                    maxLength={100}
                    value={municipio}
                    onChange={(event) => setMunicipio(event.target.value)}
                    error={submitted ? errosLocais.municipio : ''}
                    autoComplete="address-level2"
                  />

                  <div className="min-w-0">
                    <label className="flex cursor-pointer items-start gap-2.5 text-xs text-base-content select-none">
                      <input
                        type="checkbox"
                        checked={aceitePrivacidade}
                        onChange={(e) => setAceitePrivacidade(e.target.checked)}
                        className="checkbox checkbox-primary checkbox-sm mt-0.5 rounded"
                        disabled={busy}
                      />
                      <span className="leading-relaxed">
                        Declaro que li e concordo com o{' '}
                        <strong className="font-semibold">
                          [Texto do aviso de privacidade, pendente de aprovação da Prefeitura]
                        </strong>
                        .
                      </span>
                    </label>
                    {submitted && errosLocais.aceite_privacidade && (
                      <p className="mt-1 text-[11px] text-error" role="alert">
                        {errosLocais.aceite_privacidade}
                      </p>
                    )}
                  </div>

                  {erroGlobal && (
                    <div
                      role="alert"
                      className="rounded-lg border border-error/40 bg-error/10 p-3 text-xs text-error"
                    >
                      {erroGlobal}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    busy={busy}
                    className="pu-login-submit"
                  >
                    {busy ? 'Cadastrando...' : 'Criar minha conta'}
                    <span aria-hidden="true">↗</span>
                  </Button>
                </fieldset>
              </form>
            </Card>
          )}

          <div className="mt-6 text-center text-xs text-muted">
            <span>Já tem uma conta? </span>
            <Link
              to="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Já tenho conta, entrar
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
