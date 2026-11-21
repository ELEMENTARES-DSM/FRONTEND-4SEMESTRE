
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer as createHttpServer } from 'node:http'
import type { AddressInfo, Server } from 'node:net'
import {
  createServer as createViteServer,
  mergeConfig,
} from 'vite'
import type { ViteDevServer } from 'vite'
import viteConfig from '../../vite.config'

describe('Integração dos proxies de análise e relatórios', () => {
  let servidorGateway: Server | undefined
  let servidorVite: ViteDevServer | undefined

  let urlGateway = ''
  let urlVite = ''

  const caminhosRecebidos: string[] = []

  beforeAll(async () => {
    // Gateway HTTP simulado para receber as requisições encaminhadas.
    servidorGateway = createHttpServer((req, res) => {
      caminhosRecebidos.push(req.url ?? '')

      res.writeHead(200, {
        'Content-Type': 'application/json',
      })

      res.end(
        JSON.stringify({
          caminho: req.url,
          mensagem: 'Requisição recebida pelo gateway simulado.',
        }),
      )
    })

    await new Promise<void>((resolve, reject) => {
      servidorGateway?.once('error', reject)
      servidorGateway?.listen(0, '127.0.0.1', resolve)
    })

    const enderecoGateway = servidorGateway.address() as AddressInfo

    urlGateway = `http://127.0.0.1:${enderecoGateway.port}`

    // Confere os destinos definidos na configuração original.
    const proxyOriginal = viteConfig.server?.proxy

    expect(proxyOriginal).toBeDefined()

    if (!proxyOriginal || Array.isArray(proxyOriginal)) {
      throw new Error('Configuração de proxy do Vite não encontrada.')
    }

    expect(proxyOriginal['/analise']).toBe('http://localhost:80')
    expect(proxyOriginal['/relatorios']).toBe('http://localhost:80')

    // Mantém os proxies originais e troca apenas os destinos
    // para o gateway simulado durante o teste.
    const proxyParaTeste = {
      ...proxyOriginal,
      '/analise': {
        target: urlGateway,
        changeOrigin: true,
      },
      '/relatorios': {
        target: urlGateway,
        changeOrigin: true,
      },
    }

    const configuracaoTeste = mergeConfig(viteConfig, {
      configFile: false,
      server: {
        host: '127.0.0.1',
        port: 0,
        strictPort: false,
        proxy: proxyParaTeste,
      },
    })

    servidorVite = await createViteServer(configuracaoTeste)

    await servidorVite.listen()

    const enderecoVite = servidorVite.httpServer?.address()

    if (!enderecoVite || typeof enderecoVite === 'string') {
      throw new Error('Não foi possível identificar a porta do Vite.')
    }

    urlVite = `http://127.0.0.1:${enderecoVite.port}`
  })

  afterAll(async () => {
    await servidorVite?.close()

    if (servidorGateway?.listening) {
      await new Promise<void>((resolve, reject) => {
        servidorGateway?.close((erro) => {
          if (erro) {
            reject(erro)
            return
          }

          resolve()
        })
      })
    }
  })

  it.each([
    '/analise/estacoes/estacao-1/series?grandeza=PM25&periodo=24h',
    '/relatorios/estacoes/estacao-1',
  ])('deve encaminhar a requisição %s ao gateway', async (caminho) => {
    const resposta = await fetch(`${urlVite}${caminho}`)

    expect(resposta.status).toBe(200)

    const dados = await resposta.json()

    expect(dados).toEqual({
      caminho,
      mensagem: 'Requisição recebida pelo gateway simulado.',
    })

    expect(caminhosRecebidos).toContain(caminho)
  })
})
