'use client'

import { CUIDADORES } from '@config/app'

type Props = {
  cuidador: string
  onCambiar: (nombre: string) => void
}

/** Quién está a cargo ahora. Se recuerda en este teléfono. */
export default function SelectorCuidador({ cuidador, onCambiar }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] font-medium text-muted">Marca:</span>
      {CUIDADORES.map((nombre) => {
        const activo = nombre === cuidador
        return (
          <button
            key={nombre}
            type="button"
            aria-pressed={activo}
            onClick={() => onCambiar(nombre)}
            className={`min-h-[38px] rounded-full border px-3.5 text-[14px] font-semibold ${
              activo
                ? 'border-ink bg-ink text-paper'
                : 'border-line bg-paper text-muted'
            }`}
          >
            {nombre}
          </button>
        )
      })}
    </div>
  )
}
