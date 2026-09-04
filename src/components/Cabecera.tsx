'use client'

import Link from 'next/link'
import type { Progreso } from '@/lib/estado'
import { etiquetaRelativa, fechaLarga } from '@/lib/fecha'

export type Aviso =
  | { tipo: 'atraso'; texto: string }
  | { tipo: 'proxima'; texto: string }
  | { tipo: 'completo'; texto: string }
  | { tipo: 'neutro'; texto: string }

const AVISO: Record<Aviso['tipo'], string> = {
  atraso: 'bg-late-bg text-late',
  proxima: 'bg-amber-bg text-amber',
  completo: 'bg-done-bg text-done',
  neutro: 'bg-paper text-muted',
}

type Props = {
  fecha: string
  hoy: string
  progreso: Progreso
  aviso: Aviso
  enlaceHistorial: string
  onAnterior: () => void
  onSiguiente: () => void
  onHoy: () => void
}

/** Cabecera fija: dónde estoy, cuánto llevo y qué viene. Se lee de un vistazo. */
export default function Cabecera({
  fecha,
  hoy,
  progreso,
  aviso,
  enlaceHistorial,
  onAnterior,
  onSiguiente,
  onHoy,
}: Props) {
  const relativa = etiquetaRelativa(fecha, hoy)
  const esHoy = fecha === hoy

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto max-w-lg px-3 pt-2.5 pb-2">
        <div className="flex items-center gap-1.5">
          <BotonFecha etiqueta="Día anterior" onClick={onAnterior}>
            <Flecha direccion="izq" />
          </BotonFecha>

          <button
            type="button"
            onClick={onHoy}
            disabled={esHoy}
            className="min-w-0 flex-1 px-1 text-center disabled:cursor-default"
          >
            <span className="block truncate text-[17px] leading-tight font-bold text-ink first-letter:uppercase">
              {relativa ?? fechaLarga(fecha)}
            </span>
            <span className="block truncate text-[12px] leading-tight text-muted first-letter:uppercase">
              {relativa ? fechaLarga(fecha) : 'toca para volver a hoy'}
            </span>
          </button>

          <BotonFecha etiqueta="Día siguiente" onClick={onSiguiente}>
            <Flecha direccion="der" />
          </BotonFecha>
        </div>

        <div className="mt-2 flex items-center gap-2.5">
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuenow={progreso.dadas}
            aria-valuemin={0}
            aria-valuemax={progreso.total}
            aria-label="Dosis administradas hoy"
          >
            <div
              className="h-full rounded-full bg-done"
              style={{ width: `${progreso.porcentaje}%` }}
            />
          </div>
          <span className="shrink-0 text-[13px] font-semibold text-muted tabular-nums">
            {progreso.dadas}/{progreso.total}
          </span>
          <Link
            href={enlaceHistorial}
            className="no-imprimir shrink-0 text-[13px] font-medium text-muted underline decoration-line underline-offset-4"
          >
            Historial
          </Link>
        </div>

        <p className={`mt-2 rounded-xl px-3 py-2 text-[14px] leading-snug font-semibold ${AVISO[aviso.tipo]}`}>
          {aviso.texto}
        </p>
      </div>
    </header>
  )
}

function BotonFecha({
  etiqueta,
  onClick,
  children,
}: {
  etiqueta: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      onClick={onClick}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-paper text-muted"
    >
      {children}
    </button>
  )
}

function Flecha({ direccion }: { direccion: 'izq' | 'der' }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path
        d={direccion === 'izq' ? 'M15 5 8 12l7 7' : 'M9 5l7 7-7 7'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
