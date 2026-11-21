import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Header } from './Header'

vi.mock('../../../components/alarms/IndicadorAlarmes', () => ({
  IndicadorAlarmes: () => <div data-testid="indicador-alarmes" />,
}))

function renderHeader(rota: string) {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <Header />
    </MemoryRouter>,
  )
}

describe('Header', () => {
  it('não mostra o seletor de período', () => {
    renderHeader('/platform')

    expect(screen.queryByText(/01\/05/)).not.toBeInTheDocument()
  })

  it('não mostra o seletor de regiões', () => {
    renderHeader('/platform')

    expect(screen.queryByText(/Todas as regiões/)).not.toBeInTheDocument()
  })

  it('continua mostrando o título da página atual', () => {
    renderHeader('/platform/alarmes')

    expect(screen.getByText('Pulso Urbano')).toBeInTheDocument()
    expect(screen.getByText('Alarmes')).toBeInTheDocument()
  })

  it('continua mostrando o indicador de alarmes', () => {
    renderHeader('/platform')

    expect(screen.getByTestId('indicador-alarmes')).toBeInTheDocument()
  })
})
