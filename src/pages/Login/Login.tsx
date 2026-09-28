import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { devAuthBypass } from '../../auth/session'
import { Button } from '../../shared/components/Button'
import { Card } from '../../shared/components/Card'
import { Input } from '../../shared/components/Field'
import { EnvironmentalArtwork } from './EnvironmentalArtwork'
import './Login.css'

export function Login() {
  const { token, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const journeyRef = useRef<HTMLElement>(null)
  const requested = (location.state as { from?: unknown } | null)?.from
  const from = typeof requested === 'string' &&
    (requested === '/platform' || requested.startsWith('/platform/'))
    ? requested : '/platform'

  useEffect(() => {
    const section = journeyRef.current
    if (!section) return
    let frame = 0
    const update = () => {
      frame = 0
      const bounds = section.getBoundingClientRect()
      const distance = Math.max(1, bounds.height - window.innerHeight * .35)
      const progress = Math.min(1, Math.max(0, (window.innerHeight * .72 - bounds.top) / distance))
      section.style.setProperty('--pu-trace', progress.toFixed(3))
    }
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  if (token || devAuthBypass) return <Navigate to={from} replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email.trim(), senha)
      navigate(from, { replace: true })
    } catch (cause) {
      if (axios.isAxiosError(cause)) {
        setError(cause.response?.status === 401
          ? 'Email ou senha incorretos.'
          : cause.response?.status === 403
            ? 'Esta conta não está ativa.'
            : cause.response
              ? 'Não foi possível entrar. Tente novamente.'
              : 'Não foi possível conectar à API. Verifique se o backend está ativo.')
      } else {
        setError('Não foi possível iniciar a sessão. Tente novamente.')
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
            <span /> IOT APLICADO
          </p>

          <h1>
            Dados do clima para <em>decisões urbanas.</em>
          </h1>

          <p className="pu-story-description">
            Acompanhe as medições das estações meteorológicas em dashboards e relatórios.
          </p>

          <EnvironmentalArtwork />
        </div>

        <p className="pu-story-footer">
          TECNOLOGIA PARA DECISÕES MAIS CONSCIENTES
          <span>↗</span>
        </p>
      </section>

      <section className="pu-entry" aria-label="Acesso à plataforma">
        <div className="pu-entry-inner">
          <p className="pu-entry-kicker">
            ACESSO AO PORTAL <span>／</span> 02
          </p>

          <h2>
            Bem-vindo de volta<span>.</span>
          </h2>

          <p className="pu-entry-description">
            Entre com sua conta para acompanhar o ambiente da sua cidade.
          </p>

          <Card
            className="pu-login-card"
            bodyClassName="pu-login-card-body"
          >
            <form onSubmit={handleSubmit} className="pu-login-form">
              <Input
                label="Email"
                type="email"
                autoComplete="username"
                placeholder="seu.email@exemplo.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={busy}
              />

              <Input
                label="Senha"
                type="password"
                autoComplete="current-password"
                placeholder="Digite sua senha"
                required
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                disabled={busy}
              />

              {error && (
                <p role="alert" className="text-sm text-error">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                busy={busy}
                className="pu-login-submit"
              >
                {busy ? 'Entrando...' : 'Acessar plataforma'}
                <span aria-hidden="true">↗</span>
              </Button>
            </form>
          </Card>

          <p className="pu-entry-footnote">
            Acesso reservado a usuários autorizados.
          </p>
        </div>
      </section>
    </main>
  )
}