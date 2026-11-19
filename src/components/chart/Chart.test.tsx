
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Chart from './Chart'
import { formatarData } from './chart.utils'
import type { ChartSeries } from './Chart'

describe('Chart', () => {
  const series: ChartSeries[] = [
    {
      label: 'Material particulado PM2.5',
      dados: [
        {
          timestamp: '2026-11-16T12:00:00.000Z',
          valor: 15.5,
        },
        {
          timestamp: '2026-11-16T13:00:00.000Z',
          valor: 18.2,
        },
        {
          timestamp: '2026-11-16T14:00:00.000Z',
          valor: 12.8,
        },
      ],
    },
  ]

  it('deve renderizar o gráfico com dados', () => {
    render(
      <Chart
        series={series}
        unidade="µg/m³"
        titulo="Qualidade do ar"
      />,
    )

    expect(
      screen.getByRole('region', {
        name: 'Qualidade do ar',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Qualidade do ar'),
    ).toBeInTheDocument()
  })

  it('deve exibir mensagem quando não houver dados', () => {
    render(
      <Chart
        series={[]}
        unidade="µg/m³"
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Não há dados disponíveis para exibir.',
    )
  })

  it('deve exibir mensagem quando as séries não tiverem pontos', () => {
    render(
      <Chart
        series={[
          {
            label: 'PM2.5',
            dados: [],
          },
        ]}
        unidade="µg/m³"
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Não há dados disponíveis para exibir.',
    )
  })

  describe('formatação de datas no fuso de Brasília', () => {
    it('deve converter o horário UTC para o horário de Brasília', () => {
      const resultado = formatarData(
        '2026-11-16T15:00:00.000Z',
      )

      expect(resultado).toBe('16/11, 12:00')
    })

    it('deve formatar somente o horário quando solicitado', () => {
      const resultado = formatarData(
        '2026-11-16T15:00:00.000Z',
        false,
      )

      expect(resultado).toBe('12:00')
    })
  })
})
