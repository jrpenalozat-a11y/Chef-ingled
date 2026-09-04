'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Registro } from '@/lib/tipos'
import { pautaDelDia } from '@/lib/pauta'
import { fechaLarga, hoyEnSantiago, sumarDias } from '@/lib/fecha'
import { exportarTodo, importarRespaldo, registrosEntre } from '@/lib/cliente/almacen'
import { aCsv, descargar } from '@/lib/exportar'
import Pie from '@/components/Pie'

const RANGOS = [
  { dias: 7, etiqueta: '7 días' },
  { dias: 30, etiqueta: '30 días' },
  { dias: 90, etiqueta: '90 días' },
]

type Dia = {
  fecha: string
  dadas: number
  total: number
  enCurso: boolean
  faltantes: string[]
  notas: Registro[]
}

/** Historial para revisar en casa o mostrárselo al equipo de paliativos. */
export default function VistaHistorial({ codigo }: { codigo: string }) {
  const [dias, setDias] = useState(30)
  const [registros, setRegistros] = useState<Registro[] | null>(null)
  const [hoy, setHoy] = useState('')
  const [avisoRestauracion, setAvisoRestauracion] = useState('')
  const archivo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const h = hoyEnSantiago()
    setHoy(h)
    setRegistros(registrosEntre(sumarDias(h, -(dias - 1)), h))
  }, [dias])

  const resumen = useMemo<Dia[]>(() => {
    if (!registros || !hoy) return []
    const porDia = new Map<string, Registro[]>()
    for (const r of registros) {
      const lista = porDia.get(r.fecha) ?? []
      lista.push(r)
      porDia.set(r.fecha, lista)
    }

    const salida: Dia[] = []
    for (let i = 0; i < dias; i++) {
      const fecha = sumarDias(hoy, -i)
      const delDia = porDia.get(fecha) ?? []
      const pauta = pautaDelDia(fecha)
      if (pauta.length === 0) continue
      const dadas = new Set(delDia.filter((r) => r.administrado).map((r) => r.pautaId))
      // Un día sin ninguna marca es un día que no se usó la app; no lo mostramos
      // como si se hubieran saltado 13 dosis.
      if (dadas.size === 0 && delDia.length === 0 && fecha !== hoy) continue
      salida.push({
        fecha,
        dadas: dadas.size,
        total: pauta.length,
        // El día en curso todavía tiene dosis por delante: no son un olvido.
        enCurso: fecha === hoy,
        faltantes:
          fecha === hoy
            ? []
            : pauta.filter((p) => !dadas.has(p.id)).map((p) => `${p.hora} ${p.medicamento}`),
        notas: delDia.filter((r) => r.nota),
      })
    }
    return salida
  }, [registros, hoy, dias])

  function exportarCsv() {
    if (!registros || !hoy) return
    descargar(`medicacion-${sumarDias(hoy, -(dias - 1))}_a_${hoy}.csv`, aCsv(registros), 'text/csv;charset=utf-8')
  }

  function exportarRespaldo() {
    descargar(
      `medicacion-respaldo-${hoy}.json`,
      JSON.stringify(exportarTodo(), null, 2),
      'application/json',
    )
  }

  async function restaurar(e: React.ChangeEvent<HTMLInputElement>) {
    const elegido = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (!elegido) return
    try {
      const { importados, descartados } = importarRespaldo(await elegido.text())
      setAvisoRestauracion(
        `Restaurados ${importados} registros` + (descartados ? `, ${descartados} descartados` : ''),
      )
      setRegistros(registrosEntre(sumarDias(hoy, -(dias - 1)), hoy))
    } catch {
      setAvisoRestauracion('Ese archivo no es una copia de seguridad válida')
    }
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/95 px-3 py-2.5 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            href={`/f/${codigo}`}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-paper px-3 text-[14px] font-semibold text-muted"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Hoy
          </Link>
          <h1 className="text-[17px] font-bold text-ink">Historial</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-3 pt-3 pb-10">
        <div className="no-imprimir flex flex-wrap gap-2">
          {RANGOS.map((r) => (
            <button
              key={r.dias}
              type="button"
              aria-pressed={dias === r.dias}
              onClick={() => setDias(r.dias)}
              className={`min-h-[38px] rounded-full border px-3.5 text-[14px] font-semibold ${
                dias === r.dias ? 'border-ink bg-ink text-paper' : 'border-line bg-paper text-muted'
              }`}
            >
              {r.etiqueta}
            </button>
          ))}
        </div>

        {registros === null ? (
          <p className="mt-4 text-[14px] text-muted">Cargando…</p>
        ) : resumen.length === 0 ? (
          <p className="mt-4 rounded-xl border border-line bg-paper px-3 py-3 text-[14px] leading-snug text-muted">
            Todavía no hay nada registrado en este período.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {resumen.map((dia) => {
              const completo = dia.dadas === dia.total
              return (
                <li
                  key={dia.fecha}
                  className={`rounded-2xl border px-3 py-2.5 ${
                    completo ? 'border-done/25 bg-done-bg' : 'border-line bg-paper'
                  }`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-[family-name:var(--font-hora)] text-[17px] text-ink first-letter:uppercase">
                      {fechaLarga(dia.fecha)}
                    </span>
                    <span
                      className={`ml-auto shrink-0 text-[13px] font-semibold tabular-nums ${
                        completo ? 'text-done' : 'text-muted'
                      }`}
                    >
                      {dia.dadas}/{dia.total}
                    </span>
                  </div>

                  {dia.enCurso && !completo && (
                    <p className="mt-1 text-[13px] leading-snug text-muted">En curso</p>
                  )}

                  {!completo && dia.faltantes.length > 0 && (
                    <p className="mt-1 text-[13px] leading-snug text-late">
                      Sin marcar: {dia.faltantes.join(' · ')}
                    </p>
                  )}

                  {dia.notas.map((n) => (
                    <p key={n.pautaId} className="mt-1 text-[13px] leading-snug text-muted italic">
                      {n.horaReal} · “{n.nota}”
                    </p>
                  ))}
                </li>
              )
            })}
          </ul>
        )}

        <div className="no-imprimir mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={exportarCsv}
            className="min-h-[46px] rounded-xl bg-ink px-4 text-[15px] font-semibold text-paper"
          >
            Exportar CSV de estos {dias} días
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[46px] rounded-xl border border-line bg-paper px-4 text-[15px] font-semibold text-ink"
          >
            Imprimir o guardar en PDF
          </button>
          <button
            type="button"
            onClick={exportarRespaldo}
            className="min-h-[46px] rounded-xl border border-line bg-paper px-4 text-[14px] font-medium text-muted"
          >
            Guardar copia de seguridad completa
          </button>
          <button
            type="button"
            onClick={() => archivo.current?.click()}
            className="min-h-[46px] rounded-xl border border-line bg-paper px-4 text-[14px] font-medium text-muted"
          >
            Restaurar copia de seguridad
          </button>
          <input
            ref={archivo}
            type="file"
            accept="application/json,.json"
            onChange={restaurar}
            className="hidden"
          />

          {avisoRestauracion && (
            <p className="rounded-xl border border-line bg-paper px-3 py-2.5 text-[14px] font-semibold text-ink">
              {avisoRestauracion}
            </p>
          )}

          <p className="text-[12px] leading-relaxed text-muted">
            El registro vive solo en este teléfono. Guarda la copia de seguridad de vez en
            cuando: si cambias de teléfono o borras los datos del navegador, es lo único que
            queda del historial. Al restaurar no se borra nada: se fusiona con lo que ya
            tengas y gana la marca más reciente.
          </p>
        </div>

        <Pie />
      </main>
    </div>
  )
}
