'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Pauta, Registro } from '@/lib/tipos'
import type { Ahora } from '@/lib/estado'
import { SEGUNDOS_RELOJ } from '@config/app'
import { partesEnSantiago } from '@/lib/fecha'
import {
  cuidadorGuardado,
  guardarCuidador,
  guardarDia,
  podarHistorial,
  registrosDe,
} from '@/lib/cliente/almacen'

/**
 * Reloj de Santiago que se refresca solo.
 *
 * Devuelve null hasta que la app monta en el teléfono. Así las páginas pueden
 * ser estáticas (se guardan enteras en la caché del service worker y abren sin
 * señal) sin que la hora del build se cuele en la pantalla.
 *
 * Se refresca al volver a la app: si el teléfono estuvo con la pantalla apagada
 * seis horas, lo primero que se ve al desbloquearlo tiene que ser la hora real.
 */
export function useReloj(): Ahora | null {
  const [ahora, setAhora] = useState<Ahora | null>(null)

  useEffect(() => {
    const actualizar = () => {
      const p = partesEnSantiago()
      setAhora((previo) =>
        previo && previo.fecha === p.fecha && previo.minutos === p.minutos
          ? previo
          : { fecha: p.fecha, minutos: p.minutos },
      )
    }
    actualizar()
    const id = window.setInterval(actualizar, SEGUNDOS_RELOJ * 1000)
    const alVolver = () => {
      if (document.visibilityState === 'visible') actualizar()
    }
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('focus', actualizar)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener('focus', actualizar)
    }
  }, [])

  return ahora
}

export type ApiDia = {
  registros: Record<string, Registro>
  /** ¿Ya se leyó lo guardado en el teléfono? Antes de eso no hay nada que mostrar. */
  cargado: boolean
  /** El navegador no deja escribir (modo privado, cuota llena). */
  fallaAlGuardar: boolean
  alternar: (pauta: Pauta, cuidador: string) => void
  ponerNota: (pauta: Pauta, nota: string) => void
}

/** Los registros de un día, leídos y escritos en este teléfono. */
export function useDia(fecha: string): ApiDia {
  const [registros, setRegistros] = useState<Record<string, Registro>>({})
  const [cargado, setCargado] = useState(false)
  const [fallaAlGuardar, setFallaAlGuardar] = useState(false)

  useEffect(() => {
    setCargado(false)
    setRegistros(registrosDe(fecha))
    setCargado(true)
  }, [fecha])

  // Otra pestaña de la misma app marcó algo: reflejarlo aquí.
  useEffect(() => {
    const alCambiar = (e: StorageEvent) => {
      if (e.key === null || e.key === `med:dia:${fecha}`) setRegistros(registrosDe(fecha))
    }
    window.addEventListener('storage', alCambiar)
    return () => window.removeEventListener('storage', alCambiar)
  }, [fecha])

  const aplicar = useCallback(
    (cambio: (previo: Record<string, Registro>) => Record<string, Registro>) => {
      setRegistros((previo) => {
        const siguiente = cambio(previo)
        setFallaAlGuardar(!guardarDia(fecha, siguiente))
        return siguiente
      })
    },
    [fecha],
  )

  const alternar = useCallback(
    (pauta: Pauta, cuidador: string) => {
      const p = partesEnSantiago()
      aplicar((previo) => {
        const actual = previo[pauta.id]
        const siguiente = { ...previo }
        if (actual?.administrado) {
          // Desmarcar: se borra el registro, la dosis vuelve a estar pendiente.
          delete siguiente[pauta.id]
        } else {
          siguiente[pauta.id] = {
            fecha,
            pautaId: pauta.id,
            administrado: true,
            horaReal: p.hora,
            porQuien: cuidador,
            marcadoEn: new Date().toISOString(),
            ...(actual?.nota ? { nota: actual.nota } : {}),
          }
        }
        return siguiente
      })
    },
    [aplicar, fecha],
  )

  const ponerNota = useCallback(
    (pauta: Pauta, nota: string) => {
      const limpia = nota.trim().slice(0, 200)
      aplicar((previo) => {
        const actual = previo[pauta.id]
        const siguiente = { ...previo }

        // Sin registro previo y sin texto: no hay nada que guardar.
        if (!actual && !limpia) return previo

        // Borrar la nota de una dosis no administrada deja el registro vacío.
        if (actual && !actual.administrado && !limpia) {
          delete siguiente[pauta.id]
          return siguiente
        }

        const p = partesEnSantiago()
        const base: Registro = actual ?? {
          fecha,
          pautaId: pauta.id,
          administrado: false,
          horaReal: p.hora,
          porQuien: '',
          marcadoEn: '',
        }
        const actualizado: Registro = { ...base, marcadoEn: new Date().toISOString() }
        if (limpia) actualizado.nota = limpia
        else delete actualizado.nota
        siguiente[pauta.id] = actualizado
        return siguiente
      })
    },
    [aplicar, fecha],
  )

  return { registros, cargado, fallaAlGuardar, alternar, ponerNota }
}

/** Cuidador activo, recordado en este dispositivo. */
export function useCuidador(porDefecto: string): [string, (n: string) => void] {
  const [cuidador, setCuidador] = useState(porDefecto)

  useEffect(() => {
    const guardado = cuidadorGuardado()
    if (guardado) setCuidador(guardado)
  }, [])

  const cambiar = useCallback((n: string) => {
    setCuidador(n)
    guardarCuidador(n)
  }, [])

  return [cuidador, cambiar]
}

/** Poda el historial viejo una vez por sesión. */
export function usePodarHistorial(hoy: string): void {
  useEffect(() => {
    podarHistorial(hoy)
  }, [hoy])
}
