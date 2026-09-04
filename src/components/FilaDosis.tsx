'use client'

import { useState } from 'react'
import type { EstadoDosis, Pauta, Registro } from '@/lib/tipos'

const ESTILO: Record<EstadoDosis, string> = {
  dada: 'bg-done-bg border-done/25',
  atrasada: 'bg-late-bg border-late/25',
  proxima: 'bg-amber-bg border-amber/25',
  pendiente: 'bg-paper border-line',
}

const CASILLA: Record<EstadoDosis, string> = {
  dada: 'bg-done border-done text-white',
  atrasada: 'border-late/60 bg-paper',
  proxima: 'border-amber/60 bg-paper',
  pendiente: 'border-line bg-paper',
}

type Props = {
  pauta: Pauta
  registro: Registro | undefined
  estado: EstadoDosis
  /** Días futuros no se pueden marcar: aún no ha pasado nada que registrar. */
  bloqueado: boolean
  /** La dosis pertenece al bloque que toca ahora. */
  destacado: boolean
  onAlternar: () => void
  onNota: (nota: string) => void
}

/**
 * Una dosis: fila tocable de 44 px como mínimo, casilla de 26 px.
 * El estado se entiende por color y forma antes que por texto.
 */
export default function FilaDosis({
  pauta,
  registro,
  estado,
  bloqueado,
  destacado,
  onAlternar,
  onNota,
}: Props) {
  const [editandoNota, setEditandoNota] = useState(false)
  const [borrador, setBorrador] = useState(registro?.nota ?? '')
  const dada = estado === 'dada'
  const mostrarNota = Boolean(registro?.nota) || estado !== 'pendiente' || destacado

  function guardarNota() {
    onNota(borrador)
    setEditandoNota(false)
  }

  return (
    <li className={`border-t first:border-t-0 ${ESTILO[estado]}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={dada}
        disabled={bloqueado}
        onClick={onAlternar}
        className="flex min-h-[56px] w-full items-center gap-3 px-3 py-2.5 text-left disabled:opacity-45"
      >
        <span
          aria-hidden
          className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md border-2 ${CASILLA[estado]}`}
        >
          {dada && (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3.5}>
              <path d="M5 12.5 10 17.5 19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`block text-[15px] leading-tight font-semibold ${
              dada ? 'text-done line-through decoration-done/50' : 'text-ink'
            }`}
          >
            {pauta.medicamento}
          </span>
          <span className={`block text-[13px] leading-snug ${dada ? 'text-done/80' : 'text-muted'}`}>
            {pauta.dosis}
          </span>
          {dada && registro && (
            <span className="mt-1 block text-[12px] leading-snug font-medium text-done">
              dado a las {registro.horaReal}
              {registro.porQuien ? ` · ${registro.porQuien}` : ''}
            </span>
          )}
          {estado === 'atrasada' && (
            <span className="mt-1 block text-[12px] leading-snug font-semibold text-late">
              sin marcar
            </span>
          )}
        </span>
      </button>

      {/* La nota solo se ofrece donde hace falta. Trece "+ nota" en pantalla a las
          cuatro de la mañana son trece cosas que leer para nada. */}
      {(mostrarNota || editandoNota) && (
      <div className="flex items-start gap-2 px-3 pb-2.5 pl-[50px]">
        {editandoNota ? (
          <div className="flex-1">
            <textarea
              autoFocus
              rows={2}
              maxLength={200}
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              placeholder="vomitó · rechazó la dosis · se dio 20 min tarde"
              className="w-full rounded-lg border border-line bg-paper px-2.5 py-2 text-[14px] text-ink placeholder:text-muted/70"
            />
            <div className="mt-1.5 flex gap-2">
              <button
                type="button"
                onClick={guardarNota}
                className="min-h-[36px] rounded-lg bg-ink px-3 text-[13px] font-semibold text-paper"
              >
                Guardar nota
              </button>
              <button
                type="button"
                onClick={() => {
                  setBorrador(registro?.nota ?? '')
                  setEditandoNota(false)
                }}
                className="min-h-[36px] rounded-lg px-3 text-[13px] font-medium text-muted"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : registro?.nota ? (
          <button
            type="button"
            onClick={() => setEditandoNota(true)}
            className="flex-1 text-left text-[13px] leading-snug text-muted italic"
          >
            “{registro.nota}”
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditandoNota(true)}
            className="text-[13px] font-medium text-muted underline decoration-line underline-offset-4"
          >
            + nota
          </button>
        )}
      </div>
      )}
    </li>
  )
}
