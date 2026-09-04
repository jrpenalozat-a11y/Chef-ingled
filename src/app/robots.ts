import type { MetadataRoute } from 'next'

/** Nada de esta app se indexa. Son datos de salud de una persona real. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  }
}
