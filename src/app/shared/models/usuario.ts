/** Perfis de acesso (RBAC). Vêm na claim `roles` do JWT. */
export type Role = 'ROLE_ATLETA' | 'ROLE_TREINADOR';

/** Usuário autenticado, montado a partir das claims do access token. */
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: Role;
}

/** Claims esperadas no JWT emitido pelo back-end. */
export interface JwtPayload {
  /** id do usuário */
  sub: string;
  nome: string;
  email: string;
  roles: Role[];
  /** expiração em segundos (epoch) */
  exp: number;
  iat?: number;
}

/** Dados da própria conta (tela de Configurações). Resposta de GET /usuarios/me. */
export interface ContaUsuario {
  id: string;
  nome: string;
  email: string;
  /** só dígitos; não pode ser alterado pela própria pessoa */
  cpf: string;
  /** ISO yyyy-MM-dd */
  dataNascimento: string;
  /** só dígitos com DDD */
  telefone: string;
  fotoUrl?: string | null;
  perfil: Role;
}

/** Corpo de PUT /usuarios/me */
export type AtualizarContaRequest = Pick<ContaUsuario, 'nome' | 'email' | 'telefone' | 'dataNascimento'>;

/** Corpo de DELETE /usuarios/me: a senha confirma que é a própria pessoa */
export interface ExcluirContaRequest {
  password: string;
}
