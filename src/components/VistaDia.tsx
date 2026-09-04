'use client'

import { useMemo, useState } from 'react'
import type { Pauta } from '@/lib/tipos'
import type { Ahora, Progreso } from '@/lib/estado'
import type { BloqueHorario } from '@/lib/tipos'
import { CUIDADORES, NOTA_PIE } from '@config/app'
import { bloquesDelDia } from '@/lib/pauta'
import { bloqueProximo, dosisAtrasadas, progresoDelDia } from '@/lib/estado'
import { minutosProgramados, sumarDias } from '@/lib/fecha'
import { useCuidador, useDia, usePodarHistorial, useReloj } from '@/lib/cliente/hooks'
import Cabecera, { type Aviso } from '@/components/Cabecera'
import SelectorCuidador from '@/components/SelectorCuidador'
import BloqueHora from '@/components/BloqueHora'
import Pie from '@/components/Pie'

/**
 * La app espera al primer render en el teléfono para saber la hora de Santiago.
 * A cambio, la página es completamente estática y el service worker puede
 * servirla sin señal.
 */
export default function VistaDia({ codigo }: { codigo: string }) {
  const ahora = useReloj()
  return ahora ? <Dia codigo={codigo} ahora={ahora} /> : <Esqueleto />
}

function Dia({ codigo, ahora }: { codigo: string; ahora: Ahora }) {
  const [cuidador, setCuidador] = useCuidador(CUIDADORES[0] ?? '')

  // null = "sigue el día en curso". Así, si la app se queda abierta toda la
  // noche, a las 00:00 pasa sola al día nuevo en vez de quedarse en el de ayer.
  const [fechaElegida, setFechaElegida] = useState<string | null>(null)
  const fecha = fechaElegida ?? ahora.fecha

  usePodarHistorial(ahora.fecha)
  const { registros, cargado, fallaAlGuardar, alternar, ponerNota } = useDia(fecha)

  const bloques = useMemo(() => bloquesDelDia(fecha), [fecha])
  const progreso = useMemo(() => progresoDelDia(bloques, registros), [bloques, registros])
  const proximo = useMemo(
    () => bloqueProximo(bloques, registros, fecha, ahora),
    [bloques, registros, fecha, ahora],
  )
  const atrasadas = useMemo(
    () => dosisAtrasadas(bloques, registros, fecha, ahora),
    [bloques, registros, fecha, ahora],
  )

  const enFuturo = fecha > ahora.fecha
  const aviso = useMemo<Aviso>(
    () => construirAviso({ atrasadas, proximo, progreso, ahora, enFuturo, cargado }),
    [atrasadas, proximo, progreso, ahora, enFuturo, cargado],
  )

  return (
    <div className="min-h-dvh">
      <Cabecera
        fecha={fecha}
        hoy={ahora.fecha}
        progreso={progreso}
        aviso={aviso}
        enlaceHistorial={`/f/${codigo}/historial`}
        onAnterior={() => setFechaElegida(sumarDias(fecha, -1))}
        onSiguiente={() => setFechaElegida(sumarDias(fecha, 1))}
        onHoy={() => setFechaElegida(null)}
      />

      <main className="mx-auto max-w-lg px-3 pt-3 pb-10">
        <div className="no-imprimir mb-3">
          <SelectorCuidador cuidador={cuidador} onCambiar={setCuidador} />
        </div>

        {fallaAlGuardar && (
          <p className="mb-3 rounded-xl border border-late/30 bg-late-bg px-3 py-2.5 text-[14px] leading-snug font-semibold text-late">
            El navegador no está guardando los cambios. Si abriste la app en una ventana
            privada, ciérrala y ábrela en una normal: lo que marques aquí se perderá.
          </p>
        )}

        {enFuturo && (
          <p className="mb-3 rounded-xl border border-line bg-paper px-3 py-2.5 text-[14px] leading-snug text-muted">
            Este día todavía no llega. Puedes ver la pauta, pero no marcar dosis.
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          {bloques.map((bloque) => (
            <BloqueHora
              key={bloque.hora}
              bloque={bloque}
              registros={registros}
              fecha={fecha}
              ahora={ahora}
              esProximo={proximo?.hora === bloque.hora}
              bloqueado={enFuturo}
              onAlternar={(pauta: Pauta) => alternar(pauta, cuidador)}
              onNota={ponerNota}
            />
          ))}
        </div>

        <Pie />
      </main>
    </div>
  )
}

/** Lo que se ve el instante que va entre abrir la app y leer la hora del teléfono. */
function Esqueleto() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 text-center">
      <p className="font-[family-name:var(--font-hora)] text-[22px] text-ink">Medicación</p>
      <p className="mt-1 text-[14px] text-muted">Abriendo el registro…</p>
      <p className="mt-6 text-[12px] text-muted">{NOTA_PIE}</p>
    </div>
  )
}

/** El único texto de la cabecera: lo más urgente primero. */
function construirAviso({
  atrasadas,
  proximo,
  progreso,
  ahora,
  enFuturo,
  cargado,
}: {
  atrasadas: Pauta[]
  proximo: BloqueHorario | null
  progreso: Progreso
  ahora: Ahora
  enFuturo: boolean
  cargado: boolean
}): Aviso {
  if (!cargado) return { tipo: 'neutro', texto: 'Cargando el registro…' }
  if (enFuturo) return { tipo: 'neutro', texto: `Pauta del día: ${progreso.total} dosis` }

  // Lo atrasado manda, pero sin esconder lo que toca ahora mismo: quien entra de
  // turno necesita las dos cosas en la misma línea.
  if (atrasadas.length > 0) {
    const horas = [...new Set(atrasadas.map((d) => d.hora))].join(', ')
    const pendiente =
      atrasadas.length === 1
        ? `Sin marcar ${horas} · ${atrasadas[0].medicamento}`
        : `${atrasadas.length} dosis sin marcar (${horas})`
    return { tipo: 'atraso', texto: proximo ? `${pendiente} — ahora toca ${proximo.hora}` : pendiente }
  }

  if (progreso.total > 0 && progreso.dadas === progreso.total) {
    return { tipo: 'completo', texto: `Día completo · ${progreso.total} de ${progreso.total} dosis` }
  }

  if (proximo) {
    const medicamentos = [...new Set(proximo.dosis.map((d) => d.medicamento))].join(' + ')
    const faltan = minutosProgramados(ahora.fecha, proximo.hora) - ahora.minutos
    return { tipo: 'proxima', texto: `Siguiente ${proximo.hora} · ${medicamentos} · ${cuando(faltan)}` }
  }

  return { tipo: 'neutro', texto: 'No queda nada por dar hoy' }
}

function cuando(minutos: number): string {
  if (minutos <= 0) return 'es ahora'
  if (minutos < 60) return `en ${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return m === 0 ? `en ${h} h` : `en ${h} h ${m} min`
}
