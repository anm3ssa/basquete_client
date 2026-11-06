/**
 * MOCK DA API — para usar o front sem back-end.
 *
 * Liga/desliga em USAR_MOCK_API (abaixo). Com o mock ligado:
 * - Login: atleta@basquete.com ou treinador@basquete.com, com qualquer senha de 6+ caracteres
 *   (qualquer e-mail que comece com "treinador" entra como treinador; os demais, como atleta).
 * - Cadastro: cria a conta com o perfil escolhido (atleta ou treinador) e já entra.
 * - Com SEM_BACKEND = true (core/services/auth.ts), login e cadastro nem chegam aqui:
 *   ficam no navegador, e o mock responde só os dados das telas.
 * - Os dados (eventos, atletas, presenças, box scores) ficam salvos no localStorage do navegador.
 *   Para recomeçar do zero: localStorage.removeItem('basquete-assis.mock') no console.
 *
 * Quando o back-end existir: USAR_MOCK_API = false (ou apague esta pasta e a linha do app.config.ts).
 */
import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { delay, from, Observable, of, switchMap, throwError } from 'rxjs';
import { paraIsoDataHora } from '../../shared/datas';
import { pontosDosLances } from '../../shared/registro';
import { environment } from '../../../environments/environment';
import {
  Atleta,
  AuthResponse,
  ContaUsuario,
  Convocacao,
  EstatisticaAtleta,
  Evento,
  Jogo,
  JwtPayload,
  Posicao,
  Presenca,
  RegistroLances,
  Role,
  StatusPresenca,
  Time,
  Treinador,
} from '../../shared/models';
import { API_URL, USUARIOS_LOCAIS_KEY, UsuarioLocal } from '../services/auth';

export const USAR_MOCK_API = environment.useMock;

const CHAVE = 'basquete-assis.mock';
const ATRASO_MS = 250;
const ATLETA_LOGADO = 'a7';

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------

interface Banco {
  atletas: Atleta[];
  eventos: Evento[];
  presencas: Record<string, Presenca[]>;
  boxScores: Record<string, EstatisticaAtleta[]>;
  /** Registro lance a lance (opcional: bancos salvos antes desta versão não têm) */
  registros?: Record<string, RegistroLances>;
  seq: number;
}

const TREINADORES: Treinador[] = [
  { id: 't1', nome: 'Marina Costa', cargo: 'Treinadora principal', email: 'marina.costa@basqueteassis.com', telefone: '18997651234' },
  { id: 't2', nome: 'Paulo Henrique Souza', cargo: 'Assistente técnico', email: 'paulo.souza@basqueteassis.com', telefone: '1833224455' },
];

const ADVERSARIOS = ['Tigres de Marília', 'Ourinhos Basquete', 'Presidente Prudente', 'Bauru Jovem', 'Lins BC', 'Tupã Basketball'];

function emDias(dias: number, hora: number, minuto = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(hora, minuto, 0, 0);
  return d;
}

/** Número pseudoaleatório estável (mesma semente, mesmo valor) */
function aleatorio(semente: number): number {
  const x = Math.sin(semente) * 10000;
  return x - Math.floor(x);
}

function bancoInicial(): Banco {
  const elenco: [string, number, Posicao][] = [
    ['Rafael Moreira', 4, 'ARMADOR'], ['Bruno Tavares', 5, 'ALA_ARMADOR'], ['Lucas Andrade', 7, 'ALA'],
    ['Diego Santos', 8, 'ALA_PIVO'], ['Thiago Lima', 9, 'PIVO'], ['Mateus Ferreira', 10, 'ARMADOR'],
    ['Gabriel Rocha', 11, 'ALA'], ['Felipe Araújo', 12, 'ALA_PIVO'], ['João Pedro Silva', 13, 'PIVO'],
    ['Caio Nunes', 14, 'ALA_ARMADOR'], ['Vinícius Prado', 15, 'ALA'], ['Henrique Dias', 21, 'PIVO'],
  ];
  const atletas: Atleta[] = elenco.map(([nome, numero, posicao], i) => ({
    id: 'a' + numero,
    nome,
    numero,
    posicao,
    ativo: i !== elenco.length - 1,
    cpf: '00000000000',
    dataNascimento: `${2000 + (i % 9)}-0${(i % 9) + 1}-1${i % 9}`,
    email: nome.split(' ')[0].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '') + '@email.com',
    telefone: '1899876' + String(5400 + i * 37),
    fotoUrl: null,
  }));

  const eventos: Evento[] = [];
  let seq = 1;
  for (let d = -40; d <= 45; d++) {
    const diaSemana = emDias(d, 0).getDay();
    if (diaSemana === 2 || diaSemana === 4) {
      eventos.push({
        id: 'e' + seq++,
        tipo: 'TREINO',
        inicio: paraIsoDataHora(emDias(d, 19, 30)),
        fim: paraIsoDataHora(emDias(d, 21, 30)),
        local: 'Ginásio Municipal de Assis',
        foco: diaSemana === 2 ? 'Arremesso e jogadas ensaiadas' : ' Defesa individual e transição',
        anotacoes: diaSemana === 4 ? 'Trazer tênis de quadra e garrafa de água.' : undefined,
      });
    }
    if (diaSemana === 6) {
      const emCasa = d % 3 === 0;
      eventos.push({
        id: 'e' + seq++,
        tipo: 'JOGO',
        inicio: paraIsoDataHora(emDias(d, 15)),
        fim: paraIsoDataHora(emDias(d, 17)),
        local: emCasa ? 'Ginásio Municipal de Assis' : 'Ginásio do adversário',
        adversario: ADVERSARIOS[Math.abs(d) % ADVERSARIOS.length],
        mandante: emCasa,
        anotacoes: 'Concentração 1h antes. Uniforme laranja.',
      });
    }
  }

  const ativos = atletas.filter((a) => a.ativo);
  const presencas: Record<string, Presenca[]> = {};
  const boxScores: Record<string, EstatisticaAtleta[]> = {};
  for (const e of eventos) {
    const n = Number(e.id.slice(1));
    presencas[e.id] = ativos.map((a, i) => {
      const status: StatusPresenca = (i + n) % 5 === 0 ? 'AUSENTE' : (i + n) % 4 === 0 ? 'PENDENTE' : 'CONFIRMADO';
      return {
        atletaId: a.id,
        atletaNome: a.nome,
        numero: a.numero,
        status: a.id === ATLETA_LOGADO && new Date(e.inicio) > new Date() ? 'PENDENTE' : status,
        justificativa: status === 'AUSENTE' ? 'Trabalho no mesmo horário' : undefined,
      };
    });
    if (e.tipo === 'JOGO' && new Date(e.inicio) < new Date()) {
      boxScores[e.id] = ativos.slice(0, 10).map((a, i) => linhaDeJogo(a, e, n * 100 + i));
    }
  }

  return { atletas, eventos, presencas, boxScores, seq };
}

function linhaDeJogo(a: Atleta, jogo: Jogo, semente: number): EstatisticaAtleta {
  const r = (k: number, max: number) => Math.floor(aleatorio(semente * 31 + k) * (max + 1));
  const garrafao = a.posicao === 'PIVO' || a.posicao === 'ALA_PIVO';
  const ftT = r(1, 6);
  const doisT = r(2, 12) + 2;
  const tresT = garrafao ? r(3, 2) : r(3, 8);
  return {
    atletaId: a.id,
    atletaNome: a.nome,
    numero: a.numero,
    jogoId: jogo.id,
    data: jogo.inicio,
    adversario: jogo.adversario,
    minutos: 10 + r(4, 22),
    assistencias: garrafao ? r(5, 3) : r(5, 8),
    rebotes: garrafao ? 3 + r(6, 9) : r(6, 5),
    tocos: garrafao ? r(7, 4) : r(7, 1),
    roubos: r(8, 3),
    lanceLivreTentados: ftT,
    lanceLivreConvertidos: Math.round(ftT * (0.55 + aleatorio(semente + 9) * 0.35)),
    doisPontosTentados: doisT,
    doisPontosConvertidos: Math.round(doisT * (0.35 + aleatorio(semente + 10) * 0.3)),
    tresPontosTentados: tresT,
    tresPontosConvertidos: Math.round(tresT * (0.2 + aleatorio(semente + 11) * 0.3)),
  };
}

function linhaZerada(a: Atleta, jogo: Jogo): EstatisticaAtleta {
  return {
    atletaId: a.id,
    atletaNome: a.nome,
    numero: a.numero,
    jogoId: jogo.id,
    data: jogo.inicio,
    adversario: jogo.adversario,
    minutos: 0,
    assistencias: 0,
    rebotes: 0,
    tocos: 0,
    roubos: 0,
    lanceLivreTentados: 0,
    lanceLivreConvertidos: 0,
    doisPontosTentados: 0,
    doisPontosConvertidos: 0,
    tresPontosTentados: 0,
    tresPontosConvertidos: 0,
  };
}

function carregar(): Banco {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo) return JSON.parse(salvo) as Banco;
  } catch {
    /* sem localStorage: segue com dados novos */
  }
  return bancoInicial();
}

const banco = carregar();

function salvar(): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(banco));
  } catch {
    /* só em memória */
  }
}

// ---------------------------------------------------------------------------
// Tokens falsos (sem assinatura: o front só lê o payload)
// ---------------------------------------------------------------------------

function base64url(obj: object): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  return btoa(String.fromCharCode(...bytes)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function sessao(role: Role, nome?: string, email?: string): AuthResponse {
  const atleta = role === 'ROLE_ATLETA';
  const payload: JwtPayload = {
    sub: atleta ? ATLETA_LOGADO : 't1',
    nome: nome ?? (atleta ? 'Lucas Andrade' : 'Marina Costa'),
    email: email ?? (atleta ? 'atleta@basquete.com' : 'treinador@basquete.com'),
    roles: [role],
    exp: Math.floor(Date.now() / 1000) + 8 * 3600,
  };
  return {
    accessToken: `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url(payload)}.mock`,
    refreshToken: `mock-refresh.${role}`,
  };
}

function perfilDaRequisicao(req: HttpRequest<unknown>): Role {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1] ?? '';
    const json = atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'));
    return (JSON.parse(json) as JwtPayload).roles[0];
  } catch {
    return 'ROLE_ATLETA';
  }
}

// ---------------------------------------------------------------------------
// Respostas
// ---------------------------------------------------------------------------

// Sempre devolve uma cópia: a tela nunca compartilha objetos com o "banco" do mock
const ok = <T>(body: T): Observable<HttpResponse<T>> =>
  of(new HttpResponse({ status: 200, body: structuredClone(body) })).pipe(delay(ATRASO_MS));
const erro = (status: number, url: string) =>
  throwError(() => new HttpErrorResponse({ status, url })).pipe(delay(ATRASO_MS));

function comPresenca(e: Evento, role: Role): Evento {
  const lista = banco.presencas[e.id] ?? [];
  if (role === 'ROLE_ATLETA') {
    return { ...e, minhaPresenca: lista.find((p) => p.atletaId === ATLETA_LOGADO)?.status ?? 'PENDENTE' };
  }
  const conta = (s: StatusPresenca) => lista.filter((p) => p.status === s).length;
  return {
    ...e,
    resumoPresenca: { convocados: lista.length, confirmados: conta('CONFIRMADO'), ausentes: conta('AUSENTE'), pendentes: conta('PENDENTE') },
  };
}

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!USAR_MOCK_API || !req.url.startsWith(API_URL)) return next(req);

  const caminho = req.url.slice(API_URL.length);
  const role = perfilDaRequisicao(req);
  const corpo = req.body as Record<string, unknown> | null;
  const id = (padrao: RegExp) => caminho.match(padrao)?.[1] ?? '';
  const agora = new Date();

  // ---------- Autenticação ----------
  if (caminho === '/auth/login') {
    const email = String(corpo?.['email'] ?? '');
    const senha = String(corpo?.['password'] ?? '');
    if (senha.length < 6) return erro(401, req.url);
    return ok(sessao(email.startsWith('treinador') ? 'ROLE_TREINADOR' : 'ROLE_ATLETA', undefined, email));
  }
  if (caminho === '/auth/cadastro') {
    // Respeita o perfil escolhido no cadastro (atleta ou treinador)
    const perfil: Role = corpo?.['perfil'] === 'ROLE_TREINADOR' ? 'ROLE_TREINADOR' : 'ROLE_ATLETA';
    return ok(sessao(perfil, String(corpo?.['nome'] ?? 'Usuário'), String(corpo?.['email'] ?? '')));
  }
  if (caminho === '/auth/refresh') {
    const refresh = String(corpo?.['refreshToken'] ?? '');
    return ok(sessao(refresh.endsWith('ROLE_TREINADOR') ? 'ROLE_TREINADOR' : 'ROLE_ATLETA'));
  }

  // ---------- Conta (Configurações) ----------
  if (caminho === '/usuarios/me' || caminho.startsWith('/usuarios/me/')) {
    return rotasDaConta(req, caminho);
  }

  // ---------- Eventos ----------
  if (caminho === '/eventos/proximo') {
    const proximo = [...banco.eventos]
      .filter((e) => new Date(e.inicio) > agora)
      .sort((a, b) => a.inicio.localeCompare(b.inicio))[0];
    return ok(proximo ? comPresenca(proximo, role) : null);
  }
  if (caminho === '/eventos' && req.method === 'GET') {
    const de = req.params.get('de') ?? '';
    const ate = req.params.get('ate') ?? '9999';
    const tipo = req.params.get('tipo');
    return ok(
      banco.eventos
        .filter((e) => e.inicio.slice(0, 10) >= de && e.inicio.slice(0, 10) <= ate && (!tipo || e.tipo === tipo))
        .map((e) => comPresenca(e, role)),
    );
  }
  if (caminho === '/eventos' && req.method === 'POST') {
    const novo = { ...(corpo as object), id: 'e' + banco.seq++ } as Evento;
    banco.eventos.push(novo);
    banco.presencas[novo.id] = [];
    salvar();
    return ok(comPresenca(novo, role));
  }
  if (/^\/eventos\/[^/]+\/minha-presenca$/.test(caminho)) {
    const eventoId = id(/^\/eventos\/([^/]+)\//);
    const lista = (banco.presencas[eventoId] ??= []);
    let minha = lista.find((p) => p.atletaId === ATLETA_LOGADO);
    if (!minha) {
      minha = { atletaId: ATLETA_LOGADO, atletaNome: 'Lucas Andrade', numero: 7, status: 'PENDENTE' };
      lista.push(minha);
    }
    minha.status = corpo?.['status'] as StatusPresenca;
    minha.justificativa = corpo?.['justificativa'] as string | undefined;
    salvar();
    const evento = banco.eventos.find((e) => e.id === eventoId);
    return evento ? ok(comPresenca(evento, 'ROLE_ATLETA')) : erro(404, req.url);
  }
  if (/^\/eventos\/[^/]+\/presencas$/.test(caminho)) {
    return ok(banco.presencas[id(/^\/eventos\/([^/]+)\//)] ?? []);
  }
  if (/^\/eventos\/[^/]+\/convocacao$/.test(caminho)) {
    const eventoId = id(/^\/eventos\/([^/]+)\//);
    const ids = (corpo?.['atletaIds'] as string[] | undefined) ?? [];
    const anteriores = banco.presencas[eventoId] ?? [];
    banco.presencas[eventoId] = banco.atletas
      .filter((a) => ids.includes(a.id))
      .map((a) => anteriores.find((p) => p.atletaId === a.id) ?? { atletaId: a.id, atletaNome: a.nome, numero: a.numero, status: 'PENDENTE' });
    salvar();
    const ficha: Convocacao = { eventoId, geradaEm: agora.toISOString(), atletas: banco.presencas[eventoId] };
    return ok(ficha);
  }
  if (/^\/eventos\/[^/]+$/.test(caminho)) {
    const eventoId = id(/^\/eventos\/([^/]+)$/);
    if (req.method === 'GET') {
      const evento = banco.eventos.find((e) => e.id === eventoId);
      return evento ? ok(comPresenca(evento, role)) : erro(404, req.url);
    }
    if (req.method === 'PUT') {
      banco.eventos = banco.eventos.map((e) => (e.id === eventoId ? ({ ...(corpo as object), id: eventoId } as Evento) : e));
      salvar();
      const atualizado = banco.eventos.find((e) => e.id === eventoId);
      return atualizado ? ok(comPresenca(atualizado, role)) : erro(404, req.url);
    }
    if (req.method === 'DELETE') {
      banco.eventos = banco.eventos.filter((e) => e.id !== eventoId);
      delete banco.presencas[eventoId];
      salvar();
      return ok(null);
    }
  }

  // ---------- Time e atletas ----------
  if (caminho === '/time') {
    const time: Time = { nome: 'Basquete Assis · Adulto', comissaoTecnica: TREINADORES, elenco: banco.atletas };
    return ok(time);
  }
  if (caminho === '/atletas' && req.method === 'GET') return ok(banco.atletas);
  if (caminho === '/atletas' && req.method === 'POST') {
    const novo = { ...(corpo as object), id: 'a' + Date.now(), ativo: true } as Atleta;
    banco.atletas.push(novo);
    salvar();
    return ok(novo);
  }
  if (/^\/atletas\/[^/]+\/status$/.test(caminho)) {
    const atletaId = id(/^\/atletas\/([^/]+)\//);
    banco.atletas = banco.atletas.map((a) => (a.id === atletaId ? { ...a, ativo: Boolean(corpo?.['ativo']) } : a));
    salvar();
    return ok(banco.atletas.find((a) => a.id === atletaId));
  }
  if (/^\/atletas\/[^/]+$/.test(caminho) && req.method === 'PUT') {
    const atletaId = id(/^\/atletas\/([^/]+)$/);
    banco.atletas = banco.atletas.map((a) => (a.id === atletaId ? { ...a, ...(corpo as object) } : a));
    salvar();
    return ok(banco.atletas.find((a) => a.id === atletaId));
  }

  // ---------- Estatísticas ----------
  if (caminho === '/estatisticas/me') {
    const meus = banco.eventos
      .filter((e): e is Jogo => e.tipo === 'JOGO' && new Date(e.inicio) < agora)
      .sort((a, b) => a.inicio.localeCompare(b.inicio))
      .map((j) => banco.boxScores[j.id]?.find((l) => l.atletaId === ATLETA_LOGADO))
      .filter((l): l is EstatisticaAtleta => !!l);
    return ok(meus);
  }
  if (/^\/jogos\/[^/]+\/estatisticas$/.test(caminho)) {
    const jogoId = id(/^\/jogos\/([^/]+)\//);
    const jogo = banco.eventos.find((e): e is Jogo => e.id === jogoId && e.tipo === 'JOGO');
    if (!jogo) return erro(404, req.url);
    if (req.method === 'PUT') {
      // Como o back-end faria: completa data e adversário (o atleta usa no gráfico)
      banco.boxScores[jogoId] = (corpo as unknown as EstatisticaAtleta[]).map((l) => ({
        ...l,
        jogoId,
        data: jogo.inicio,
        adversario: jogo.adversario,
      }));
      salvar();
    }
    // Jogo sem números ainda: uma linha zerada por atleta ativo
    banco.boxScores[jogoId] ??= banco.atletas.filter((a) => a.ativo).map((a) => linhaZerada(a, jogo));
    return ok(banco.boxScores[jogoId]);
  }
  if (/^\/jogos\/[^/]+\/registro$/.test(caminho)) {
    const jogoId = id(/^\/jogos\/([^/]+)\//);
    const jogo = banco.eventos.find((e): e is Jogo => e.id === jogoId && e.tipo === 'JOGO');
    if (!jogo) return erro(404, req.url);
    banco.registros ??= {};
    if (req.method === 'PUT') {
      const registro = corpo as unknown as RegistroLances;
      banco.registros[jogoId] = registro;
      // O placar do jogo passa a ser o do registro
      jogo.placarTime = pontosDosLances(registro.lances);
      jogo.placarAdversario = registro.placarAdversario;
      salvar();
    }
    return ok(banco.registros[jogoId] ?? { lances: [], placarAdversario: 0 });
  }

  return erro(404, req.url);
};

// ---------------------------------------------------------------------------
// Conta: usa os mesmos cadastros do modo sem back-end (core/services/auth.ts),
// então editar nome/e-mail aqui vale para o próximo login.
// ---------------------------------------------------------------------------

function payloadDoToken(req: HttpRequest<unknown>): JwtPayload | null {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1] ?? '';
    const bytes = Uint8Array.from(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtPayload;
  } catch {
    return null;
  }
}

function lerUsuarios(): UsuarioLocal[] {
  try {
    return JSON.parse(localStorage.getItem(USUARIOS_LOCAIS_KEY) ?? '[]') as UsuarioLocal[];
  } catch {
    return [];
  }
}

function gravarUsuarios(usuarios: UsuarioLocal[]): void {
  try {
    localStorage.setItem(USUARIOS_LOCAIS_KEY, JSON.stringify(usuarios));
  } catch {
    /* sem armazenamento: as alterações valem só até recarregar */
  }
}

function contaDe(u: UsuarioLocal): ContaUsuario {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    cpf: u.cpf ?? '',
    dataNascimento: u.dataNascimento ?? '',
    telefone: u.telefone ?? '',
    fotoUrl: u.fotoUrl ?? null,
    perfil: u.perfil,
  };
}

function lerComoDataUrl(arquivo: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(arquivo);
  });
}

function rotasDaConta(req: HttpRequest<unknown>, caminho: string) {
  const token = payloadDoToken(req);
  if (!token) return erro(401, req.url);

  const usuarios = lerUsuarios();
  let usuario = usuarios.find((u) => u.id === token.sub);
  if (!usuario) {
    // Entrou pelo login do mock (sem cadastro local): cria a conta a partir do token
    usuario = { id: token.sub, nome: token.nome, email: token.email, perfil: token.roles[0] };
    usuarios.push(usuario);
    gravarUsuarios(usuarios);
  }
  const atual = usuario;
  const salvarEResponder = () => {
    gravarUsuarios(usuarios);
    return ok(contaDe(atual));
  };

  if (caminho === '/usuarios/me' && req.method === 'GET') return ok(contaDe(atual));

  if (caminho === '/usuarios/me' && req.method === 'PUT') {
    const dados = req.body as Partial<ContaUsuario>;
    const email = String(dados.email ?? '').trim().toLowerCase();
    if (usuarios.some((u) => u.id !== atual.id && u.email === email)) return erro(409, req.url);
    Object.assign(atual, {
      nome: String(dados.nome ?? atual.nome).trim(),
      email,
      telefone: dados.telefone ?? atual.telefone,
      dataNascimento: dados.dataNascimento ?? atual.dataNascimento,
    });
    return salvarEResponder();
  }

  if (caminho === '/usuarios/me/foto' && req.method === 'POST') {
    const foto = (req.body as FormData).get('foto');
    if (!(foto instanceof Blob)) return erro(400, req.url);
    return from(lerComoDataUrl(foto)).pipe(
      switchMap((dataUrl) => {
        atual.fotoUrl = dataUrl;
        return salvarEResponder();
      }),
    );
  }

  if (caminho === '/usuarios/me/foto' && req.method === 'DELETE') {
    atual.fotoUrl = null;
    return salvarEResponder();
  }

  if (caminho === '/usuarios/me' && req.method === 'DELETE') {
    // O back-end real confere a senha; aqui só exige o mínimo de 6 caracteres
    const senha = String((req.body as { password?: string } | null)?.password ?? '');
    if (senha.length < 6) return erro(401, req.url);
    gravarUsuarios(usuarios.filter((u) => u.id !== atual.id));
    return ok(null);
  }

  return erro(404, req.url);
}
