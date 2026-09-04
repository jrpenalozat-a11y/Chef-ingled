import { codigosValidos, esCodigoValido, normalizar } from '@/lib/acceso'

/**
 * Un manifest por código, para que el ícono de la pantalla de inicio abra
 * directamente en el registro y no en la página raíz.
 */
export function generateStaticParams() {
  return codigosValidos().map((codigo) => ({ codigo }))
}

export const dynamicParams = false

export async function GET(_req: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params
  if (!esCodigoValido(codigo)) return new Response('No encontrado', { status: 404 })

  const raiz = `/f/${normalizar(codigo)}`
  const manifest = {
    name: 'Control de medicación',
    short_name: 'Medicación',
    description: 'Registro de dosis administradas en casa.',
    start_url: raiz,
    scope: raiz,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#EEF1F5',
    theme_color: '#EEF1F5',
    lang: 'es-CL',
    dir: 'ltr',
    icons: [
      { src: '/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }

  return Response.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
