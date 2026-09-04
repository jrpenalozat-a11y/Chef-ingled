/**
 * Todo el tiempo de la app corre en hora local de Chile.
 *
 * Regla de oro: comparamos siempre reloj de pared contra reloj de pared
 * (minutos del día en America/Santiago), nunca marcas UTC restadas a mano.
 * Así los cambios de horario de verano se resuelven solos: en el salto de
 * septiembre la hora que no existe simplemente nunca llega a ser "ahora"
 * (la dosis de las 00:00 se marcará atrasada a la 01:00, que es lo correcto),
 * y en el retroceso de abril la hora repetida no descuadra ninguna cuenta.
 */
export const ZONA = 'America/Santiago'

const FMT_PARTES = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export type PartesLocales = {
  /** "YYYY-MM-DD" */
  fecha: string
  /** "HH:mm" */
  hora: string
  /** minutos transcurridos del día, 0..1439 */
  minutos: number
}

/** Descompone un instante en fecha y hora de pared de Santiago. */
export function partesEnSantiago(d: Date = new Date()): PartesLocales {
  const p: Record<string, string> = {}
  for (const { type, value } of FMT_PARTES.formatToParts(d)) p[type] = value
  // en-CA con hour12:false puede devolver "24" a medianoche en algunos motores
  const hh = p.hour === '24' ? '00' : p.hour
  return {
    fecha: `${p.year}-${p.month}-${p.day}`,
    hora: `${hh}:${p.minute}`,
    minutos: Number(hh) * 60 + Number(p.minute),
  }
}

/** "YYYY-MM-DD" de hoy en Santiago. */
export function hoyEnSantiago(): string {
  return partesEnSantiago().fecha
}

/** "HH:mm" de ahora en Santiago. */
export function horaEnSantiago(): string {
  return partesEnSantiago().hora
}

/** Aritmética de calendario sobre "YYYY-MM-DD". Independiente de zonas y de DST. */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number)
  const t = new Date(Date.UTC(a, m - 1, d))
  t.setUTCDate(t.getUTCDate() + dias)
  return t.toISOString().slice(0, 10)
}

/** "HH:mm" → minutos del día. */
export function minutosDeHora(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

/** ¿La cadena tiene forma "YYYY-MM-DD" y es una fecha real? */
export function esFechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false
  const [a, m, d] = fecha.split('-').map(Number)
  const t = new Date(Date.UTC(a, m - 1, d))
  return t.getUTCFullYear() === a && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}

const FMT_LARGO = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

/** "jueves, 4 de septiembre" a partir de "YYYY-MM-DD". */
export function fechaLarga(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number)
  return FMT_LARGO.format(new Date(Date.UTC(a, m - 1, d)))
}

/** "04/09" a partir de "YYYY-MM-DD". */
export function fechaCorta(fecha: string): string {
  const [, m, d] = fecha.split('-')
  return `${d}/${m}`
}

/** Etiqueta relativa amable, o null si la fecha está lejos. */
export function etiquetaRelativa(fecha: string, hoy = hoyEnSantiago()): string | null {
  if (fecha === hoy) return 'Hoy'
  if (fecha === sumarDias(hoy, -1)) return 'Ayer'
  if (fecha === sumarDias(hoy, 1)) return 'Mañana'
  return null
}

/** Desfase de Santiago respecto de UTC, en milisegundos, en un instante dado. */
function desfaseEn(instante: number): number {
  const p = partesEnSantiago(new Date(instante))
  return Date.parse(`${p.fecha}T${p.hora}:00Z`) - instante
}

const cacheMinutos = new Map<string, number>()

/**
 * Minutos del día en que de verdad ocurre una hora programada.
 *
 * Casi siempre coincide con la hora de la pauta. La excepción es la noche en
 * que Chile adelanta el reloj: el primer domingo de septiembre se pasa de las
 * 23:59 a la 01:00, así que ese día las 00:00 no existen. Sin esto, las dos
 * dosis de medianoche saldrían en rojo desde el primer segundo del día, cuando
 * en realidad nadie pudo darlas: el margen tiene que empezar a contar desde la
 * primera hora que sí existió.
 *
 * Se prueban los dos desfases posibles del día (antes y después del cambio) y
 * se busca cuál reproduce la hora pedida. Si ninguno lo hace, esa hora no
 * existió y vale la más temprana que sí cae dentro del día.
 */
export function minutosProgramados(fecha: string, hora: string): number {
  const clave = `${fecha}|${hora}`
  const guardado = cacheMinutos.get(clave)
  if (guardado !== undefined) return guardado

  const objetivo = Date.parse(`${fecha}T${hora}:00Z`)
  const DOCE_HORAS = 12 * 60 * 60 * 1000
  let minutos: number | null = null

  for (const sonda of [objetivo - DOCE_HORAS, objetivo + DOCE_HORAS]) {
    const candidato = partesEnSantiago(new Date(objetivo - desfaseEn(sonda)))
    if (candidato.fecha !== fecha) continue
    if (candidato.hora === hora) {
      minutos = candidato.minutos // caso normal: la hora existe tal cual
      break
    }
    if (minutos === null || candidato.minutos < minutos) minutos = candidato.minutos
  }

  const resultado = minutos ?? minutosDeHora(hora)
  cacheMinutos.set(clave, resultado)
  return resultado
}
