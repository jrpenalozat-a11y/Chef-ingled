import type { MetadataRoute } from 'next'

// Se genera en el build: el sitio se publica como archivos estáticos.
export const dynamic = 'force-static'

/** Nada de esta app se indexa. Son datos de salud de una persona real. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  }
}
