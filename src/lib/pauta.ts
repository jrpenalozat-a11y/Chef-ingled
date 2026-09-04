import { PAUTA } from '@config/pauta'
import type { BloqueHorario, Pauta } from '@/lib/tipos'
import { minutosDeHora } from '@/lib/fecha'

/** Líneas de la pauta vigentes en una fecha dada ("YYYY-MM-DD"). */
export function pautaDelDia(fecha: string): Pauta[] {
  return PAUTA.filter(
    (p) => p.vigenteDesde <= fecha && (!p.vigenteHasta || fecha <= p.vigenteHasta),
  ).sort(
    (a, b) => minutosDeHora(a.hora) - minutosDeHora(b.hora) || a.medicamento.localeCompare(b.medicamento),
  )
}

/** La pauta del día agrupada en bloques horarios, en orden. */
export function bloquesDelDia(fecha: string): BloqueHorario[] {
  const bloques: BloqueHorario[] = []
  for (const p of pautaDelDia(fecha)) {
    const ultimo = bloques[bloques.length - 1]
    if (ultimo && ultimo.hora === p.hora) ultimo.dosis.push(p)
    else bloques.push({ hora: p.hora, dosis: [p] })
  }
  return bloques
}

/** Busca una línea de la pauta por id, incluidas las ya no vigentes (historial). */
export function buscarPauta(id: string): Pauta | undefined {
  return PAUTA.find((p) => p.id === id)
}
