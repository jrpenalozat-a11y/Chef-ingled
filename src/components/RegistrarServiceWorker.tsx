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
      // En GitHub Pages la app cuelga de /<repo>/, así que el worker y su
      // alcance tienen que colgar de ahí también.
      const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

      // Las rutas a guardar se las damos ya resueltas por el navegador, no
      // armadas a mano: según el despliegue la dirección canónica lleva barra
      // final o no, y si no coincide con la que se pide luego, el modo sin
      // señal no encuentra nada.
      const raiz = window.location.pathname
      const historial = raiz.endsWith('/') ? `${raiz}historial/` : `${raiz}/historial`
      const rutas = encodeURIComponent([raiz, historial].join(','))

      const ruta = `${base}/sw.js?rutas=${rutas}`
      navigator.serviceWorker.register(ruta, { scope: `${base}/` }).catch((e) => {
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
