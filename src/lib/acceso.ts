/**
 * Acceso por código en la URL. Sin registro, sin contraseñas, sin cuentas.
 *
 * Los datos de medicación viven solo en el teléfono, nunca salen de él: no hay
 * base de datos ni API que proteger. El código sirve para que el enlace no sea
 * adivinable, y las páginas van marcadas noindex con robots.txt bloqueando todo,
 * porque son datos de salud de una persona real.
 */
import { CODIGO_POR_DEFECTO } from '@config/app'

/** Códigos aceptados: CODIGO_FAMILIA (separados por coma) o el de config/app.ts. */
export function codigosValidos(): string[] {
  const desdeEntorno = (process.env.CODIGO_FAMILIA ?? '')
    .split(',')
    .map(normalizar)
    .filter(Boolean)
  return desdeEntorno.length > 0 ? desdeEntorno : [normalizar(CODIGO_POR_DEFECTO)]
}

export function normalizar(codigo: string): string {
  return codigo.trim().toLowerCase()
}

export function esCodigoValido(codigo: string | null | undefined): boolean {
  if (!codigo) return false
  const c = normalizar(codigo)
  return codigosValidos().some((v) => iguales(v, c))
}

/** Comparación de tiempo constante, para no filtrar el código carácter a carácter. */
function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let dif = 0
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return dif === 0
}

/** El código que se usa para armar enlaces internos. */
export function codigoPrincipal(): string {
  return codigosValidos()[0]
}
