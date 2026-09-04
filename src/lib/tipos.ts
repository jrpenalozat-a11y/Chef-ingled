/**
 * Modelo de datos de la app de control de medicación.
 * La app NO calcula, sugiere ni ajusta dosis: solo registra lo administrado.
 */

/** Una dosis programada de la pauta. */
export type Pauta = {
  id: string
  /** "HH:mm" en hora local de America/Santiago */
  hora: string
  medicamento: string
  dosis: string
  /** "YYYY-MM-DD" — desde qué día rige esta línea de la pauta */
  vigenteDesde: string
  /** "YYYY-MM-DD" — último día en que rige (inclusive). Ausente = sigue vigente */
  vigenteHasta?: string
}

/** Lo que efectivamente pasó con una dosis en un día concreto. */
export type Registro = {
  /** "YYYY-MM-DD" en America/Santiago */
  fecha: string
  pautaId: string
  administrado: boolean
  /** "HH:mm" — hora efectiva, puede diferir de la programada */
  horaReal: string
  /** Nombre libre del cuidador */
  porQuien: string
  /** Timestamp ISO. Gana el más reciente al resolver conflictos */
  marcadoEn: string
  nota?: string
}

/** Clave primaria de un registro. */
export function claveRegistro(fecha: string, pautaId: string): string {
  return `${fecha}|${pautaId}`
}

/** Estado visual de una dosis en la vista del día. */
export type EstadoDosis = 'pendiente' | 'proxima' | 'atrasada' | 'dada'

/** Un bloque horario con todas sus dosis. */
export type BloqueHorario = {
  hora: string
  dosis: Pauta[]
}
