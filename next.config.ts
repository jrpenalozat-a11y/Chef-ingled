import type { NextConfig } from 'next'

/**
 * Se despliega como sitio estático (GitHub Pages), así que todo se exporta a
 * HTML y no hay servidor que ponga cabeceras: el `noindex` viaja en el <head>
 * de cada página. En Vercel o en local, sin BASE_PATH, sigue funcionando igual
 * con las cabeceras puestas por el servidor.
 */
const basePath = process.env.BASE_PATH ?? ''
const estatico = process.env.EXPORTAR_ESTATICO === '1'

const config: NextConfig = {
  reactStrictMode: true,
  ...(estatico ? { output: 'export' as const, trailingSlash: true } : {}),
  basePath,
  // El componente que registra el service worker necesita saber dónde vive la app.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: { unoptimized: true },

  ...(estatico
    ? {}
    : {
        async headers() {
          return [
            {
              // Son datos de salud de una persona real: nada de esto se indexa.
              source: '/:path*',
              headers: [
                { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
                { key: 'Referrer-Policy', value: 'no-referrer' },
                { key: 'X-Content-Type-Options', value: 'nosniff' },
              ],
            },
            {
              // El service worker debe poder controlar toda la app, no solo /
              source: '/sw.js',
              headers: [
                { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                { key: 'Service-Worker-Allowed', value: '/' },
              ],
            },
          ]
        },
      }),
}

export default config
