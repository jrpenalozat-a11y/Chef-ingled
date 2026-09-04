'use client'

import type { BloqueHorario, Pauta, Registro } from '@/lib/tipos'
import type { Ahora } from '@/lib/estado'
import { estadoDeDosis } from '@/lib/estado'
import { minutosProgramados } from '@/lib/fecha'
import FilaDosis from '@/components/FilaDosis'

type Props = {
  bloque: BloqueHorario
  registros: Record<string, Registro>
  fecha: string
  ahora: Ahora
  esProximo: boolean
  bloqueado: boolean
  onAlternar: (pauta: Pauta) => void
  onNota: (pauta: Pauta, nota: string) => void
}

/** Un horario de la pauta con todas sus dosis. La hora, en serif, es el ancla visual. */
export default function BloqueHora({
  bloque,
  registros,
  fecha,
  ahora,
  esProximo,
  bloqueado,
  onAlternar,
  onNota,
}: Props) {
  const total = bloque.dosis.length
  const dadas = bloque.dosis.filter((d) => registros[d.id]?.administrado).length
  const completo = dadas === total
  const hayAtraso = bloque.dosis.some(
    (d) => estadoDeDosis(d, registros[d.id], fecha, ahora) === 'atrasada',
  )

  const borde = esProximo
    ? 'border-amber/45 shadow-[0_0_0_2px_rgba(154,91,0,0.12)]'
    : hayAtraso
      ? 'border-late/35'
      : 'border-line'

  // "Ahora" solo cuando la hora ya llegó; antes de eso es la siguiente.
  const yaLlego = minutosProgramados(fecha, bloque.hora) <= ahora.minutos && fecha === ahora.fecha

  const cabecera = completo
    ? 'bg-done-bg text-done'
    : hayAtraso
      ? 'bg-late-bg text-late'
      : esProximo
        ? 'bg-amber-bg text-amber'
        : 'bg-paper text-ink'

  return (
    <section className={`overflow-hidden rounded-2xl border bg-paper ${borde}`}>
      <header className={`flex items-baseline gap-3 border-b border-line/70 px-3 py-2 ${cabecera}`}>
        <h2 className="font-[family-name:var(--font-hora)] text-[26px] leading-none tracking-tight">
          {bloque.hora}
        </h2>
        <span className="ml-auto text-[12px] font-semibold tracking-wide uppercase">
          {completo
            ? 'completo'
            : esProximo
              ? yaLlego
                ? 'ahora'
                : 'siguiente'
              : hayAtraso
                ? 'atrasado'
                : `${dadas}/${total}`}
        </span>
      </header>

      <ul>
        {bloque.dosis.map((dosis) => (
          <FilaDosis
            key={dosis.id}
            pauta={dosis}
            registro={registros[dosis.id]}
            estado={estadoDeDosis(dosis, registros[dosis.id], fecha, ahora)}
            bloqueado={bloqueado}
            destacado={esProximo}
            onAlternar={() => onAlternar(dosis)}
            onNota={(nota) => onNota(dosis, nota)}
          />
        ))}
      </ul>
    </section>
  )
}
