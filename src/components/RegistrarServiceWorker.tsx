'use client'

import { useEffect } from 'react'

/**
 * Registra el service worker que hace la app instalable y utilizable sin señal.
 * En desarrollo no se registra, para no servir versiones viejas mientras se edita.
 */
export default function RegistrarServiceWorker({ codigo }: { codigo: string }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const registrar = () => {
      const ruta = `/sw.js?raiz=${encodeURIComponent(`/f/${codigo}`)}`
      navigator.serviceWorker.register(ruta, { scope: '/' }).catch((e) => {
        // Sin service worker la app sigue funcionando: solo pierde el modo offline.
        console.warn('No se pudo registrar el service worker', e)
      })
    }

    if (document.readyState === 'complete') registrar()
    else window.addEventListener('load', registrar, { once: true })
    return () => window.removeEventListener('load', registrar)
  }, [codigo])

  return null
}
