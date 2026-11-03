import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { dataBrParaIso, paraIsoData } from './datas';

/** CPF válido (dígitos verificadores). Aceita com ou sem máscara. */
export const cpfValido: ValidatorFn = (controle: AbstractControl): ValidationErrors | null => {
  const cpf = String(controle.value ?? '').replace(/\D/g, '');
  if (!cpf) return null; // obrigatoriedade fica com Validators.required
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return { cpf: true };

  const digito = (base: string, pesoInicial: number) => {
    const soma = base.split('').reduce((acc, n, i) => acc + Number(n) * (pesoInicial - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = digito(cpf.slice(0, 9), 10);
  const d2 = digito(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]) ? null : { cpf: true };
};

/** Data dd/MM/yyyy válida e no passado (data de nascimento). */
export const dataNascimentoValida: ValidatorFn = (controle: AbstractControl): ValidationErrors | null => {
  const valor = String(controle.value ?? '');
  if (!valor) return null;
  const iso = dataBrParaIso(valor);
  if (!iso) return { data: true };
  return iso >= paraIsoData(new Date()) ? { data: true } : null;
};

/** Grupo com campos `password` e `confirmarPassword` iguais. */
export const senhasIguais: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  const senha = grupo.get('password')?.value;
  const confirmacao = grupo.get('confirmarPassword')?.value;
  return senha && confirmacao && senha !== confirmacao ? { senhasDiferentes: true } : null;
};

/** Grupo de arremessos: convertidos <= tentados (ex.: lanceLivreConvertidos/lanceLivreTentados). */
export function convertidosAteTentados(...prefixos: string[]): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const invalidos = prefixos.filter((p) => {
      const feitos = Number(grupo.get(`${p}Convertidos`)?.value ?? 0);
      const tentados = Number(grupo.get(`${p}Tentados`)?.value ?? 0);
      return feitos > tentados;
    });
    return invalidos.length ? { arremessos: invalidos } : null;
  };
}
