import type { Papel, Usuario } from '../services/usuariosService'

// Exemplos visuais do projeto gestao-usuarios, adaptados ao contrato deste frontend.
// Usados apenas no desenvolvimento, nunca enviados à API.
export const mockPapeis: Papel[] = [
  { id: '38e3e7c0-317e-49fd-a7a4-a241f419ebe2', nome: 'ADMINISTRADOR', descricao: 'Gestão global da plataforma.' },
  { id: 'd38c98fa-5b40-4c71-8552-ebf771c81347', nome: 'GESTOR_PUBLICO', descricao: 'Gestão por município.' },
  { id: '2131ecfb-46d0-4dea-8083-d2fa50bcf2a2', nome: 'PESQUISADOR', descricao: 'Consulta a dados ambientais.' },
]

const [admin, gestor, pesquisador] = mockPapeis

export const mockUsuarios: Usuario[] = [
  { id: 'mock-1', nome: 'Ana Beatriz Ferreira', email: 'ana.ferreira@pulsourbano.gov.br', papel_id: admin.id, papel_nome: admin.nome, municipio: null, esta_ativo: true },
  { id: 'mock-2', nome: 'Carlos Eduardo Mendes', email: 'carlos.mendes@saopaulo.sp.gov.br', papel_id: gestor.id, papel_nome: gestor.nome, municipio: 'São Paulo', esta_ativo: true },
  { id: 'mock-3', nome: 'Fernanda Lima Souza', email: 'fernanda.lima@recife.pe.gov.br', papel_id: gestor.id, papel_nome: gestor.nome, municipio: 'Recife', esta_ativo: true },
  { id: 'mock-4', nome: 'Rodrigo Alves Pereira', email: 'rodrigo.alves@ufrj.br', papel_id: pesquisador.id, papel_nome: pesquisador.nome, municipio: 'Rio de Janeiro', esta_ativo: true },
  { id: 'mock-5', nome: 'Juliana Costa Nunes', email: 'juliana.nunes@bh.mg.gov.br', papel_id: gestor.id, papel_nome: gestor.nome, municipio: 'Belo Horizonte', esta_ativo: false },
  { id: 'mock-6', nome: 'Marcelo Santos Barros', email: 'marcelo.barros@ufba.br', papel_id: pesquisador.id, papel_nome: pesquisador.nome, municipio: 'Salvador', esta_ativo: true },
  { id: 'mock-7', nome: 'Patrícia Oliveira Cruz', email: 'patricia.cruz@pulsourbano.gov.br', papel_id: admin.id, papel_nome: admin.nome, municipio: null, esta_ativo: true },
  { id: 'mock-8', nome: 'Thiago Ramos Machado', email: 'thiago.machado@curitiba.pr.gov.br', papel_id: gestor.id, papel_nome: gestor.nome, municipio: 'Curitiba', esta_ativo: true },
  { id: 'mock-9', nome: 'Larissa Gomes Teixeira', email: 'larissa.teixeira@usp.br', papel_id: pesquisador.id, papel_nome: pesquisador.nome, municipio: 'São Paulo', esta_ativo: false },
  { id: 'mock-10', nome: 'Rafael Vieira Cardoso', email: 'rafael.cardoso@fortaleza.ce.gov.br', papel_id: gestor.id, papel_nome: gestor.nome, municipio: 'Fortaleza', esta_ativo: true },
  { id: 'mock-11', nome: 'Camila Martins Rocha', email: 'camila.rocha@ufam.br', papel_id: pesquisador.id, papel_nome: pesquisador.nome, municipio: 'Manaus', esta_ativo: true },
  { id: 'mock-12', nome: 'Bruno Lopes Azevedo', email: 'bruno.azevedo@poa.rs.gov.br', papel_id: gestor.id, papel_nome: gestor.nome, municipio: 'Porto Alegre', esta_ativo: false },
  { id: 'mock-13', nome: 'Vanessa Pinto Moreira', email: 'vanessa.moreira@belem.pa.gov.br', papel_id: gestor.id, papel_nome: gestor.nome, municipio: 'Belém', esta_ativo: true },
  { id: 'mock-14', nome: 'Diego Nascimento Silva', email: 'diego.silva@ufg.br', papel_id: pesquisador.id, papel_nome: pesquisador.nome, municipio: 'Goiânia', esta_ativo: true },
  { id: 'mock-15', nome: 'Aline Freitas Campos', email: 'aline.campos@guarulhos.sp.gov.br', papel_id: gestor.id, papel_nome: gestor.nome, municipio: 'Guarulhos', esta_ativo: true },
  { id: 'mock-16', nome: 'Gustavo Ribeiro Faria', email: 'gustavo.faria@pulsourbano.gov.br', papel_id: admin.id, papel_nome: admin.nome, municipio: null, esta_ativo: false },
  { id: 'mock-17', nome: 'Isabela Torres Cunha', email: 'isabela.cunha@ufc.br', papel_id: pesquisador.id, papel_nome: pesquisador.nome, municipio: 'Fortaleza', esta_ativo: true },
  { id: 'mock-18', nome: 'Henrique Borges Lima', email: 'henrique.lima@campinas.sp.gov.br', papel_id: gestor.id, papel_nome: gestor.nome, municipio: 'Campinas', esta_ativo: true },
  { id: 'mock-19', nome: 'Tatiana Almeida Dias', email: 'tatiana.dias@ufpe.br', papel_id: pesquisador.id, papel_nome: pesquisador.nome, municipio: 'Recife', esta_ativo: false },
  { id: 'mock-20', nome: 'Leandro Carvalho Melo', email: 'leandro.melo@saopaulo.sp.gov.br', papel_id: gestor.id, papel_nome: gestor.nome, municipio: 'São Paulo', esta_ativo: true },
  { id: 'mock-21', nome: 'Renata Correia Baptista', email: 'renata.baptista@ufmg.br', papel_id: pesquisador.id, papel_nome: pesquisador.nome, municipio: 'Belo Horizonte', esta_ativo: true },
  { id: 'mock-22', nome: 'Fábio Moura Santos', email: 'fabio.santos@salvador.ba.gov.br', papel_id: gestor.id, papel_nome: gestor.nome, municipio: 'Salvador', esta_ativo: false },
  { id: 'mock-23', nome: 'Priscila Ferreira Leal', email: 'priscila.leal@ufpr.br', papel_id: pesquisador.id, papel_nome: pesquisador.nome, municipio: 'Curitiba', esta_ativo: true },
  { id: 'mock-24', nome: 'Sérgio Monteiro Paiva', email: 'sergio.paiva@manaus.am.gov.br', papel_id: gestor.id, papel_nome: gestor.nome, municipio: 'Manaus', esta_ativo: true },
  { id: 'mock-25', nome: 'Mônica Barbosa Reis', email: 'monica.reis@pucrs.br', papel_id: pesquisador.id, papel_nome: pesquisador.nome, municipio: 'Porto Alegre', esta_ativo: true },
  { id: 'mock-26', nome: 'Adriano Fontes Queiroz', email: 'adriano.queiroz@belem.pa.gov.br', papel_id: gestor.id, papel_nome: gestor.nome, municipio: 'Belém', esta_ativo: false },
  { id: 'mock-27', nome: 'Cristiane Duarte Vargas', email: 'cristiane.vargas@unesp.br', papel_id: pesquisador.id, papel_nome: pesquisador.nome, municipio: 'Campinas', esta_ativo: true },
  { id: 'mock-28', nome: 'Eduardo Pinto Andrade', email: 'eduardo.andrade@goiania.go.gov.br', papel_id: gestor.id, papel_nome: gestor.nome, municipio: 'Goiânia', esta_ativo: true },
  { id: 'mock-29', nome: 'Luciana Vieira Siqueira', email: 'luciana.siqueira@pulsourbano.gov.br', papel_id: admin.id, papel_nome: admin.nome, municipio: null, esta_ativo: true },
  { id: 'mock-30', nome: 'Tiago Aquino Fontana', email: 'tiago.fontana@ufrgs.br', papel_id: pesquisador.id, papel_nome: pesquisador.nome, municipio: 'Porto Alegre', esta_ativo: false },
]
