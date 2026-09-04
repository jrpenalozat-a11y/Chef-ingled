import type { Registro } from '@/lib/tipos'
import { DIAS_HISTORIAL } from '@config/app'
import { esFechaValida, sumarDias } from '@/lib/fecha'
import { buscarPauta } from '@/lib/pauta'

/**
 * Almacenamiento en el propio teléfono. Aquí vive la fuente de verdad:
 * no hay servidor, no hay base de datos, no sale nada del dispositivo.
 *
 * Un día = una clave `med:dia:YYYY-MM-DD` con la lista de registros de ese día.
 * Escribir es síncrono, así que marcar una dosis nunca depende de la señal.
 */

const P_DIA = 'med:dia:'
const K_CUIDADOR = 'med:cuidador'

function leer<T>(clave: string, porDefecto: T): T {
  if (typeof window === 'undefined') return porDefecto
  try {
    const crudo = window.localStorage.getItem(clave)
    return crudo ? (JSON.parse(crudo) as T) : porDefecto
  } catch {
    return porDefecto
  }
}

function escribir(clave: string, valor: unknown): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor))
    return true
  } catch {
    // Modo privado o cuota llena: la app sigue en memoria hasta recargar.
    return false
  }
}

/** Registros de un día, indexados por pautaId. */
export function registrosDe(fecha: string): Record<string, Registro> {
  const lista = leer<Registro[]>(P_DIA + fecha, [])
  const salida: Record<string, Registro> = {}
  for (const r of lista) salida[r.pautaId] = r
  return salida
}

/** Guarda el día completo. Devuelve false si el navegador no dejó escribir. */
export function guardarDia(fecha: string, registros: Record<string, Registro>): boolean {
  const lista = Object.values(registros)
  if (lista.length === 0) {
    try {
      window.localStorage.removeItem(P_DIA + fecha)
      return true
    } catch {
      return false
    }
  }
  return escribir(P_DIA + fecha, lista)
}

/** Todos los días guardados, de más nuevo a más viejo. */
export function fechasGuardadas(): string[] {
  if (typeof window === 'undefined') return []
  const fechas: string[] = []
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const clave = window.localStorage.key(i)
      if (clave?.startsWith(P_DIA)) fechas.push(clave.slice(P_DIA.length))
    }
  } catch {
    return []
  }
  return fechas.sort().reverse()
}

/** Registros de un rango de fechas, ordenados. Para el historial y la exportación. */
export function registrosEntre(desde: string, hasta: string): Registro[] {
  return fechasGuardadas()
    .filter((f) => f >= desde && f <= hasta)
    .flatMap((f) => Object.values(registrosDe(f)))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaReal.localeCompare(b.horaReal))
}

/** Poda los días que quedan fuera de la ventana de historial. */
export function podarHistorial(hoy: string): void {
  const limite = sumarDias(hoy, -DIAS_HISTORIAL)
  for (const fecha of fechasGuardadas()) {
    if (fecha < limite) {
      try {
        window.localStorage.removeItem(P_DIA + fecha)
      } catch {
        return
      }
    }
  }
}

// — Preferencias del dispositivo ——————————————————————————————————

export function cuidadorGuardado(): string {
  return leer<string>(K_CUIDADOR, '')
}

export function guardarCuidador(nombre: string): void {
  escribir(K_CUIDADOR, nombre)
}

/** Copia de seguridad completa, para llevarse el historial a otro teléfono. */
export function exportarTodo(): { version: 1; exportadoEn: string; registros: Registro[] } {
  return {
    version: 1,
    exportadoEn: new Date().toISOString(),
    registros: fechasGuardadas().flatMap((f) => Object.values(registrosDe(f))),
  }
}

/**
 * Restaura una copia de seguridad sobre lo que ya hay en el teléfono.
 *
 * No borra nada: fusiona. Si una dosis está en ambos lados gana la marca más
 * reciente, así restaurar un respaldo viejo no deshace lo de esta semana.
 * Devuelve cuántos registros entraron y cuántos se descartaron por venir mal.
 */
export function importarRespaldo(texto: string): { importados: number; descartados: number } {
  const datos = JSON.parse(texto) as { registros?: unknown }
  if (!Array.isArray(datos.registros)) throw new Error('El archivo no tiene registros')

  const validos: Registro[] = []
  let descartados = 0
  for (const bruto of datos.registros) {
    const r = validar(bruto)
    if (r) validos.push(r)
    else descartados++
  }

  const porDia = new Map<string, Registro[]>()
  for (const r of validos) {
    const lista = porDia.get(r.fecha) ?? []
    lista.push(r)
    porDia.set(r.fecha, lista)
  }

  let importados = 0
  for (const [fecha, lista] of porDia) {
    const actual = registrosDe(fecha)
    for (const r of lista) {
      const previo = actual[r.pautaId]
      if (!previo || previo.marcadoEn <= r.marcadoEn) {
        actual[r.pautaId] = r
        importados++
      }
    }
    guardarDia(fecha, actual)
  }

  return { importados, descartados }
}

/** Un registro de un archivo externo solo entra si está entero y es coherente. */
function validar(bruto: unknown): Registro | null {
  if (!bruto || typeof bruto !== 'object') return null
  const r = bruto as Record<string, unknown>
  if (typeof r.fecha !== 'string' || !esFechaValida(r.fecha)) return null
  if (typeof r.pautaId !== 'string' || !buscarPauta(r.pautaId)) return null
  if (typeof r.horaReal !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.horaReal)) return null
  if (typeof r.marcadoEn !== 'string' || Number.isNaN(Date.parse(r.marcadoEn))) return null

  const nota = typeof r.nota === 'string' ? r.nota.trim().slice(0, 200) : ''
  return {
    fecha: r.fecha,
    pautaId: r.pautaId,
    administrado: r.administrado === true,
    horaReal: r.horaReal,
    porQuien: typeof r.porQuien === 'string' ? r.porQuien.slice(0, 40) : '',
    marcadoEn: new Date(r.marcadoEn).toISOString(),
    ...(nota ? { nota } : {}),
  }
}
