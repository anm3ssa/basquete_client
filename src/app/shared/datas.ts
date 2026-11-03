/** Helpers de data sem dependências externas. Datas de API em ISO. */

/** Date -> 'yyyy-MM-dd' no fuso local (não usa toISOString, que converte para UTC). */
export function paraIsoData(data: Date): string {
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`;
}

/** Date -> ISO 8601 com o fuso local, ex.: 2026-11-04T19:30:00-03:00 */
export function paraIsoDataHora(data: Date): string {
  const dois = (n: number) => String(Math.abs(n)).padStart(2, '0');
  const fuso = -data.getTimezoneOffset();
  const sinal = fuso >= 0 ? '+' : '-';
  return (
    `${paraIsoData(data)}T${dois(data.getHours())}:${dois(data.getMinutes())}:00` +
    `${sinal}${dois(Math.trunc(fuso / 60))}:${dois(fuso % 60)}`
  );
}

/** 'dd/MM/yyyy' (vindo do ngx-mask sem separadores: ddMMyyyy) -> 'yyyy-MM-dd' ou null. */
export function dataBrParaIso(valor: string): string | null {
  const digitos = valor.replace(/\D/g, '');
  if (digitos.length !== 8) return null;
  const dia = Number(digitos.slice(0, 2));
  const mes = Number(digitos.slice(2, 4));
  const ano = Number(digitos.slice(4, 8));
  const data = new Date(ano, mes - 1, dia);
  const valida = data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  return valida ? paraIsoData(data) : null;
}

/** 'yyyy-MM-dd' -> Date local (meia-noite). */
export function isoParaData(iso: string): Date {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

export function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Primeiro e último dia do mês, em ISO. */
export function intervaloDoMes(ano: number, mes: number): { de: string; ate: string } {
  return { de: paraIsoData(new Date(ano, mes, 1)), ate: paraIsoData(new Date(ano, mes + 1, 0)) };
}

/** Chave 'yyyy-MM-dd' usada para marcar dias no calendário. */
export function chaveDia(ano: number, mes: number, dia: number): string {
  return paraIsoData(new Date(ano, mes, dia));
}
