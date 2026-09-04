import type { Registro } from '@/lib/tipos'
import { buscarPauta } from '@/lib/pauta'

const COLUMNAS = [
  'fecha',
  'hora_programada',
  'medicamento',
  'dosis',
  'administrado',
  'hora_real',
  'quien',
  'nota',
] as const

function escapar(valor: string): string {
  return /[",;\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor
}

/**
 * CSV del historial para mostrárselo al equipo de paliativos.
 * Separador `;` y BOM: así Excel en español lo abre en columnas sin pelear.
 */
export function aCsv(registros: Registro[]): string {
  // Orden de lectura: día a día y, dentro del día, en el orden de la pauta.
  const ordenados = [...registros].sort(
    (a, b) =>
      a.fecha.localeCompare(b.fecha) ||
      (buscarPauta(a.pautaId)?.hora ?? '').localeCompare(buscarPauta(b.pautaId)?.hora ?? '') ||
      a.pautaId.localeCompare(b.pautaId),
  )

  const filas = [COLUMNAS.join(';')]
  for (const r of ordenados) {
    const pauta = buscarPauta(r.pautaId)
    filas.push(
      [
        r.fecha,
        pauta?.hora ?? '',
        pauta?.medicamento ?? r.pautaId,
        pauta?.dosis ?? '',
        r.administrado ? 'sí' : 'no',
        r.administrado ? r.horaReal : '',
        r.porQuien,
        r.nota ?? '',
      ]
        .map((c) => escapar(String(c)))
        .join(';'),
    )
  }
  return '﻿' + filas.join('\r\n') + '\r\n'
}

/** Descarga un archivo generado en el propio teléfono. */
export function descargar(nombre: string, contenido: string, tipo: string): void {
  const blob = new Blob([contenido], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Dar tiempo al navegador a empezar la descarga antes de soltar el blob.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
