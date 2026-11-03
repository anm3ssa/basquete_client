export interface LoginRequest {
  email: string;
  password: string;
}

import { Role } from './usuario';

/** Cadastro público: a pessoa escolhe se é atleta ou treinador. */
export interface CadastroRequest {
  perfil: Role;
  nome: string;
  /** só dígitos, ex.: 12345678909 */
  cpf: string;
  /** ISO yyyy-MM-dd */
  dataNascimento: string;
  email: string;
  /** só dígitos com DDD, ex.: 18998765432 */
  telefone: string;
  password: string;
}

/** Resposta de /auth/login, /auth/cadastro e /auth/refresh. */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}
