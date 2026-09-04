/*
 * Service worker de la app de medicación.
 *
 * Todo el registro vive en localStorage, así que aquí solo hay que guardar la
 * app en sí (HTML, JS, CSS, íconos). Con eso el ícono de la pantalla de inicio
 * abre y funciona igual sin señal, que es lo que pasa de madrugada en la casa.
 *
 * Sube VERSION al cambiar la estrategia para que la caché vieja se limpie.
 */
const VERSION = 'v1'
const CACHE = `medicacion-${VERSION}`

// La app se registra como /sw.js?raiz=/f/<codigo>, así el worker sabe qué páginas
// guardar de entrada y la app abre sin señal ya desde la primera visita, sin
// esperar a una segunda carga.
const RAIZ = new URL(self.location.href).searchParams.get('raiz')
const PRECARGA = RAIZ ? [RAIZ, `${RAIZ}/historial`] : []

self.addEventListener('install', (evento) => {
  // La app nueva entra en cuanto está lista: no queremos dos versiones conviviendo.
  self.skipWaiting()
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      // Si alguna falla (por ejemplo por estar ya sin señal), no bloquea la instalación.
      await Promise.allSettled(PRECARGA.map((ruta) => cache.add(new Request(ruta, { cache: 'reload' }))))
    })(),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const nombres = await caches.keys()
      await Promise.all(nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request
  if (peticion.method !== 'GET') return

  const url = new URL(peticion.url)
  if (url.origin !== self.location.origin) return

  // Navegación: intenta la red y cae a lo guardado. Así se ve la versión nueva
  // cuando hay señal, y la app abre igual cuando no la hay.
  if (peticion.mode === 'navigate') {
    evento.respondWith(redPrimero(peticion))
    return
  }

  // Los archivos de /_next/static llevan hash en el nombre: no cambian nunca.
  if (url.pathname.startsWith('/_next/static/')) {
    evento.respondWith(cachePrimero(peticion))
    return
  }

  evento.respondWith(cacheYActualiza(peticion))
})

async function redPrimero(peticion) {
  const cache = await caches.open(CACHE)
  try {
    const respuesta = await fetch(peticion)
    if (respuesta && respuesta.ok) cache.put(peticion, respuesta.clone())
    return respuesta
  } catch {
    const guardada = (await cache.match(peticion)) || (await cache.match(peticion, { ignoreSearch: true }))
    if (guardada) return guardada
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Sin conexión</title>' +
        '<body style="font:16px system-ui;padding:2rem;color:#16202E;background:#EEF1F5">' +
        '<h1 style="font:400 24px Georgia,serif">Sin conexión</h1>' +
        '<p style="color:#63748A">Vuelve a abrir la app desde el ícono de la pantalla de inicio.</p>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }
}

async function cachePrimero(peticion) {
  const cache = await caches.open(CACHE)
  const guardada = await cache.match(peticion)
  if (guardada) return guardada
  const respuesta = await fetch(peticion)
  if (respuesta && respuesta.ok) cache.put(peticion, respuesta.clone())
  return respuesta
}

async function cacheYActualiza(peticion) {
  const cache = await caches.open(CACHE)
  const guardada = await cache.match(peticion)
  const enRed = fetch(peticion)
    .then((respuesta) => {
      if (respuesta && respuesta.ok) cache.put(peticion, respuesta.clone())
      return respuesta
    })
    .catch(() => null)
  return guardada || (await enRed) || Response.error()
}
