/**
 * Configuración general de la app. Editable sin tocar componentes.
 */

/**
 * Código de acceso que va en la URL: /f/<codigo>
 *
 * Los datos viven solo en este teléfono, así que el código no protege una base
 * de datos: sirve para que el enlace no sea adivinable y para que las páginas
 * queden fuera de buscadores (van marcadas noindex y robots.txt bloquea todo).
 *
 * Cámbialo por el tuyo. También se puede fijar con la variable de entorno
 * CODIGO_FAMILIA (acepta varios separados por coma), que tiene prioridad.
 */
export const CODIGO_POR_DEFECTO = 'casa'

/** Cuidadores que aparecen en el selector. Nombres libres, sin cuentas ni contraseñas. */
export const CUIDADORES: string[] = ['Ricardo', 'Hermana', 'Apoyo']

/** Minutos que pueden pasar de la hora programada antes de marcar la dosis como atrasada. */
export const MINUTOS_ATRASO = 45

/** Cada cuánto se recalculan "próxima dosis" y "atrasada", en segundos. */
export const SEGUNDOS_RELOJ = 30

/** Días de historial que se guardan en el teléfono antes de podar la caché. */
export const DIAS_HISTORIAL = 120

/** Pie de página: quién manda sobre las dosis. */
export const NOTA_PIE =
  'Las dosis las fija el equipo de cuidados paliativos. Esta app solo registra lo que se administró.'
