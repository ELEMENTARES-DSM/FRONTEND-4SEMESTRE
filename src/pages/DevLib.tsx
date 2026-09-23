import { useState } from 'react'
import { Button } from '../shared/components/Button'
import { Card } from '../shared/components/Card'
import { Input, Select } from '../shared/components/Field'
import { Filter } from '../shared/components/Filter'
import { Icon } from '../shared/components/Icon'
import { Modal } from '../shared/components/Modal'
import { Pagination } from '../shared/components/Pagination'
import { SearchInput } from '../shared/components/SearchInput'
import { Table, type TableColumn } from '../shared/components/Table'
import { Toast, type Notificacao } from '../shared/components/Toast'
import { Toggle } from '../shared/components/Toggle'

interface EstacaoMock {
  id: string
  nome: string
  localizacao: string
  temperatura: number
  status: 'Operacional' | 'Alerta' | 'Manutenção'
}

export default function DevLib() {
  // Estados para interatividade dos componentes
  const [toggleActive, setToggleActive] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [notification, setNotification] = useState<Notificacao | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [inputValue, setInputValue] = useState('Texto de exemplo')
  const [selectValue, setSelectValue] = useState('opcao1')
  const [radioFilter, setRadioFilter] = useState('React')
  const [checkboxFilter, setCheckboxFilter] = useState<string[]>(['Temperatura', 'Umidade'])
  const [pillFilter, setPillFilter] = useState('Todos')
  const [searchValue, setSearchValue] = useState('')
  const [lastSearched, setLastSearched] = useState('')
  const [tableLoading, setTableLoading] = useState(false)
  const [tableZebra, setTableZebra] = useState(false)

  const sampleEstacoes: EstacaoMock[] = [
    { id: 'EST-01', nome: 'Estação Central', localizacao: 'São Paulo - SP', temperatura: 24.5, status: 'Operacional' },
    { id: 'EST-02', nome: 'Estação Norte', localizacao: 'Campinas - SP', temperatura: 29.1, status: 'Alerta' },
    { id: 'EST-03', nome: 'Estação Sul', localizacao: 'Santos - SP', temperatura: 22.0, status: 'Operacional' },
    { id: 'EST-04', nome: 'Estação Serra', localizacao: 'Campos do Jordão - SP', temperatura: 15.3, status: 'Manutenção' },
  ]

  const estacoesColumns: TableColumn<EstacaoMock>[] = [
    {
      key: 'id',
      header: 'Código',
      width: '110px',
      sortable: true,
      render: (item) => <span className="font-mono text-primary font-bold">{item.id}</span>,
    },
    {
      key: 'nome',
      header: 'Estação',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-semibold text-base-content">{item.nome}</div>
          <div className="text-xs text-muted">{item.localizacao}</div>
        </div>
      ),
    },
    {
      key: 'temperatura',
      header: 'Temperatura',
      align: 'right',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium">{item.temperatura.toFixed(1)} °C</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortable: true,
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            item.status === 'Operacional'
              ? 'bg-success/15 text-success border border-success/30'
              : item.status === 'Alerta'
                ? 'bg-warning/15 text-warning border border-warning/30'
                : 'bg-error/15 text-error border border-error/30'
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              item.status === 'Operacional'
                ? 'bg-success'
                : item.status === 'Alerta'
                  ? 'bg-warning'
                  : 'bg-error'
            }`}
          />
          {item.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: () => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" className="h-7 px-2.5 text-xs">
            Ver
          </Button>
          <Button variant="outline" className="h-7 px-2.5 text-xs">
            Editar
          </Button>
        </div>
      ),
    },
  ]

  const availableIcons = [
    'search',
    'close',
    'left',
    'right',
    'plus',
    'filter',
    'check',
    'alert',
    'refresh',
    'trash',
    'box',
  ] as const

  return (
    <div className="min-h-screen bg-base-100 p-6 sm:p-10 text-base-content">
      {/* Toast Notification */}
      <Toast notification={notification} onClose={() => setNotification(null)} />

      {/* Modal Dialog */}
      {isModalOpen && (
        <Modal
          title="Modal de Teste"
          description="Este é um exemplo do componente Modal com backdrop e animação."
          onClose={() => setIsModalOpen(false)}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Você pode inserir qualquer conteúdo aqui dentro.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                Confirmar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Sheet (Mobile / Bottom Sheet) */}
      {isSheetOpen && (
        <Modal
          title="Bottom Sheet"
          description="Exemplo de modal configurado como sheet."
          sheet
          onClose={() => setIsSheetOpen(false)}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted">Exibição no formato Sheet / Gaveta.</p>
            <Button variant="primary" className="w-full" onClick={() => setIsSheetOpen(false)}>
              Fechar Sheet
            </Button>
          </div>
        </Modal>
      )}

      {/* Header */}
      <header className="mb-8 border-b border-line pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
          Vitrine de Componentes (<code className="text-primary font-mono text-xl">shared/components</code>)
        </h1>
        <p className="mt-1 text-sm text-muted">
          Página de teste rápido com todos os componentes da pasta compartilhada e tema escuro.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* 1. Button */}
        <section className="rounded-xl border border-line bg-base-200 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-base-content border-b border-line pb-2 flex items-center gap-2">
            <Icon name="box" className="text-primary" />
            1. Button (<code className="text-xs text-primary font-mono">Button.tsx</code>)
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" busy>
              Carregando
            </Button>
            <Button variant="secondary" disabled>
              Desabilitado
            </Button>
          </div>
        </section>

        {/* 2. Toggle */}
        <section className="rounded-xl border border-line bg-base-200 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-base-content border-b border-line pb-2 flex items-center gap-2">
            <Icon name="refresh" className="text-primary" />
            2. Toggle (<code className="text-xs text-primary font-mono">Toggle.tsx</code>)
          </h2>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Toggle
                label="Interruptor de status"
                checked={toggleActive}
                busy={false}
                onChange={() => setToggleActive((prev) => !prev)}
              />
              <span className="text-sm font-medium">
                Estado: {toggleActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Toggle
                label="Toggle em carregamento"
                checked={true}
                busy={true}
                onChange={() => {}}
              />
              <span className="text-sm text-muted">Carregando (busy)</span>
            </div>
          </div>
        </section>

        {/* 3. Field (Input & Select) */}
        <section className="rounded-xl border border-line bg-base-200 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-base-content border-b border-line pb-2 flex items-center gap-2">
            <Icon name="filter" className="text-primary" />
            3. Field (<code className="text-xs text-primary font-mono">Field.tsx</code>)
          </h2>
          <div className="space-y-4">
            <Input
              label="Input Padrão"
              placeholder="Digite alguma informação..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />

            <Input
              label="Input com Erro"
              placeholder="Campo com validação..."
              defaultValue="Valor inválido"
              error="Este campo é obrigatório ou está inválido."
            />

            <Select
              label="Select Padrão"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
            >
              <option value="opcao1">Opção 1 - Estação Norte</option>
              <option value="opcao2">Opção 2 - Estação Sul</option>
              <option value="opcao3">Opção 3 - Estação Central</option>
            </Select>
          </div>
        </section>

        {/* 4. Icon */}
        <section className="rounded-xl border border-line bg-base-200 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-base-content border-b border-line pb-2 flex items-center gap-2">
            <Icon name="check" className="text-primary" />
            4. Icon (<code className="text-xs text-primary font-mono">Icon.tsx</code>)
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {availableIcons.map((iconName) => (
              <div
                key={iconName}
                className="flex items-center gap-2 rounded-lg border border-line/60 bg-base-300 p-2.5 hover:border-line"
              >
                <Icon name={iconName} size={18} className="text-primary" />
                <span className="font-mono text-xs text-muted truncate">{iconName}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Modal Trigger */}
        <section className="rounded-xl border border-line bg-base-200 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-base-content border-b border-line pb-2 flex items-center gap-2">
            <Icon name="plus" className="text-primary" />
            5. Modal (<code className="text-xs text-primary font-mono">Modal.tsx</code>)
          </h2>
          <p className="text-sm text-muted mb-4">
            Clique para abrir os diálogos renderizados via Portal:
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Abrir Modal Central
            </Button>
            <Button variant="outline" onClick={() => setIsSheetOpen(true)}>
              Abrir Bottom Sheet
            </Button>
          </div>
        </section>

        {/* 6. Toast Trigger */}
        <section className="rounded-xl border border-line bg-base-200 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-base-content border-b border-line pb-2 flex items-center gap-2">
            <Icon name="alert" className="text-primary" />
            6. Toast (<code className="text-xs text-primary font-mono">Toast.tsx</code>)
          </h2>
          <p className="text-sm text-muted mb-4">
            Dispare mensagens temporárias de feedback (fecham após 4s):
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() =>
                setNotification({
                  id: Date.now(),
                  type: 'success',
                  message: 'Operação realizada com sucesso!',
                })
              }
            >
              Disparar Toast Sucesso
            </Button>

            <Button
              variant="danger"
              onClick={() =>
                setNotification({
                  id: Date.now(),
                  type: 'error',
                  message: 'Ocorreu um erro ao processar a requisição.',
                })
              }
            >
              Disparar Toast Erro
            </Button>
          </div>
        </section>
      </div>

      {/* 7. Pagination */}
      <Card
        className="mt-8"
        icon={<Icon name="left" className="text-primary" />}
        title={
          <>
            7. Pagination (<code className="text-xs text-primary font-mono">Pagination.tsx</code>)
          </>
        }
      >
        <p className="text-sm text-muted mb-3">
          Componente de paginação com controle de página e itens por página:
        </p>
        <Pagination
          page={currentPage}
          pageSize={pageSize}
          total={85}
          onPage={(p) => setCurrentPage(p)}
          onPageSize={(s) => {
            setPageSize(s)
            setCurrentPage(1)
          }}
        />
      </Card>

      {/* 8. Card */}
      <Card
        className="mt-8"
        icon={<Icon name="box" className="text-primary" />}
        title={
          <>
            8. Card (<code className="text-xs text-primary font-mono">Card.tsx</code>)
          </>
        }
        actions={
          <span className="text-xs text-muted font-mono bg-base-300 px-2 py-1 rounded">
            Componente reutilizável
          </span>
        }
      >
        <p className="text-sm text-muted mb-4">
          Card padronizado baseado no DaisyUI (<code className="text-xs text-primary font-mono">card</code>, <code className="text-xs text-primary font-mono">card-body</code>, <code className="text-xs text-primary font-mono">card-title</code>, <code className="text-xs text-primary font-mono">card-actions</code>) para uso em diferentes páginas:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Card Simples">
            <p className="text-sm text-muted">Exemplo usando props diretas: title e children.</p>
          </Card>
          <Card
            icon={<Icon name="check" className="text-success" />}
            title="Card com Ações"
            actions={<Button variant="outline">Ação</Button>}
          >
            <p className="text-sm text-muted">Exemplo com ícone, título e botão de ação à direita.</p>
          </Card>
          <Card noBody>
            <Card.Body>
              <Card.Title>
                <Icon name="box" className="text-primary" />
                DaisyUI Composto
              </Card.Title>
              <p className="text-sm text-muted">Exemplo com subcomponentes DaisyUI (Card.Body, Card.Title e Card.Actions).</p>
              <Card.Actions className="justify-end pt-2">
                <Button variant="primary">Confirmar</Button>
              </Card.Actions>
            </Card.Body>
          </Card>
        </div>
      </Card>

      {/* 9. Filter */}
      <Card
        className="mt-8"
        icon={<Icon name="filter" className="text-primary" />}
        title={
          <>
            9. Filter (<code className="text-xs text-primary font-mono">Filter.tsx</code>)
          </>
        }
        actions={
          <span className="text-xs text-muted font-mono bg-base-300 px-2 py-1 rounded">
            DaisyUI Filter
          </span>
        }
      >
        <p className="text-sm text-muted mb-4">
          Componente de filtros dinâmicos reutilizável em N telas, com suporte a seleção única (radio), múltipla (checkbox), colapso animado DaisyUI e modo de botões visíveis (pills):
        </p>

        <div className="space-y-6">
          {/* Exemplo 1: Radio Filter nativo DaisyUI com botão de reset */}
          <div className="rounded-lg border border-line/60 bg-base-300/40 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-base-content uppercase tracking-wider">
                1. Seleção Única com Colapso Animado (DaisyUI Nativo)
              </span>
              <span className="text-xs text-muted">
                Selecionado: <strong className="text-primary font-mono">{radioFilter || 'Nenhum'}</strong>
              </span>
            </div>
            <p className="text-xs text-muted">
              Ao selecionar uma opção, as outras se recolhem e o botão <code className="text-primary font-mono">×</code> aparece para restaurar a lista:
            </p>
            <Filter
              options={['Svelte', 'Vue', 'React', 'Angular']}
              value={radioFilter}
              onChange={setRadioFilter}
            />
          </div>

          {/* Exemplo 2: Checkbox Filter (Multi-seleção com contadores) */}
          <div className="rounded-lg border border-line/60 bg-base-300/40 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-base-content uppercase tracking-wider">
                2. Multi-Seleção (Checkboxes com contadores)
              </span>
              <span className="text-xs text-muted">
                Selecionados:{' '}
                <strong className="text-primary font-mono">
                  {checkboxFilter.length > 0 ? checkboxFilter.join(', ') : 'Nenhum'}
                </strong>
              </span>
            </div>
            <p className="text-xs text-muted">
              Múltiplos filtros ativos simultaneamente; o botão de limpar surge automaticamente ao selecionar itens:
            </p>
            <Filter
              type="checkbox"
              options={[
                { label: 'Temperatura', value: 'Temperatura', count: 12 },
                { label: 'Umidade', value: 'Umidade', count: 8 },
                { label: 'Pressão', value: 'Pressão', count: 5 },
                { label: 'Vento', value: 'Vento', count: 3 },
              ]}
              value={checkboxFilter}
              onChange={setCheckboxFilter}
            />
          </div>

          {/* Exemplo 3: Pills sem colapso (Padrão para tabelas/painéis) */}
          <div className="rounded-lg border border-line/60 bg-base-300/40 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-base-content uppercase tracking-wider">
                3. Filtro em Segmentos / Pills (Todas as opções visíveis)
              </span>
              <span className="text-xs text-muted">
                Status ativo: <strong className="text-primary font-mono">{pillFilter}</strong>
              </span>
            </div>
            <p className="text-xs text-muted">
              Ideal para barras de ferramentas em tabelas de estações, usuários e logs:
            </p>
            <Filter
              collapse={false}
              label="Status:"
              icon={<Icon name="filter" size={14} className="text-primary" />}
              options={[
                { label: 'Todos', value: 'Todos' },
                { label: 'Ativos', value: 'Ativos', count: 14 },
                { label: 'Inativos', value: 'Inativos', count: 2 },
                { label: 'Alerta', value: 'Alerta', count: 1 },
              ]}
              value={pillFilter}
              onChange={setPillFilter}
              showReset={false}
            />
          </div>
        </div>
      </Card>

      {/* 10. SearchInput */}
      <Card
        className="mt-8"
        icon={<Icon name="search" className="text-primary" />}
        title={
          <>
            10. SearchInput (<code className="text-xs text-primary font-mono">SearchInput.tsx</code>)
          </>
        }
        actions={
          <span className="text-xs text-muted font-mono bg-base-300 px-2 py-1 rounded">
            DaisyUI Input + Icon
          </span>
        }
      >
        <p className="text-sm text-muted mb-4">
          Campo de pesquisa customizado com o ícone <code className="text-primary font-mono">search</code> de <code className="text-xs text-primary font-mono">Icon.tsx</code>, botão de limpar automático (<code className="text-primary font-mono">close</code>), suporte a carregamento e atalhos:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Exemplo 1: Busca Interativa */}
          <div className="rounded-lg border border-line/60 bg-base-300/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-base-content uppercase tracking-wider">
                1. Busca Interativa
              </span>
              {lastSearched && (
                <span className="text-xs text-primary font-mono">
                  Enter: "{lastSearched}"
                </span>
              )}
            </div>
            <SearchInput
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={(val) => setLastSearched(val)}
              placeholder="Digite o nome da estação ou sensor..."
            />
            <p className="text-xs text-muted">
              Pressione <kbd className="kbd kbd-xs bg-base-200">Enter</kbd> para submeter ou clique no botão <code className="text-primary font-mono">×</code> para limpar.
            </p>
          </div>

          {/* Exemplo 2: Estado Loading */}
          <div className="rounded-lg border border-line/60 bg-base-300/40 p-4 space-y-3">
            <span className="text-xs font-semibold text-base-content uppercase tracking-wider block">
              2. Estado de Carregamento (Loading)
            </span>
            <SearchInput
              defaultValue="Consultando dados em tempo real..."
              loading
              placeholder="Pesquisando..."
            />
            <p className="text-xs text-muted">
              Substitui o ícone de lupa por spinner de carregamento durante requisições assíncronas.
            </p>
          </div>

          {/* Exemplo 3: Tamanho Compacto */}
          <div className="rounded-lg border border-line/60 bg-base-300/40 p-4 space-y-3">
            <span className="text-xs font-semibold text-base-content uppercase tracking-wider block">
              3. Tamanho Compacto (size="sm")
            </span>
            <SearchInput
              size="sm"
              placeholder="Filtrar dados da tabela..."
            />
            <p className="text-xs text-muted">
              Altura reduzida para encaixe em cabeçalhos de tabela ou barras de ferramentas compactas.
            </p>
          </div>

          {/* Exemplo 4: Com Label e Validação de Erro */}
          <div className="rounded-lg border border-line/60 bg-base-300/40 p-4 space-y-3">
            <span className="text-xs font-semibold text-base-content uppercase tracking-wider block">
              4. Com Label e Validação de Erro
            </span>
            <SearchInput
              label="Buscar por ID ou Código"
              defaultValue="EST-999"
              error="Nenhuma estação encontrada com este identificador."
            />
          </div>
        </div>
      </Card>

      {/* 11. Table */}
      <Card
        className="mt-8"
        icon={<Icon name="box" className="text-primary" />}
        title={
          <>
            11. Table (<code className="text-xs text-primary font-mono">Table.tsx</code>)
          </>
        }
        actions={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
              <span>Zebra:</span>
              <Toggle
                label="Alternar modo zebra"
                checked={tableZebra}
                busy={false}
                onChange={() => setTableZebra((z) => !z)}
              />
            </label>
            <Button
              variant={tableLoading ? 'primary' : 'outline'}
              className="h-7 px-2.5 text-xs"
              onClick={() => setTableLoading((l) => !l)}
            >
              {tableLoading ? 'Parar Loading' : 'Simular Loading'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted mb-4">
          Tabela customizada para listagem de dados com ordenação nas colunas, estilos DaisyUI (<code className="text-xs text-primary font-mono">table</code>, <code className="text-xs text-primary font-mono">table-zebra</code>), cores da identidade visual (<code className="text-xs text-primary font-mono">table-head</code>, <code className="text-xs text-primary font-mono">row-hover</code>) e estados de carregamento / vazio:
        </p>

        <Table
          columns={estacoesColumns}
          data={sampleEstacoes}
          loading={tableLoading}
          zebra={tableZebra}
          keyExtractor={(item) => item.id}
        />
      </Card>
    </div>
  )
}
