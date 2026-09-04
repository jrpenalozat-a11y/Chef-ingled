import type { BloqueHorario, EstadoDosis, Pauta, Registro } from '@/lib/tipos'
import { MINUTOS_ATRASO } from '@config/app'
import { minutosProgramados } from '@/lib/fecha'

export type Ahora = {
  /** "YYYY-MM-DD" de hoy en Santiago */
  fecha: string
  /** minutos del día transcurridos, 0..1439 */
  minutos: number
}

/**
 * Estado de una dosis concreta.
 *
 * Se compara reloj de pared contra reloj de pared, siempre dentro del mismo día
 * local, así que los cambios de horario de verano no descuadran nada.
 */
export function estadoDeDosis(
  pauta: Pauta,
  registro: Registro | undefined,
  fecha: string,
  ahora: Ahora,
): EstadoDosis {
  if (registro?.administrado) return 'dada'
  if (fecha > ahora.fecha) return 'pendiente' // día futuro: aún no toca
  if (fecha < ahora.fecha) return 'atrasada' // día pasado sin marcar
  return minutosProgramados(fecha, pauta.hora) + MINUTOS_ATRASO < ahora.minutos
    ? 'atrasada'
    : 'pendiente'
}

/**
 * El bloque que toca ahora: el más temprano que aún tiene dosis sin marcar y
 * cuyo margen de 45 minutos no se ha agotado. Devuelve null si el día está
 * cerrado (todo marcado, o todo lo que queda ya está atrasado).
 */
export function bloqueProximo(
  bloques: BloqueHorario[],
  registros: Record<string, Registro>,
  fecha: string,
  ahora: Ahora,
): BloqueHorario | null {
  if (fecha !== ahora.fecha) return null // solo tiene sentido en el día en curso
  for (const bloque of bloques) {
    const pendientes = bloque.dosis.some((d) => !registros[d.id]?.administrado)
    if (!pendientes) continue
    if (minutosProgramados(fecha, bloque.hora) + MINUTOS_ATRASO >= ahora.minutos) return bloque
  }
  return null
}

/** Dosis atrasadas del día: pendientes cuyo margen ya se agotó. */
export function dosisAtrasadas(
  bloques: BloqueHorario[],
  registros: Record<string, Registro>,
  fecha: string,
  ahora: Ahora,
): Pauta[] {
  return bloques
    .flatMap((b) => b.dosis)
    .filter((d) => estadoDeDosis(d, registros[d.id], fecha, ahora) === 'atrasada')
}

export type Progreso = { dadas: number; total: number; porcentaje: number }

export function progresoDelDia(
  bloques: BloqueHorario[],
  registros: Record<string, Registro>,
): Progreso {
  const dosis = bloques.flatMap((b) => b.dosis)
  const dadas = dosis.filter((d) => registros[d.id]?.administrado).length
  const total = dosis.length
  return { dadas, total, porcentaje: total === 0 ? 0 : Math.round((dadas / total) * 100) }
}
