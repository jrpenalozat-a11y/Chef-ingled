/**
 * PAUTA DE MEDICACIÓN — archivo de configuración editable.
 *
 * Esto es lo único que hay que tocar cuando el equipo de paliativos cambia la pauta.
 * No hay dosis incrustadas en los componentes.
 *
 * CÓMO CAMBIAR LA PAUTA SIN ROMPER EL HISTORIAL
 * ---------------------------------------------
 * No borres ni edites una línea que ya se usó: ponle `vigenteHasta` con el último día
 * en que rigió y agrega una línea nueva con un `id` nuevo y `vigenteDesde` el día
 * siguiente. Los registros antiguos apuntan al `id` viejo y siguen siendo legibles.
 *
 * Ejemplo — la morfina de las 12:00 pasa de 10 a 15 gotas desde el 2026-09-10:
 *   { id: 'morfina-1200',   hora: '12:00', ..., dosis: '10 gotas',
 *     vigenteDesde: '2025-01-01', vigenteHasta: '2026-09-09' },
 *   { id: 'morfina-1200-b', hora: '12:00', ..., dosis: '15 gotas',
 *     vigenteDesde: '2026-09-10' },
 *
 * Frecuencias de origen, para validar la pauta al editarla:
 *   Morfina cada 6 h · Escopolamina cada 12 h · Inhalador cada 4 h · Haloperidol 1 vez al día.
 */
import type { Pauta } from '@/lib/tipos'

/** Fecha desde la que rige la pauta actual. */
const DESDE = '2025-01-01'

export const PAUTA: Pauta[] = [
  { id: 'morfina-0000',      hora: '00:00', medicamento: 'Morfina',      dosis: '10 gotas',                   vigenteDesde: DESDE },
  { id: 'inhalador-0000',    hora: '00:00', medicamento: 'Inhalador',    dosis: '2 puff',                     vigenteDesde: DESDE },
  { id: 'inhalador-0400',    hora: '04:00', medicamento: 'Inhalador',    dosis: '2 puff',                     vigenteDesde: DESDE },
  { id: 'morfina-0600',      hora: '06:00', medicamento: 'Morfina',      dosis: '10 gotas',                   vigenteDesde: DESDE },
  { id: 'escopolamina-0800', hora: '08:00', medicamento: 'Escopolamina', dosis: '10 mg — mitad de la jeringa', vigenteDesde: DESDE },
  { id: 'inhalador-0800',    hora: '08:00', medicamento: 'Inhalador',    dosis: '2 puff',                     vigenteDesde: DESDE },
  { id: 'morfina-1200',      hora: '12:00', medicamento: 'Morfina',      dosis: '10 gotas',                   vigenteDesde: DESDE },
  { id: 'inhalador-1200',    hora: '12:00', medicamento: 'Inhalador',    dosis: '2 puff',                     vigenteDesde: DESDE },
  { id: 'inhalador-1600',    hora: '16:00', medicamento: 'Inhalador',    dosis: '2 puff',                     vigenteDesde: DESDE },
  { id: 'morfina-1800',      hora: '18:00', medicamento: 'Morfina',      dosis: '10 gotas',                   vigenteDesde: DESDE },
  { id: 'escopolamina-2000', hora: '20:00', medicamento: 'Escopolamina', dosis: '10 mg — mitad de la jeringa', vigenteDesde: DESDE },
  { id: 'inhalador-2000',    hora: '20:00', medicamento: 'Inhalador',    dosis: '2 puff',                     vigenteDesde: DESDE },
  { id: 'haloperidol-2300',  hora: '23:00', medicamento: 'Haloperidol',  dosis: '5 mg — jeringa entera',      vigenteDesde: DESDE },
]
